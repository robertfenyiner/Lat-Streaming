# Video Streaming Platform

A comprehensive video streaming platform that uploads videos to Telegram as cloud storage and streams them in HLS (m3u8) format with support for multiple audio tracks and quality levels.

## Features

- **Video Upload**: Support for multiple video formats (MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V, 3GP)
- **Telegram Cloud Storage**: Automatic backup to Telegram channel with support for large files
- **HLS Streaming**: Convert any video format to HLS (m3u8) for adaptive streaming
- **Multiple Quality Levels**: Automatic generation of different quality streams
- **Dual Audio Support**: Preserve and stream multiple audio tracks if available
- **Web Interface**: Modern, responsive web interface for upload and playback
- **Video Library**: Browse, search, and manage uploaded videos
- **Real-time Progress**: Upload progress tracking with visual feedback

## Prerequisites

- Node.js (v14 or higher)
- FFmpeg installed and accessible in PATH
- Telegram Bot Token
- Telegram Channel for storage

## Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Install FFmpeg:
   - **Windows**: Download from https://ffmpeg.org/download.html
   - **macOS**: `brew install ffmpeg`
   - **Linux**: `sudo apt install ffmpeg`

4. Create a Telegram Bot:
   - Message @BotFather on Telegram
   - Create a new bot with `/newbot`
   - Save the bot token

5. Create a Telegram Channel:
   - Create a new channel
   - Add your bot as an administrator
   - Get the channel ID (starts with @)

6. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHANNEL_ID=@your_channel_username_or_id
   PORT=3000
   ```

## Usage

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and go to `http://localhost:3000`

3. Upload videos using the web interface:
   - Drag and drop files or click to browse
   - Monitor upload progress
   - Videos are automatically processed and backed up to Telegram

4. Stream videos:
   - Browse your video library
   - Click play to stream in HLS format
   - Supports adaptive quality and multiple audio tracks

## API Endpoints

- `POST /api/upload` - Upload a video file
- `GET /api/videos` - Get list of all videos
- `GET /api/video/:id` - Get specific video details
- `GET /api/stream/:id` - Get HLS stream for video
- `DELETE /api/video/:id` - Delete a video

## Technical Details

### Video Processing
- Converts all video formats to HLS using FFmpeg
- Generates multiple quality levels based on source resolution
- Preserves multiple audio tracks with proper metadata
- Creates adaptive bitrate streaming

### Telegram Integration
- Uploads videos up to 50MB directly
- Splits larger files into chunks for upload
- Maintains file integrity across chunks
- Supports download and deletion from Telegram

### Storage Structure
```
video-streaming-platform/
├── uploads/          # Temporary upload storage
├── hls/             # HLS output files
├── temp/            # Temporary processing files
├── data/            # JSON database
└── public/          # Web interface files
```

## Configuration Options

### Environment Variables
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `TELEGRAM_CHANNEL_ID` - Target channel for uploads
- `PORT` - Server port (default: 3000)
- `UPLOAD_DIR` - Upload directory (default: ./uploads)
- `HLS_DIR` - HLS output directory (default: ./hls)
- `TEMP_DIR` - Temporary files directory (default: ./temp)
- `FFMPEG_PATH` - Custom FFmpeg path
- `FFPROBE_PATH` - Custom FFprobe path

### Video Quality Levels
The system automatically generates appropriate quality levels:
- 1080p (1920x1080) - 5000k bitrate
- 720p (1280x720) - 3000k bitrate
- 480p (854x480) - 1500k bitrate
- 360p (640x360) - 800k bitrate

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Ensure FFmpeg is installed and in PATH
   - Set custom paths in .env if needed

2. **Telegram upload fails**
   - Verify bot token and channel ID
   - Ensure bot has admin rights in channel
   - Check file size limits

3. **Video won't play**
   - Check browser HLS support
   - Verify HLS files were generated
   - Check console for errors

4. **Large file uploads**
   - Files over 2GB are not supported
   - Consider compressing videos before upload

### Logs
Check console output for detailed processing information and error messages.

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari (native HLS support)
- Edge

## Security Considerations

- The platform is designed for local/private use
- Add authentication for production deployment
- Consider rate limiting for public access
- Validate file types and sizes appropriately

## License

MIT License - feel free to modify and distribute as needed.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review console logs for errors
3. Ensure all prerequisites are met
4. Verify configuration settings