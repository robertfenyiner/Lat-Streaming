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
}

module.exports = VideoProcessor;