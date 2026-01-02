# Kiosk Application - Architecture Overview

## Project Summary
This is a **Barangay Document Request & Payment Kiosk System** - a full-stack application that allows users to request various barangay documents (clearances, certificates, permits) through a kiosk interface, make payments, and track their requests. The generated documents are automatically converted to PDFs and stored in Google Drive.

---

## System Architecture

### Frontend Architecture
```
Frontend (React + Vite)
├── Kiosk Client (Public-facing kiosk interface)
│   ├── Home → SelectDocument → DocumentForm → PersonalInfo → Payment → Confirmation
│   └── TrackRequest (separate flow)
└── Admin Dashboard (Management interface)
```

### Backend Architecture
```
Backend (Node.js + Express)
├── Routes (API endpoints)
│   ├── /api/request (Document requests)
│   ├── /api/payment (Paymongo integration)
│   ├── /api/pdf (PDF generation & Google Drive)
│   └── /api/print (Printing services)
├── Controllers (Business logic)
├── Services (PDF generation, Google Auth, Drive upload)
├── Models (MongoDB schemas)
└── Middleware (Error handling, validation)
```

---

## Important Files & Their Roles

### **BACKEND CORE**

#### 1. **[backend/app.js](backend/app.js)** - Express Server Entry Point
- **Purpose**: Main application server initialization
- **Key Responsibilities**:
  - Sets up Express with CORS, body parser, and JSON middleware
  - Configures LibreOffice binary paths (required for PDF conversion on Windows)
  - Loads environment variables from `.env`
  - Mounts API routes (`/api/v1`, `/api`)
  - Connects to MongoDB and loads saved Google OAuth tokens
  - Implements centralized error handling
- **Key Ports**: Runs on port 5000 (default)

#### 2. **[backend/routes/index.js](backend/routes/index.js)** - Route Router
- **Purpose**: Central routing hub
- **Routes**:
  - `/api/payment` → Payment processing (Paymongo)
  - `/api/request` → Document request creation and tracking
  - `/api/print` → Printing operations
  - `/api/pdf` → PDF generation and Drive operations

#### 3. **[backend/routes/requestRoute.js](backend/routes/requestRoute.js)** - Request Endpoints
- `POST /api/request/create-request` - Creates a new document request
- `GET /api/request/track/:referenceNumber` - Tracks request status

#### 4. **[backend/controllers/requestController.js](backend/controllers/requestController.js)** - Request Logic
- **`createRequest()`**: Core request creation function
  - Extracts form data (fullName, email, address, document type, template fields)
  - Generates unique reference number (format: `DOCCODE-YEAR-SEQUENCE`)
  - Example: `BRGY-CLR-2025-0001`
  - Stores request in MongoDB
  - Calls payment endpoint to create checkout
  - Returns payment checkout URL
- **Template Field Mapping**: Dynamically stores document-specific fields (age, purpose, zone, etc.)
- **`trackRequest()`**: Retrieves request status by reference number

#### 5. **[backend/controllers/pdfController.js](backend/controllers/pdfController.js)** - PDF & Drive Integration
- **`generatePdf()`**: Converts form data to PDF
  - Calls template engine to render PDF
  - Creates MongoDB request record if missing
  - Uploads PDF to Google Drive if authenticated
  - Returns upload confirmation or auth URL if not authenticated
- **`oauthCallback()`**: Handles Google OAuth redirect
  - Exchanges authorization code for refresh token
  - Saves token for persistent Drive access
- **`initAuth()`**: Generates Google Auth URL for Drive connection

#### 6. **[backend/services/requestService.js](backend/services/requestService.js)** - Request Helpers
- **`createRequestIfMissing()`**: Creates/finds request records
  - Generates sequential reference numbers using counter pattern
  - Prevents duplicate request creation
- **`getDocCode()`**: Maps document names to codes
  - Barangay Clearance → `BRGY-CLR`
  - Indigency Certificate → `BRGY-IND`
  - etc.

