// PM2 Ecosystem Configuration for ARIA5 Platform v5.0 - Cloudflare Pages Development
module.exports = {
  apps: [
    {
      name: 'aria5-htmx',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=aria51-production --local --ip 0.0.0.0 --port 3000',
      cwd: '/home/user/ARIA5-Ubuntu',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DATABASE_URL: 'local'
      },
      watch: false, // Disable PM2 file monitoring
      instances: 1, // Development mode uses only one instance
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};