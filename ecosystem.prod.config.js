module.exports = {
  apps: [
    {
      name: 'cochin-api',
      script: 'server/server.js',
      exec_mode: 'cluster',
      instances: 4,
      watch: false,
      autorestart: true,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
      },
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