#### 7. **[backend/services/pdf/generatePdf.js](backend/services/pdf/generatePdf.js)** - PDF Generation
- **Purpose**: Converts form data + template to PDF
- **Flow**:
  1. Loads Carbone template (DOCX format)
  2. Merges form data into template
  3. Exports to PDF (with optional DOCX→ODT→PDF pipeline for clean conversion)
  4. Saves to temporary directory
  5. Returns PDF file path
- **Optional**: Environment variable `PDF_DOCX_VIA_ODT=true` enables ODT intermediate format (fixes header/footer duplication)

#### 8. **[backend/services/pdf/uploadDrive.js](backend/services/pdf/uploadDrive.js)** - Google Drive Upload
- **Purpose**: Uploads generated PDFs to Google Drive
- **Stores**: File metadata (reference number, request ID, document code)
- **Returns**: Drive file ID and link

#### 9. **[backend/services/google/Auth.js](backend/services/google/Auth.js)** - Google OAuth Manager
- **Manages**: Google OAuth tokens and authentication state
- **Methods**:
  - `generateAuthUrl()` - Creates Google consent screen URL
  - `handleOAuthCallback()` - Exchanges code for tokens
  - `isAuthenticated()` - Checks if valid token exists
  - `getToken()` - Provides access token for Drive API
  - Auto-refreshes tokens when expired

#### 10. **[backend/models/requestSchema.js](backend/models/requestSchema.js)** - Request Database Schema
- **Stores**: 
  - Personal info (name, email, contact, address)
  - Document type and reference number
  - Template-specific fields (age, purpose, zone, civil status, etc.)
  - Payment status
  - Timestamps
- **Purpose**: Single source of truth for request data

#### 11. **[backend/models/counter.js](backend/models/counter.js)** - Sequential Counter
- **Purpose**: Generates unique request numbers yearly
- **Schema**: Stores counter per year
- **Usage**: Auto-increments to create `BRGY-CLR-2025-0001` format

#### 12. **[backend/_templates/](backend/_templates/)** - Document Templates
- **Files**: `BRGY-CLR.js`, `BRGY-IND.js`, `BRGY-BLD.js`, etc.
- **Format**: Carbone-compatible DOCX templates
- **Content**: Define placeholder fields that get merged with form data
- **Examples**:
  - `BRGY-CLR.js` - Barangay Clearance template
  - `BRGY-IND.js` - Indigency Certificate template

---

### **FRONTEND CORE**

#### 1. **[frontend/kiosk-client/src/App.jsx](frontend/kiosk-client/src/App.jsx)** - Main Application
- **Purpose**: Root component and state management
- **Key Data**:
  - `documents[]` - Available documents with fees
  - `formData` - User input state (persisted to localStorage)
  - `paymentStatus` - Tracks payment progress
- **Key Functions**:
  - `handlePayment()` - Initiates payment → POST to `/api/request/create-request`
  - `resetUI()` - Clears form and localStorage after completion
- **Routing**: Wraps `AnimatedRoutes` for page transitions

#### 2. **[frontend/kiosk-client/src/AnimatedRoutes.jsx](frontend/kiosk-client/src/AnimatedRoutes.jsx)** - Route Handler
- **Purpose**: Manages page flow and animations
- **Page Flow**:
  1. **Home** - Welcome screen
  2. **SelectDocument** - Choose document type
  3. **DocumentForm** - Fill document-specific fields
  4. **PersonalInfo** - Enter personal details + photo capture
  5. **Payment** - Review and pay
  6. **Confirmation** - Success screen with reference number
  7. **TrackRequest** - Check existing request status

#### 3. **[frontend/kiosk-client/src/components/SelectDocument.jsx](frontend/kiosk-client/src/components/SelectDocument.jsx)** - Document Picker
- **Purpose**: Shows available documents with descriptions and fees
- **Updates**: `formData.document` with selected document type

#### 4. **[frontend/kiosk-client/src/components/DocumentForm.jsx](frontend/kiosk-client/src/components/DocumentForm.jsx)** - Dynamic Form Fields
- **Purpose**: Renders document-specific form fields
- **Key Mapping** (frontend → backend):
  - Barangay Clearance: `citizenship`, `civilStatus`, `age`, `purpose`
  - Indigency Certificate: `age`, `purpose`
  - Building Clearance: `age`, `sex`, `projectType`
  - Business Permit: `businessName`, `businessKind`
  - etc.
