const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');

class VideoConverter {
    constructor() {
        this.tempDir = path.join(__dirname, '..', 'temp');
        this.uploadsDir = path.join(__dirname, '..', 'uploads');
        
        // Ensure directories exist
        fs.ensureDirSync(this.tempDir);
        fs.ensureDirSync(this.uploadsDir);
    }

    /**
     * Convert MKV file to MP4
     * @param {string} inputPath - Path to input MKV file
     * @param {string} outputPath - Path for output MP4 file
     * @param {function} progressCallback - Callback for progress updates
     * @returns {Promise<boolean>} - Success status
     */
    async convertMkvToMp4(inputPath, outputPath, progressCallback = null) {
        return new Promise((resolve, reject) => {
            console.log(`Starting conversion: ${inputPath} -> ${outputPath}`);
            
            const command = ffmpeg(inputPath)
                .output(outputPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .format('mp4')
                .addOptions([
                    '-preset fast',        // Faster encoding
                    '-crf 23',            // Good quality
                    '-movflags +faststart' // Web optimization
                ]);

            // Progress tracking
            if (progressCallback) {
                command.on('progress', (progress) => {
                    progressCallback({
                        percent: progress.percent || 0,
                        currentTime: progress.timemark,
                        targetSize: progress.targetSize
                    });
                });
            }

            command
                .on('end', () => {
                    console.log(`Conversion completed: ${outputPath}`);
                    resolve(true);
                })
                .on('error', (err) => {
                    console.error('Conversion error:', err);
                    reject(err);
                })
                .run();
        });
    }

    /**
     * Check if file needs conversion
     * @param {string} filename - Original filename
     * @returns {boolean} - True if needs conversion
     */
    needsConversion(filename) {
        const ext = path.extname(filename).toLowerCase();
        return ['.mkv', '.avi', '.mov', '.wmv', '.flv'].includes(ext);
    }

    /**
     * Get converted filename (change extension to .mp4)
     * @param {string} originalFilename - Original filename
     * @returns {string} - New filename with .mp4 extension
     */
    getConvertedFilename(originalFilename) {
        const nameWithoutExt = path.parse(originalFilename).name;
        return `${nameWithoutExt}.mp4`;
    }

    /**
     * Process uploaded file (convert if needed)
     * @param {string} uploadedFilePath - Path to uploaded file
     * @param {string} originalFilename - Original filename
     * @param {function} progressCallback - Progress callback
     * @returns {Object} - Result with final path and filename
     */
    async processUploadedFile(uploadedFilePath, originalFilename, progressCallback = null) {
        if (!this.needsConversion(originalFilename)) {
            // No conversion needed
            return {
                success: true,
                finalPath: uploadedFilePath,
                finalFilename: originalFilename,
                converted: false
            };
        }

        try {
            const convertedFilename = this.getConvertedFilename(originalFilename);
            const convertedPath = path.join(this.uploadsDir, `converted_${Date.now()}_${convertedFilename}`);

            // Convert the file
            await this.convertMkvToMp4(uploadedFilePath, convertedPath, progressCallback);

            // Verify conversion was successful
            if (!await fs.pathExists(convertedPath)) {
                throw new Error('Conversion failed - output file not created');
            }

            const stats = await fs.stat(convertedPath);
            if (stats.size === 0) {
                throw new Error('Conversion failed - output file is empty');
            }

            return {
                success: true,
                finalPath: convertedPath,
                finalFilename: convertedFilename,
                converted: true,
                originalPath: uploadedFilePath
            };

        } catch (error) {
            console.error('Error processing file:', error);
            return {
                success: false,
                error: error.message,
                finalPath: uploadedFilePath,
                finalFilename: originalFilename,
                converted: false
            };
        }
    }

    /**
     * Clean up temporary files
     * @param {Array<string>} filePaths - Paths to clean up
     */
    async cleanup(filePaths) {
        for (const filePath of filePaths) {
            try {
                if (await fs.pathExists(filePath)) {
                    await fs.remove(filePath);
                    console.log(`Cleaned up: ${filePath}`);
                }
            } catch (error) {
                console.error(`Error cleaning up ${filePath}:`, error);
            }
        }
    }

    /**
     * Get supported input formats
     * @returns {Array<string>} - Array of supported extensions
     */
    getSupportedFormats() {
        return ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
    }

    /**
     * Validate if file format is supported
     * @param {string} filename - Filename to check
     * @returns {boolean} - True if supported
     */
    isFormatSupported(filename) {
        const ext = path.extname(filename).toLowerCase();
        return this.getSupportedFormats().includes(ext);
    }
}

module.exports = VideoConverter;
