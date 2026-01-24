const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

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

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:4000',
    process.env.VITE_KIOSK_URL,
    process.env.VITE_ADMIN_URL,
    process.env.VITE_NGROK_URL, // Add Ngrok support
];

const corsOptions = {
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Relaxed CORS for development: allow any localhost or ngrok origin
        if (allowedOrigins.indexOf(origin) !== -1 || 
            origin.includes('localhost') || 
            origin.includes('ngrok-free.app')) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy: This origin is not allowed.'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ type: '*/*' }));
app.use(bodyParser.urlencoded({ extended: false }));

const pdfRoutes = require('./routes/pdfRoute.js');
const authRoutes = require('./routes/authRoute.js');
const pdfController = require('./controllers/pdfController');

// mount API routes (v1) and keep legacy /api for backward compatibility
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/auth', authRoutes);



app.get('/', (req, res) => res.send('Hello world!'));

 app.get('/oauth2callback', (req, res, next) => pdfController.oauthCallback(req, res, next));

// centralized error handler
app.use(errorHandler);

 const googleAuth = require('./googleAuth');

config.dbMain()
    .then(() => {
        try {
            googleAuth.loadSavedToken();
        } catch (err) {
            console.warn('Could not load saved Google token:', err.message || err);
        }

        app.listen(PORT, () => {
            console.log(`>> Listening at PORT: ${PORT}`);
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


