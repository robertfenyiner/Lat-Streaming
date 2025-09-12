module.exports = {
  apps: [{
    name: 'lat-streaming',
    script: 'server.js',
    env: {
      NODE_OPTIONS: '--dns-result-order=ipv4first'
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
