# 🚀 Guía de Instalación de Lat-Streaming en VPS Ubuntu 22.04.3 LTS

## 📋 Información del Servidor
- **IP**: 216.9.226.186
- **OS**: Ubuntu 22.04.3 LTS
- **Arquitectura**: x86_64
- **Memoria**: 3% utilizada (abundante disponible)
- **Disco**: 2.2% de 77.35GB usado (75GB+ disponibles)

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
# Clonar el repositorio (ajusta la URL según donde esté tu repo)
git clone https://github.com/robertfenyiner/Lat-Streaming.git .

# O subir archivos manualmente via SCP/SFTP a /opt/lat-streaming/

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
   - Seguir las instrucciones
   - Copiar el token y pegarlo en `.env`

2. **Crear Canal:**
   - Crear un canal en Telegram
   - Agregar el bot como administrador
   - Obtener el ID del canal (puede usar [@userinfobot](https://t.me/userinfobot))
   - Agregar el ID al archivo `.env`

### 7️⃣ Configurar Firewall

```bash
# Permitir puerto 3000
sudo ufw allow 3000

# Verificar reglas (opcional)
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

# Configurar PM2 para auto-inicio
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

**Contenido de la configuración:**
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

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

---

## 📊 Comandos de Monitoreo

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

# Espacio en disco
df -h

# Uso de memoria
free -h

# Procesos de Node.js
ps aux | grep node
```

### Verificar Puertos
```bash
# Ver qué usa el puerto 3000
sudo netstat -tlnp | grep 3000

# O con ss
sudo ss -tlnp | grep 3000
```

---

## 🔧 Solución de Problemas

### Si la App No Inicia
```bash
# Verificar logs de error
pm2 logs lat-streaming --err --lines 50

# Verificar configuración de Node.js
node --version
npm --version

# Probar iniciar manualmente
cd /opt/lat-streaming
node server.js
```

### Si FFmpeg Falla
```bash
# Verificar instalación de FFmpeg
which ffmpeg
ffmpeg -version

# Reinstalar si es necesario
sudo apt remove --purge ffmpeg
sudo apt install -y ffmpeg
```

### Si Telegram No Funciona
1. Verificar token del bot en `.env`
2. Verificar que el bot sea administrador del canal
3. Verificar ID del canal (debe empezar con `-100`)

### Liberar Espacio
```bash
# Limpiar logs de PM2 antiguos
pm2 flush

# Limpiar archivos temporales
cd /opt/lat-streaming
rm -rf temp/* uploads/*

# Limpiar cache de npm
npm cache clean --force
```

---

## 🚀 Acceder a la Aplicación

### Acceso Directo por IP
```
http://216.9.226.186:3000
```

### Con Nginx (Puerto 80)
```
http://216.9.226.186
```

### Con Dominio y SSL
```
https://tu-dominio.com
```

---

## 🛡️ Consideraciones de Seguridad

1. **Firewall**: Solo abrir puertos necesarios
2. **SSH**: Cambiar puerto por defecto y usar claves SSH
3. **Updates**: Mantener sistema actualizado
4. **Backups**: Respaldar configuración y base de datos
5. **Monitoring**: Configurar alertas de sistema

---

## 📋 Checklist Final

- [ ] ✅ Node.js 18+ instalado
- [ ] ✅ FFmpeg instalado  
- [ ] ✅ Código clonado en `/opt/lat-streaming`
- [ ] ✅ Dependencias instaladas (`npm install`)
- [ ] ✅ Archivo `.env` configurado
- [ ] ✅ Bot de Telegram creado y configurado
- [ ] ✅ Canal de Telegram creado con bot como admin
- [ ] ✅ PM2 instalado y configurado
- [ ] ✅ Aplicación iniciada con PM2
- [ ] ✅ Acceso verificado en `http://216.9.226.186:3000`
- [ ] ✅ Firewall configurado (puerto 3000)
- [ ] ⚪ Nginx configurado (opcional)
- [ ] ⚪ SSL configurado (opcional)

---

## 🆘 Soporte

Si tienes problemas:

1. Verificar logs: `pm2 logs lat-streaming`
2. Verificar estado: `pm2 status`  
3. Verificar conectividad: `curl http://localhost:3000`
4. Revisar configuración de Telegram en `.env`

**¡Tu plataforma Lat-Streaming está lista para usar!** 🎉