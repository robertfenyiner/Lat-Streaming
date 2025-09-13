const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const TelegramService = require('./services/telegramService');
const VideoProcessor = require('./services/videoProcessor');
const DatabaseService = require('./services/databaseService');
const CloudStreamingService = require('./services/cloudStreamingService');
const VideoConverter = require('./services/videoConverter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Upload lock system to prevent parallel uploads
const uploadLocks = new Set(); // Keep track of videos currently being uploaded

function isUploadInProgress(videoId) {
    return uploadLocks.has(videoId);
}

function startUploadLock(videoId) {
    uploadLocks.add(videoId);
    console.log(`🔒 Upload lock acquired for video ${videoId}`);
}

function releaseUploadLock(videoId) {
    uploadLocks.delete(videoId);
    console.log(`🔓 Upload lock released for video ${videoId}`);
}

app.use(express.static('public'));

// Ensure directories exist (removed hls directory)
const ensureDirectories = async () => {
    const dirs = ['uploads', 'temp', 'data'];
    for (const dir of dirs) {
        await fs.ensureDir(dir);
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024 // 2GB limit
    },
    fileFilter: (req, file, cb) => {
        // Initialize VideoConverter temporarily for validation
        const tempConverter = new (require('./services/videoConverter'))();
        if (tempConverter.isFormatSupported(file.originalname)) {
            cb(null, true);
        } else {
            cb(new Error(`Formato no soportado. Formatos permitidos: ${tempConverter.getSupportedFormats().join(', ')}`));
        }
    }
});

