# Chapter 3 Flowchart Specifications (Implementation Draft)

## 1) Scope and Deliverables

This package includes:
1. Strict flowcharts for macro user flows and API endpoint flows.
2. Architecture diagrams (kept in Chapter 3, explicitly marked as non-flowcharts).
3. A single convention block so all figures use the same notation rules.

---

## 2) Standards and Conventions (Strict)

### 2.1 Symbol Set (ISO 5807 / ANSI style)

| Symbol             | Use                                              |
|--------------------|--------------------------------------------------|
| Terminator         | Start or End only                                |
| Process            | Internal processing step                         |
| Decision           | Exactly one condition, explicit Yes and No exits |
| Input/Output       | User input, API payload, response body, or log   |
| Display            | UI rendering to kiosk/mobile/admin               |
| Data Store         | MongoDB or Google Drive persistence              |
| Predefined Process | Reusable service, subroutine, or external call   |
| Off-page Connector | Cross-page continuation                          |
| On-page Connector  | Loop anchor or line de-cluttering within page    |

Note: External API calls (PayMongo, Google, TextBee, Expo) are
represented as Input/Output symbols since they are I/O operations
from the system's perspective. Predefined Process is used only for
internal subroutines and services documented within this package.

### 2.2 Non-negotiable Flow Rules

1. Every non-terminator symbol has an outgoing path.
2. Every Decision has explicit Yes and No arrow labels.
3. Every path ends at one of:
   - End terminator,
   - paired off-page connector,
   - or a Data Store handoff explicitly followed by a continuation.
4. No branch is left dangling.
5. Branch merges must point to one explicit target symbol.

### 2.3 Off-page Connector Rule

1. On manuscript diagrams, label both sides with the same ID only
   (example: A1 and A1).
2. In drafting text, A1 OUT -> A1 IN may be used for clarity.
3. Source page: connector is the last symbol on that page.
4. Target page: matching connector is the first symbol on the
   next page.
5. Off-page connector uses the off-page connector shape, not an
   on-page circle.

Note: No off-page connectors are used in this package. All
cross-figure references are handled via Predefined Process symbols
since all subprocess references return control to the caller. This
section is retained to confirm the convention was evaluated and
intentionally not applied.

### 2.4 Terminology Lock

Request status terms:
- Pending
- Processing
- For Pick-up
- Completed
- Cancelled

Payment status terms:
- Unpaid
- Pending
- Processing
- Paid
- Failed

### 2.5 Response Shape Rule (Authoritative)

1. Any Return STATUS_CODE node is an Input/Output symbol.
2. Start and End are Terminator symbols.
3. Decision steps are Decision symbols with explicit Yes and No exits.
4. Log output (console.log / warn / error) is an Input/Output symbol.
5. On-page connectors used as loop anchors or merge points are
   labeled with an ID (e.g., L1, F1, CM).

---

## 3) Figure Numbering (Chapter 3)

### A. Macro User Flows
- C3-1   Kiosk Client End-to-End Flow
- C3-2   Mobile App End-to-End Flow
- C3-3   Admin Dashboard End-to-End Flow

Scope note:
- C3-1 covers the primary transactional kiosk flow.
- Auxiliary kiosk functions (Track Request, Help Video) are
  separated into C3-35 and C3-36 and referenced from C3-1.

### B. Architecture Diagrams (Non-flowchart notation)
- C3-4   Deployment Architecture
- C3-5   Hardware-Software Interface
- C3-6   Data Flow Diagram (L0 and L1)

### C. Essential Endpoint and Service Flowcharts
- C3-7   POST /api/request/create-request/
- C3-8   POST /api/payment/create-checkout
- C3-9   POST /api/payment/create-cash-payment
- C3-10  POST /api/payment/handle-webhook
- C3-11  Generate PDF Service
         (backend/services/pdf/generatePdf.js)
- C3-12  PATCH /api/pdf/status/:fileId
- C3-13  PATCH /api/pdf/status/ref/:referenceNumber
- C3-14  POST /api/print/
- C3-15  GET /api/queue/
- C3-16  POST /api/auth/request-otp
- C3-17  POST /api/auth/verify-otp
- C3-18  POST /api/auth/google
- C3-19  POST /api/auth/refresh-token
- C3-20  WebSocket wss:// (path /)
- C3-21  GET /api/pdf/auth/check
- C3-22  GET /api/pdf/auth/init
- C3-23  GET /api/pdf/auth/callback
- C3-24  GET /api/pdf/list
- C3-25  GET /api/pdf/trash
- C3-26  DELETE /api/pdf/delete/:fileId
- C3-27  DELETE /api/pdf/delete-multiple
- C3-28  POST /api/pdf/restore/:fileId
- C3-29  POST /api/pdf/restore-multiple
- C3-30  DELETE /api/pdf/trash/:fileId
- C3-31  DELETE /api/pdf/trash-multiple
- C3-32  GET /api/pdf/download/:fileId
- C3-33  POST /api/pdf/auth/logout
- C3-34  POST /api/pdf/auth/disconnect

### D. Auxiliary Kiosk UI Flowcharts
- C3-35  GET /api/request/track-request/:referenceNumber
- C3-36  Help Button Tutorial Video Flow

### E. Auxiliary Mobile UI Flowcharts
- C3-37  Mobile Request Details Screen Flow

### F. Fee and Document Services
- C3-38  Compute Document Fee (Fee Policy)

### G. Google Drive and Upload Services
- C3-39  Google Drive Upload Service (uploadPdf)

### H. Additional Essential In-Use Flows
- C3-40  PATCH /api/request/hide*
- C3-41  PATCH /api/request/unhide*
- C3-42  POST /api/auth/push-token
- C3-43  DELETE /api/auth/push-token
- C3-44  GET /api/auth/google/mobile
- C3-45  GET /api/auth/google/mobile/callback
- C3-46  Push Notification Dispatch Service
         (sendRequestStatusNotification)
- C3-47  Token Generation Service
         (tokenManager.generateTokens)
- C3-48  POST /api/pdf/generate (Generate PDF Endpoint)

---

## 4) Connector Registry (Authoritative)

No off-page connectors are used in this package.
All cross-figure references are handled via Predefined Process
symbols. See Section 2.3 note.

---

## 5) Macro Flowcharts

---

## C3-1) Kiosk Client End-to-End Flow

Start: Citizen arrives at kiosk terminal.
End: Citizen receives confirmation with reference number,
     or exits from auxiliary flow.

1.  Start (Terminator)

2.  Display: Language selection and home screen options (Display)

3.  Decision: Request document selected?
    ├── Yes → Enter personal information (Input/Output)
    └── No  → Decision: Track Request selected?
                ├── Yes → Track Request
                │         (Predefined Process, ref. C3-35)
                │         → [arrow back to step 2]
                └── No  → Decision: Help selected?
                            ├── Yes → Help Tutorial Video
                            │         (Predefined Process, ref. C3-36)
                            │         → [arrow back to step 2]
                            └── No  → [arrow back to step 2]

