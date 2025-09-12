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

---

# 🚀 Guía de Instalación Completa

## 📋 Prerrequisitos del Sistema
- **SO Recomendado**: Ubuntu 22.04.3 LTS o superior
- **Node.js**: v14 o superior (recomendado v18 LTS)
- **FFmpeg**: Para procesamiento de video
- **Memoria**: Mínimo 512MB RAM disponible
- **Espacio en Disco**: Mínimo 1GB disponible
- **Red**: Puerto 3000 disponible (configurable)

---

## ⚡ Instalación Rápida (Paso a Paso)

### 1️⃣ Preparar el Sistema

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y curl wget git unzip htop nano

# Crear directorio del proyecto
sudo mkdir -p /opt/lat-streaming
sudo chown $USER:$USER /opt/lat-streaming
cd /opt/lat-streaming
```

### 2️⃣ Instalar Node.js 18 LTS

```bash
# Instalar NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v18.x.x
npm --version   # Debe mostrar 9.x.x o superior
```

### 3️⃣ Instalar FFmpeg

```bash
# Instalar FFmpeg para procesamiento de video
sudo apt install -y ffmpeg

# Verificar instalación
ffmpeg -version
```

### 4️⃣ Clonar y Configurar Lat-Streaming

```bash
# Clonar el repositorio
git clone https://github.com/robertfenyiner/Lat-Streaming.git .

# Instalar dependencias
npm install

# Crear directorios necesarios
mkdir -p uploads temp data
```

### 5️⃣ Configurar Variables de Entorno

```bash
# Crear archivo de configuración
nano .env
```

**Contenido del archivo `.env`:**
```env
# Configuración del Bot de Telegram
TELEGRAM_BOT_TOKEN=tu_token_del_bot_aqui
TELEGRAM_CHANNEL_ID=tu_id_del_canal_aqui

# Configuración del Servidor
PORT=3000
NODE_ENV=production

# Configuraciones de Almacenamiento
ENABLE_THUMBNAILS=true

# Configuración opcional de canales de respaldo
# TELEGRAM_BACKUP_CHANNELS=-1001234567890,-1001234567891

# Configuración de FFmpeg (opcional si está en PATH)
# FFMPEG_PATH=/usr/bin/ffmpeg
# FFPROBE_PATH=/usr/bin/ffprobe
```

### 6️⃣ Crear Bot de Telegram

1. **Crear el Bot:**
   - Ir a [@BotFather](https://t.me/botfather) en Telegram
   - Enviar `/newbot`
   - Seguir las instrucciones para nombrar tu bot
   - Copiar el token proporcionado y pegarlo en el archivo `.env`

2. **Crear Canal:**
   - Crear un canal en Telegram
   - Agregar el bot como administrador con permisos completos
   - Obtener el ID del canal (puedes usar [@userinfobot](https://t.me/userinfobot))
   - Agregar el ID del canal al archivo `.env`

### 7️⃣ Configurar Firewall

```bash
# Permitir puerto 3000
sudo ufw allow 3000

# Verificar reglas del firewall
sudo ufw status
```

### 8️⃣ Instalar PM2 para Gestión de Procesos

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Crear archivo de configuración PM2
nano ecosystem.config.js
```

**Contenido de `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [{
    name: 'lat-streaming',
    script: './server.js',
    cwd: '/opt/lat-streaming',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/opt/lat-streaming/logs/combined.log',
    out_file: '/opt/lat-streaming/logs/out.log',
    error_file: '/opt/lat-streaming/logs/error.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

### 9️⃣ Crear Directorio de Logs

```bash
mkdir -p logs
```

### 🔟 Iniciar la Aplicación

```bash
# Iniciar con PM2
pm2 start ecosystem.config.js

# Verificar que esté corriendo
pm2 status

# Ver logs en tiempo real
pm2 logs lat-streaming

# Configurar PM2 para auto-inicio del sistema
pm2 startup
pm2 save
```

---

## 🌐 Configuración de Dominio (Opcional)

### Con Nginx como Proxy Reverso

```bash
# Instalar Nginx
sudo apt install -y nginx

# Crear configuración del sitio
sudo nano /etc/nginx/sites-available/lat-streaming
```

**Contenido de la configuración de Nginx:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # Cambiar por tu dominio

    client_max_body_size 2G;  # Para archivos grandes

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

```bash
# Activar el sitio
sudo ln -s /etc/nginx/sites-available/lat-streaming /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🔒 Configuración de SSL con Certbot (Opcional)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL gratuito
sudo certbot --nginx -d tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

---

## 📊 Comandos de Monitoreo y Mantenimiento

### Verificar Estado de la Aplicación
```bash
# Estado de PM2
pm2 status

# Logs en tiempo real
pm2 logs lat-streaming --lines 100

# Reiniciar aplicación
pm2 restart lat-streaming

# Recargar con cero tiempo de inactividad
pm2 reload lat-streaming

# Parar aplicación
pm2 stop lat-streaming
```

