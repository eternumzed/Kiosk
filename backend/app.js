const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Ensure LibreOffice binaries are discoverable on Windows before any imports
if (process.platform === 'win32') {
    const loDirs = [
        'C:\\Program Files\\LibreOffice\\program',
        'C:\\Program Files (x86)\\LibreOffice\\program',
    ];
    const currentPath = process.env.PATH || '';
    const extra = loDirs.join(';');
    if (!currentPath.includes('LibreOffice\\program')) {
        process.env.PATH = `${extra};${currentPath}`;
    }
}

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const config = require('./config/db');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const APK_FILE_PATH = process.env.MOBILE_APK_PATH || path.resolve(__dirname, '../apk/app-release.apk');

// Production domains
const PRODUCTION_DOMAINS = [
    'https://brgybiluso.me',
    'https://api.brgybiluso.me',
    'https://kiosk.brgybiluso.me',
    'https://admin.brgybiluso.me',
    'https://queue.brgybiluso.me',
];

// Allowed origins for CORS
const allowedOrigins = [
    // Development
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:5000',
    // Production (from env or defaults)
    process.env.KIOSK_URL,
    process.env.ADMIN_URL,
    process.env.API_URL,
    ...PRODUCTION_DOMAINS,
].filter(Boolean); // Remove undefined values

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        
        // Check against allowed origins
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Development: allow localhost
        if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
            return callback(null, true);
        }
        
        // Production: allow brgybiluso.me subdomains
        if (origin.endsWith('.brgybiluso.me') || origin === 'https://brgybiluso.me') {
            return callback(null, true);
        }
        
        return callback(new Error('CORS policy: This origin is not allowed.'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb', type: '*/*' })); // Increased for base64 image uploads
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

const pdfRoutes = require('./routes/pdfRoute.js');
const authRoutes = require('./routes/authRoute.js');
const pdfController = require('./controllers/pdfController');

// mount API routes (v1) and keep legacy /api for backward compatibility
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/auth', authRoutes);


app.get('/download', (req, res) => {
        const hasApk = fs.existsSync(APK_FILE_PATH);
        const downloadUrl = '/download/app-release.apk';

        return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Barangay Biluso Mobile App Download</title>
    ${hasApk ? `<meta http-equiv="refresh" content="1; url=${downloadUrl}" />` : ''}
    <style>
        body { font-family: Arial, sans-serif; background:#f4fdf8; color:#1f2937; margin:0; }
        .wrap { max-width: 640px; margin: 64px auto; background:#fff; border:1px solid #d1fae5; border-radius:16px; padding:24px; }
        h1 { margin:0 0 12px; font-size: 24px; }
        p { margin: 0 0 16px; line-height:1.5; }
        .btn { display:inline-block; background:#059669; color:#fff; text-decoration:none; font-weight:700; padding:12px 18px; border-radius:10px; }
        .meta { margin-top:16px; font-size:13px; color:#4b5563; }
        .warn { margin-top:12px; padding:10px; border-radius:8px; background:#fef2f2; border:1px solid #fecaca; color:#991b1b; }
    </style>
</head>
<body>
    <div class="wrap">
        <h1>Barangay Biluso Mobile App</h1>
    <p>Preparing your APK download...</p>
    ${hasApk
        ? `<a class="btn" href="${downloadUrl}">If not downloading, click here</a>
           <div class="meta">If download does not start automatically, tap the button above.</div>
           <script>setTimeout(function(){ window.location.href = '${downloadUrl}'; }, 700);</script>`
        : `<div class="warn">APK file is not available on this server yet.</div>
           <div class="meta">Expected server path: ${APK_FILE_PATH}</div>`}
    </div>
</body>
</html>`);
});

app.get('/download/app-release.apk', (req, res) => {
    if (!fs.existsSync(APK_FILE_PATH)) {
                return res.status(404).json({
                        success: false,
                        message: 'APK file not found on server.',
                        expectedPath: APK_FILE_PATH,
                });
        }

        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        return res.download(APK_FILE_PATH, 'brgy-biluso-mobile-app.apk');
});



app.get('/', (req, res) => res.send('Hello world!'));

// Google OAuth routes for Drive authorization
const googleAuth = require('./googleAuth');
app.get('/google-auth', googleAuth.getAuthUrl);
app.get('/oauth2callback', googleAuth.handleCallback);

// centralized error handler
app.use(errorHandler);

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize WebSocket for print agent communication
const websocketHandler = require('./services/websocketHandler');
websocketHandler.initWebSocket(server);

config.dbMain()
    .then(() => {
        try {
            googleAuth.loadSavedToken();
        } catch (err) {
            console.warn('Could not load saved Google token:', err.message || err);
        }

        server.listen(PORT, () => {
            console.log(`>> Listening at PORT: ${PORT}`);
            console.log(`>> WebSocket ready for print agents`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to DB, exiting.', err.message || err);
        process.exit(1);
    });

// Google Drive API integration for listing PDF files in a specific folder
const { google } = require('googleapis');
const drive = google.drive('v3');

async function listPDFFilesInFolder(auth, FOLDER_ID) {
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and mimeType='application/pdf'`,
    fields: 'files(id,name,createdTime,size,webViewLink,webContentLink)',
    orderBy: 'createdTime desc',
  });

  console.log(`[DEBUG] Google Drive Check:`);
  console.log(`  - Target Folder: ${FOLDER_ID}`);
  console.log(`  - Files Found: ${res.data.files?.length || 0}`);
  
  if (res.data.files?.length === 0) {
    console.warn(`  - Check if the folder is empty or if account access is restricted.`);
  }
}

module.exports = { listPDFFilesInFolder };


