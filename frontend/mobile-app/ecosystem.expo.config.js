module.exports = {
  apps: [
    {
      name: 'kiosk-expo-tunnel',
      cwd: '/var/www/Kiosk/frontend/mobile-app',
      script: 'npm',
      args: 'run start:tunnel:stable',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'development',
        EXPO_NO_TELEMETRY: '1',
      },
    },
  ],
};