- **Architecture**: Form definitions are hardcoded in component
- **Backend**: Receives all fields and stores them dynamically

#### 5. **[frontend/kiosk-client/src/components/PersonalInfo.jsx](frontend/kiosk-client/src/components/PersonalInfo.jsx)** - User Details & Photo
- **Purpose**: Collects personal info + captures photo for eligible documents
- **Photo Capture**: Only shown for:
  - Barangay Clearance
  - Indigency Certificate
  - Residency Certificate
- **Features**:
  - Opens `CameraModal` when user clicks "Capture Photo"
  - Validates photo is captured before proceeding (if required)
  - Shows thumbnail of captured photo
  - "Retake Photo" option
- **Form Fields**: Full name, contact, email, address

#### 6. **[frontend/kiosk-client/src/components/CameraModal.jsx](frontend/kiosk-client/src/components/CameraModal.jsx)** - Photo Capture
- **Purpose**: Modal-based camera interface
- **Features**:
  - Opens as overlay (not inline on form)
  - Real-time face detection with visual feedback
  - 5-second preview after capture with auto-confirm timer
  - Manual confirm/retake buttons
  - Converts photo to Base64 data URL
  - Stores as `photoId` in formData
- **Technology**: `html5-qrcode` library for camera & face detection
- **Returns**: Base64-encoded image data

#### 7. **[frontend/kiosk-client/src/components/Payment.jsx](frontend/kiosk-client/src/components/Payment.jsx)** - Payment Review
- **Purpose**: Summary before payment
- **Displays**: Document type, fee, form fields
- **Action**: Calls `handlePayment()` from App.jsx
- **Flow**:
  1. Sends form data to `/api/request/create-request`
  2. Backend creates request + returns checkout URL
  3. Redirects to Paymongo checkout
  4. User pays and returns to app

#### 8. **[frontend/kiosk-client/src/components/Confirmation.jsx](frontend/kiosk-client/src/components/Confirmation.jsx)** - Success Screen
- **Purpose**: Shows payment success and reference number
- **Displays**: Reference number (e.g., `BRGY-CLR-2025-0001`)
- **Next Steps**: Prompts user to return to home or track request

#### 9. **[frontend/kiosk-client/src/components/TrackRequest.jsx](frontend/kiosk-client/src/components/TrackRequest.jsx)** - Request Lookup
- **Purpose**: Search for existing requests
- **Input**: Reference number
- **Calls**: `GET /api/request/track/:referenceNumber`
- **Displays**: Request status, document info, submission date

---

## Data Flow Diagrams

### Request Creation Flow
```
User fills form in Kiosk
    ↓
PersonalInfo: Capture photo (optional)
    ↓
Payment: Review details
    ↓
POST /api/request/create-request
    ↓
Backend:
  1. Extract formData (fullName, age, purpose, photoId, etc.)
  2. Generate unique reference number (BRGY-CLR-2025-0001)
  3. Create request in MongoDB
  4. POST to /api/payment/create-checkout (Paymongo)
    ↓
Return checkout_url + reference_number
    ↓
Frontend: Redirect to Paymongo checkout
    ↓
User pays
    ↓
Webhook: Backend receives payment confirmation
    ↓
Trigger: Generate PDF from template + form data
    ↓
Google Drive: Upload PDF
    ↓
MongoDB: Update request status to "Completed"
```

### PDF Generation Flow (After Payment)
```
Payment confirmed
    ↓
Backend webhook receives confirmation
    ↓
POST /api/pdf/generate
  - Template: BRGY-CLR.js (loaded from backend/_templates/)
  - Data: Form fields (name, age, purpose, photo)
    ↓
Carbone: Merge data into template
    ↓
LibreOffice: Convert DOCX → PDF
  (Optional: DOCX → ODT → PDF for cleaner output)
    ↓
Google Drive Upload:
  1. Authenticate with Google OAuth
  2. Upload PDF file
  3. Store metadata (reference number, request ID)
    ↓
Return download link
    ↓
MongoDB: Save file link to request record
```