4.  Validate personal information (Process)

5.  Decision: Personal information valid?
    ├── No  → Display: Validation errors (Display)
    │         → [arrow back to step 3 Yes branch:
    │            Enter personal information]
    └── Yes → Display: Select document type (Display)

6.  Fill document fields and review (Input/Output)

7.  Decision: Payment method is E-wallet?
    ├── Yes → Create Document Request and Initiate Checkout
    │         (Predefined Process, ref. C3-7)
    │         → Display: Open PayMongo checkout URL (Display)
    │         → Await payment callback / webhook (Process)
    │         → Update payment status (Process)
    │         → ○ PM
    └── No  → Create Cash Payment
              (Predefined Process, ref. C3-9)
              → Display: Processing / Please Wait (Display)
              → ○ PM

○ PM
↓
8.  Generate PDF (Predefined Process, ref. C3-11)

9.  Upload PDF to Google Drive (Predefined Process, ref. C3-39)

10. Display: Confirmation screen with reference number (Display)

11. Decision: Print receipt requested?
    ├── No  → End (Terminator)
    └── Yes → Print Receipt (Predefined Process, ref. C3-14)
              → End (Terminator)

---

## C3-2) Mobile App End-to-End Flow

Start: User opens mobile app.
End: Request submitted and confirmation shown, or session ended.

1.  Start (Terminator)

2.  Load app and check session token (Process)

3.  Decision: Access token valid?
    ├── Yes → ○ S1
    └── No  → Display: Authentication options (Display)

4.  Decision: Use OTP authentication?
    ├── Yes → OTP Request and Verification
    │         (Predefined Process, ref. C3-16, C3-17)
    │         → ○ EA
    └── No  → Google Authentication Flow
              (Predefined Process, ref. C3-44, C3-45, C3-18)
              → ○ EA

○ EA
↓
5.  Evaluate Authentication Result (Process)

6.  Decision: Authentication successful?
    ├── No  → Display: Authentication error (Display)
    │         → End (Terminator)
    └── Yes → ○ S1

○ S1
↓
7.  Display: Dashboard and request history (Display)

8.  Register Expo push token with backend
    (Predefined Process, ref. C3-42)

9.  Decision: Create new request?
    ├── No  → End (Terminator)
    └── Yes → Select document and fill form (Input/Output)

10. Display: Review payment options — Online / Cash / Free (Display)

11. Decision: Fee > 0?
    ├── No  → Create Cash Payment
    │         (Predefined Process, ref. C3-9)
    │         → ○ CM
    └── Yes → Decision: Payment method is E-wallet?
                ├── Yes → Create Document Request and
                │         Initiate Checkout
                │         (Predefined Process, ref. C3-7)
                │         → Display: PayMongo checkout —
                │           await deep-link callback (Display)
                │         → Await payment confirmation (Process)
                │         → Update payment status (Process)
                │         → Generate PDF
                │           (Predefined Process, ref. C3-11)
                │         → Upload PDF to Google Drive
                │           (Predefined Process, ref. C3-39)
                │         → ○ CM
                └── No  → Create Cash Payment
                          (Predefined Process, ref. C3-9)
                          → ○ CM

○ CM
↓
12. Display: Confirmation screen with reference number (Display)

○ CL
↓
13. Decision: Track Request selected?
    ├── Yes → Track Request (Predefined Process, ref. C3-35)
    │         → End (Terminator)
    └── No  → Decision: Go to Home selected?
                ├── Yes → End (Terminator)
                └── No  → ○ CL

---

## C3-3) Admin Dashboard End-to-End Flow

Start: Admin opens dashboard.
End: Session ended after queue and document actions.

1.  Start (Terminator)

2.  Check admin Drive authentication session (Process)

3.  Decision: Session valid?
    ├── No  → Display: Sign in with Google Drive button (Display)
    │         → Decision: Admin clicks Sign in?
    │             ├── No  → End (Terminator)
    │             └── Yes → Initialize OAuth and Callback
    │                        (Predefined Process, ref. C3-22, C3-23)
    │                        → Decision: Auth successful?
    │                            ├── No  → Display: Access denied
    │                            │         (Display) → End (Terminator)
    │                            └── Yes → ○ D1
    └── Yes → Decision: Authorized?
                ├── No  → Display: Access denied (Display)
                │         → End (Terminator)
                └── Yes → ○ D1

○ D1
↓
4.  Prepare Dashboard (Process)

5.  Display: Load queue and file lists (Display)

6.  Connect WebSocket and subscribe to queue
    (Predefined Process, ref. C3-20)

○ L1
↓
7.  Decision: Continue session?
    ├── No  → Logout and Disconnect Drive
    │         (Predefined Process, ref. C3-34, C3-33)
    │         → End (Terminator)
    └── Yes → Decision: Update a request status?
                ├── Yes → Progress Request Status
                │         (Predefined Process, ref. C3-12 / C3-13)
                │         → ○ L1
                └── No  → Decision: Manage a PDF file?
                            ├── Yes → PDF File Operation
                            │         (Predefined Process,
                            │          ref. C3-24 to C3-32)
                            │         → ○ L1
                            └── No  → ○ L1

---

## 6) Architecture Diagrams (Non-flowchart)

These are intentionally not strict flowcharts.

## C3-4) Deployment Architecture (Non-flowchart)

Include nodes and links:
1. Kiosk Terminal (touch display, browser, local network)
2. Mobile App (Expo/React Native client)
3. Admin Dashboard (web client)
4. Backend API server (Express)
5. MongoDB
6. PayMongo
7. Google Drive
8. Print Agent and Thermal Printer

Connection labels:
- HTTP/HTTPS
- WebSocket
- OAuth callback
- Webhook callback
- USB ESC/POS

## C3-5) Hardware-Software Interface (Non-flowchart)

Use three swimlanes:
1. Hardware lane: touch display, printer, NIC
2. Middleware lane: USB driver, WS client, ESC/POS formatter
3. Software lane: kiosk client, admin app, backend, database

Show explicit signal/data labels between lanes.

## C3-6) Data Flow Diagram L0/L1 (Non-flowchart)

L0 entities:
- Citizen
- Admin
- PayMongo
- Google Drive

L1 processes:
- Validate request
- Process payment
- Generate document
- Dispatch print
- Update status
- Notify clients

---

## 7) Endpoint and Service Flowcharts

All flowcharts below are strict ISO 5807 flowcharts.

---

## C3-7) POST /api/request/create-request/ — Create Request

Start: Request creation call received.
End: Checkout payload returned or error returned.

1.  Start (Terminator)
2.  Receive request payload body (Input/Output)
3.  Extract base fields and template fields (Process)
4.  Resolve userId from Authorization token or body fallback (Process)
5.  Compute document fee
    (Predefined Process, ref. C3-38)
6.  Increment yearly counter via Counter.findOneAndUpdate (Data Store)
7.  Build reference number from doc code + year + sequence (Process)
8.  Create request record with status Pending (Data Store)
9.  Build payment payload with return/cancel URLs (Process)
10. Call POST /api/payment/create-checkout
    (Predefined Process, ref. C3-8)
