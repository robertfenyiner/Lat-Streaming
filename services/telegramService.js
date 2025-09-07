const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');

class TelegramService {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.channelId = process.env.TELEGRAM_CHANNEL_ID;
        
        if (!this.botToken || !this.channelId) {
            console.warn('Telegram credentials not configured. Video backup to Telegram will be disabled.');
            this.bot = null;
            return;
        }

        this.bot = new TelegramBot(this.botToken, { polling: false });
        this.maxFileSize = 50 * 1024 * 1024; // 50MB Telegram limit
    }

    async uploadVideo(videoPath, originalName, videoId) {
        if (!this.bot) {
            console.log('Telegram service not configured, skipping upload');
            return { uploaded: false, reason: 'Service not configured' };
        }

        try {
            const stats = await fs.stat(videoPath);
            const fileSize = stats.size;

            if (fileSize > this.maxFileSize) {
                return await this.uploadLargeVideo(videoPath, originalName, videoId);
            } else {
                return await this.uploadSmallVideo(videoPath, originalName, videoId);
            }
        } catch (error) {
            console.error('Telegram upload error:', error);
            return { uploaded: false, error: error.message };
        }
    }

    async uploadSmallVideo(videoPath, originalName, videoId) {
        try {
            const caption = `📹 ${originalName}\n🆔 ${videoId}\n📅 ${new Date().toLocaleString()}`;
            
            const result = await this.bot.sendVideo(this.channelId, videoPath, {
                caption: caption,
                supports_streaming: true
            });

            return {
                uploaded: true,
                messageId: result.message_id,
                fileId: result.video.file_id,
                fileUniqueId: result.video.file_unique_id,
                size: result.video.file_size,
                duration: result.video.duration,
                uploadMethod: 'single'
            };
        } catch (error) {
            console.error('Small video upload error:', error);
            throw error;
        }
    }

    async uploadLargeVideo(videoPath, originalName, videoId) {
        try {
            // For large files, split into chunks
            const chunkSize = 45 * 1024 * 1024; // 45MB chunks
            const chunks = await this.splitVideoFile(videoPath, chunkSize);
            const uploadedChunks = [];

            for (let i = 0; i < chunks.length; i++) {
                const chunkPath = chunks[i];
                const caption = `📹 ${originalName} (Part ${i + 1}/${chunks.length})\n🆔 ${videoId}\n📅 ${new Date().toLocaleString()}`;
                
                const result = await this.bot.sendDocument(this.channelId, chunkPath, {
                    caption: caption
                });

                uploadedChunks.push({
                    part: i + 1,
                    messageId: result.message_id,
                    fileId: result.document.file_id,
                    fileUniqueId: result.document.file_unique_id,
                    size: result.document.file_size
                });

                // Clean up chunk file
                await fs.remove(chunkPath);
            }

            return {
                uploaded: true,
                uploadMethod: 'chunked',
                totalChunks: chunks.length,
                chunks: uploadedChunks
            };
        } catch (error) {
            console.error('Large video upload error:', error);
            throw error;
        }
    }

    async splitVideoFile(videoPath, chunkSize) {
        const chunks = [];
        const fileSize = (await fs.stat(videoPath)).size;
        const numChunks = Math.ceil(fileSize / chunkSize);
        
        const tempDir = path.join(__dirname, '..', 'temp');
        await fs.ensureDir(tempDir);

        for (let i = 0; i < numChunks; i++) {
            const chunkPath = path.join(tempDir, `chunk_${i}.bin`);
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, fileSize);
            
            const readStream = fs.createReadStream(videoPath, { start, end: end - 1 });
            const writeStream = fs.createWriteStream(chunkPath);
            
            await new Promise((resolve, reject) => {
                readStream.pipe(writeStream);
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            chunks.push(chunkPath);
        }

        return chunks;
    }

    async downloadVideo(telegramData, outputPath) {
        if (!this.bot || !telegramData.uploaded) {
            throw new Error('Cannot download: Telegram service not available or video not uploaded');
        }

        try {
            if (telegramData.uploadMethod === 'single') {
                const fileStream = this.bot.getFileStream(telegramData.fileId);
                const writeStream = fs.createWriteStream(outputPath);
                
                return new Promise((resolve, reject) => {
                    fileStream.pipe(writeStream);
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });
            } else if (telegramData.uploadMethod === 'chunked') {
                return await this.downloadChunkedVideo(telegramData, outputPath);
            }
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }

    async downloadChunkedVideo(telegramData, outputPath) {
        const tempDir = path.join(__dirname, '..', 'temp');
        await fs.ensureDir(tempDir);
        
        const writeStream = fs.createWriteStream(outputPath);
        
        for (const chunk of telegramData.chunks) {
            const chunkStream = this.bot.getFileStream(chunk.fileId);
            
            await new Promise((resolve, reject) => {
                chunkStream.on('data', (data) => {
                    writeStream.write(data);
                });
                chunkStream.on('end', resolve);
                chunkStream.on('error', reject);
            });
        }
        
        writeStream.end();
        
        return new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
    }

    async deleteVideo(telegramData) {
        if (!this.bot || !telegramData.uploaded) {
            return { deleted: false, reason: 'Service not available or video not uploaded' };
        }

        try {
            if (telegramData.uploadMethod === 'single') {
                await this.bot.deleteMessage(this.channelId, telegramData.messageId);
            } else if (telegramData.uploadMethod === 'chunked') {
                for (const chunk of telegramData.chunks) {
                    await this.bot.deleteMessage(this.channelId, chunk.messageId);
                }
            }
            
            return { deleted: true };
        } catch (error) {
            console.error('Delete error:', error);
            return { deleted: false, error: error.message };
        }
    }
}

module.exports = TelegramService;