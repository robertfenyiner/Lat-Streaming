module.exports = {
  apps: [{
    name: 'lat-streaming',
    script: 'server.js',
    env: {
      NODE_OPTIONS: '--dns-result-order=ipv4first',
      NODE_ENV: 'production',
      PORT: 3000,
      TELEGRAM_BOT_TOKEN: '8378067144:AAFeP7zGV-6HZMXRXe2tXGE8euP7kBLeUak',
      TELEGRAM_CHANNEL_ID: '-1003001236281',
      ENABLE_THUMBNAILS: 'true'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