---

## Key Design Patterns

### 1. **Template-Based Document Generation**
- Templates are DOCX files with Carbone merge syntax
- Form data is merged into templates at runtime
- Supports photo embedding in PDFs

### 2. **Reference Number Pattern**
- Format: `DOCCODE-YEAR-SEQUENCE`
- Example: `BRGY-CLR-2025-0001`
- Uses MongoDB counter for sequential numbering
- Unique per document type per year

### 3. **State Persistence**
- Frontend: localStorage stores formData
- Backend: MongoDB stores complete request records
- Allows users to refresh/comeback without losing progress

### 4. **Google Drive Integration**
- OAuth-based authentication
- Auto-refresh tokens for persistent access
- PDFs uploaded with metadata for easy retrieval
- No local file storage needed

### 5. **Dynamic Form Fields**
- Frontend defines which fields appear for each document
- Backend accepts all fields dynamically
- Flexible for adding new documents without backend changes

---

## Database Schema Overview

### Request Document (MongoDB)
```javascript
{
  _id: ObjectId,
  referenceNumber: "BRGY-CLR-2025-0001",  // Unique identifier
  documentCode: "BRGY-CLR",                 // Document type code
  document: "Barangay Clearance",           // Full document name
  status: "Pending" | "Completed" | "Processing",
  
  // Personal info
  fullName: "John Doe",
  email: "john@example.com",
  contactNumber: "09123456789",
  address: "123 Main St",
  
  // Document-specific fields (dynamic)
  age: "25",
  citizenship: "Filipino",
  civilStatus: "Single",
  purpose: "Employment",
  photoId: "data:image/png;base64,...",  // Base64 image
  
  // Payment
  amount: 50,
  paymentStatus: "Completed",
  paymentId: "pay_12345abc",
  
  // Drive
  driveFileId: "1abc2def...",
  driveDownloadLink: "https://drive.google.com/...",
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **PDF Generation**: Carbone + LibreOffice
- **Cloud Storage**: Google Drive API
- **Payment**: Paymongo (webhook integration)
- **Auth**: Google OAuth 2.0

### Frontend
- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router
- **Camera**: html5-qrcode
- **State**: React Hooks (useState, useEffect, localStorage)

---

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:5000/oauth2callback
VITE_KIOSK_URL=http://localhost:3000
VITE_ADMIN_URL=http://localhost:4000
PDF_DOCX_VIA_ODT=true  # Optional: use ODT intermediate for PDFs
```

### Frontend
- `VITE_API_URL=http://localhost:5000` (backend endpoint)

---

## Request Lifecycle

1. **Form Submission** (Frontend)
   - User submits form with all fields
   - formData is sent to `/api/request/create-request`

2. **Request Creation** (Backend)
   - Reference number generated
   - Request stored in MongoDB
   - Payment intent created via Paymongo

3. **Payment Processing**
   - User redirected to Paymongo checkout
   - Payment completed/failed

4. **Webhook Callback** (After successful payment)
   - Paymongo notifies backend
   - Triggers PDF generation

5. **PDF Generation**
   - Template loaded
   - Form data merged into template
   - DOCX converted to PDF
   - PDF uploaded to Google Drive

6. **Completion**
   - Request status updated to "Completed"
   - Drive link stored in MongoDB
   - User sees confirmation with reference number

---

## Important Notes

- **Photo Storage**: Base64 encoded in MongoDB and embedded in PDFs
- **PDF Headers/Footers**: Use `PDF_DOCX_VIA_ODT=true` if duplicates appear
- **LibreOffice**: Required on Windows for DOCX→PDF conversion
- **Google OAuth**: Tokens saved locally after first auth for seamless Drive uploads
- **Reference Numbers**: Unique across all requests for easy tracking
- **Template Flexibility**: New documents can be added by creating template + updating DocumentForm.jsx