### Monitor de Sistema
```bash
# Uso de recursos en tiempo real
htop

# Espacio en disco disponible
df -h

# Uso de memoria del sistema
free -h

# Procesos de Node.js activos
ps aux | grep node
```

### Verificar Puertos y Conectividad
```bash
# Ver qué proceso usa el puerto 3000
sudo netstat -tlnp | grep 3000

# Alternativamente con ss
sudo ss -tlnp | grep 3000

# Probar conectividad local
curl http://localhost:3000
```

---

## 🔧 Solución de Problemas Comunes

### Si la Aplicación No Inicia
```bash
# Verificar logs de error detallados
pm2 logs lat-streaming --err --lines 50

# Verificar versiones de Node.js
node --version
npm --version

# Probar iniciar manualmente para debug
cd /opt/lat-streaming
node server.js
```

### Si FFmpeg Presenta Problemas
```bash
# Verificar instalación de FFmpeg
which ffmpeg
ffmpeg -version

# Reinstalar FFmpeg si es necesario
sudo apt remove --purge ffmpeg
sudo apt install -y ffmpeg

# Verificar permisos de archivos
ls -la /usr/bin/ffmpeg
```

### Problemas con Telegram
1. **Verificar token del bot** en archivo `.env`
2. **Confirmar que el bot sea administrador** del canal
3. **Verificar formato del ID del canal** (debe empezar con `-100`)
4. **Probar el bot manualmente** enviando un mensaje

### Liberar Espacio de Almacenamiento
```bash
# Limpiar logs antiguos de PM2
pm2 flush

# Limpiar archivos temporales
cd /opt/lat-streaming
rm -rf temp/* uploads/*

# Limpiar cache de npm
npm cache clean --force

# Limpiar logs del sistema (opcional)
sudo journalctl --vacuum-time=7d
```

---

## 🚀 Acceder a tu Aplicación

### Acceso Directo por IP
```
http://tu-ip-servidor:3000
```

### Con Nginx (Puerto 80)
```
http://tu-ip-servidor
http://tu-dominio.com
```

### Con SSL Habilitado
```
https://tu-dominio.com
```

---

## 🛡️ Consideraciones de Seguridad

1. **Firewall**: Configurar UFW para permitir solo puertos necesarios
2. **SSH**: Cambiar puerto SSH por defecto y usar autenticación por claves
3. **Actualizaciones**: Mantener el sistema y dependencias actualizadas
4. **Respaldos**: Configurar respaldos automáticos de la base de datos JSON
5. **Monitoreo**: Implementar alertas de sistema y logs de acceso
6. **Variables de Entorno**: Nunca compartir o versionar el archivo `.env`

---

## 📋 Checklist de Instalación

### Prerrequisitos
- [ ] ✅ Servidor Ubuntu 22.04+ preparado
- [ ] ✅ Acceso SSH configurado
- [ ] ✅ Usuario con permisos sudo

### Instalación Base
- [ ] ✅ Sistema actualizado
- [ ] ✅ Node.js 18+ instalado y verificado
- [ ] ✅ FFmpeg instalado y funcionando
- [ ] ✅ Código clonado en `/opt/lat-streaming`
- [ ] ✅ Dependencias npm instaladas

### Configuración
- [ ] ✅ Archivo `.env` creado y configurado
- [ ] ✅ Bot de Telegram creado
- [ ] ✅ Canal de Telegram configurado con bot como admin
- [ ] ✅ IDs de bot y canal verificados

### Producción
- [ ] ✅ PM2 instalado globalmente
- [ ] ✅ Archivo `ecosystem.config.js` configurado
- [ ] ✅ Aplicación iniciada con PM2
- [ ] ✅ PM2 configurado para auto-inicio
- [ ] ✅ Firewall configurado (puerto 3000)

### Opcional
- [ ] ⚪ Nginx instalado y configurado
- [ ] ⚪ Dominio apuntando al servidor
- [ ] ⚪ Certificado SSL instalado
- [ ] ⚪ Monitoreo de logs configurado

---

## 🆘 Soporte y Troubleshooting

### Pasos de Diagnóstico
1. **Verificar logs**: `pm2 logs lat-streaming`
2. **Verificar estado**: `pm2 status`
3. **Probar conectividad**: `curl http://localhost:3000`
4. **Revisar configuración**: Verificar archivo `.env`
5. **Verificar recursos**: `htop` y `df -h`

### Comandos de Emergencia
```bash
# Reinicio completo de la aplicación
pm2 restart lat-streaming

# Reinicio del sistema completo
sudo reboot

# Verificar espacio en disco
df -h

# Verificar memoria disponible
free -h
```

### Obtener Ayuda
- Revisar logs detallados en `/opt/lat-streaming/logs/`
- Verificar documentación de Telegram Bot API
- Consultar documentación de PM2
- Revisar issues en el repositorio del proyecto

**¡Tu plataforma Lat-Streaming está lista para funcionar!** 🎉
