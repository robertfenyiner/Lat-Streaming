# 🎬 Lat-Streaming - Plataforma de Video con Almacenamiento en la Nube de Telegram

Una plataforma moderna y minimalista de streaming de videos que utiliza Telegram como backend de almacenamiento ilimitado en la nube. Transmite, almacena y gestiona tus videos con una hermosa interfaz de tema oscuro.

![Version](https://img.shields.io/badge/versión-2.0.0-green)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-blue)
![License](https://img.shields.io/badge/licencia-MIT-blue)

## ✨ Características

### Funciones Principales
- **🚀 Almacenamiento Ilimitado** - Aprovecha la infraestructura en la nube de Telegram para almacenamiento ilimitado de videos
- **📡 Transmisión Directa** - Transmite videos directamente desde Telegram sin almacenamiento local
- **⬆️ Subida Inteligente** - Subida automática de videos a Telegram con seguimiento de progreso
- **⬇️ Soporte de Descarga** - Descarga videos desde el almacenamiento en la nube en cualquier momento
- **🔗 Enlaces Compartidos** - Genera enlaces compartibles para tus videos
- **📱 Diseño Responsivo** - Funciona perfectamente en dispositivos de escritorio y móviles

### Características de UI/UX
- **🌑 Tema Oscuro** - Interfaz oscura moderna y minimalista con bordes limpios
- **🎨 Iconos Limpios** - Iconos SVG personalizados para mejor consistencia visual
- **📊 Estado en Tiempo Real** - Indicador de estado de conexión en vivo
- **🔔 Notificaciones Inteligentes** - Sistema de notificaciones no intrusivo
- **⚡ Carga Rápida** - Rendimiento optimizado con carga diferida
- **🎯 Controles Intuitivos** - Interfaz simple y amigable para el usuario

### Características Técnicas
- **🔄 Limpieza Automática** - Limpieza automática de archivos temporales
- **📈 Solicitudes de Rango** - Soporte para búsqueda de video y contenido parcial
- **🛡️ Manejo de Errores** - Recuperación elegante de errores y respaldos
- **💾 Soporte de Base de Datos** - Base de datos basada en JSON para metadatos de video
- **🔐 Transmisión Segura** - Transmisión directa con autenticación adecuada
- **🎞️ Múltiples Formatos** - Soporte para MP4, WebM, AVI, MKV y más

## 🚀 Actualizaciones Recientes (v2.0.0)

### Rediseño de UI
- ✅ Rediseño completo del tema oscuro con enfoque minimalista
- ✅ Eliminación de bordes exteriores para un aspecto más limpio
- ✅ Mejor contraste de colores para mejor visibilidad
- ✅ Iconos SVG personalizados reemplazando FontAwesome
- ✅ Efectos de hover y animaciones mejorados
- ✅ Sistema de notificación único (corregidas notificaciones duplicadas)

### Mejoras del Backend
- ✅ Corregidos problemas de configuración del bot de Telegram
- ✅ Transmisión de video mejorada con tipos MIME apropiados
- ✅ Manejo de errores mejorado para reproducción de video
- ✅ Corregida limpieza del reproductor de video al cerrar
- ✅ Generación de miniaturas mejorada con respaldo elegante
- ✅ Agregado axios para mejor transmisión HTTP

### Corrección de Errores
- ✅ Corregido "NotSupportedError" en reproducción de video
- ✅ Corregidos errores de configuración de canales de respaldo
- ✅ Corregida funcionalidad y visibilidad de botones
- ✅ Corregidos problemas de temporización de inicialización de la app
- ✅ Corregidos errores de generación de miniaturas FFmpeg

## 🛠️ Instalación

### Prerrequisitos
- Node.js (v14 o superior)
- FFmpeg (para generación de miniaturas)
- Token de Bot de Telegram

### Configuración

1. **Clonar el repositorio**
```bash
git clone https://github.com/robertfenyiner/Lat-Streaming.git
cd Lat-Streaming
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear un archivo `.env` en el directorio raíz:
```env
# Configuración del Bot de Telegram
TELEGRAM_BOT_TOKEN=tu_token_del_bot_aqui
TELEGRAM_CHANNEL_ID=tu_id_del_canal_aqui

# Configuración del Servidor
PORT=3000

# Configuraciones de Almacenamiento
ENABLE_THUMBNAILS=true  # Establecer como false si ocurren problemas con FFmpeg
```

4. **Crear Bot de Telegram**
- Abrir [@BotFather](https://t.me/botfather) en Telegram
- Crear un nuevo bot con `/newbot`
- Copiar el token del bot al archivo `.env`
- Crear un canal y agregar el bot como administrador
- Obtener el ID del canal y agregarlo al archivo `.env`

5. **Iniciar el servidor**
```bash
npm start
```

6. **Acceder a la plataforma**
Abrir tu navegador y navegar a `http://localhost:3000`

## 📖 Uso

### Subir Videos
1. Hacer clic en el botón "Subir" en el encabezado
2. Seleccionar o arrastrar y soltar tu archivo de video
3. Esperar a que se complete la subida
4. El video se guardará automáticamente en la nube de Telegram

### Transmitir Videos
1. Hacer clic en cualquier tarjeta de video para comenzar la transmisión
2. Usar los controles del reproductor para la reproducción
3. Los videos se transmiten directamente desde Telegram - no se necesita almacenamiento local

### Gestionar Videos
- **Reproducir** - Hacer clic en el botón de reproducción o miniatura del video
- **Descargar** - Descargar video a tu dispositivo
- **Copiar URL** - Obtener enlace compartible para el video
- **Eliminar** - Remover video (con confirmación)

## 🔮 Próximas Características

### Fase 1 - Mejoras Principales
- [ ] **Renombrar Video** - Renombrar videos después de subir
- [ ] **Funcionalidad de Búsqueda** - Buscar videos por nombre
- [ ] **Categorías de Video** - Organizar videos en categorías
- [ ] **Subida en Lote** - Subir múltiples videos a la vez
- [ ] **Cola de Subida** - Sistema de cola para múltiples subidas

### Fase 2 - Características Avanzadas
- [ ] **Compresión de Video** - Compresión automática de video antes de subir
- [ ] **Transmisión Adaptiva** - Soporte HLS/DASH para mejor transmisión
- [ ] **Transcodificación de Video** - Convertir videos a diferentes formatos
- [ ] **Soporte de Subtítulos** - Agregar y mostrar subtítulos
- [ ] **Editor de Video** - Capacidades básicas de edición de video
- [ ] **Soporte de Listas de Reproducción** - Crear y gestionar listas de reproducción

### Fase 3 - Características Sociales
- [ ] **Autenticación de Usuario** - Soporte multi-usuario con inicio de sesión
- [ ] **Sistema de Compartir** - Compartir avanzado con permisos
- [ ] **Comentarios** - Agregar comentarios a videos
- [ ] **Favoritos** - Marcar videos como favoritos
- [ ] **Historial de Visualización** - Rastrear historial de visualización
- [ ] **Analíticas** - Métricas de conteo de vistas y participación

### Fase 4 - Características de Plataforma
- [ ] **App Móvil** - Aplicaciones móviles nativas
- [ ] **Soporte PWA** - Capacidades de Aplicación Web Progresiva
- [ ] **Modo Offline** - Descargar para visualización offline
- [ ] **Transmisión en Vivo** - Transmitir videos en vivo
- [ ] **Multi-idioma** - Soporte para múltiples idiomas
- [ ] **Alternador Tema Oscuro/Claro** - Cambio de temas

### Fase 5 - Almacenamiento Avanzado
- [ ] **Soporte Multi-canal** - Usar múltiples canales de Telegram
- [ ] **Sistema de Redundancia** - Respaldo automático entre canales
- [ ] **Analíticas de Almacenamiento** - Monitorear uso de almacenamiento
- [ ] **Auto-migración** - Migrar videos entre canales
- [ ] **Estadísticas de Compresión** - Mostrar ahorros de almacenamiento

## 🤝 Contribuyendo

¡Las contribuciones son bienvenidas! Por favor, siéntete libre de enviar un Pull Request.

1. Hacer fork del repositorio
2. Crear tu rama de característica (`git checkout -b feature/CaracteristicaIncreible`)
3. Confirmar tus cambios (`git commit -m 'Agregar alguna CaracteristicaIncreible'`)
4. Hacer push a la rama (`git push origin feature/CaracteristicaIncreible`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Agradecimientos

- Telegram por proporcionar almacenamiento ilimitado en la nube
- Comunidad de Node.js por excelentes paquetes
- FFmpeg por capacidades de procesamiento de video
- Todos los colaboradores y usuarios de este proyecto

## 📧 Contacto

Para preguntas y soporte, por favor abre un issue en GitHub.

---

**Nota:** Este proyecto es para propósitos educativos. Por favor, asegúrate de cumplir con los términos de servicio de Telegram al usar esta plataforma.