11. Decision: Checkout call successful?
    ├── No  → Return 500 error payload (Input/Output)
    │         → End (Terminator)
    └── Yes → Return 200 checkout attributes (Input/Output)
              → End (Terminator)

---

## C3-8) POST /api/payment/create-checkout — Create Checkout

Start: Checkout creation call received.
End: Checkout URL returned or failure returned.

1.  Start (Terminator)
2.  Receive request/payment payload (Input/Output)
3.  Recompute fee using backend policy (Process)
4.  Resolve success/cancel URLs from payload or kiosk defaults (Process)
5.  Convert PHP amount to centavos (Process)
6.  Call PayMongo checkout session API and receive response (Input/Output)
7.  Decision: PayMongo API call successful?
    ├── No  → Return 500 with error details (Input/Output)
    │         → End (Terminator)
    └── Yes → Return 200 with checkout attributes (Input/Output)
              → End (Terminator)

---

## C3-9) POST /api/payment/create-cash-payment — Create Cash Payment

Start: Cash payment call received.
End: Request persisted and response returned.

1.  Start (Terminator)
2.  Receive payload (Input/Output)
3.  Extract base/template fields and resolve userId from
    token/body (Process)
4.  Compute fee and classify free vs cash (Process)
5.  Increment yearly counter and generate reference number
    (Data Store → Process)
6.  Set status/payment fields:
    Processing/Paid/Free for free documents,
    Pending/Pending/Cash otherwise (Process)
7.  Create request record (Data Store)
8.  Decision: Request create successful?
    ├── No  → Return 500 error payload (Input/Output)
    │         → End (Terminator)
    └── Yes → Generate PDF then upload to Drive
              (Predefined Process, ref. C3-11, C3-39)
10. Return 200 with reference/status/payment fields (Input/Output)
    → End (Terminator)

---

## C3-10) POST /api/payment/handle-webhook — Handle Webhook

Start: PayMongo webhook POST received.
End: HTTP 200 on all handled paths; HTTP 500 on outer failure.

Always-200 rule: res.sendStatus(200) is a single statement
outside all inner blocks. All handled paths converge at ○ R1
before returning HTTP 200. PayMongo requires this to stop retries.

[Outer try block — wraps steps 1 through R1]

1.  Start (Terminator)

2.  Receive webhook payload req.body.data (Input/Output)

3.  Parse event.attributes.type (Process)

4.  Decision: Event type is checkout_session.payment.paid?
    ├── No  → ○ R1
    └── Yes → Extract referenceNumber and raw paymentMethod
              from checkout attributes (Process)

5.  Normalize raw paymentMethod to display label
    e.g. gcash → GCash (Process)

6.  Update matching request record:
    status=Processing, paymentStatus=Paid,
    paymentMethod, paidAt (Data Store)

7.  Decision: Record found and updated?
    ├── No  → Log warning: no request found for reference
    │         (Input/Output) → ○ R1
    └── Yes → Decision: userId exists?
                ├── Yes → Send push status notification
                │         (Predefined Process, ref. C3-46)
                │         → ○ WS
                └── No  → ○ WS

○ WS
↓
8.  Broadcast queue update via WebSocket
    (Predefined Process, ref. C3-20)

9.  Generate PDF and upload to Drive
    (Predefined Process, ref. C3-11, C3-39)

10. Decision: PDF and upload process successful?
    ├── No  → Log error, defer to cleanup daemon (Input/Output)
    │         → ○ R1
    └── Yes → ○ R1

○ R1 [all handled paths converge here — HTTP 200 path]
↓
Return HTTP 200 (Input/Output) → End (Terminator)

[Outer catch — catches any unhandled exception from steps 1–R1]
↓
Log webhook processing error (Input/Output)
↓
Return HTTP 500 (Input/Output) → End (Terminator)

---

## C3-11) Generate PDF Service - 8
##        (backend/services/pdf/generatePdf.js)

Start: PDF generation service called with templateKey and rawData.
End: Final PDF file path returned, or invalid template error thrown.

1.  Start (Terminator)
2.  Receive templateKey and rawData (Input/Output)
3.  Decision: Template exists for templateKey?
    ├── No  → Throw invalid template error (Input/Output)
    │         → End (Terminator)
    └── Yes → Render base PDF via Carbone (Process)
4.  Decision: Template has images?
    ├── No  → ○ F1
    └── Yes → Embed images into PDF (Process)
              → Decision: New file produced?
                  ├── No  → ○ F1
                  └── Yes → Delete intermediate base PDF (Process)
                            → Decision: Deletion successful?
                                ├── No  → Log cleanup warning
                                │         (Input/Output) → ○ F1
                                └── Yes → ○ F1

○ F1
↓
Return final PDF path (Input/Output) → End (Terminator)

---

## C3-12) PATCH /api/pdf/status/:fileId — Update Status by File ID - 9

## C3-13) PATCH /api/pdf/status/ref/:referenceNumber - 9
##         Update Status by Reference Number

Start: Admin status update request received.
End: Updated status returned or error returned.

1.  Start (Terminator)

2.  Check admin session via isAdminLoggedIn (Process)

3.  Decision: Authorized?
    ├── No  → Return 401 Not authenticated (Input/Output)
    │         → End (Terminator)
    └── Yes → Receive identifier from path param
              (fileId or referenceNumber) (Input/Output)

4.  Decision: Identifier present?
    ├── No  → Return 400 missing identifier (Input/Output)
    │         → End (Terminator)
    └── Yes → Receive status from request body (Input/Output)

5.  Validate status in
    Pending | Processing | For Pick-up |
    Completed | Cancelled (Process)

6.  Decision: Status valid?
    ├── No  → Return 400 invalid status (Input/Output)
    │         → End (Terminator)
    └── Yes → Update and retrieve request record
              via drive.updateStatus (Data Store)

7.  Decision: Record found and updated?
    ├── No  → Return 500 update failed (Input/Output)
    │         → End (Terminator)
    └── Yes → Decision: Status is not Pending?
                ├── No  → ○ B
                └── Yes → Run notification chain / Status Update Notification Chain
                          (Predefined Process, ref. C3-49)
                          → ○ B

○ B
↓
8.  Broadcast queue update
    (Predefined Process, ref. C3-20)

9.  Return 200 success with updated record (Input/Output)
    → End (Terminator)

