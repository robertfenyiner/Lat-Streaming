const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');

class VideoProcessor {
    constructor() {
        // Set FFmpeg paths if specified in environment
        if (process.env.FFMPEG_PATH) {
            ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
        }
        if (process.env.FFPROBE_PATH) {
            ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
        }
    }

    async getBasicMetadata(videoPath) {
        return new Promise((resolve, reject) => {
            // Use faster metadata extraction with limited probing
            ffmpeg.ffprobe(videoPath, ['-v', 'quiet', '-show_format', '-show_streams'], (err, metadata) => {
                if (err) {
                    // Fallback to file stats if ffprobe fails
                    const fs = require('fs-extra');
                    fs.stat(videoPath).then(stats => {
                        resolve({
                            duration: 0,
                            size: stats.size,
                            bitrate: null,
                            format: 'unknown',
                            video: null,
                            audio: []
                        });
                    }).catch(reject);
                    return;
                }

                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                const audioStreams = metadata.streams.filter(stream => stream.codec_type === 'audio');
                
                const result = {
                    duration: metadata.format.duration || 0,
                    size: metadata.format.size || 0,
                    bitrate: metadata.format.bit_rate || null,
                    format: metadata.format.format_name || 'unknown',
                    video: videoStream ? {
                        codec: videoStream.codec_name,
                        width: videoStream.width,
                        height: videoStream.height,
                        fps: this.calculateFPS(videoStream.r_frame_rate),
                        bitrate: videoStream.bit_rate
                    } : null,
                    audio: audioStreams.slice(0, 1).map(stream => ({ // Only first audio track for speed
                        codec: stream.codec_name,
                        channels: stream.channels,
                        sampleRate: stream.sample_rate,
                        bitrate: stream.bit_rate,
                        language: stream.tags?.language || 'unknown',
                        title: stream.tags?.title || `Audio ${stream.index}`
                    }))
                };

                resolve(result);
            });
        });
    }

    async getVideoMetadata(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) {
                    reject(err);
                    return;
                }

                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                const audioStreams = metadata.streams.filter(stream => stream.codec_type === 'audio');
                
                const result = {
                    duration: metadata.format.duration,
                    size: metadata.format.size,
                    bitrate: metadata.format.bit_rate,
                    format: metadata.format.format_name,
                    video: videoStream ? {
                        codec: videoStream.codec_name,
                        width: videoStream.width,
                        height: videoStream.height,
                        fps: this.calculateFPS(videoStream.r_frame_rate),
                        bitrate: videoStream.bit_rate
                    } : null,
                    audio: audioStreams.map(stream => ({
                        codec: stream.codec_name,
                        channels: stream.channels,
                        sampleRate: stream.sample_rate,
                        bitrate: stream.bit_rate,
                        language: stream.tags?.language || 'unknown',
                        title: stream.tags?.title || `Audio ${stream.index}`
                    }))
                };

