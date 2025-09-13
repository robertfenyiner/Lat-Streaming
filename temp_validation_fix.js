    validateFile(file) {
        const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
        
        // Extensiones permitidas (incluyendo formatos que se pueden convertir)
        const allowedExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.ogv', '.m4v'];
        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
        
        // Validar por tipo MIME o extensión
        const isValidType = file.type.startsWith('video/') || allowedExtensions.includes(fileExtension);
        
        if (!isValidType) {
            this.showToast(`Formato no soportado. Formatos permitidos: ${allowedExtensions.join(', ')}`, 'error');
            return false;
        }

        if (file.size > maxSize) {
            this.showToast('El tamaño del archivo debe ser menor a 2GB', 'error');
            return false;
        }

        // Mostrar mensaje si el archivo necesitará conversión
        const needsConversion = ['.mkv', '.avi', '.mov', '.wmv', '.flv'].includes(fileExtension);
        if (needsConversion) {
            this.showToast(`Archivo ${fileExtension.toUpperCase()} detectado - se convertirá a MP4 automáticamente`, 'info');
        }

        return true;
    }