[Outer catch — wraps drive.updateStatus and steps 7-9]
↓
Return 500 update failed with error details (Input/Output)
→ End (Terminator)
```

---

## C3-14) POST /api/print/ — Print Receipt

Start: Print dispatch endpoint called.
End: Print result returned.

1.  Start (Terminator)
2.  Receive print payload (Input/Output)
3.  Decision: Runtime is Linux / non-Windows?
    ├── Yes → Check print agent availability
    │         via isPrintAgentAvailable (Process)
    │         → Decision: Agent available?
    │             ├── No  → Return 503 no-agent message (Input/Output)
    │             │         → End (Terminator)
    │             └── Yes → Send Print Job To Agent
    │                        (Predefined Process, ref. C3-20)
    │                        → Decision: Agent callback success?
    │                            ├── No  → Return 500 print failure
    │                            │         (Input/Output)
    │                            │         → End (Terminator)
    │                            └── Yes → Return 200 receipt sent
    │                                      (Input/Output)
    │                                      → End (Terminator)
    └── No  → Choose local Windows printer (Process)
              → Decision: Printer found?
                  ├── No  → Return 500 no-printer message (Input/Output)
                  │         → End (Terminator)
                  └── Yes → Build ESC/POS payload and send bytes
                            to printer (Process)
                            → Decision: Local print success?
                                ├── No  → Return 500 printing error
                                │         (Input/Output)
                                │         → End (Terminator)
                                └── Yes → Return 200 receipt sent
                                          (Input/Output)
                                          → End (Terminator)

---

## C3-15) GET /api/queue/ — Get Queue Snapshot - 11

Start: Queue snapshot request received.
End: Queue payload returned.

1.  Start (Terminator)
2.  Query requests where status in Processing, For Pick-up
    and not deleted (Data Store)
3.  Decision: Query success?
    ├── No  → Return 500 error payload (Input/Output)
    │         → End (Terminator)
    └── Yes → Sort and map rows (Process)
4.  Split into nowServing and forPickup arrays (Process)
5.  Return 200 snapshot payload (Input/Output) → End (Terminator)

---

C3-16) POST /api/auth/request-otp — Request OTP - 12

Start: OTP request call received.
End: OTP token response returned.

1.  Start (Terminator)
2.  Receive phoneNumber and optional fullName (Input/Output)
3.  Decision: phoneNumber provided?
    ├── No  → Return 400 Phone number is required (Input/Output)
    │         → End (Terminator)
    └── Yes → Find user by phoneNumber (Data Store)
4.  Send OTP via TextBee SMS API and receive result (Input/Output)
5.  Decision: OTP send successful?
    ├── No  → Return 500 failed to send OTP (Input/Output)
    │         → End (Terminator)
    └── Yes → Sign temporary OTP token with claims:
              phoneNumber, otp, expiresAt,
              fullName, isNewUser (Process)
6.  Return 200 with otpToken and isNewUser (Input/Output)
    → End (Terminator)
---

```
C3-17) POST /api/auth/verify-otp — Verify OTP - 13

Start: OTP verification call received.
End: Access/refresh tokens returned or error.

1.  Start (Terminator)
2.  Receive phoneNumber, otp, optional fullName,
    and otpToken (Input/Output)
3.  Decision: otp and otpToken provided?
    ├── No  → Return 400 OTP and OTP token are required
    │         (Input/Output) → End (Terminator)
    └── Yes → Verify OTP token signature via JWT (Process)
4.  Decision: Token valid?
    ├── No  → Return 400 OTP token expired or invalid
    │         (Input/Output) → End (Terminator)
    └── Yes → Compare submitted OTP against token claims
              and verify OTP expiry (Process)
5.  Decision: OTP valid?
    ├── No  → Return 400 with verification error (Input/Output)
    │         → End (Terminator)
    └── Yes → Resolve verified phone number from token
              claims or request body fallback (Process)
6.  Find user by verified phone number (Data Store)
7.  Decision: User exists?
    ├── No  → Create new user record with phone,
    │         name, isPhoneVerified, authProvider,
    │         isActive, lastLoginAt (Data Store) → ○ T1
    └── Yes → Update isPhoneVerified and
              lastLoginAt (Data Store) → ○ T1

○ T1
↓
8.  Generate access and refresh tokens
    (Predefined Process, ref. C3-47)
9.  Return 200 with token, refreshToken,
    and user info (Input/Output) → End (Terminator)
---

## C3-18) POST /api/auth/google — Google Authentication - 14

Start: Google auth endpoint called.
End: Access/refresh tokens returned or error.

1.  Start (Terminator)
2.  Receive googleToken and email payload (Input/Output)
3.  Decision: googleToken and email present?
    ├── No  → Return 400 missing fields (Input/Output)
    │         → End (Terminator)
    └── Yes → Call Google userinfo API and receive response (Input/Output)
4.  Decision: Google token valid?
    ├── No  → Return 401 invalid token (Input/Output)
    │         → End (Terminator)
    └── Yes → Decision: Token email matches payload email?
                ├── No  → Return 401 email mismatch (Input/Output)
                │         → End (Terminator)
                └── Yes → Find user by email or googleId (Data Store)
5.  Decision: User exists?
    ├── No  → Create new user record (Data Store) → ○ T2
    └── Yes → Patch missing profile fields and login timestamp
              (Data Store) → ○ T2

○ T2
↓
6.  Generate access and refresh tokens
    (Predefined Process, ref. C3-47)
7.  Return 200 success payload (Input/Output) → End (Terminator)

---

## C3-19) POST /api/auth/refresh-token — Refresh Token - 15

Start: Refresh token endpoint called.
End: New access token returned or unauthorized.

1.  Start (Terminator)
2.  Receive refreshToken payload (Input/Output)
3.  Decision: Token provided?
    ├── No  → Return 400 Refresh token required (Input/Output)
    │         → End (Terminator)
    └── Yes → Verify refresh token signature and expiry (Process)
4.  Decision: Refresh token valid?
    ├── No  → Return 401 token refresh failed (Input/Output)
    │         → End (Terminator)
    └── Yes → Find user by token subject (Data Store)
5.  Decision: Active user found?
    ├── No  → Return 401 user missing or inactive (Input/Output)
    │         → End (Terminator)
    └── Yes → Generate new access token (Process)
6.  Return 200 with new access token (Input/Output)
    → End (Terminator)

---

## C3-20) WebSocket wss:// (path /) — WebSocket Handler/ Send Print Job to Agent - 16

Start: Incoming WebSocket upgrade.
End: Agent registered, job dispatched, or connection closed.

1.  Start (Terminator)
2.  Accept WebSocket connection and initialize
    connection flags (Process)
3.  Receive register message
    (type=register, agentSecret) (Input/Output)
4.  Decision: Secret valid?
    ├── No  → Send error and close socket (Input/Output)
    │         → End (Terminator)
    └── Yes → Mark agent authenticated and store
              connection (Process)

6.  Wait for sendPrintJob dispatch from HTTP print path (Process)

○ WL
↓
7.  Decision: Print job dispatched to agent?
    ├── No  → Continue heartbeat/ping loop (Process) → ○ WL
    └── Yes → Create jobId and pending callback entry (Process)
8.  Send print-job message to agent (Input/Output)
9.  Decision: print-result received before timeout?
    ├── No  → Resolve callback as timeout/failure (Process)
    │         → End (Terminator)
    └── Yes → Resolve callback with success/failure
              payload (Process) → End (Terminator)

---

## C3-21) GET /api/pdf/auth/check — Auth Check - 17

Start: Admin auth-check request received.
End: Auth status response returned.

