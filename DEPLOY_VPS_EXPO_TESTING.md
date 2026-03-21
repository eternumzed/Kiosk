# VPS Deployment + Member Testing Guide (Expo Go or APK)

This guide hosts your backend/API on VPS and gives your members a way to test the mobile app.

## 1) Recommended Testing Strategy

- Backend: host on VPS (stable, shared for everyone)
- Mobile app testing:
  - Best for Android members: install preview APK (most reliable for push notifications)
  - Quick UI/demo only: Expo Go (works, but push behavior is limited compared to real build)

## 2) Deploy Backend to VPS

Assumptions:
- Ubuntu VPS
- Domain `api.yourdomain.com` points to VPS
- MongoDB URI is ready

### 2.1 SSH to VPS

```bash
ssh root@YOUR_VPS_IP
```

### 2.2 Install system dependencies

```bash
apt update && apt upgrade -y
apt install -y curl git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm i -g pm2
node -v
npm -v
pm2 -v
```

### 2.3 Clone project and install backend deps

```bash
cd /var/www
git clone https://github.com/YOUR_ORG/YOUR_REPO.git kiosk
cd kiosk/backend
npm install
```

### 2.4 Create backend env file

Create `/var/www/Kiosk/.env` (because backend loads `../.env`):

```env
NODE_ENV=production
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
API_URL=https://api.yourdomain.com
ADMIN_URL=https://admin.yourdomain.com
KIOSK_URL=https://kiosk.yourdomain.com
```

Add any other keys you already use (OTP, email, PayMongo, Firebase, etc.).

### 2.5 Start backend with PM2

```bash
cd /var/www/Kiosk/backend
pm2 start app.js --name kiosk-backend
pm2 save
pm2 startup
```

Verify:

```bash
pm2 status
curl http://127.0.0.1:5000/
```

Expected: `Hello world!`

### 2.6 Configure Nginx reverse proxy

Create `/etc/nginx/sites-available/kiosk-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
ln -s /etc/nginx/sites-available/kiosk-api /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 2.7 Add HTTPS (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.yourdomain.com
```

Test:

```bash
curl https://api.yourdomain.com/
```

## 3) Point Mobile App to VPS API

In your mobile app environment, set:

```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

If using EAS builds/updates, set this in EAS environment variables.

## 4) Let Members Test the App

## Option A (Recommended Android): Preview APK

This gives real app identity and proper push behavior.

```bash
cd frontend/mobile-app
eas build -p android --profile preview
```

Share the generated install link or APK with members.

## Option B (Fast Demo): Expo Go

Use this when you want members to try flows quickly.

```bash
cd frontend/mobile-app
npx expo start --tunnel
```

### Option B.1 (Recommended for thesis demo): Persistent Expo tunnel via PM2

This keeps Expo running on VPS even if your SSH session closes, so you don't need to relaunch it repeatedly.

```bash
cd /var/www/Kiosk/frontend/mobile-app
pm2 start ecosystem.expo.config.js
pm2 save
pm2 startup
```

Useful commands during demo:

```bash
pm2 status
pm2 logs kiosk-expo-tunnel --lines 100
pm2 restart kiosk-expo-tunnel
pm2 stop kiosk-expo-tunnel
```

Notes:
- PM2 profile uses `start:tunnel:persistent` with `CI=1` plus stable workers/memory.
- Avoid running `--clear` for every restart during live demo, because it forces full rebundle each time.
- If Expo Go appears stuck at `Bundling 100%`, first restart only the PM2 Expo process:

```bash
pm2 restart kiosk-expo-tunnel
```

Share the QR/code. Members open Expo Go and scan/connect.

Notes:
- Expo Go is good for UI and basic flow checks.
- Push notifications and native config behavior are more accurate in preview APK.

## Option C (iOS without TestFlight build)

- Expo Go on iPhone can demo most UI/flow behavior.
- Remote push validation on iOS still needs signed iOS build.

## 5) Update Backend After New Commits

```bash
ssh root@YOUR_VPS_IP
cd /var/www/Kiosk
git pull origin master
cd backend
npm install
pm2 restart kiosk-backend
pm2 logs kiosk-backend --lines 100
```

## 6) Quick Troubleshooting

- Backend not reachable:
  - `pm2 status`
  - `pm2 logs kiosk-backend`
  - `nginx -t`
  - `systemctl status nginx`
  - Check DNS A record to VPS IP
- CORS errors:
  - Ensure domain is in backend allowed origins/env vars
- Expo app cannot connect:
  - Confirm `EXPO_PUBLIC_API_URL` points to VPS HTTPS API
- Push token/register issues:
  - Test on real device
  - Prefer preview APK over Expo Go for push verification

## 7) Security Checklist

- Rotate any Firebase/private keys exposed before
- Use strong JWT secrets
- Keep `.env` out of git
- Enable VPS firewall (`ufw`) and only open required ports (22, 80, 443)

