module.exports = {
  apps: [
    {
      name: 'kiosk-expo-tunnel',
      cwd: '/var/www/Kiosk/frontend/mobile-app',
      script: 'npm',
      args: 'run start:tunnel:persistent',
      interpreter: 'none',
      autorestart: true,
      restart_delay: 5000,
      watch: false,
      max_memory_restart: '2500M',
      env: {
        NODE_ENV: 'development',
        NODE_OPTIONS: '--max-old-space-size=3072',
        CI: '1',
        EXPO_NO_TELEMETRY: '1',
      },
    },
  ],
};