1.  Start (Terminator)
2.  Read current admin auth session state
    via isAdminLoggedIn (Process)
3.  Decision: Authenticated?
    ├── No  → Return {authenticated:false} (Input/Output)
    │         → End (Terminator)
    └── Yes → Return {authenticated:true} (Input/Output)
              → End (Terminator)

---

## C3-22) GET /api/pdf/auth/init — Auth Init - 18

Start: Admin auth init request received.
End: OAuth authorization URL returned.

1.  Start (Terminator)
2.  Generate Google OAuth authorization URL
    via auth.generateAuthUrl (Process)
3.  Decision: URL generation succeeded?
    ├── No  → Return 500 auth-init failure (Input/Output)
    │         → End (Terminator)
    └── Yes → Return {authUrl} payload (Input/Output)
              → End (Terminator)

---

## C3-23) GET /api/pdf/auth/callback — OAuth Callback - 19

Start: Google OAuth callback request received.
End: Token persisted and redirect issued, or access denied.

1.  Start (Terminator)
2.  Receive callback query code (Input/Output)
3.  Decision: Authorization code present?
    ├── No  → Return 400 missing code (Input/Output)
    │         → End (Terminator)
    └── Yes → Exchange code for tokens with Google (Process)
4.  Decision: Exchange and validation successful?
    ├── No  → Return 500 authentication failed (Input/Output)
    │         → End (Terminator)
    └── Yes → Decision: Admin identity allowed?
                ├── No  → Display: 403 access-denied page (Display)
                │         → End (Terminator)
                └── Yes → Persist tokens and session,
                          redirect ?auth=success to admin app
                          (Input/Output) → End (Terminator)

---

## C3-24) GET /api/pdf/list — List PDFs - 20

Start: List PDFs request received.
End: File list payload returned.

1.  Start (Terminator)
2.  Check admin logged-in state (Process)
3.  Decision: Authorized?
    ├── No  → Return 401 not authenticated (Input/Output)
    │         → End (Terminator)
    └── Yes → Query Drive PDF list (Data Store)
4.  Decision: Query success?
    ├── No  → Return 500 list failure (Input/Output)
    │         → End (Terminator)
    └── Yes → Return 200 list payload (Input/Output)
              → End (Terminator)

---

## C3-25) GET /api/pdf/trash — List Trashed PDFs - 21

Start: List trashed PDFs request received.
End: Trash list payload returned.

1.  Start (Terminator)
2.  Check admin logged-in state (Process)
3.  Decision: Authorized?
    ├── No  → Return 401 not authenticated (Input/Output)
    │         → End (Terminator)
    └── Yes → Query Drive trash list (Data Store)
4.  Decision: Query success?
    ├── No  → Return 500 trash-list failure (Input/Output)
    │         → End (Terminator)
    └── Yes → Return 200 trash payload (Input/Output)
              → End (Terminator)

---

## C3-26) DELETE /api/pdf/delete/:fileId — Soft Delete PDF - 22

Start: Soft-delete request received.
End: Deletion result returned.

1.  Start (Terminator)
2.  Check admin logged-in state (Process)
3.  Decision: Authorized?
    ├── No  → Return 401 not authenticated (Input/Output)
    │         → End (Terminator)
    └── Yes → Receive fileId path param (Input/Output)
4.  Soft-delete record via service (deleted=true)
    and broadcast queue update (Process)
5.  Decision: Operation successful?
    ├── No  → Return 500 delete failure (Input/Output)
    │         → End (Terminator)
    └── Yes → Return 200 success message (Input/Output)
              → End (Terminator)

---

## C3-27) DELETE /api/pdf/delete-multiple — Batch Soft Delete - 23

Start: Batch soft-delete request received.
End: Batch result returned.

1.  Start (Terminator)
2.  Check admin logged-in state (Process)
3.  Decision: Authorized?
    ├── No  → Return 401 not authenticated (Input/Output)
    │         → End (Terminator)
    └── Yes → Receive fileIds array payload (Input/Output)
4.  Decision: Non-empty valid array?
    ├── No  → Return 400 invalid file IDs (Input/Output)
    │         → End (Terminator)
    └── Yes → Run bulk soft-delete service
              and broadcast queue update (Process)
5.  Decision: Bulk action successful?
    ├── No  → Return 500 deletion failure (Input/Output)
    │         → End (Terminator)
    └── Yes → Return 200 success message (Input/Output)
              → End (Terminator)

---

## C3-28) POST /api/pdf/restore/:fileId — Restore One PDF - 24

Start: Restore one trashed PDF request received.
End: Restore result returned.

1.  Start (Terminator)
2.  Check admin logged-in state (Process)
3.  Decision: Authorized?
    ├── No  → Return 401 not authenticated (Input/Output)
    │         → End (Terminator)
    └── Yes → Receive fileId path param (Input/Output)
4.  Restore record from trash and broadcast queue update (Process)
5.  Decision: Restore successful?
    ├── No  → Return 500 restore failure (Input/Output)
    │         → End (Terminator)
    └── Yes → Return 200 restore result (Input/Output)
              → End (Terminator)

---

## C3-29) POST /api/pdf/restore-multiple — Batch Restore - 25

Start: Batch restore request received.
End: Batch restore summary returned.

1.  Start (Terminator)
2.  Check admin logged-in state (Process)
3.  Decision: Authorized?
    ├── No  → Return 401 not authenticated (Input/Output)
    │         → End (Terminator)
    └── Yes → Receive fileIds array payload (Input/Output)
4.  Decision: Valid non-empty array?
    ├── No  → Return 400 invalid file IDs (Input/Output)
    │         → End (Terminator)
    └── Yes → Run bulk restore and broadcast queue update (Process)
5.  Decision: Restore action successful?
    ├── No  → Return 500 restore failure (Input/Output)
    │         → End (Terminator)
    └── Yes → Return 200 restore summary (Input/Output)
              → End (Terminator)

---

## C3-30) DELETE /api/pdf/trash/:fileId — Permanent Delete One - 26

Start: Permanent delete one file request received.
End: Permanent delete result returned.

1.  Start (Terminator)
2.  Check admin logged-in state (Process)
3.  Decision: Authorized?
    ├── No  → Return 401 not authenticated (Input/Output)
    │         → End (Terminator)
    └── Yes → Receive fileId path param (Input/Output)
4.  Permanently delete one file from trash (Data Store)
5.  Decision: Delete successful?
    ├── No  → Return 500 permanent-delete failure (Input/Output)
    │         → End (Terminator)
    └── Yes → Return 200 delete result (Input/Output)
              → End (Terminator)

---

## C3-31) DELETE /api/pdf/trash-multiple — Batch Permanent Delete - 27

Start: Batch permanent delete request received.
End: Batch result returned.

1.  Start (Terminator)
2.  Check admin logged-in state (Process)
3.  Decision: Authorized?
    ├── No  → Return 401 not authenticated (Input/Output)
    │         → End (Terminator)
    └── Yes → Receive fileIds array payload (Input/Output)
