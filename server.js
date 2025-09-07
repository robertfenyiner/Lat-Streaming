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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/hls', express.static('hls'));

// Ensure directories exist
const ensureDirectories = async () => {
    const dirs = ['uploads', 'hls', 'temp', 'data'];
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
        const allowedTypes = /\.(mp4|avi|mkv|mov|wmv|flv|webm|m4v|3gp)$/i;
        if (allowedTypes.test(file.originalname)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only video files are allowed.'));
        }
    }
});

// Initialize services
const telegramService = new TelegramService();
const videoProcessor = new VideoProcessor();
const databaseService = new DatabaseService();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload video endpoint
app.post('/api/upload', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        const videoId = uuidv4();
        const videoPath = req.file.path;
        const originalName = req.file.originalname;

        console.log(`Processing video: ${originalName}`);

        // Get video metadata
        const metadata = await videoProcessor.getVideoMetadata(videoPath);
        
        // Process video to HLS format
        const hlsPath = await videoProcessor.convertToHLS(videoPath, videoId, metadata);

        // Upload to Telegram
        const telegramData = await telegramService.uploadVideo(videoPath, originalName, videoId);

        // Save to database
        const videoData = {
            id: videoId,
            originalName: originalName,
            metadata: metadata,
            hlsPath: hlsPath,
            telegramData: telegramData,
            uploadDate: new Date().toISOString(),
            size: req.file.size
        };

        await databaseService.saveVideo(videoData);

        // Clean up original file
        await fs.remove(videoPath);

        res.json({
            success: true,
            videoId: videoId,
            message: 'Video uploaded and processed successfully',
            streamUrl: `/api/stream/${videoId}`,
            metadata: metadata
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get video list
app.get('/api/videos', async (req, res) => {
    try {
        const videos = await databaseService.getAllVideos();
        console.log(`Found ${videos.length} videos in database`);
        res.json(videos);
    } catch (error) {
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
        console.error('Error fetching video:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stream video endpoint - serve playlist
app.get('/api/stream/:id', async (req, res) => {
    try {
        const videoId = req.params.id;
        const video = await databaseService.getVideo(videoId);
        
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const m3u8Path = path.join(__dirname, 'hls', videoId, 'playlist.m3u8');
        
        if (await fs.pathExists(m3u8Path)) {
            // Read the playlist and modify segment paths to be absolute
            let playlistContent = await fs.readFile(m3u8Path, 'utf8');
            
            // Replace relative segment paths with absolute URLs
            playlistContent = playlistContent.replace(
                /segment_(\d+)\.ts/g, 
                `/api/stream/${videoId}/segment_$1.ts`
            );
            
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(playlistContent);
        } else {
            res.status(404).json({ error: 'Stream not available' });
        }
    } catch (error) {
        console.error('Stream error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stream video segments
app.get('/api/stream/:id/:segment', async (req, res) => {
    try {
        const videoId = req.params.id;
        const segment = req.params.segment;
        
        // Validate segment filename
        if (!/^segment_\d+\.ts$/.test(segment)) {
            return res.status(404).json({ error: 'Invalid segment' });
        }
        
        const video = await databaseService.getVideo(videoId);
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const segmentPath = path.join(__dirname, 'hls', videoId, segment);
        
        if (await fs.pathExists(segmentPath)) {
            res.setHeader('Content-Type', 'video/mp2t');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.sendFile(segmentPath);
        } else {
            res.status(404).json({ error: 'Segment not found' });
        }
    } catch (error) {
        console.error('Segment error:', error);
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

        // Delete HLS files
        const hlsDir = path.join(__dirname, 'hls', videoId);
        if (await fs.pathExists(hlsDir)) {
            await fs.remove(hlsDir);
        }

        // Delete from database
        await databaseService.deleteVideo(videoId);

        res.json({ success: true, message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
const startServer = async () => {
    try {
        await ensureDirectories();
        await databaseService.initialize();
        
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log('Make sure to configure your .env file with Telegram bot credentials');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();