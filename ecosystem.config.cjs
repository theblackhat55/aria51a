// PM2 Ecosystem Configuration for ARIA5.1 Enterprise Security Intelligence Platform
// Optimized for Cloudflare Pages with D1, KV, and R2 integration
module.exports = {
  apps: [
    {
      name: 'aria51-enterprise',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=aria51-production --local --ip 0.0.0.0 --port 3000 --compatibility-flags nodejs_compat --compatibility-date 2025-01-01',
      cwd: '/home/user/ARIA5-Ubuntu',
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
      error_file: './logs/aria51-error.log',
      out_file: './logs/aria51-out.log',
      log_file: './logs/aria51-combined.log',
      time: true,
      // Health check configuration
      health_check_url: 'http://localhost:3000/health',
      health_check_grace_period: 10000,
      // Process management
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 10000
    },
    
    // Optional: Separate process for background tasks (if needed)
    {
      name: 'aria51-workers',
      script: 'node',
      args: 'src/workers/background-tasks.js',
      cwd: '/home/user/ARIA5-Ubuntu',
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'background'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      error_file: './logs/workers-error.log',
      out_file: './logs/workers-out.log',
      log_file: './logs/workers-combined.log',
      time: true,
      // Start after main app
      wait_ready: false,
      // Disable by default (uncomment to enable)
      disabled: true
    }
  ]
};

// Development notes:
// 1. Main app uses wrangler pages dev for full Cloudflare simulation
// 2. --local flag ensures D1 uses local SQLite for development
// 3. Hot reload is handled by wrangler, not PM2
// 4. Health checks ensure proper startup
// 5. Background workers can be enabled for additional processing if needed