4.  Decision: Valid non-empty array?
    ├── No  → Return 400 invalid file IDs (Input/Output)
    │         → End (Terminator)
    └── Yes → Run bulk permanent-delete service (Data Store)
5.  Decision: Operation successful?
    ├── No  → Return 500 permanent-delete failure (Input/Output)
    │         → End (Terminator)
    └── Yes → Return 200 success summary (Input/Output)
              → End (Terminator)

---

## C3-32) GET /api/pdf/download/:fileId — Download PDF - 28

Start: Download file request received.
End: Stream response or error.

1.  Start (Terminator)
2.  Check admin logged-in state (Process)
3.  Decision: Authorized?
    ├── No  → Return 401 not authenticated (Input/Output)
    │         → End (Terminator)
    └── Yes → Receive fileId path param (Input/Output)
4.  Request PDF stream from Drive service (Data Store)
5.  Decision: Stream retrieval succeeded?
    ├── No  → Return 500 download failed (Input/Output)
    │         → End (Terminator)
    └── Yes → Return streamed PDF response (Input/Output)
              → End (Terminator)

---

## C3-33) POST /api/pdf/auth/logout — Admin Logout - 29

Start: Admin logout request received.
End: Session cleared.

1.  Start (Terminator)
2.  Clear admin login state via auth.logout() (Process)
3.  Return 200 logout success payload (Input/Output)
4.  End (Terminator)

---

## C3-34) POST /api/pdf/auth/disconnect — Disconnect Drive - 30

Start: Admin disconnect-drive request received.
End: Drive token revoked.

1.  Start (Terminator)
2.  Receive disconnect request (Input/Output)
3.  Revoke Drive token and clear local token state
    via auth.disconnectDrive (Process)
4.  Return 200 disconnect success payload (Input/Output)
    → End (Terminator)

---

## C3-35) GET /api/request/track-request/:referenceNumber
##         Track Request (Kiosk) - 31

Start: Track request lookup called from kiosk tracking UI.
End: Matching request payload returned or error returned.

1.  Start (Terminator)
2.  Receive referenceNumber path param (Input/Output)
3.  Normalize and trim reference number string (Process)
4.  Query request by referenceNumber (Data Store)
5.  Decision: Query executed successfully?
    ├── No  → Return 500 error payload (Input/Output)
    │         → End (Terminator)
    └── Yes → Decision: Matching record found?
                ├── No  → Return 404 not-found payload (Input/Output)
                │         → End (Terminator)
                └── Yes → Return 200 with request payload (Input/Output)
                          → End (Terminator)

---

## C3-36) Help Button Tutorial Video Flow - 32

Start: User taps Help button on kiosk home screen.
End: User returns to Home screen.

1.  Start (Terminator)
2.  User selects Help on Home screen (Input/Output)
3.  Display: Help page (Display)
4.  Load and render tutorial video player
    /kiosk-tutorial.mp4 (Process)
5.  Decision: Video loaded and playable?
    ├── No  → Display: Playback error / fallback message (Display)
    │         → [arrow to step 7]
    └── Yes → Display: Play tutorial video with controls (Display)
7.  Decision: User taps Back button?
    ├── No  → [arrow back to step 6: Play tutorial video]
    └── Yes → Display: Navigate back to Home screen (Display)
              → End (Terminator)

---

## C3-37) Mobile Hide Request - 33

Start: User opens one request from My Requests.
End: Request remains visible, or is hidden from My Requests list.

1.  Start (Terminator)
2.  User taps a request item in My Requests (Input/Output)
3.  Display: Request Details screen (Display)
4.  Decision: User taps Hide from My Requests?
    ├── No  → End (Terminator)
    └── Yes → Display: Show updating state on button (Display)
5.  Save hidden state for this request (Process)
6.  Decision: Hide action succeeded?
    ├── No  → Display: Show error alert, keep request visible (Display)
    │         → End (Terminator)
    └── Yes → Display: Confirm hidden state, remove from
              My Requests list view (Display) → End (Terminator)

---

## C3-38) Compute Document Fee (Fee Policy) - 34

Start: Fee computation called with document, purpose, isStudent.
End: Fee amount and reason returned.

Note: If document type is not found in the fee schedule,
the base fee defaults to 0 (fallback via ?? 0 operator).

1.  Start (Terminator)
2.  Receive document, purpose, isStudent (Input/Output)
3.  Normalize document name to lowercase trimmed string (Process)
4.  Look up base fee from fee schedule;
    default to 0 if not found (Process)
5.  Decision: Document is Barangay Clearance?
    ├── No  → Return fee amount and reason: standard_fee
    │         (Input/Output) → End (Terminator)
    └── Yes → Normalize isStudent to boolean (Process)
6.  Evaluate purpose for work-related keywords
    (work, job, employment, trabaho, hanapbuhay,
     apply, application) (Process)
7.  Decision: Is student AND purpose is non-work?
    ├── Yes → Return amount: 0,
    │         reason: student_non_work_clearance
    │         (Input/Output) → End (Terminator)
    └── No  → Return amount: 50,
              reason: standard_clearance_fee
              (Input/Output) → End (Terminator)

---

## C3-39) Google Drive Upload Service (uploadPdf) - 35

Start: Upload service called with PDF path and metadata.
End: Drive file metadata returned, or error propagated.

1.  Start (Terminator)
2.  Receive pdfPath, namePrefix, meta (Input/Output)
3.  Ensure Google token is valid via ensureValidToken (Process)

5.  Upload file to Google Drive folder
    via drive.files.create (Data Store)
6.  Decision: Upload call successful?
    ├── No  → Propagate upload error to caller (Input/Output)
    │         → End (Terminator)
    └── Yes → Build request update payload
              (fileId, links, size, uploadedAt, type) (Process)
7.  Decision: meta.requestId present?
    ├── Yes → Update request by MongoDB _id (Data Store) → ○ U2
    └── No  → Decision: meta.referenceNumber present?
                ├── Yes → Update request by referenceNumber
                │         (Data Store) → ○ U2
                └── No  → Log warning: missing request identifier
                          (Input/Output) → ○ U2

○ U2
↓
8.  Create public-read Drive permission
    (role=reader, type=anyone) (Data Store)
9.  Return Drive file metadata
    (id, name, webViewLink, webContentLink, ...) (Input/Output)
    → End (Terminator)

---

## C3-40) PATCH /api/request/hide* — Mobile Hide Request API - 36

Start: Authenticated mobile user hides request from My Requests.
End: Visibility updated or error returned.

1.  Start (Terminator)
2.  Verify access token and resolve userId (Process)
3.  Decision: Authenticated user present?
    ├── No  → Return 401 unauthorized (Input/Output)
    │         → End (Terminator)
    └── Yes → Receive identifier from body/path
              (requestId and/or referenceNumber) (Input/Output)
4.  Decision: Any identifier provided?
    ├── No  → Return 400 identifier required (Input/Output)
    │         → End (Terminator)
    └── Yes → Update matching request with
              {hiddenByUser:true, hiddenAt:now}
              for this userId (Data Store)