// Initialize services
const telegramService = new TelegramService();
const videoProcessor = new VideoProcessor();
const databaseService = new DatabaseService();
const cloudStreamingService = new CloudStreamingService();
const videoConverter = new VideoConverter();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload video endpoint
app.post('/api/upload', upload.single('video'), async (req, res) => {
    const startTime = Date.now();
    let filesToCleanup = [];

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        const videoId = uuidv4();
        let videoPath = req.file.path;
        let originalName = req.file.originalname;
        let finalName = originalName;

        console.log(`Processing video: ${originalName}`);
        filesToCleanup.push(videoPath);

        // Check if conversion is needed
        if (videoConverter.needsConversion(originalName)) {
            console.log(`Converting ${originalName} to MP4...`);
            
            const conversionResult = await videoConverter.processUploadedFile(
                videoPath, 
                originalName,
                (progress) => {
                    console.log(`Conversion progress: ${progress.percent}%`);
                }
            );

            if (!conversionResult.success) {
                throw new Error(`Conversion failed: ${conversionResult.error}`);
            }

            if (conversionResult.converted) {
                videoPath = conversionResult.finalPath;
                finalName = conversionResult.finalFilename;
                filesToCleanup.push(videoPath); // Add converted file to cleanup
                console.log(`Conversion completed: ${originalName} -> ${finalName}`);
            }
        }

        // Start upload immediately without waiting for metadata
        console.log('Uploading to Telegram cloud storage...');
        const uploadStartTime = Date.now();
        // Check if upload is already in progress
        if (isUploadInProgress(videoId)) {
            return res.status(409).json({ error: "Upload already in progress for this video" });
        }
        startUploadLock(videoId);

        const uploadPromise = telegramService.uploadVideo(videoPath, finalName, videoId);

        // Get basic metadata immediately (lightweight operation)
        const metadata = await videoProcessor.getBasicMetadata(videoPath);

        // Save to database immediately with PENDING status
        const videoData = {
            id: videoId,
            originalName: finalName, // Use final name (converted if needed)
            metadata: metadata,
            telegramData: {
                uploaded: false,
                uploading: true,
                status: 'pending'
            },
            cloudThumbnail: null, // Will be generated in background
            uploadDate: new Date().toISOString(),
            size: req.file.size,
            viewCount: 0,
            favorite: false,
            tags: [],
            category: null,
            shareLinks: [],
            streamingMethod: 'cloud',
            uploadTime: null, // Will be updated when upload completes
            converted: videoConverter.needsConversion(originalName), // Track if file was converted
            originalFileName: originalName // Keep track of original name
        };

        await databaseService.saveVideo(videoData);

        // Start background upload (don't wait for it)
        console.log('Starting background upload to Telegram...');
        const backgroundUploadStartTime = Date.now();
        
        setImmediate(async () => {
                console.log(`DEBUG: Starting Telegram upload for video ${videoId}, file: ${videoPath}`);
            try {
                // Upload to Telegram in background
                const telegramData = await telegramService.uploadVideo(videoPath, finalName, videoId);
                const uploadTime = Date.now() - backgroundUploadStartTime;
                console.log(`Background upload completed in ${uploadTime}ms`);

                // Update database with Telegram data
                await databaseService.updateVideoMetadata(videoId, {
                    telegramData: telegramData,
                    uploadTime: uploadTime,
                    'telegramData.uploading': false,
                    'telegramData.status': 'completed'
                });

                // Generate thumbnail in background
                let cloudThumbnail = null;
                try {
                    console.log('Attempting thumbnail generation...');
                    cloudThumbnail = await cloudStreamingService.generateThumbnailFromTelegram(telegramData, videoId);
                    if (cloudThumbnail) {
                        console.log('Thumbnail generated successfully');
                        await databaseService.updateVideoMetadata(videoId, {
                            cloudThumbnail: cloudThumbnail
                        });
                    } else {
                        console.log('Thumbnail generation skipped or failed - using placeholder');
                    }
                } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
                    console.log('Thumbnail generation error (non-critical):', error.message.split('\n')[0]);
                }

                // Clean up all temporary files after processing is complete
                console.log(`Cleaning up ${filesToCleanup.length} temporary files...`);
                await videoConverter.cleanup(filesToCleanup);
                releaseUploadLock(videoId);

            } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
                console.error('Background upload failed:', error);
                
                // Update database with error status
                await databaseService.updateVideoMetadata(videoId, {
                    'telegramData.uploaded': false,
                    'telegramData.uploading': false,
                    'telegramData.status': 'failed',
                    'telegramData.error': error.message
                });

                releaseUploadLock(videoId);
                // Still clean up files even if upload fails
                await videoConverter.cleanup(filesToCleanup);
            }
        });

        const totalTime = Date.now() - startTime;
        console.log(`Total request processed in ${totalTime}ms (Processing in background)`);

        // Return response immediately
        res.json({
            success: true,
            videoId: videoId,
            message: videoConverter.needsConversion(originalName) 
                ? `Video received - processing in background (${originalName} -> ${finalName})`
                : 'Video received - uploading to cloud in background',
            streamUrl: `/api/stream/${videoId}`,
            cloudStreamUrl: `/api/cloud-stream/${videoId}`,
            thumbnailUrl: `/api/thumbnail/${videoId}`, // Will be available once generated
            metadata: metadata,
            streamingMethod: 'cloud',
            processing: true, // Indicates background processing is ongoing
            converted: videoConverter.needsConversion(originalName),
            originalFileName: originalName,
            finalFileName: finalName,
        });

    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Upload error:', error);
        
        releaseUploadLock(videoId);
        // Clean up files on error
        if (filesToCleanup.length > 0) {
            await videoConverter.cleanup(filesToCleanup).catch(err => 
                console.warn('Error during cleanup:', err)
            );
        }

        res.status(500).json({ 
            error: error.message || 'Upload failed',
            details: error.stack
        });
    }
});

