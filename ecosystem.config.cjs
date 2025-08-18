// PM2 Ecosystem Configuration for DMT Risk Assessment System - Native Ubuntu Deployment
module.exports = {
  apps: [
    {
      name: 'grc-native',
      script: 'src/server.js',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0',
        DEBUG_MODE: 'true'
      },
      watch: false, // Disable PM2 file monitoring for production stability
      instances: 1, // Single instance for native deployment
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};