5.  Decision: Request found and updated?
    ├── No  → Return 404 request not found (Input/Output)
    │         → End (Terminator)
    └── Yes → Broadcast queue update
              (Predefined Process, ref. C3-20)
6.  Return 200 success with updated request (Input/Output)
    → End (Terminator)

---

## C3-41) PATCH /api/request/unhide* — Mobile Unhide Request API - 37

Start: Authenticated mobile user unhides request.
End: Visibility restored or error returned.

1.  Start (Terminator)
2.  Verify access token and resolve userId (Process)
3.  Decision: Authenticated user present?
    ├── No  → Return 401 unauthorized (Input/Output)
    │         → End (Terminator)
    └── Yes → Receive identifier from body/path
              (requestId and/or referenceNumber) (Input/Output)
4.  Decision: Any identifier provided?
    ├── No  → Return 400 identifier required (Input/Output)
    │         → End (Terminator)
    └── Yes → Update matching request with
              {hiddenByUser:false, hiddenAt:null}
              for this userId (Data Store)
5.  Decision: Request found and updated?
    ├── No  → Return 404 request not found (Input/Output)
    │         → End (Terminator)
    └── Yes → Broadcast queue update
              (Predefined Process, ref. C3-20)
6.  Return 200 success with updated request (Input/Output)
    → End (Terminator)

---

## C3-42) POST /api/auth/push-token — Register Push Token - 38

Start: Authenticated mobile client registers Expo push token.
End: Token saved or error returned.

1.  Start (Terminator)
2.  Verify access token and resolve userId (Process)
3.  Decision: Authenticated user present?
    ├── No  → Return 401 unauthorized (Input/Output)
    │         → End (Terminator)
    └── Yes → Receive {expoPushToken, pushDeviceId}
              payload (Input/Output)
4.  Decision: expoPushToken present and valid format?
    ├── No  → Return 400 invalid or missing token (Input/Output)
    │         → End (Terminator)
    └── Yes → Clear same token/device from other users
              to enforce unique mapping (Data Store)
5.  Update current user push token and device fields (Data Store)
6.  Decision: User update successful?
    ├── No  → Return 404 user not found (Input/Output)
    │         → End (Terminator)
    └── Yes → Return 200 registration success (Input/Output)
              → End (Terminator)

---

## C3-43) DELETE /api/auth/push-token — Remove Push Token - 39

Start: Authenticated mobile client removes Expo push token.
End: Token removed or error returned.

1.  Start (Terminator)
2.  Verify access token and resolve userId (Process)
3.  Decision: Authenticated user present?
    ├── No  → Return 401 unauthorized (Input/Output)
    │         → End (Terminator)
    └── Yes → Unset expoPushToken and expoPushDeviceId
              from user record (Data Store)
4.  Decision: Remove operation successful?
    ├── No  → Return 500 remove-token failure (Input/Output)
    │         → End (Terminator)
    └── Yes → Return 200 remove success (Input/Output)
              → End (Terminator)

---

## C3-44) GET /api/auth/google/mobile — Mobile Google OAuth Init - 40

Start: Mobile app initiates Google OAuth browser flow.
End: Redirect to Google consent page.

1.  Start (Terminator)
2.  Read optional redirectUrl query param (Input/Output)
3.  Decision: Server OAuth credentials configured?
    ├── No  → Return 500 oauth-not-configured (Input/Output)
    │         → End (Terminator)
    └── Yes → Build backend callback URL
              /api/auth/google/mobile/callback (Process)
4.  Encode state with mobile redirect URL (Process)
5.  Build Google OAuth URL // with scopes
    openid email profile (Process)
6.  Redirect to Google authorization page (Input/Output)
    → End (Terminator)

---

## C3-45) GET /api/auth/google/mobile/callback
##         Mobile Google OAuth Callback - 41

Start: Google redirects back with auth result.
End: Redirect to mobile deep link with success or error payload.

1.  Start (Terminator)
2.  Receive callback query {code, error, state} (Input/Output)
3.  Parse state and resolve mobile redirect URL (Process)
4.  Decision: error present OR code missing?
    ├── Yes → Redirect mobile deep link with error params (Input/Output)
    │         → End (Terminator)
    └── No  → Decision: OAuth credentials configured?
                ├── No  → Redirect with oauth-not-configured
                │         error (Input/Output) → End (Terminator)
                └── Yes → Exchange code for Google access
                          token (Process)
5.  Decision: Token exchange succeeded?
    ├── No  → Redirect with token-exchange error (Input/Output)
    │         → End (Terminator)
    └── Yes → Fetch Google user profile (Process)
6.  Decision: User profile fetch succeeded?
    ├── No  → Redirect with user-info error (Input/Output)
    │         → End (Terminator)
    └── Yes → Find or create local user record (Data Store)
7.  Generate access and refresh tokens
    (Predefined Process, ref. C3-47)
8.  Redirect mobile deep link with auth payload (Input/Output)
    → End (Terminator)

---

## C3-46) Push Notification Dispatch Service - Send Push Notification
##         (sendRequestStatusNotification) - 42

Start: Status-change flow requests push notification to a user.
End: Notification sent, skipped, or failure logged without
     breaking caller flow.

1.  Start (Terminator)
2.  Receive {userId, referenceNumber, documentType,
    newStatus, requestId} (Input/Output)
3.  Look up user and push token details (Data Store)
4.  Decision: Valid Expo push token available?
    ├── No  → Skip send and return non-fatal result (Input/Output)
    │         → End (Terminator)
    └── Yes → Build notification payload
              (title, body, data) (Process)
5.  Send push notification via Expo notifications
    endpoint (Input/Output)
6.  Decision: Send request successful?
    ├── No  → Log warning and return non-fatal
    │         failure (Input/Output) → End (Terminator)
    └── Yes → Return success result to caller (Input/Output)
              → End (Terminator)

---

## C3-47) Token Generation Service
##         (tokenManager.generateTokens) - 43

Start: Auth flow needs new access/refresh tokens.
End: Signed token pair returned.

1.  Start (Terminator)
2.  Receive user/session payload for claims (Input/Output)
3.  Build access token claims and expiry window (Process)
4.  Sign access token with JWT secret (Process)
5.  Build refresh token claims and longer expiry (Process)
6.  Sign refresh token with refresh secret (Process)
7.  Return {token/accessToken, refreshToken} (Input/Output)
    → End (Terminator)

---

## C3-48) POST /api/pdf/generate — Generate PDF Endpoint
##         (alias: POST /api/pdf/) - 44

Start: PDF generation endpoint called.
End: Uploaded file metadata or structured error returned.

1.  Start (Terminator)
2.  Receive {type, data} payload (Input/Output)
3.  Generate local temp PDF file
    (Predefined Process, ref. C3-11)
4.  Decision: PDF generation succeeded?
    ├── No  → Return 500 Failed to process document (Input/Output)
    │         → Cleanup temp file (Process) → End (Terminator)
    └── Yes → Create or find request record via
              createRequestIfMissing (Predefined Process)
