const fs = require('fs-extra');
const path = require('path');

class DatabaseService {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.videosFile = path.join(this.dataDir, 'videos.json');
        this.videos = new Map();
    }

    async initialize() {
        await fs.ensureDir(this.dataDir);
        
        if (await fs.pathExists(this.videosFile)) {
            try {
                const data = await fs.readJson(this.videosFile);
                this.videos = new Map(Object.entries(data));
                console.log(`Loaded ${this.videos.size} videos from database`);
            } catch (error) {
                console.error('Error loading database:', error);
                this.videos = new Map();
            }
        } else {
            await this.saveDatabase();
        }
    }

    async saveDatabase() {
        try {
            const data = Object.fromEntries(this.videos);
            await fs.writeJson(this.videosFile, data, { spaces: 2 });
        } catch (error) {
            console.error('Error saving database:', error);
            throw error;
        }
    }

    async saveVideo(videoData) {
        try {
            this.videos.set(videoData.id, videoData);
            await this.saveDatabase();
            console.log(`Video saved: ${videoData.originalName} (${videoData.id})`);
            return videoData;
        } catch (error) {
            console.error('Error saving video:', error);
            throw error;
        }
    }

    async getVideo(videoId) {
        return this.videos.get(videoId) || null;
    }

    async getAllVideos() {
        return Array.from(this.videos.values()).sort((a, b) => 
            new Date(b.uploadDate) - new Date(a.uploadDate)
        );
    }

    async updateVideo(videoId, updates) {
        const video = this.videos.get(videoId);
        if (!video) {
            throw new Error('Video not found');
        }

        const updatedVideo = { ...video, ...updates, updatedDate: new Date().toISOString() };
        this.videos.set(videoId, updatedVideo);
        await this.saveDatabase();
        
        return updatedVideo;
    }

    async updateVideoName(videoId, newName) {
        return await this.updateVideo(videoId, { originalName: newName });
    }

    async deleteVideo(videoId) {
        const deleted = this.videos.delete(videoId);
        if (deleted) {
            await this.saveDatabase();
            console.log(`Video deleted: ${videoId}`);
        }
        return deleted;
    }

    async searchVideos(query) {
        const searchTerm = query.toLowerCase();
        return Array.from(this.videos.values()).filter(video => 
            video.originalName.toLowerCase().includes(searchTerm) ||
            video.id.toLowerCase().includes(searchTerm)
        );
    }

    async getVideosByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return Array.from(this.videos.values()).filter(video => {
            const uploadDate = new Date(video.uploadDate);
            return uploadDate >= start && uploadDate <= end;
        });
    }

    async getVideoStats() {
        const videos = Array.from(this.videos.values());
        
        const totalVideos = videos.length;
        const totalSize = videos.reduce((sum, video) => sum + (video.size || 0), 0);
        const totalDuration = videos.reduce((sum, video) => 
            sum + (video.metadata?.duration || 0), 0
        );
        
        const formatCounts = {};
        videos.forEach(video => {
            const format = video.metadata?.format || 'unknown';
            formatCounts[format] = (formatCounts[format] || 0) + 1;
        });

        const resolutionCounts = {};
        videos.forEach(video => {
            if (video.metadata?.video) {
                const resolution = `${video.metadata.video.width}x${video.metadata.video.height}`;
                resolutionCounts[resolution] = (resolutionCounts[resolution] || 0) + 1;
            }
        });

        return {
            totalVideos,
            totalSize: this.formatFileSize(totalSize),
            totalDuration: this.formatDuration(totalDuration),
            formatCounts,
            resolutionCounts,
            averageSize: totalVideos > 0 ? this.formatFileSize(totalSize / totalVideos) : '0 Bytes',
            averageDuration: totalVideos > 0 ? this.formatDuration(totalDuration / totalVideos) : '0:00'
        };
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

    async backup() {
        const backupFile = path.join(this.dataDir, `backup_${Date.now()}.json`);
        await fs.copy(this.videosFile, backupFile);
        console.log(`Database backed up to: ${backupFile}`);
        return backupFile;
    }

    async restore(backupFile) {
        if (await fs.pathExists(backupFile)) {
            await fs.copy(backupFile, this.videosFile);
            await this.initialize();
            console.log(`Database restored from: ${backupFile}`);
            return true;
        }
        return false;
    }
}

module.exports = DatabaseService;