                resolve(result);
            });
        });
    }

    async convertToHLS(videoPath, videoId, metadata) {
        const outputDir = path.join(__dirname, '..', 'hls', videoId);
        await fs.ensureDir(outputDir);

        const playlistPath = path.join(outputDir, 'playlist.m3u8');
        
        return new Promise((resolve, reject) => {
            let command = ffmpeg(videoPath);

            // Start with basic HLS settings
            command = command
                .format('hls')
                .outputOptions([
                    '-hls_time 10',
                    '-hls_list_size 0',
                    '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'),
                    '-preset fast',
                    '-crf 23'
                ]);

            // Handle video encoding
            if (metadata.video) {
                command = command.videoCodec('libx264');
                
                // Scale down if too large
                if (metadata.video.height > 1080) {
                    command = command.size('1920x1080');
                } else if (metadata.video.height > 720) {
                    command = command.size('1280x720');
                }
            } else {
                // If no video stream, copy as is
                command = command.videoCodec('copy');
            }

            // Handle audio encoding
            if (metadata.audio && metadata.audio.length > 0) {
                command = command.audioCodec('aac').audioBitrate('128k');
                
                // Handle multiple audio tracks
                if (metadata.audio.length > 1) {
                    console.log(`Found ${metadata.audio.length} audio tracks, using first one`);
                }
            } else {
                // If no audio, disable audio
                command = command.noAudio();
            }

            command
                .output(playlistPath)
                .on('start', (commandLine) => {
                    console.log('FFmpeg command:', commandLine);
                })
                .on('progress', (progress) => {
                    console.log(`Processing: ${Math.round(progress.percent || 0)}% done`);
                })
                .on('end', () => {
                    console.log('HLS conversion completed');
                    resolve(playlistPath);
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(err);
                })
                .run();
        });
    }

    addMultipleQualities(command, videoMetadata, outputDir) {
        if (!videoMetadata) return command;

        const width = videoMetadata.width;
        const height = videoMetadata.height;
        
        // Define quality levels based on original resolution
        const qualities = [];
        
        if (height >= 1080) {
            qualities.push({ name: '1080p', width: 1920, height: 1080, bitrate: '5000k' });
        }
        if (height >= 720) {
            qualities.push({ name: '720p', width: 1280, height: 720, bitrate: '3000k' });
        }
        if (height >= 480) {
            qualities.push({ name: '480p', width: 854, height: 480, bitrate: '1500k' });
        }
        qualities.push({ name: '360p', width: 640, height: 360, bitrate: '800k' });

        // Filter qualities that are not larger than original
        const validQualities = qualities.filter(q => q.height <= height);

        if (validQualities.length > 1) {
            // Create variant streams for different qualities
            validQualities.forEach((quality, index) => {
                command = command
                    .outputOptions([
                        `-map 0:v:0`,
                        `-map 0:a:0`,
                        `-s:v:${index} ${quality.width}x${quality.height}`,
                        `-b:v:${index} ${quality.bitrate}`,
                        `-maxrate:v:${index} ${quality.bitrate}`,
                        `-bufsize:v:${index} ${parseInt(quality.bitrate) * 2}k`
                    ]);
            });

            // Create master playlist
            this.createMasterPlaylist(outputDir, validQualities);
        }

        return command;
    }

    addMultipleAudioTracks(command, audioTracks, outputDir) {
        // Map all audio tracks
        audioTracks.forEach((track, index) => {
            command = command.outputOptions([
                `-map 0:a:${index}`,
                `-c:a:${index} aac`,
                `-b:a:${index} 128k`
            ]);
        });

        // Create audio-only playlists for each track
        this.createAudioPlaylists(outputDir, audioTracks);

        return command;
    }

    async createMasterPlaylist(outputDir, qualities) {
        let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

        qualities.forEach((quality) => {
            masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(quality.bitrate) * 1000},RESOLUTION=${quality.width}x${quality.height}\n`;
            masterContent += `${quality.name}.m3u8\n\n`;
        });

        const masterPath = path.join(outputDir, 'master.m3u8');
        await fs.writeFile(masterPath, masterContent);
    }

    async createAudioPlaylists(outputDir, audioTracks) {
        let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

        audioTracks.forEach((track, index) => {
            const language = track.language || 'unknown';
            const title = track.title || `Audio ${index + 1}`;
            
            masterContent += `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="${title}",LANGUAGE="${language}",URI="audio_${index}.m3u8"\n`;
        });

        const audioMasterPath = path.join(outputDir, 'audio_master.m3u8');
        await fs.writeFile(audioMasterPath, masterContent);
    }

    async extractThumbnail(videoPath, outputPath, timeOffset = '00:00:10') {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                    timestamps: [timeOffset],
                    filename: 'thumbnail.jpg',
                    folder: path.dirname(outputPath),
                    size: '320x240'
                })
                .on('end', () => {
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    reject(err);
                });
        });
    }

    async getVideoInfo(videoPath) {
        try {
            const metadata = await this.getVideoMetadata(videoPath);
            return {
                duration: this.formatDuration(metadata.duration),
                size: this.formatFileSize(metadata.size),
                resolution: metadata.video ? `${metadata.video.width}x${metadata.video.height}` : 'Unknown',
                fps: metadata.video ? Math.round(metadata.video.fps) : 'Unknown',
                audioTracks: metadata.audio.length,
                format: metadata.format
            };
        } catch (error) {
            console.error('Error getting video info:', error);
            throw error;
        }
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    calculateFPS(frameRate) {
        if (!frameRate) return 0;
        
        // Handle fraction format like "30/1" or "25000/1001"
        if (typeof frameRate === 'string' && frameRate.includes('/')) {
            const [numerator, denominator] = frameRate.split('/').map(Number);
            return denominator ? numerator / denominator : 0;
        }
        
        // Handle direct number
        return parseFloat(frameRate) || 0;
    }

    async generateMultipleThumbnails(videoPath, videoId, percentages = [10, 30, 50, 70, 90]) {
        const outputDir = path.join(__dirname, '..', 'hls', videoId);
        await fs.ensureDir(outputDir);
        
        const thumbnails = [];
        
        // First, get video duration
        let videoDuration;
        try {
            const metadata = await this.getVideoMetadata(videoPath);
            videoDuration = metadata.duration;
        } catch (error) {
            console.error('Failed to get video duration for thumbnails:', error.message);
            return thumbnails;
        }
        
        if (!videoDuration || videoDuration <= 0) {
            console.warn('Invalid video duration, cannot generate thumbnails');
            return thumbnails;
        }
        
        for (let i = 0; i < percentages.length; i++) {
            const percentage = percentages[i];
            const timeInSeconds = Math.floor((videoDuration * percentage) / 100);
            const thumbnailPath = path.join(outputDir, `thumbnail_${i + 1}.jpg`);
            
            try {
                await new Promise((resolve, reject) => {
                    ffmpeg(videoPath)
                        .seekInput(timeInSeconds)
                        .frames(1)
                        .size('320x180')
                        .format('image2')
                        .outputOptions(['-q:v 2']) // High quality JPEG
                        .output(thumbnailPath)
                        .on('end', () => {
                            thumbnails.push({
                                index: i + 1,
                                timestamp: `${timeInSeconds}s`,
                                percentage: `${percentage}%`,
                                path: thumbnailPath,
                                filename: `thumbnail_${i + 1}.jpg`,
                                url: `/hls/${videoId}/thumbnail_${i + 1}.jpg`
                            });
                            resolve();
                        })
                        .on('error', reject)
                        .run();
                });
                console.log(`Generated thumbnail ${i + 1} at ${timeInSeconds}s (${percentage}%)`);
            } catch (error) {
                console.warn(`Failed to generate thumbnail ${i + 1} at ${timeInSeconds}s:`, error.message);
            }
        }
        
        return thumbnails;
    }

    async extractAdvancedMetadata(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) {
                    reject(err);
                    return;
                }

                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                const audioStreams = metadata.streams.filter(stream => stream.codec_type === 'audio');
                const subtitleStreams = metadata.streams.filter(stream => stream.codec_type === 'subtitle');
                
                const result = {
                    // Basic info
                    duration: metadata.format.duration,
                    size: metadata.format.size,
                    bitrate: metadata.format.bit_rate,
                    format: metadata.format.format_name,
                    filename: metadata.format.filename,
                    
                    // Video stream info
                    video: videoStream ? {
                        codec: videoStream.codec_name,
                        width: videoStream.width,
                        height: videoStream.height,
                        fps: this.calculateFPS(videoStream.r_frame_rate),
                        bitrate: videoStream.bit_rate,
                        pixelFormat: videoStream.pix_fmt,
                        profile: videoStream.profile,
                        level: videoStream.level,
                        aspectRatio: videoStream.display_aspect_ratio,
                        colorSpace: videoStream.color_space,
                        colorRange: videoStream.color_range
                    } : null,
                    
                    // Audio streams info
                    audio: audioStreams.map((stream, index) => ({
                        index: index,
                        codec: stream.codec_name,
                        channels: stream.channels,
                        channelLayout: stream.channel_layout,
                        sampleRate: stream.sample_rate,
                        bitrate: stream.bit_rate,
                        language: stream.tags?.language || 'unknown',
                        title: stream.tags?.title || `Audio ${index + 1}`,
                        profile: stream.profile
                    })),
                    
                    // Subtitle streams info
                    subtitles: subtitleStreams.map((stream, index) => ({
                        index: index,
                        codec: stream.codec_name,
                        language: stream.tags?.language || 'unknown',
                        title: stream.tags?.title || `Subtitle ${index + 1}`
                    })),
                    
                    // Additional metadata
                    metadata: {
                        creationTime: metadata.format.tags?.creation_time,
                        title: metadata.format.tags?.title,
                        artist: metadata.format.tags?.artist,
                        album: metadata.format.tags?.album,
                        date: metadata.format.tags?.date,
                        genre: metadata.format.tags?.genre,
                        comment: metadata.format.tags?.comment,
                        encoder: metadata.format.tags?.encoder
                    },
                    
                    // Quality assessment
                    quality: this.assessVideoQuality(videoStream, metadata.format),
                    
                    // Stream count
                    streamCount: {
                        total: metadata.streams.length,
                        video: metadata.streams.filter(s => s.codec_type === 'video').length,
                        audio: audioStreams.length,
                        subtitle: subtitleStreams.length
                    }
                };

                resolve(result);
            });
        });
    }

    assessVideoQuality(videoStream, formatInfo) {
        if (!videoStream) return null;
        
        const width = videoStream.width;
        const height = videoStream.height;
        const bitrate = videoStream.bit_rate || formatInfo.bit_rate;
        const fps = this.calculateFPS(videoStream.r_frame_rate);
        
        let resolution = 'unknown';
        let quality = 'unknown';
        
        if (height >= 2160) {
            resolution = '4K';
            quality = bitrate > 20000000 ? 'excellent' : bitrate > 15000000 ? 'good' : 'fair';
        } else if (height >= 1080) {
            resolution = '1080p';
            quality = bitrate > 8000000 ? 'excellent' : bitrate > 5000000 ? 'good' : 'fair';
        } else if (height >= 720) {
            resolution = '720p';
            quality = bitrate > 5000000 ? 'excellent' : bitrate > 3000000 ? 'good' : 'fair';
        } else if (height >= 480) {
            resolution = '480p';
            quality = bitrate > 2000000 ? 'good' : 'fair';
        } else {
            resolution = '360p';
            quality = 'fair';
        }
        
        return {
            resolution: resolution,
            quality: quality,
            fps: fps,
            bitrate: bitrate,
            aspectRatio: `${width}:${height}`
        };
    }

    async generateVideoPreview(videoPath, videoId, duration = 10) {
        const outputDir = path.join(__dirname, '..', 'hls', videoId);
        await fs.ensureDir(outputDir);
        
        const previewPath = path.join(outputDir, 'preview.mp4');
        
        // Get video duration to ensure we don't start too late
        let videoDuration;
        try {
            const metadata = await this.getVideoMetadata(videoPath);
            videoDuration = metadata.duration;
        } catch (error) {
            console.error('Failed to get video duration for preview:', error.message);
            videoDuration = 60; // Fallback to assuming 60 seconds
        }
        
        // Start at 10 seconds or 10% of video duration, whichever is smaller
        const startTime = Math.min(10, Math.floor(videoDuration * 0.1));
        const previewDuration = Math.min(duration, videoDuration - startTime - 1);
        
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .seekInput(startTime) // Start time in seconds
                .duration(previewDuration) // Preview duration
                .size('640x360') // Lower resolution for preview
                .videoBitrate('500k')
                .audioBitrate('64k')
                .format('mp4')
                .output(previewPath)
                .on('start', (commandLine) => {
                    console.log(`Generating preview: ${commandLine}`);
                })
                .on('end', () => {
                    console.log(`Generated preview: ${previewDuration}s starting at ${startTime}s`);
                    resolve({
                        path: previewPath,
                        url: `/hls/${videoId}/preview.mp4`,
                        duration: previewDuration,
                        startTime: startTime
                    });
                })
                .on('error', (error) => {
                    console.error('Preview generation failed:', error.message);
                    reject(error);
                })
                .run();
        });
    }
}

module.exports = VideoProcessor;