5.  Decision: Request linkage succeeded?
    ├── No  → Return 500 Failed to create request record (Input/Output)
    │         → Cleanup temp file (Process) → End (Terminator)
    └── Yes → Decision: Drive authenticated?
6.  Decision: Drive authenticated?
    ├── No  → Return 200 {authenticated:false, authUrl, pdfPath}
    │         (Input/Output)
    │         → Cleanup temp file (Process) → End (Terminator)
    └── Yes → Upload PDF to Google Drive
              (Predefined Process, ref. C3-39)
7.  Decision: Upload succeeded?
    ├── No  → Return 500 Drive upload failed (Input/Output)
    │         → Cleanup temp file (Process) → End (Terminator)
    └── Yes → Return 200 {uploaded:true, file} (Input/Output)
              → Cleanup temp file (Process) → End (Terminator)

Note: Cleanup temp file appears on every exit path,
reflecting the finally block in the implementation
which runs unconditionally regardless of outcome.

## C3-49) Status Update Notification Chain
       (updateStatus inline notification block)

Start: Updated request record available, status is not Pending.
End: Notification sent via one tier, or all tiers exhausted
     silently. Caller flow never blocked.

1.  Start (Terminator)

2.  Receive updated request record and status (Input/Output)

3.  Build document label from
    updated.document or updated.documentCode (Process)

4.  Decision: userId present on updated record?
    ├── Yes → Send push notification via userId
    │         (Predefined Process, ref. C3-46)
    │         → Decision: Notification successful?
    │             ├── Yes → ○ N1
    │             └── No  → Log push notification failure
    │                        (Input/Output) → ○ F2
    └── No  → Log no linked userId, attempt fallback (Input/Output)
              → ○ F2

○ F2 [Phone fallback entry]
↓
5.  Decision: contactNumber present on updated record?
    ├── No  → ○ F3
    └── Yes → Resolve phone number variants (Process)
              → Query token-enabled users by
                phone variants (Data Store)

6.  Decision: Exactly one token-enabled match found?
    ├── No  → Log ambiguous or no match (Input/Output) → ○ F3
    └── Yes → Send push notification via phone
              fallback userId
              (Predefined Process, ref. C3-46)
              → Decision: Notification successful?
                  ├── Yes → ○ N1
                  └── No  → Log fallback failure (Input/Output)
                            → ○ F3

○ F3 [Email fallback entry]
↓
7.  Decision: email present on updated record?
    ├── No  → ○ N1
    └── Yes → Normalize email address (Process)
              → Query token-enabled users by
                normalized email (Data Store)

8.  Decision: Exactly one token-enabled match found?
    ├── No  → Log ambiguous or no email match (Input/Output)
    │         → ○ N1
    └── Yes → Send push notification via email
              fallback userId
              (Predefined Process, ref. C3-46)
              → Decision: Notification successful?
                  ├── Yes → ○ N1
                  └── No  → Log email fallback failure
                            (Input/Output) → ○ N1

○ N1 [All tiers exhausted or notification sent]
↓
9.  Return to caller (Terminator)


C3-50) Broadcast Queue Update
       (websocketHandler.broadcastQueueUpdate)

Start: Queue state change triggers broadcast call.
End: All subscribed clients receive updated queue snapshot.

1.  Start (Terminator)
2.  Fetch current queue snapshot
    (Predefined Process, ref. C3-15)
3.  Decision: Active WebSocket subscribers present?
    ├── No  → End (Terminator)
    └── Yes → Send queue snapshot to all
              subscribed clients (Input/Output)
4.  End (Terminator)

---

C3-51) Connect WebSocket and Subscribe to Queue
       (admin dashboard client-side subscription)

Start: Admin dashboard initiates WebSocket connection.
End: Connection established and initial queue snapshot received.

1.  Start (Terminator)
2.  Open WebSocket connection to wss:// server (Input/Output)
3.  Decision: Connection established?
    ├── No  → Log connection error (Input/Output)
    │         → End (Terminator)
    └── Yes → Send subscribe-queue message to server (Input/Output)
4.  Receive initial queue snapshot from server (Input/Output)
5.  Display: Render initial queue state (Display)
    → End (Terminator)

## 8) Cross-reference Matrix

| Macro Step                           | Endpoint Figure         |
|--------------------------------------|-------------------------|
| Kiosk submit request                 | C3-7                    |
| Kiosk e-wallet checkout              | C3-8                    |
| Kiosk / mobile cash payment          | C3-9                    |
| Webhook payment finalization         | C3-10                   |
| PDF generation service               | C3-11                   |
| PDF generation endpoint              | C3-48                   |
| Google Drive upload service          | C3-39                   |
| Print dispatch                       | C3-14                   |
| Queue snapshot                       | C3-15                   |
| WebSocket queue broadcast            | C3-20                   |
| OTP authentication                   | C3-16, C3-17            |
| Mobile Google OAuth redirect         | C3-44, C3-45            |
| Google token verification            | C3-18                   |
| Token refresh                        | C3-19                   |
| Access/refresh token generation      | C3-47                   |
| Admin Drive auth check               | C3-21                   |
| Admin Drive auth init and callback   | C3-22, C3-23            |
| Admin request status update          | C3-12, C3-13            |
| Admin file list and trash            | C3-24, C3-25            |
| Admin file soft delete               | C3-26, C3-27            |
| Admin file restore                   | C3-28, C3-29            |
| Admin permanent delete               | C3-30, C3-31            |
| Admin file download                  | C3-32                   |
| Admin logout and Drive disconnect    | C3-33, C3-34            |
| Kiosk track request                  | C3-35                   |
| Kiosk help video                     | C3-36                   |
| Mobile request details and hide      | C3-37                   |
| Mobile request visibility endpoints  | C3-40, C3-41            |
| Mobile push token lifecycle          | C3-42, C3-43            |
| Push notification dispatch           | C3-46                   |
| Document fee computation             | C3-38                   |

---

## 9) Final Validation Checklist

Before diagram reconstruction in diagrams.net, verify:

1.  Every Decision has exactly one condition with explicit
    Yes and No exit labels.
2.  No process, display, or input/output node has a missing
    outgoing path.
3.  Every off-page connector ID appears exactly once as source
    and once as target. (Expected: none in this package.)
4.  Every on-page connector used as a loop anchor or merge
    point has a clear label (L1, F1, CM, CL, D1, R1, WS,
    WL, PM, S1, EA, T1, T2, U1, U2).
5.  Log output steps use Input/Output symbol, not Process.
6.  External API calls (PayMongo, Google, Expo, TextBee)
    use Input/Output symbol, not Predefined Process.
7.  Predefined Process labels describe the operation name,
    not the route path. Route references belong in the
    figure caption only.
8.  Architecture diagrams C3-4, C3-5, C3-6 are clearly
    marked as non-flowcharts.
9.  Endpoint figure titles match route method and path exactly.
10. C3-48 is listed as the Generate PDF Endpoint and is
    distinct from C3-11 the Generate PDF Service.