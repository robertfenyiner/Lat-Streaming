# 🎬 Unlimited - Telegram Cloud Storage Video Platform

A modern, minimalist video streaming platform that uses Telegram as unlimited cloud storage backend. Stream, store, and manage your videos with a beautiful dark-themed interface.

![Version](https://img.shields.io/badge/version-2.0.0-green)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### Core Features
- **🚀 Unlimited Storage** - Leverage Telegram's cloud infrastructure for unlimited video storage
- **📡 Direct Streaming** - Stream videos directly from Telegram without local storage
- **⬆️ Smart Upload** - Automatic video upload to Telegram with progress tracking
- **⬇️ Download Support** - Download videos from cloud storage anytime
- **🔗 Share Links** - Generate shareable links for your videos
- **📱 Responsive Design** - Works seamlessly on desktop and mobile devices

### UI/UX Features
- **🌑 Dark Theme** - Modern, minimalist dark interface with clean borders
- **🎨 Clean Icons** - Custom SVG icons for better visual consistency
- **📊 Real-time Status** - Live connection status indicator
- **🔔 Smart Notifications** - Non-intrusive notification system
- **⚡ Fast Loading** - Optimized performance with lazy loading
- **🎯 Intuitive Controls** - Simple, user-friendly interface

### Technical Features
- **🔄 Auto Cleanup** - Automatic cleanup of temporary files
- **📈 Range Requests** - Support for video seeking and partial content
- **🛡️ Error Handling** - Graceful error recovery and fallbacks
- **💾 Database Support** - JSON-based database for video metadata
- **🔐 Secure Streaming** - Direct streaming with proper authentication
- **🎞️ Multiple Formats** - Support for MP4, WebM, AVI, MKV, and more

## 🚀 Recent Updates (v2.0.0)

### UI Redesign
- ✅ Complete dark theme redesign with minimalist approach
- ✅ Removed outer borders for cleaner look
- ✅ Improved color contrast for better visibility
- ✅ Custom SVG icons replacing FontAwesome
- ✅ Enhanced hover effects and animations
- ✅ Single notification system (fixed duplicate notifications)

### Backend Improvements
- ✅ Fixed Telegram bot configuration issues
- ✅ Improved video streaming with proper MIME types
- ✅ Enhanced error handling for video playback
- ✅ Fixed video player cleanup on close
- ✅ Improved thumbnail generation with graceful fallback
- ✅ Added axios for better HTTP streaming

### Bug Fixes
- ✅ Fixed "NotSupportedError" in video playback
- ✅ Fixed backup channel configuration errors
- ✅ Fixed button functionality and visibility
- ✅ Fixed app initialization timing issues
- ✅ Fixed FFmpeg thumbnail generation errors

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- FFmpeg (for thumbnail generation)
- Telegram Bot Token

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/friday2su/unlimited.git
cd unlimited
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_ID=your_channel_id_here

# Server Configuration
PORT=3000

# Storage Settings
ENABLE_THUMBNAILS=true  # Set to false if FFmpeg issues occur
```

4. **Create Telegram Bot**
- Open [@BotFather](https://t.me/botfather) on Telegram
- Create a new bot with `/newbot`
- Copy the bot token to `.env`
- Create a channel and add the bot as admin
- Get channel ID and add to `.env`

5. **Start the server**
```bash
npm start
```

6. **Access the platform**
Open your browser and navigate to `http://localhost:3000`

## 📖 Usage

### Uploading Videos
1. Click the "Upload" button in the header
2. Select or drag-and-drop your video file
3. Wait for upload to complete
4. Video will be automatically saved to Telegram cloud

### Streaming Videos
1. Click on any video card to start streaming
2. Use the player controls for playback
3. Videos stream directly from Telegram - no local storage needed

### Managing Videos
- **Play** - Click the play button or video thumbnail
- **Download** - Download video to your device
- **Copy URL** - Get shareable link for the video
- **Delete** - Remove video (with confirmation)

## 🔮 Upcoming Features

### Phase 1 - Core Enhancements
- [ ] **Video Rename** - Rename videos after upload
- [ ] **Search Functionality** - Search videos by name
- [ ] **Video Categories** - Organize videos into categories
- [ ] **Batch Upload** - Upload multiple videos at once
- [ ] **Upload Queue** - Queue system for multiple uploads

### Phase 2 - Advanced Features
- [ ] **Video Compression** - Automatic video compression before upload
- [ ] **Adaptive Streaming** - HLS/DASH support for better streaming
- [ ] **Video Transcoding** - Convert videos to different formats
- [ ] **Subtitle Support** - Add and display subtitles
- [ ] **Video Editor** - Basic video editing capabilities
- [ ] **Playlist Support** - Create and manage playlists

### Phase 3 - Social Features
- [ ] **User Authentication** - Multi-user support with login
- [ ] **Sharing System** - Advanced sharing with permissions
- [ ] **Comments** - Add comments to videos
- [ ] **Favorites** - Mark videos as favorites
- [ ] **Watch History** - Track viewing history
- [ ] **Analytics** - View count and engagement metrics

### Phase 4 - Platform Features
- [ ] **Mobile App** - Native mobile applications
- [ ] **PWA Support** - Progressive Web App capabilities
- [ ] **Offline Mode** - Download for offline viewing
- [ ] **Live Streaming** - Stream live videos
- [ ] **Multi-language** - Support for multiple languages
- [ ] **Dark/Light Theme Toggle** - Theme switching option

### Phase 5 - Advanced Storage
- [ ] **Multi-channel Support** - Use multiple Telegram channels
- [ ] **Redundancy System** - Automatic backup across channels
- [ ] **Storage Analytics** - Monitor storage usage
- [ ] **Auto-migration** - Migrate videos between channels
- [ ] **Compression Stats** - Show storage savings

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Telegram for providing unlimited cloud storage
- Node.js community for excellent packages
- FFmpeg for video processing capabilities
- All contributors and users of this project

## 📧 Contact

For questions and support, please open an issue on GitHub.

---

**Note:** This project is for educational purposes. Please ensure you comply with Telegram's terms of service when using this platform.
