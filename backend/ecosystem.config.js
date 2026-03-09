module.exports = {
  apps: [
    {
      name: 'kiosk-backend',
      script: 'app.js',
      cwd: '/var/www/Kiosk/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
