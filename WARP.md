# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an advanced Node.js video streaming platform with lifetime cloud storage capabilities. It uses redundant Telegram channels for cloud storage, serves videos via HLS with adaptive bitrate streaming, and provides comprehensive video management features including tagging, favorites, sharing, and analytics. The platform ensures data integrity through checksums and automatic retry mechanisms.

## Development Commands

### Start the Application
```bash
npm start          # Production mode
npm run dev        # Development mode with nodemon
```

### Install Dependencies
```bash
npm install        # Install all dependencies
```

### Environment Setup
```bash
cp .env.example .env    # Copy environment template
```

Required environment variables:
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `TELEGRAM_CHANNEL_ID` - Primary channel ID (e.g., @your_channel)
- `TELEGRAM_BACKUP_CHANNELS` - Backup channels for redundancy (comma-separated, optional)
- `PORT` - Server port (default: 3000)
- `FFMPEG_PATH` - Custom FFmpeg binary path (optional)
- `FFPROBE_PATH` - Custom FFprobe binary path (optional)
- `ENABLE_THUMBNAILS` - Generate thumbnails (default: true)
- `ENABLE_PREVIEW` - Generate preview clips (default: true)
- `THUMBNAIL_COUNT` - Number of thumbnails to generate (default: 5)
- `PREVIEW_DURATION` - Preview clip duration in seconds (default: 10)

### Prerequisites
- Node.js v14+
- FFmpeg installed and in PATH
- Telegram bot token and channel setup

## Architecture

### Core Services Layer
The application follows a service-oriented architecture with three main services:

#### DatabaseService (`services/databaseService.js`)
- JSON file-based database using Map for in-memory operations
- Handles video metadata storage, search, and statistics
- Provides backup/restore functionality
- Located at `data/videos.json`

#### TelegramService (`services/telegramService.js`)
- Manages redundant uploads to multiple Telegram channels
- SHA-256 checksum verification for data integrity
- Handles file chunking for large videos (>50MB) with reconstruction
- Automatic retry with exponential backoff for failed uploads
- Real-time storage health monitoring across all channels
- Supports download and deletion from primary and backup channels

#### VideoProcessor (`services/videoProcessor.js`)
- FFmpeg wrapper for video processing
- Converts videos to HLS format with adaptive bitrate
- Handles multiple audio tracks and quality levels
- Generates `.m3u8` playlists and `.ts` segments

### API Architecture

#### Main Server (`server.js`)
Express.js server with comprehensive video management endpoints:

**Core Operations:**
- `POST /api/upload` - Video upload with enhanced processing
- `GET /api/videos` - List all videos with metadata
- `GET /api/video/:id` - Get specific video details
- `GET /api/stream/:id` - Serve HLS playlist
- `GET /api/stream/:id/:segment` - Serve HLS segments
- `DELETE /api/video/:id` - Delete video and cleanup

**Video Management:**
- `POST /api/video/:id/tags` - Add tags to video
- `PUT /api/video/:id/category` - Set video category
- `POST /api/video/:id/favorite` - Toggle favorite status
- `POST /api/video/:id/view` - Increment view count
- `PUT /api/video/:id/rename` - Rename video

**Advanced Features:**
- `POST /api/search` - Advanced search with filters
- `POST /api/video/:id/share` - Generate sharing links
- `GET /share/:shareId` - Access shared videos
- `GET /api/storage/health` - Storage health monitoring
- `GET /api/stats` - Platform analytics

#### Frontend (`public/`)
Simple vanilla JavaScript SPA with:
- Drag-and-drop video upload
- Progress tracking
- Video library browser
- HLS video player integration

### Enhanced Data Flow
1. **Upload** → Video uploaded via web interface → `multer` middleware → temp storage in `uploads/`
2. **Analysis** → Enhanced metadata extraction → `VideoProcessor.extractAdvancedMetadata()`
3. **Thumbnails** → Multiple thumbnail generation → `VideoProcessor.generateMultipleThumbnails()`
4. **Preview** → Preview clip generation → `VideoProcessor.generateVideoPreview()`
5. **HLS Conversion** → Adaptive bitrate conversion → `VideoProcessor.convertToHLS()` → output to `hls/videoId/`
6. **Cloud Backup** → Redundant upload with checksum → `TelegramService.uploadVideo()` → primary + backup channels
7. **Database Storage** → Enhanced metadata storage → `DatabaseService.saveVideo()` → `data/videos.json`
8. **Verification** → Upload integrity verification → checksum comparison
9. **Cleanup** → Original file removal → temp files cleaned

### Storage Structure
```
├── uploads/     # Temporary upload storage (cleaned after processing)
├── hls/         # HLS output files organized by video ID
│   └── {videoId}/
│       ├── playlist.m3u8
│       └── segment_*.ts
├── temp/        # Temporary processing files and chunks
├── data/        # JSON database and backups
│   └── videos.json
└── public/      # Static web assets
```

## File Processing Pipeline

### Video Conversion Logic
- Input: Any video format (MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V, 3GP)
- Process: FFmpeg conversion to HLS with libx264 video codec and AAC audio
- Output: Adaptive bitrate streaming with quality levels based on source resolution
- Segments: 10-second chunks with sequential naming

### Quality Level Generation
Automatically generates appropriate quality levels:
- 1080p (1920x1080) @ 5000k - if source ≥ 1080p
- 720p (1280x720) @ 3000k - if source ≥ 720p  
- 480p (854x480) @ 1500k - if source ≥ 480p
- 360p (640x360) @ 800k - always generated

### Telegram Integration Details
- Files ≤50MB: Direct upload as video with streaming support
- Files >50MB: Split into 45MB chunks, uploaded as documents
- Maintains file integrity across chunks with sequential reassembly
- Supports download reconstruction and deletion of chunked files

## Development Notes

### Error Handling Patterns
- Services throw errors that are caught and handled in Express routes
- Telegram service gracefully degrades if credentials are missing
- FFmpeg errors are logged with full command line for debugging

### Database Considerations
- Uses JSON file with in-memory Map for performance
- Auto-saves after every operation
- Provides backup/restore functionality
- Supports search and filtering operations

### Configuration Priority
1. Environment variables
2. Default values in code
3. FFmpeg auto-detection in PATH

### Debugging
- Enable detailed FFmpeg logging by checking server console
- Use `/api/debug` endpoint for database inspection
- Check `data/videos.json` for direct database state
- Monitor `hls/` directory for conversion outputs

## Common Development Tasks

### Adding New Video Formats
1. Update `fileFilter` in `server.js` multer configuration
2. Test FFmpeg compatibility with new format
3. Update documentation and error messages

### Modifying HLS Settings
Edit `VideoProcessor.convertToHLS()` method:
- Segment duration: `-hls_time` parameter
- Quality settings: CRF and bitrate values
- Audio encoding: codec and bitrate parameters

### Extending Telegram Features
- File size limits in `TelegramService.maxFileSize`
- Chunk size in `uploadLargeVideo()` method
- Message formatting in caption templates

### Database Schema Changes
1. Update `DatabaseService.saveVideo()` for new fields
2. Add migration logic in `initialize()` method
3. Update search and filter methods as needed
