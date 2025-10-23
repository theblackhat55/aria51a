// PM2 Ecosystem Configuration for ARIA51A - Risk Module v2 Testing Instance
// Optimized for Cloudflare Pages with D1 database integration
module.exports = {
  apps: [
    {
      name: 'aria51a',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=aria51a-production --local --ip 0.0.0.0 --port 3000 --compatibility-flags nodejs_compat --compatibility-date 2025-01-01',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DATABASE_URL: 'local',
        LOG_LEVEL: 'info',
        ENABLE_WEBSOCKETS: 'true',
        ENABLE_AI_FEATURES: 'true',
        ENABLE_METRICS: 'true'
      },
      watch: false, // Disable PM2 file monitoring - wrangler handles hot reload
      instances: 1, // Single instance for development
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '2G', // Increased for AI operations
      error_file: './logs/aria51a-error.log',
      out_file: './logs/aria51a-out.log',
      log_file: './logs/aria51a-combined.log',
      time: true,
      // Health check configuration
      health_check_url: 'http://localhost:3000/health',
      health_check_grace_period: 10000,
      // Process management
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 10000
    },
    

  ]
};

// Development notes:
// 1. Main app uses wrangler pages dev for full Cloudflare simulation
// 2. --local flag ensures D1 uses local SQLite for development
// 3. Hot reload is handled by wrangler, not PM2
// 4. Health checks ensure proper startup
// 5. This is aria51a instance - separate from aria51 production