// Get video list (with Telegram existence validation)
app.get('/api/videos', async (req, res) => {
    try {
        const videos = await databaseService.getAllVideos();
        console.log(`Found ${videos.length} videos in database`);
        
        // Validar existencia en Telegram y filtrar videos inexistentes
        const validVideos = [];
        const videosToDelete = [];
        
        for (const video of videos) {
            if (video.telegramData && video.telegramData.uploaded) {
                // Verificar si el video aún existe en Telegram
                const exists = await telegramService.checkVideoExists(video.telegramData);
                if (exists) {
                    validVideos.push(video);
                } else {
                    console.log(`Video ${video.id} (${video.originalName}) no longer exists in Telegram, removing from database`);
                    videosToDelete.push(video.id);
                }
            } else {
                // Videos sin datos de Telegram (posiblemente corruptos)
                validVideos.push(video);
            }
        }
        
        // Eliminar videos que ya no existen en Telegram
        for (const videoId of videosToDelete) {
            await databaseService.deleteVideo(videoId);
        }
        
        if (videosToDelete.length > 0) {
            console.log(`Cleaned up ${videosToDelete.length} orphaned videos from database`);
        }
        
        console.log(`Returning ${validVideos.length} valid videos`);
        res.json(validVideos);
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint
app.get('/api/debug', async (req, res) => {
    try {
        const videos = await databaseService.getAllVideos();
        const videoIds = videos.map(v => v.id);
        res.json({
            totalVideos: videos.length,
            videoIds: videoIds,
            sampleVideo: videos[0] || null
        });
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get video details
app.get('/api/video/:id', async (req, res) => {
    try {
        console.log('Fetching video with ID:', req.params.id);
        const video = await databaseService.getVideo(req.params.id);
        console.log('Video found:', video ? 'Yes' : 'No');
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        res.json(video);
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Error fetching video:', error);
        res.status(500).json({ error: error.message });
    }
});

// Direct cloud streaming endpoint
app.get('/api/stream/:id', async (req, res) => {
    try {
        const videoId = req.params.id;
        console.log(`Stream request for video ID: ${videoId}`);
        const video = await databaseService.getVideo(videoId);
        
        if (!video) {
            console.log(`Video not found: ${videoId}`);
            return res.status(404).json({ error: 'Video not found' });
        }

        if (!video.telegramData?.uploaded) {
            console.log(`Video not uploaded to Telegram: ${videoId}`);
            return res.status(404).json({ error: 'Video not available for streaming' });
        }

        // Verificar si el video aún existe en Telegram
        const exists = await telegramService.checkVideoExists(video.telegramData);
        if (!exists) {
            console.log(`Video ${videoId} no longer exists in Telegram, removing from database`);
            await databaseService.deleteVideo(videoId);
            return res.status(404).json({ error: 'Video no longer available - removed from storage' });
        }

        console.log(`Video found: ${video.originalName}, Telegram data:`, video.telegramData);

        // Increment view count
        await databaseService.incrementViewCount(videoId);

        // Parse range header for partial content requests
        const range = req.headers.range;
        console.log(`Range header: ${range}`);
        
        // Stream video directly from Telegram
        const streamData = await cloudStreamingService.streamVideo(video.telegramData, range, video.originalName);
        console.log(`Stream data obtained, content length: ${streamData.contentLength}`);
        
        // Set appropriate headers for browser video playback
        res.setHeader('Content-Type', streamData.contentType);
        res.setHeader('Accept-Ranges', streamData.acceptsRanges ? 'bytes' : 'none');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(video.originalName)}"`);
        
        // Handle range requests
        if (range && streamData.acceptsRanges) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : streamData.contentLength - 1;
            const chunkSize = (end - start) + 1;
            
            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${streamData.contentLength}`);
            res.setHeader('Content-Length', chunkSize);
        } else if (!range) {
            // No range request, send full content
            res.setHeader('Content-Length', streamData.contentLength);
        }
        
        // Pipe the stream to response
        streamData.stream.pipe(res);
        
        streamData.stream.on('error', (error) => {
            console.error('Streaming error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Streaming failed' });
            }
        });
        
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Stream error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

// Cloud streaming endpoint with better range support
app.get('/api/cloud-stream/:id', async (req, res) => {
    try {
        const videoId = req.params.id;
        const video = await databaseService.getVideo(videoId);
        
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        if (!video.telegramData?.uploaded) {
            return res.status(404).json({ error: 'Video not available for streaming' });
        }

        // Get stream info
        const streamInfo = await cloudStreamingService.getVideoStreamInfo(video.telegramData);
        
        // Stream the video with proper headers
        const streamData = await cloudStreamingService.streamVideo(video.telegramData, req.headers.range, video.originalName);
        
        // Set video-specific headers
        res.setHeader('Content-Type', streamData.contentType);
        res.setHeader('Content-Length', streamInfo.size);
        res.setHeader('Accept-Ranges', streamInfo.supportsRangeRequests ? 'bytes' : 'none');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(video.originalName)}"`);        

        streamData.stream.pipe(res);
        
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Cloud stream error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve cloud-generated thumbnails
app.get('/api/thumbnail/:id', async (req, res) => {
    try {
        const videoId = req.params.id;
        const video = await databaseService.getVideo(videoId);
        
        if (!video || !video.cloudThumbnail) {
            return res.status(404).json({ error: 'Thumbnail not found' });
        }
        
        res.setHeader('Content-Type', video.cloudThumbnail.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(video.cloudThumbnail.data);
        
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Thumbnail error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rename video endpoint
app.put('/api/video/:id/rename', async (req, res) => {
    try {
        const videoId = req.params.id;
        const { newName } = req.body;
        
        if (!newName || typeof newName !== 'string' || !newName.trim()) {
            return res.status(400).json({ error: 'Invalid video name' });
        }

        const video = await databaseService.getVideo(videoId);
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Update video name in database
        await databaseService.updateVideoName(videoId, newName.trim());

        console.log(`Video ${videoId} renamed from '${video.originalName}' to '${newName.trim()}'`);
        res.json({ success: true, message: 'Video renamed successfully', newName: newName.trim() });
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Rename error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete video endpoint
app.delete('/api/video/:id', async (req, res) => {
    try {
        const videoId = req.params.id;
        const video = await databaseService.getVideo(videoId);
        
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Delete from Telegram
        try {
            if (video.telegramData?.uploaded) {
                await telegramService.deleteVideo(video.telegramData);
                console.log(`Video ${videoId} deleted from Telegram successfully.`);
            }
        } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
            console.warn('Failed to delete from Telegram:', error.message);
            // Continue with database deletion even if Telegram deletion fails
        }

        // Delete from database
        await databaseService.deleteVideo(videoId);

        res.json({ success: true, message: 'Video deleted successfully' });
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Enhanced video management endpoints

// Add tags to video
app.post('/api/video/:id/tags', async (req, res) => {
    try {
        const videoId = req.params.id;
        const { tags } = req.body;
        
        if (!tags || !Array.isArray(tags)) {
            return res.status(400).json({ error: 'Tags must be an array' });
        }
        
        const updatedTags = await databaseService.addVideoTags(videoId, tags);
        res.json({ success: true, tags: updatedTags });
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Add tags error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Set video category
app.put('/api/video/:id/category', async (req, res) => {
    try {
        const videoId = req.params.id;
        const { category } = req.body;
        
        await databaseService.setVideoCategory(videoId, category);
        res.json({ success: true, category });
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Set category error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Toggle favorite status
app.post('/api/video/:id/favorite', async (req, res) => {
    try {
        const videoId = req.params.id;
        const favorite = await databaseService.toggleFavorite(videoId);
        res.json({ success: true, favorite });
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Toggle favorite error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Increment view count
app.post('/api/video/:id/view', async (req, res) => {
    try {
        const videoId = req.params.id;
        const viewCount = await databaseService.incrementViewCount(videoId);
        res.json({ success: true, viewCount });
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('View count error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Advanced search endpoint
app.post('/api/search', async (req, res) => {
    try {
        const searchResult = await databaseService.advancedSearch(req.body);
        res.json(searchResult);
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate sharing link
app.post('/api/video/:id/share', async (req, res) => {
    try {
        const videoId = req.params.id;
        const { expiresInHours = 24 } = req.body;
        
        const shareId = await databaseService.generateSharingLink(videoId, expiresInHours);
        res.json({ 
            success: true, 
            shareId,
            shareUrl: `${req.protocol}://${req.get('host')}/share/${shareId}`,
            expiresInHours
        });
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Share link error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Access shared video
app.get('/share/:shareId', async (req, res) => {
    try {
        const shareId = req.params.shareId;
        const shareData = await databaseService.getVideoByShareId(shareId);
        
        if (!shareData) {
            return res.status(404).json({ error: 'Shared video not found or expired' });
        }
        
        res.json({
            video: shareData.video,
            streamUrl: `/api/stream/${shareData.videoId}`,
            shareInfo: shareData.shareLink
        });
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Shared video error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Storage health check
app.get('/api/storage/health', async (req, res) => {
    try {
        const health = await telegramService.getStorageHealth();
        res.json(health);
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Storage health error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Video statistics endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await databaseService.getVideoStats();
        res.json(stats);
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cleanup endpoint to remove local files
app.post('/api/cleanup', async (req, res) => {
    try {
        const cleanupResults = {
            uploads: { cleaned: 0, errors: 0 },
            temp: { cleaned: 0, errors: 0 },
            hls: { cleaned: 0, errors: 0 }
        };

        // Clean uploads directory
        try {
            const uploadFiles = await fs.readdir('uploads');
            for (const file of uploadFiles) {
                try {
                    await fs.remove(path.join('uploads', file));
                    cleanupResults.uploads.cleaned++;
                    console.log(`Cleaned upload file: ${file}`);
                } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
                    cleanupResults.uploads.errors++;
                    console.warn(`Failed to clean upload file ${file}:`, error.message);
                }
            }
        } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
            console.warn('Failed to read uploads directory:', error.message);
        }

        // Clean temp directory
        try {
            const tempFiles = await fs.readdir('temp');
            for (const file of tempFiles) {
                try {
                    await fs.remove(path.join('temp', file));
                    cleanupResults.temp.cleaned++;
                    console.log(`Cleaned temp file: ${file}`);
                } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
                    cleanupResults.temp.errors++;
                    console.warn(`Failed to clean temp file ${file}:`, error.message);
                }
            }
        } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
            console.warn('Failed to read temp directory:', error.message);
        }

        // Clean hls directory if it exists
        try {
            if (await fs.pathExists('hls')) {
                const hlsFiles = await fs.readdir('hls');
                for (const file of hlsFiles) {
                    try {
                        await fs.remove(path.join('hls', file));
                        cleanupResults.hls.cleaned++;
                        console.log(`Cleaned HLS file/directory: ${file}`);
                    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
                        cleanupResults.hls.errors++;
                        console.warn(`Failed to clean HLS file ${file}:`, error.message);
                    }
                }
            }
        } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
            console.warn('Failed to read hls directory:', error.message);
        }

        const totalCleaned = cleanupResults.uploads.cleaned + cleanupResults.temp.cleaned + cleanupResults.hls.cleaned;
        const totalErrors = cleanupResults.uploads.errors + cleanupResults.temp.errors + cleanupResults.hls.errors;

        res.json({
            success: true,
            message: `Cleanup completed: ${totalCleaned} files cleaned, ${totalErrors} errors`,
            details: cleanupResults
        });

    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Cleanup error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Automatic cleanup function
const performAutomaticCleanup = async () => {
    try {
        console.log('Performing automatic cleanup of temporary files...');
        
        // Clean uploads directory (files older than 1 hour)
        try {
            const uploadFiles = await fs.readdir('uploads');
            let cleanedCount = 0;
            
            for (const file of uploadFiles) {
                const filePath = path.join('uploads', file);
                const stats = await fs.stat(filePath);
                const fileAge = Date.now() - stats.mtime.getTime();
                
                // Remove files older than 1 hour (3600000 ms)
                if (fileAge > 3600000) {
                    await fs.remove(filePath);
                    cleanedCount++;
                    console.log(`Auto-cleaned old upload file: ${file}`);
                }
            }
            
            if (cleanedCount > 0) {
                console.log(`Auto-cleanup: Removed ${cleanedCount} old upload files`);
            }
        } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
            console.warn('Auto-cleanup uploads failed:', error.message);
        }

        // Clean temp directory (files older than 30 minutes)
        try {
            const tempFiles = await fs.readdir('temp');
            let cleanedCount = 0;
            
            for (const file of tempFiles) {
                const filePath = path.join('temp', file);
                const stats = await fs.stat(filePath);
                const fileAge = Date.now() - stats.mtime.getTime();
                
                // Remove files older than 30 minutes (1800000 ms)
                if (fileAge > 1800000) {
                    await fs.remove(filePath);
                    cleanedCount++;
                    console.log(`Auto-cleaned old temp file: ${file}`);
                }
            }
            
            if (cleanedCount > 0) {
                console.log(`Auto-cleanup: Removed ${cleanedCount} old temp files`);
            }
        } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
            console.warn('Auto-cleanup temp failed:', error.message);
        }
        
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.warn('Automatic cleanup failed:', error.message);
    }
};

// Manual sync endpoint - force synchronization with Telegram
app.post('/api/sync-telegram', async (req, res) => {
    try {
        console.log('Manual Telegram synchronization requested');
        const videos = await databaseService.getAllVideos();
        const syncResults = {
            total: videos.length,
            valid: 0,
            removed: 0,
            errors: []
        };
        
        for (const video of videos) {
            try {
                if (video.telegramData && video.telegramData.uploaded) {
                    const exists = await telegramService.checkVideoExists(video.telegramData);
                    if (exists) {
                        syncResults.valid++;
                    } else {
                        console.log(`Removing orphaned video: ${video.originalName} (${video.id})`);
                        await databaseService.deleteVideo(video.id);
                        syncResults.removed++;
                    }
                } else {
                    syncResults.valid++; // Videos without Telegram data are kept
                }
            } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
                console.error(`Error checking video ${video.id}:`, error);
                syncResults.errors.push({
                    videoId: video.id,
                    videoName: video.originalName,
                    error: error.message
                });
            }
        }
        
        console.log(`Sync completed: ${syncResults.valid} valid, ${syncResults.removed} removed, ${syncResults.errors.length} errors`);
        res.json({
            success: true,
            message: 'Synchronization completed',
            results: syncResults
        });
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Clean orphaned videos endpoint
app.post('/api/clean-orphaned', async (req, res) => {
    try {
        console.log('Cleaning orphaned videos from database');
        const videos = await databaseService.getAllVideos();
        let removedCount = 0;
        const orphanedVideos = [];
        
        for (const video of videos) {
            try {
                if (video.telegramData && video.telegramData.uploaded) {
                    const exists = await telegramService.checkVideoExists(video.telegramData);
                    if (!exists) {
                        console.log(`Found orphaned video: ${video.originalName} (${video.id})`);
                        orphanedVideos.push({
                            id: video.id,
                            name: video.originalName,
                            uploadDate: video.uploadDate
                        });
                        await databaseService.deleteVideo(video.id);
                        removedCount++;
                    }
                } else {
                    // Videos without Telegram data are also orphaned
                    console.log(`Found video without Telegram data: ${video.originalName} (${video.id})`);
                    orphanedVideos.push({
                        id: video.id,
                        name: video.originalName,
                        uploadDate: video.uploadDate,
                        reason: 'No Telegram data'
                    });
                    await databaseService.deleteVideo(video.id);
                    removedCount++;
                }
            } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
                console.error(`Error checking video ${video.id}:`, error.message);
            }
        }
        
        console.log(`Orphan cleanup completed: ${removedCount} videos removed`);
        res.json({
            success: true,
            message: `Cleanup completed: ${removedCount} orphaned videos removed`,
            removedVideos: orphanedVideos,
            totalRemoved: removedCount
        });
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Orphan cleanup error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Emergency endpoint to delete all videos
app.post('/api/emergency-delete-all', async (req, res) => {
    try {
        console.log('EMERGENCY: Deleting all videos requested');
        const videos = await databaseService.getAllVideos();
        
        let deletedCount = 0;
        let errors = [];
        
        for (const video of videos) {
            try {
                // Delete from Telegram
                if (video.telegramData && video.telegramData.uploaded) {
                    const deleteResult = await telegramService.deleteVideo(video.telegramData);
                    if (deleteResult.deleted) {
                        console.log(`Deleted from Telegram: ${video.originalName}`);
                    }
                }
                
                // Delete from database
                await databaseService.deleteVideo(video.id);
                deletedCount++;
                console.log(`Emergency deleted: ${video.originalName}`);
                
            } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
                console.error(`Error deleting video ${video.id}:`, error);
                errors.push({
                    videoId: video.id,
                    name: video.originalName,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            message: `Emergency deletion completed: ${deletedCount} videos deleted`,
            deletedCount,
            errors
        });
        
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Emergency delete error:', error);
        res.status(500).json({ 
            error: 'Emergency deletion failed',
            details: error.message 
        });
    }
});

// Start server
const startServer = async () => {
    try {
        await ensureDirectories();
        await databaseService.initialize();
        
        // Start automatic cleanup every 30 minutes
        setInterval(performAutomaticCleanup, 30 * 60 * 1000); // 30 minutes
        
        // Perform initial cleanup
        setTimeout(performAutomaticCleanup, 5000); // After 5 seconds
        
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log('Automatic cleanup enabled: uploads (1h), temp (30min)');
        });
    } catch (error) {
                console.error(`DEBUG: Background upload failed for video ${videoId}:`, error.message);
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();