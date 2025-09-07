class StreamDriveApp {
    constructor() {
        this.videos = [];
        this.currentPlayer = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadVideos();
        this.updateBackupStatus();
    }

    setupEventListeners() {
        // Upload modal events
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        // File input change
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Upload area events
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.uploadFile(files[0]);
            }
        });

        // Modal close events
        window.addEventListener('click', (e) => {
            if (e.target.id === 'uploadModal') {
                this.closeUploadModal();
            }
            if (e.target.id === 'playerModal') {
                this.closePlayer();
            }
            if (e.target.id === 'renameModal') {
                this.closeRenameModal();
            }
            if (e.target.id === 'deleteModal') {
                this.closeDeleteModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUploadModal();
                this.closePlayer();
                this.closeRenameModal();
                this.closeDeleteModal();
            }
            // Enter key for rename modal
            if (e.key === 'Enter' && document.getElementById('renameModal').classList.contains('show')) {
                this.renameVideo();
            }
        });
    }

    // File Management
    async loadVideos() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        try {
            loadingSpinner.style.display = 'flex';
            const response = await fetch('/api/videos');
            
            if (!response.ok) {
                throw new Error('Failed to load videos');
            }

            this.videos = await response.json();
            this.renderVideos();
        } catch (error) {
            console.error('Error loading videos:', error);
            this.showToast('Failed to load videos', 'error');
            this.showEmptyState('Error loading files');
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    renderVideos() {
        const videosGrid = document.getElementById('videosGrid');
        
        if (this.videos.length === 0) {
            this.showEmptyState('No videos uploaded yet');
            return;
        }

        videosGrid.innerHTML = '';

        this.videos.forEach(video => {
            const videoCard = this.createVideoCard(video);
            videosGrid.appendChild(videoCard);
        });
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.videoId = video.id;
        
        const backupStatus = video.telegramData?.uploaded ? 'success' : 'error';
        const backupText = video.telegramData?.uploaded ? 'Backed up' : 'Backup failed';

        card.innerHTML = `
            <div class="video-preview">
                <i class="fas fa-play-circle"></i>
                <div class="video-overlay">
                    <button class="play-btn" onclick="app.playVideo('${video.id}')">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
            <div class="video-info">
                <div class="video-title" title="${video.originalName}">
                    ${video.originalName}
                </div>
                <div class="video-meta">
                    <span class="video-size">${this.formatFileSize(video.size)}</span>
                    <span class="backup-status ${backupStatus}">${backupText}</span>
                </div>
                <div class="video-actions">
                    <button class="action-btn primary" onclick="app.playVideo('${video.id}')">
                        <i class="fas fa-play"></i>
                        Play
                    </button>
                    <button class="action-btn" onclick="app.downloadVideo('${video.id}')">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                    <button class="action-btn" onclick="app.copyVideoUrl('${video.id}')">
                        <i class="fas fa-link"></i>
                        URL
                    </button>
                    <button class="action-btn rename-btn" onclick="app.showRenameModal('${video.id}')">
                        <i class="fas fa-edit"></i>
                        Rename
                    </button>
                    <button class="action-btn delete-btn" onclick="app.confirmDelete('${video.id}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    showEmptyState(message) {
        const videosGrid = document.getElementById('videosGrid');
        videosGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-video"></i>
                <h3>${message}</h3>
                <p>Upload your first video to get started with StreamDrive</p>
            </div>
        `;
    }

    // Upload Functionality
    openUploadModal() {
        document.getElementById('uploadModal').classList.add('show');
    }

    closeUploadModal() {
        document.getElementById('uploadModal').classList.remove('show');
        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('progressFill').style.width = '0%';
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.uploadFile(file);
        }
    }

    async uploadFile(file) {
        if (!this.validateFile(file)) {
            return;
        }

        const formData = new FormData();
        formData.append('video', file);

        const progressContainer = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        progressContainer.style.display = 'block';
        progressText.textContent = 'Uploading...';

        try {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressFill.style.width = percentComplete + '%';
                    progressText.textContent = `Uploading... ${Math.round(percentComplete)}%`;
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    this.showToast('Video uploaded successfully!', 'success');
                    this.loadVideos();
                    progressText.textContent = 'Upload complete!';
                    setTimeout(() => {
                        this.closeUploadModal();
                    }, 2000);
                } else {
                    const error = JSON.parse(xhr.responseText);
                    this.showToast(`Upload failed: ${error.error}`, 'error');
                    progressContainer.style.display = 'none';
                }
            });

            xhr.addEventListener('error', () => {
                this.showToast('Upload failed: Network error', 'error');
                progressContainer.style.display = 'none';
            });

            xhr.open('POST', '/api/upload');
            xhr.send(formData);

        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Upload failed: ' + error.message, 'error');
            progressContainer.style.display = 'none';
        }
    }

    validateFile(file) {
        const maxSize = 2 * 1024 * 1024 * 1024; // 2GB

        if (!file.type.startsWith('video/')) {
            this.showToast('Please select a valid video file', 'error');
            return false;
        }

        if (file.size > maxSize) {
            this.showToast('File size must be less than 2GB', 'error');
            return false;
        }

        return true;
    }

    // Video Player - Fixed version
    async playVideo(videoId) {
        try {
            // First get video details
            const videoResponse = await fetch(`/api/video/${videoId}`);
            
            if (!videoResponse.ok) {
                const errorData = await videoResponse.json().catch(() => ({}));
                throw new Error(errorData.error || `Video not found (${videoResponse.status})`);
            }

            const video = await videoResponse.json();
            const modal = document.getElementById('playerModal');
            const playerTitle = document.getElementById('playerTitle');
            const videoPlayer = document.getElementById('videoPlayer');

            playerTitle.textContent = video.originalName;
            
            // Setup video player with direct stream URL
            const streamUrl = `/api/stream/${videoId}`;
            
            // Check if HLS is supported and available
            if (window.Hls && Hls.isSupported()) {
                if (this.currentPlayer) {
                    this.currentPlayer.destroy();
                }
                
                this.currentPlayer = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                    debug: false
                });
                
                this.currentPlayer.loadSource(streamUrl);
                this.currentPlayer.attachMedia(videoPlayer);
                
                this.currentPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('HLS manifest loaded successfully');
                });
                
                this.currentPlayer.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS error:', data);
                    if (data.fatal) {
                        // Fallback to direct video src
                        console.log('HLS failed, trying direct video playback');
                        videoPlayer.src = streamUrl;
                        this.currentPlayer = null;
                    }
                });
            } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                videoPlayer.src = streamUrl;
            } else {
                // Fallback to direct video src
                videoPlayer.src = streamUrl;
            }

            modal.classList.add('show');
            
        } catch (error) {
            console.error('Error playing video:', error);
            this.showToast(`Failed to play video: ${error.message}`, 'error');
        }
    }

    closePlayer() {
        const modal = document.getElementById('playerModal');
        const videoPlayer = document.getElementById('videoPlayer');
        
        modal.classList.remove('show');
        videoPlayer.pause();
        videoPlayer.src = '';
        
        if (this.currentPlayer) {
            this.currentPlayer.destroy();
            this.currentPlayer = null;
        }
    }

    // Video Actions
    downloadVideo(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (video) {
            // Create download link
            const link = document.createElement('a');
            link.href = `/api/stream/${videoId}`;
            link.download = video.originalName;
            link.click();
            this.showToast('Download started', 'success');
        }
    }

    copyVideoUrl(videoId) {
        const streamUrl = `${window.location.origin}/api/stream/${videoId}`;
        
        navigator.clipboard.writeText(streamUrl).then(() => {
            this.showToast('Video URL copied to clipboard', 'success');
        }).catch(() => {
            this.showToast('Failed to copy URL', 'error');
        });
    }

    // Rename Video
    showRenameModal(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (video) {
            this.currentRenameVideoId = videoId;
            const modal = document.getElementById('renameModal');
            const input = document.getElementById('newVideoName');
            
            // Set current name without extension
            const nameWithoutExt = video.originalName.replace(/\.[^/.]+$/, "");
            input.value = nameWithoutExt;
            
            modal.classList.add('show');
            input.focus();
            input.select();
        }
    }

    async renameVideo() {
        const newName = document.getElementById('newVideoName').value.trim();
        
        if (!newName) {
            this.showToast('Please enter a valid name', 'error');
            return;
        }

        if (!this.currentRenameVideoId) return;

        try {
            const video = this.videos.find(v => v.id === this.currentRenameVideoId);
            const originalExt = video.originalName.match(/\.[^/.]+$/)?.[0] || '';
            const fullNewName = newName + originalExt;

            const response = await fetch(`/api/video/${this.currentRenameVideoId}/rename`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newName: fullNewName })
            });

            if (response.ok) {
                this.showToast('Video renamed successfully', 'success');
                this.loadVideos();
                this.closeRenameModal();
            } else {
                const error = await response.json();
                this.showToast(`Failed to rename: ${error.error}`, 'error');
            }
        } catch (error) {
            console.error('Rename error:', error);
            this.showToast('Failed to rename video', 'error');
        }
    }

    closeRenameModal() {
        document.getElementById('renameModal').classList.remove('show');
        this.currentRenameVideoId = null;
    }

    // Delete Video
    confirmDelete(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (video) {
            this.currentDeleteVideoId = videoId;
            const modal = document.getElementById('deleteModal');
            const videoNameSpan = document.getElementById('deleteVideoName');
            
            videoNameSpan.textContent = video.originalName;
            modal.classList.add('show');
        }
    }

    async deleteVideo() {
        if (!this.currentDeleteVideoId) return;

        try {
            const response = await fetch(`/api/video/${this.currentDeleteVideoId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showToast('Video deleted successfully', 'success');
                this.loadVideos();
                this.closeDeleteModal();
            } else {
                const error = await response.json();
                this.showToast(`Failed to delete: ${error.error}`, 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showToast('Failed to delete video', 'error');
        }
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('show');
        this.currentDeleteVideoId = null;
    }

    // Backup Status
    updateBackupStatus() {
        const backupStatus = document.getElementById('backupStatus');
        // Mock backup status - replace with real API call
        backupStatus.textContent = 'Connected';
        backupStatus.className = 'status connected';
    }

    syncBackup() {
        const syncBtn = document.getElementById('syncBtn');
        const icon = syncBtn.querySelector('i');
        
        syncBtn.classList.add('syncing');
        this.showToast('Syncing backup...', 'info');
        
        // Mock sync process
        setTimeout(() => {
            syncBtn.classList.remove('syncing');
            this.showToast('Backup synced successfully', 'success');
        }, 2000);
    }

    // Utility Functions
    formatFileSize(bytes) {
        if (!bytes) return 'Unknown';
        
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Global functions for HTML onclick events
function openUploadModal() {
    app.openUploadModal();
}

function closeUploadModal() {
    app.closeUploadModal();
}

function closePlayer() {
    app.closePlayer();
}

function syncBackup() {
    app.syncBackup();
}

function closeRenameModal() {
    app.closeRenameModal();
}

function closeDeleteModal() {
    app.closeDeleteModal();
}

// Initialize app
const app = new StreamDriveApp();
