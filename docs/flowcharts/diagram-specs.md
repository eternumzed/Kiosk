# Diagram Specifications (Implementation Draft)

This file defines what to draw in each required flowchart.

## 1) System Context Flowchart

Goal: Explain system boundaries and interfaces in one page.

### Symbol Reference (ISO 5807 / ANSI Standard)

| Symbol Name          | Shape Description                        | Used For in This Diagram                         |
|----------------------|------------------------------------------|--------------------------------------------------|
| Input/Output         | Parallelogram (slanted sides)            | Data entry/output in process flowcharts          |
| Display              | Curved-bottom / monitor shape            | Client-facing UIs: Kiosk Client, Mobile App, Admin Dashboard |
| Process              | Plain Rectangle                          | Core services: Backend API                       |
| Data Store           | Open-ended cylinder (two horizontal lines) | Persistent storage: MongoDB                    |
| Predefined Process   | Rectangle with double vertical bars (‖ ‖) | Agent/subroutine: Print Agent                  |
| External Entity      | Rectangle (optionally dashed border)     | Actors/services outside system control           |
| Document             | Rectangle with wavy bottom               | Physical hardware output: Thermal Printer        |
| Flowline             | Solid arrow ( → )                        | Unidirectional data/control flow                 |
| Bidirectional Flow   | Two separate opposite arrows ( → / ← )  | Request + response pairs (never double-headed)   |

---

### Nodes to Include

| Node                    | Symbol               | Rationale                                              |
|-------------------------|----------------------|--------------------------------------------------------|
| Citizen                 | External Entity      | External actor — initiates requests/tracking           |
| Admin                   | External Entity      | External actor — manages and monitors the system       |
| Kiosk Client (Web)      | Display              | Browser UI rendered to the citizen at the terminal     |
| Mobile App              | Display              | Mobile UI for tracking and notifications               |
| Admin Dashboard (Web)   | Display              | Browser UI for queue management and oversight          |
| Backend API             | Process              | Central processing service (Express.js)                |
| MongoDB                 | Data Store           | Persistent document database (cylinder shape)          |
| Paymongo                | External Entity      | Third-party payment gateway outside system boundary    |
| Google Drive            | External Entity      | Third-party file storage outside system boundary       |
| Print Agent             | Predefined Process   | Standalone Node.js agent — acts as a defined subroutine |
| Thermal Printer         | Document             | Physical hardware peripheral — outputs printed document |

---

### Flow Requirements

1. [External Entity] **Citizen** → [Display] **Kiosk Client** / [Display] **Mobile App**
   — Arrow label: `Request details`
2. [Display] **Kiosk Client** / [Display] **Mobile App** → [Process] **Backend API**
   — Arrow label: `Submit request` / `Status query`
3. [Decision @ Process] **Backend API**: `Payment method?`
4. [Cash path] [Process] **Backend API** → [Data Store] **MongoDB**
   — Arrow label: `Store paid request`
5. [Cash path] [Process] **Backend API** → [External Entity] **Google Drive**
   — Arrow label: `Upload PDF`
6. [E-wallet path] [Process] **Backend API** → [Data Store] **MongoDB**
   — Arrow label: `Store pending`
7. [E-wallet path] [Process] **Backend API** → [External Entity] **Paymongo**
   — Arrow label: `Checkout`
8. [E-wallet path] [External Entity] **Paymongo** → [Process] **Backend API**
   — Arrow label: `Webhook callback`
9. [E-wallet path] [Process] **Backend API** → [Data Store] **MongoDB**
   — Arrow label: `Update payment`
10. [E-wallet path] [Process] **Backend API** → [External Entity] **Google Drive**
    — Arrow label: `Upload PDF`
11. [Process] **Backend API** → [Predefined Process] **Print Agent** → [Document] **Thermal Printer**
   — Arrow labels: `Print job` and `ESC/POS command`
12. [Predefined Process] **Print Agent** → [Process] **Backend API**
   — Arrow label: `Print status`
13. [Process] **Backend API** → [Display] **Admin Dashboard**
   — Arrow label: `Realtime updates`
14. [Process] **Backend API** → [Display] **Mobile App**
   — Arrow label: `Status notification`
15. [External Entity] **Admin** → [Display] **Admin Dashboard**
    — Arrow label: `Queue actions`

---

## API Endpoint Reference

Cross-reference of every HTTP endpoint in this system, mapped to its per-endpoint draw-order figure and the macro-flow diagram(s) it also appears in.

| Figure | Method | Endpoint | Controller Function | Also Appears In |
|--------|--------|----------|---------------------|-----------------|
| X.12 | `POST` | `/api/request/create-request` | `requestController.createRequest` | X.2 step 7 |
| X.13 | `POST` | `/api/payment/create-checkout` | `paymentController.createCheckout` | X.2 step 10, X.5 step 5 |
| X.14 | `POST` | `/api/payment/create-cash-payment` | `paymentController.createCashPayment` | X.2 step 9, X.5 step 4 |
| X.15 | `POST` | `/api/payment/handle-webhook` | `paymentController.handleWebhook` | X.2 step 11, X.5 step 7 |
| X.16 | `POST` | `/api/pdf/generate` | `pdfController.generatePdf` | X.2 step 13 |
| X.17 | `PATCH` | `/api/pdf/status/:fileId` | `pdfController.updateStatus` | X.3 step 9, X.6 step 8 |
| X.18 | `POST` | `/api/print/` | `printController.print` | X.6 steps 2–3 |
| X.19 | — | WebSocket `wss://` (path `/`) | `websocketHandler` — agent registration & dispatch | X.6, X.8 |
| X.20 | `GET` | `/api/queue/` | `queueController.getQueueSnapshot` | X.3 step 6 |
| X.21 | `POST` | `/api/auth/request-otp` | `authController.requestOTPPhone` | X.11 left branch |
| X.22 | `POST` | `/api/auth/verify-otp` | `authController.verifyOTPPhone` | X.11 left branch |
| X.23 | `POST` | `/api/auth/google` | `authController.googleAuth` | X.3 step 2, X.11 left branch |
| X.24 | `POST` | `/api/auth/refresh-token` | `authController.refreshToken` | — |
| X.25 | — | Internal service (no HTTP) | `feePolicy.computeDocumentFee` | X.12, X.13, X.14 |

> All REST routes are prefixed `/api` via `backend/routes/index.js`.

---

## 2) Citizen Request Processing Flowchart

Start: Citizen starts transaction.
End: Request completed and document picked up or marked completed.

Required steps:
1. Start (Terminator)
2. Display available documents (Display)
3. Enter request information (Input/Output)
4. Validate form fields (Process)
5. Decision: Valid input?
6. If No -> Display validation errors -> return to input
7. If Yes -> Submit request to backend (Process)
8. Decision: Payment method?
9. Cash branch -> Record cash payment (Process)
10. E-wallet branch -> Redirect to gateway (Display) -> wait for webhook (Off-page connector if split)
11. Update payment status (Process)
12. Generate PDF (Predefined process)
13. Upload PDF to Drive (Predefined process)
14. Queue print job (Process)
15. Decision: Print success?
16. If No -> Flag for reprint/manual handling (Process)
17. If Yes -> Update request status (Process)
18. Display reference and pickup info (Display)
19. End (Terminator)

## 3) Admin Operations Flowchart

Start: Admin signs in.
End: Request is finalized.

Required steps:
1. Start (Terminator)
2. Enter credentials/OAuth (Input/Output)
3. Authenticate admin (Process)
4. Decision: Auth success?
5. If No -> Display auth error -> End or retry connector
6. If Yes -> Load queue dashboard (Display)
7. Review pending requests (Process)
8. Decision: Requires intervention?
9. If Yes -> Correct metadata/status/payment/print action (Process)
10. Monitor print queue (Display)
11. Decision: Job printed?
12. If No -> Requeue/diagnose print job (Process)
13. If Yes -> Mark request completed (Process)
14. End (Terminator)

## 4) Request Lifecycle State Flowchart

States (use process boxes with explicit state labels):
1. Pending
2. Processing
3. For Pickup
4. Completed
5. Failed (optional if used in implementation)
6. Cancelled (optional if used in implementation)

Transitions (label each arrow):
- Pending -> Processing (payment verified or request accepted)
- Processing -> For Pickup (pdf generated and print completed)
- For Pickup -> Completed (document claimed/closed by admin)
- Processing -> Failed (generation or print failure)
- Pending -> Cancelled (timeout/manual cancellation)

## 5) Payment Integration Flowchart

Start: Payment required.
End: Payment status persisted.

Required branches:
1. Select payment method (Input/Output)
2. Decision: Cash or E-wallet?
3. Cash -> Record payment -> Mark paid
4. E-wallet -> Create gateway checkout -> User pays -> Receive webhook -> Verify signature -> Update payment status
5. Decision: Payment confirmed?
6. If No -> Mark unpaid/failed and notify
7. If Yes -> Continue processing

## 6) Print Integration Flowchart

Start: Document ready for printing.
End: Print result recorded and user/admin notified.

Required sequence-like flow in chart symbols:
1. Backend creates print job (Process)
2. Send to print agent via socket/channel (Process)
3. Print agent formats command for thermal printer (Predefined process)
4. Printer executes job (Document/Process as appropriate)
5. Decision: Printer success response?
6. If No -> Retry or escalate to admin queue
7. If Yes -> Update request status and notify stakeholders

## Connector and Pagination Rules

1. If a diagram exceeds one page, break at logical boundaries.
2. Use off-page connector IDs (`A1`, `A2`, etc.) with explicit target page label.
3. Keep one connector pair per continuation path to avoid ambiguity.

## 7) Draw-Order Script: System Context (Figure X.1)

Use this as an exact build order in Draw.io or Visio.

Canvas setup:
1. Page size: A3 landscape (or 16:9 slide if for defense deck).
2. Grid: on.
3. Snap: on.
4. Suggested spacing: 180 to 240 px between major nodes.

Step-by-step placement:
1. Place one central Process rectangle labeled `Backend API`.
2. Place Data Store cylinder labeled `MongoDB` above-right of `Backend API`.
3. Place External Entity rectangle labeled `Paymongo` on the right side.
4. Place External Entity rectangle labeled `Google Drive` below-right of `Backend API`.
5. Place Predefined Process box labeled `Print Agent` below `Backend API`.
6. Place Document/Process box labeled `Thermal Printer` below `Print Agent`.
7. Place Display symbol labeled `Kiosk Client (Web)` on left-middle.
8. Place Display symbol labeled `Mobile App` on left-bottom.
9. Place Display symbol labeled `Admin Dashboard (Web)` on left-top.
10. Place External Entity symbol labeled `Citizen` far-left (between kiosk and mobile vertically).
11. Place External Entity symbol labeled `Admin` far-left aligned with admin dashboard.

Flowline wiring order:
1. `Citizen` -> `Kiosk Client (Web)` with label `Request details`.
2. `Citizen` -> `Mobile App` with label `Track request`.
3. `Admin` -> `Admin Dashboard (Web)` with label `Queue actions`.
4. `Kiosk Client (Web)` -> `Backend API` with label `Submit request`.
5. `Mobile App` -> `Backend API` with label `Status/query`.
6. `Admin Dashboard (Web)` -> `Backend API` with label `Manage queue`.
7. `Backend API` -> `MongoDB` with label `Store paid request` (cash path).
8. `Backend API` -> `Google Drive` with label `Upload PDF` (cash path).
9. `Backend API` -> `MongoDB` with label `Store pending` (e-wallet path).
10. `Backend API` -> `Paymongo` with label `Checkout` (e-wallet path).
11. `Paymongo` -> `Backend API` with label `Webhook callback` (e-wallet path).
12. `Backend API` -> `MongoDB` with label `Update payment` (e-wallet path).
13. `Backend API` -> `Google Drive` with label `Upload PDF` (e-wallet path).
14. `Backend API` -> `Print Agent` with label `Print job`.
15. `Print Agent` -> `Thermal Printer` with label `ESC/POS command`.
16. `Print Agent` -> `Backend API` with label `Print status`.
17. `Backend API` -> `Admin Dashboard (Web)` with label `Realtime updates`.
18. `Backend API` -> `Mobile App` with label `Status notification`.

Labeling and style constraints:
1. Keep all labels 1 to 3 words, except `Webhook callback`.
2. Use consistent arrowheads and line thickness.
3. Keep bidirectional links as two separate arrows, not a single double-headed arrow.
4. Avoid crossing lines by rerouting with elbow connectors.
5. If crossings are unavoidable, break the path with on-page connectors (`A`, `B`, etc.).

Quick validation before export:
1. All displays use display symbol (not rectangle).
2. All actors (`Citizen`, `Admin`) are not shown as process boxes.
3. Database is cylinder.
4. Central node has highest in/out degree (`Backend API`).
5. Export as SVG for manuscript and PNG (300 dpi) for slide deck.

## 8) Draw-Order Script: Citizen Request Processing (Figure X.2)

Layout model: top-to-bottom with one right-side branch for invalid input and one split branch for payment method.

Build order:
1. Terminator `Start`.
2. Display `Show document list`.
3. Input/Output `Enter request data`.
4. Process `Validate fields`.
5. Decision `Valid input?`.
6. Right-side Display `Show validation errors`.
7. Process `Submit request`.
   — Endpoint: `POST /api/request/create-request` → see Figure X.12
8. Decision `Payment method?`.
9. Left branch Process `Record cash payment`.
   — Endpoint: `POST /api/payment/create-cash-payment` → see Figure X.14
10. Right branch Display `Open E-wallet checkout`.
    — Endpoint: `POST /api/payment/create-checkout` → see Figure X.13
11. Off-page connector `A1` for webhook wait (if split page).
    — Endpoint: `POST /api/payment/handle-webhook` → see Figure X.15
12. Process `Update payment status`.
13. Predefined Process `Generate PDF`.
    — Endpoint: `POST /api/pdf/generate` → see Figure X.16
14. Predefined Process `Upload to Drive`.
    — (Invoked inside Figure X.16 — no separate HTTP call)
15. Process `Queue print job`.
    — Endpoint: `POST /api/print/` → see Figure X.18
16. Decision `Print success?`.
17. Left Process `Flag reprint/manual`.
18. Right Process `Update request status`.
    — Endpoint: `PATCH /api/pdf/status/:fileId` → see Figure X.17
19. Display `Show reference and pickup info`.
20. Terminator `End`.

Connection rules:
1. `Valid input?` No -> `Show validation errors` -> back to `Enter request data`.
2. `Payment method?` Cash and E-wallet branches must rejoin at `Update payment status`.
3. `Print success?` No branch ends at `Flag reprint/manual` then to End or admin handoff connector.
4. Keep rejoin points explicit; do not merge arrows without junction clarity.

## 9) Draw-Order Script: Admin Operations (Figure X.3)

Layout model: linear main path with one auth-failure branch and one print-failure branch.

Build order:
1. Terminator `Start`.
2. Input/Output `Enter credentials/OAuth`.
   — Endpoint: `POST /api/auth/google` → see Figure X.23
3. Process `Authenticate admin`.
4. Decision `Auth success?`.
5. Right Display `Show auth error`.
6. Display `Load queue dashboard`.
   — Endpoint: `GET /api/queue/` → see Figure X.20
7. Process `Review pending requests`.
8. Decision `Needs intervention?`.
9. Right Process `Correct status/payment/print`.
   — Endpoint: `PATCH /api/pdf/status/:fileId` → see Figure X.17
10. Display `Monitor print queue`.
    — Live updates via WebSocket subscription → see Figure X.19
11. Decision `Job printed?`.
12. Left Process `Requeue or diagnose`.
13. Process `Mark request completed`.
    — Endpoint: `PATCH /api/pdf/status/:fileId` (status: "Completed") → see Figure X.17
14. Terminator `End`.

Connection rules:
1. `Auth success?` No -> `Show auth error` -> End or retry connector (`R1`).
2. `Needs intervention?` Yes -> `Correct status/payment/print` -> `Monitor print queue`.
3. `Job printed?` No -> `Requeue or diagnose` -> back to `Monitor print queue`.

## 10) Draw-Order Script: Request Lifecycle (Figure X.4)

Layout model: left-to-right state progression with downward exception branches.

Build order:
1. Process `Pending`.
2. Process `Processing` to the right.
3. Process `For Pickup` to the right.
4. Process `Completed` to the right.
5. Process `Failed` below `Processing`.
6. Process `Cancelled` below `Pending`.

Arrow labels:
1. `Pending` -> `Processing`: `Payment verified`.
2. `Processing` -> `For Pickup`: `PDF + print done`.
3. `For Pickup` -> `Completed`: `Claim confirmed`.
4. `Processing` -> `Failed`: `Generation/print error`.
5. `Pending` -> `Cancelled`: `Timeout/manual cancel`.

## 11) Draw-Order Script: Payment Integration (Figure X.5)

Layout model: one decision split (Cash vs E-wallet) with reconciliation decision at the end.

Build order:
1. Terminator `Start`.
2. Input/Output `Select payment method`.
3. Decision `Cash or E-wallet?`.
4. Left Process `Record cash payment`.
   — Endpoint: `POST /api/payment/create-cash-payment` → see Figure X.14
5. Right Process `Create checkout session`.
   — Endpoint: `POST /api/payment/create-checkout` → see Figure X.13
6. Right Display `User completes payment`.
7. Right Input/Output `Receive webhook callback`.
   — Endpoint: `POST /api/payment/handle-webhook` → see Figure X.15
8. Right Process `Verify callback signature`.
9. Process `Update payment status` (rejoin point).
10. Decision `Payment confirmed?`.
11. Left Process `Mark unpaid/failed`.
12. Right Process `Continue request processing`.
13. Terminator `End`.

## 12) Draw-Order Script: Print Integration (Figure X.6)

Layout model: vertical processing pipeline with one retry branch.

Build order:
1. Terminator `Start`.
2. Process `Create print job`.
   — Endpoint: `POST /api/print/` → see Figure X.18
3. Process `Send to print agent`.
   — Protocol: WebSocket (not HTTP) → see Figure X.19
4. Predefined Process `Format ESC/POS command`.
5. Process `Execute printer job`.
6. Decision `Printer success?`.
7. Left Process `Retry/escalate to admin`.
8. Right Process `Update request status`.
   — Endpoint: `PATCH /api/pdf/status/:fileId` → see Figure X.17
9. Display `Notify admin/citizen`.
   — Protocol: WebSocket broadcast (queueClients push) → see Figure X.19
10. Terminator `End`.

Connection rules:
1. Failure branch can loop once to `Send to print agent` or terminate to admin escalation connector (`P1`).
2. Success branch must pass through status update before notification.

## 13) Draw-Order Script: Deployment Architecture (Figure X.7)

This is NOT a flowchart—it's an infrastructure/network diagram. Use boxes and connectors, not flowchart symbols.

Layout model: Left-to-right showing physical locations and network paths.

Build order:
1. **Left (Physical Kiosk):** Rectangle `Kiosk Terminal (Barangay Hall)` with interior boxes `Touch Display` and `XP-58 Printer` labeled with USB connectors
2. **Center:** Rectangle `Internet / Local Network (Ethernet/WiFi)`
3. **Right (Backend):** Rectangle `Backend Server (VPS/Cloud)` with interior: `Express.js API`, `MongoDB`, `Services`
4. **External Services:** External Entity rectangles for `Paymongo`, `Google Drive`, `Admin Dashboard`
5. **Main connections:** Kiosk → Network (HTTP/WebSocket), Network → Backend (API), Backend ↔ Paymongo (OAuth/Webhook), Backend ↔ Drive (API), Printer → USB

Protocol labels on all arrows: HTTP, WebSocket, USB, OAuth, Webhook, ESC/POS.

---

## 14) Draw-Order Script: Hardware-Software Interface (Figure X.8)

Emphasizes **Computer Engineering**: physical-digital boundary with three swimlanes.

Layout model: Vertical swimlanes (Hardware | Driver/Middleware | Software Backend).

Build order:
- **Lane 1 (Hardware):** Touch Display, XP-58 Printer, Network Interface
- **Lane 2 (Driver/Protocol):** USB Driver, ESC/POS Formatter, WebSocket Client, HTTP Handler
- **Lane 3 (Backend):** Kiosk Client (React), Print Agent (Node.js), Backend API, MongoDB

Cross-lane arrows showing interaction:
1. Touch Display → Kiosk Client: `Touch events (x,y)`
2. Kiosk Client → WebSocket Client: `Form data (JSON)`
3. WebSocket Client → Backend API: `WebSocket upgrade`
4. Backend API → Print Agent: `Job object (socket)`
5. Print Agent → ESC/POS Formatter: `PDF + settings`
6. ESC/POS Formatter → USB Driver: `Command bytes`
7. USB Driver → XP-58 Printer: `USB endpoint`
8. XP-58 Printer → USB Driver: `Status response`
9. USB Driver → Print Agent: `Success/failure`
10. Print Agent → Backend API: `Status callback`
11. Backend API → MongoDB: `Update status`
12. Backend API → Kiosk Client: `Status update (WebSocket)`

Label all arrows with protocols/data formats: JSON, USB, bytes, socket, etc.

---

## 15) Draw-Order Script: Data Flow Diagram L0 + L1 (Figure X.9)

Standard DFD notation—non-software panelists understand it easily.

**Part A: DFD Level 0 (Context)**

External entities (rectangles):
- Citizen (top-left)
- Admin (top-right)
- Paymongo (bottom-right)
- Google Drive (bottom-right)

Central process (large circle):
- (0) Kiosk System

Data flows:
1. Citizen → System: `Request (name, doc type, contact)`
2. System → Citizen: `Reference, status, PDF preview`
3. Admin → System: `Queue command`
4. System → Admin: `Queue status`
5. System ↔ Paymongo: `Checkout / webhook`
6. System ↔ Google Drive: `Upload / retrieve PDF`

Optional data store (parallel lines): [D1] MongoDB

**Part B: DFD Level 1 (Decomposition)**

Processes (circles, numbered):
1. (1) Validate Request
2. (2) Process Payment
3. (3) Generate Document
4. (4) Queue Print Job
5. (5) Update Status
6. (6) Notify Stakeholders

Data stores (parallel lines):
- [D1] MongoDB (requests, payments, users)
- [D2] Google Drive (PDFs)
- [D3] Cache (optional: sessions, queue)

Data flows (labeled by data type, not action):
1. Citizen → (1): `Request data`
2. (1) → [D1]: `Store request`
3. (1) → (2): `Validated request`
4. (2) → Paymongo: `Checkout session`
5. Paymongo → (2): `Webhook callback`
6. (2) → [D1]: `Store payment record`
7. (2) → (3): `Approved request`
8. (3) → [D2]: `Upload PDF`
9. (3) → (4): `PDF metadata`
10. (4) → (5): `Print job result`
11. (5) → [D1]: `Update status`
12. (5) → (6): `Status ready`
13. (6) → Citizen: `Notification`
14. (6) → Admin: `Queue update`

DFD rules:
- Every process has inputs and outputs
- Data stores only connect to processes
- Labels describe data, not actions
- Follow left-to-right and top-to-bottom flow

---

## 16) Draw-Order Script: Error Handling & Recovery (Figure X.10)

Strict flowchart symbols. Focus: exception paths and admin escalation.

Build order (main success path center-right, failures right):
1. Terminator `Start`
2. Process `Call payment gateway`
3. Decision `Gateway responds?`
4. Left branch: Process `Log timeout`, Process `Queue for manual review`, Display `Notify citizen: delayed`
5. Right (Yes): Decision `Payment confirmed?`
6. Left (No): Process `Mark payment failed`, Display `Notify citizen: insufficient funds`
7. Right (Yes): Process `Proceed to PDF generation`
8. Decision `PDF generation succeeds?`
9. Left (No): Process `Log error`, Process `Flag for admin`, Display `Notify admin`
10. Right (Yes): Process `Queue print job`
11. Decision `Print succeeds?`
12. Left (No): Process `Retry once`, Decision `Retry succeeds?`
13. Left (No): Off-page connector `E1`, Display `Notify admin: printer error`
14. Right (Yes): Process `Mark completed`, Display `Notify citizen: ready for pickup`
15. Terminator `End`

Connection rules:
- Failure branches either: retry (with limits), escalate to admin via off-page connector, or notify citizen and block
- All off-page escalations reference admin operations (Figure X.3)
- Success path is rightmost

---

## 17) Draw-Order Script: Authentication & Security Flow (Figure X.11)

Two parallel branches (Admin auth + Payment security) merging at validation success.

**Left Branch: Admin Authentication**
1. Terminator `Start`
2. Input/Output `Admin enters credentials/OAuth`
3. Process `Send over HTTPS/TLS`
4. Decision `HTTPS/TLS active?`
5. Left (No): Process `Reject: insecure connection`
6. Right (Yes): Process `Hash password (bcrypt/Argon2)`
7. Process `Compare with MongoDB hash`
8. Decision `Match?`
9. Left (No): Display `Invalid credentials error`
10. Right (Yes): Process `Generate JWT token`
11. Display `Return token to client`

**Right Branch: Payment Webhook Security**
1. Input/Output `Paymongo sends webhook`
2. Process `Extract HMAC signature`
3. Process `Compute HMAC-SHA256 with secret`
4. Decision `Signature valid?`
5. Left (No): Process `Log mismatch`, Display `Reject webhook`
6. Right (Yes): Process `Verify timestamp`
7. Decision `Timestamp within 5 min?`
8. Left (No): Process `Reject (replay attack)`
9. Right (Yes): Process `Mark payment confirmed`

**Merge**
1. Both branches → Process `Proceed with authorized action`
2. Terminator `End`

Security labels:
- All crypto ops: HMAC-SHA256, bcrypt, JWT, TLS 1.3
- All validations: "Signature valid?", "Timestamp within window?"
- All rejections with reason

---

## 18) Draw-Order Script: Create Request (Figure X.12)

**Endpoint:** `POST /api/request/create-request` | **Controller:** `requestController.js`

Layout model: top-to-bottom main path; fee computation and reference number construction shown as predefined-process sub-steps; ends with internal checkout call.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Receive body: fullName, email, contactNumber, address, document, returnUrl, cancelUrl, userId, templateFields`
3. [Process] `Resolve userId — JWT Bearer token present? decode and use; else use body userId`
4. [Predefined Process] `computeDocumentFee(document, purpose, isStudent)` — see Figure X.25
5. [Decision] `isStudent = true AND purpose NOT work-related?`
   - Yes → `amount = 0`
   - No → `amount = baseFee from fee policy map`
6. [Data Store] Query MongoDB: `Counter.findOneAndUpdate({name:"requestCounter", year}, {$inc:{seq:1}}, {upsert:true})`
7. [Predefined Process] `getDocCode(document)` — returns template code (e.g., "BRGY-CLR")
8. [Process] `Build referenceNumber: "${docCode}-${year}-${String(seq).padStart(4,'0')}"`
9. [Data Store] Write MongoDB: `new Request({fullName, document, contactNumber, email, address, amount, status:"Pending", referenceNumber, userId, ...templateFields}).save()`
10. [Predefined Process] `axios.POST /api/payment/create-checkout` (internal HTTP call) — see Figure X.13
11. [Decision] `Internal checkout call succeeded?`
    - Yes → return 200 with Paymongo checkout session attributes
    - No → return 500 with error message
12. [Terminator] `End`

Error paths:
- Missing required fields → 400 before step 3
- Counter upsert fails → 500 at step 6
- Request save fails → 500 at step 9
- Paymongo axios fails → 500 at step 10

---

## 19) Draw-Order Script: Create Checkout Session (Figure X.13)

**Endpoint:** `POST /api/payment/create-checkout` | **Controller:** `paymentController.js`

Layout model: top-to-bottom; URL resolution mini-branch (two decisions); single Paymongo external call at base.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Receive body: newRequest (fullName, email, contactNumber, document, amount, referenceNumber, returnUrl, cancelUrl)`
3. [Predefined Process] `computeDocumentFee(document, purpose, isStudent)` — see Figure X.25; overwrite amount
4. [Decision] `returnUrl provided?`
   - Yes → `successUrl = "${returnUrl}/confirmation?referenceNumber=${refNum}"`
   - No → `successUrl = "${KIOSK_URL}/confirmation?referenceNumber=${refNum}"`
5. [Decision] `cancelUrl provided?`
   - Yes → use provided value
   - No → `cancelUrl = "${KIOSK_URL}/payment"`
6. [Process] `Convert to centavos: amountCentavos = amount × 100`
7. [Process] `Encode Basic auth: Base64("${PAYMONGO_SECRET_KEY}:")`
8. [External Entity] `POST https://api.paymongo.com/v1/checkout_sessions`
   — Body: `{line_items:[{name:document, amount:amountCentavos, currency:"PHP", quantity:1}], payment_method_types:[e_wallet_methods...], billing:{name, email, phone}, reference_number:refNum, send_email_receipt:true, success_url, cancel_url}`
   — Header: `Authorization: Basic ${encodedKey}`
9. [Decision] `Paymongo response 2xx?`
   - Yes → return 200 with `data.attributes`
   - No → return 500 with `error.response.data`
10. [Terminator] `End`

---

## 20) Draw-Order Script: Create Cash Payment (Figure X.14)

**Endpoint:** `POST /api/payment/create-cash-payment` | **Controller:** `paymentController.js`

Layout model: top-to-bottom; `isFreeRequest` decision splits initial status assignment; PDF generation and Drive upload sub-path follow DB write.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Receive body: fullName, email, contactNumber, address, document, userId, templateFields`
3. [Process] `Resolve userId from JWT Bearer OR body`
4. [Predefined Process] `computeDocumentFee(document, purpose, isStudent)` — see Figure X.25
5. [Decision] `amount = 0? (isFreeRequest)`
   - Yes → `isFreeRequest = true`
   - No → `isFreeRequest = false`
6. [Data Store] MongoDB: `Counter.findOneAndUpdate({name:"requestCounter", year}, {$inc:{seq:1}}, {upsert:true})`
7. [Predefined Process] `getDocCode(document)` → templateCode
8. [Process] `Build referenceNumber: "${docCode}-${year}-${seq padded 4 digits}"`
9. [Process] `paidAt = current Manila timezone datetime`
10. [Decision] `isFreeRequest?`
    - Yes → `status="Processing"`, `paymentStatus="Paid"`, `paymentMethod="Free"`
    - No → `status="Pending"`, `paymentStatus="Pending"`, `paymentMethod="Cash"`
11. [Data Store] Write MongoDB: `new Request({...all fields, status, paymentStatus, paymentMethod, paidAt}).save()`
12. [Predefined Process] `pdfService({templateKey, rawData: request.toObject()})` — generate PDF
13. [Decision] `PDF generated successfully?`
    - No → log error; skip Drive upload; go to step 17
    - Yes → continue
14. [Decision] `Auth.isAuthenticated()? (Google Drive)`
    - No → log warning; leave file for PM2 daemon cleanup; go to step 17
    - Yes → continue
15. [Predefined Process] `drive.uploadPdf(pdfPath, referenceNumber, {type, referenceNumber, requestId})`
16. [Decision] `Upload success?`
    - Yes → `fs.unlinkSync(pdfPath)` (delete temp file)
    - No → log error; leave file for daemon
17. [Process] `Return 200: {success:true, referenceNumber, status, paymentStatus, paymentMethod, message}`
18. [Terminator] `End`

Error paths:
- DB save fails → 500 (does not reach PDF generation)
- PDF or upload failure → non-blocking; response still succeeds

---

## 21) Draw-Order Script: Handle Payment Webhook (Figure X.15)

**Endpoint:** `POST /api/payment/handle-webhook` | **Controller:** `paymentController.js`

Layout model: top-to-bottom; ALL error branches return 200 (Paymongo requirement). Main success path runs center.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Receive Paymongo webhook body: {data:{attributes:{type, data:{attributes:{reference_number, payment_method_type}}}}}`
3. [Decision] `event.type = "checkout_session.payment.paid"?`
   - No → return 200 (unknown event type; ignore)
   - Yes → continue
4. [Process] `Extract: refNum = reference_number; rawMethod = payment_method_type`
5. [Process] `Map provider method code to label: e-wallet providers→"E-wallet", card→"Credit/Debit Card", etc.`
6. [Process] `paidAt = current Manila timezone datetime`
7. [Data Store] MongoDB: `Request.findOneAndUpdate({referenceNumber:refNum}, {$set:{status:"Processing", paymentStatus:"Paid", paymentMethod:label, paidAt}}, {new:true})`
8. [Decision] `updatedRequest found?`
   - No → log warning; return 200
   - Yes → continue
9. [Decision] `updatedRequest.userId exists?`
   - Yes → [Process] `PushNotificationService.sendRequestStatusNotification(userId, refNum, document, "Processing", requestId)` *(non-blocking — errors caught silently)*
   - No → skip
10. [Process] `websocketHandler.broadcastQueueUpdate()` — fan-out to all queue WebSocket subscribers
11. [Predefined Process] `getDocCode(document)` → templateKey
12. [Predefined Process] `pdfService({templateKey, rawData: updatedRequest.toObject()})` — generate PDF
13. [Decision] `PDF generation success?`
    - No → log error; return 200 *(webhook must always return 200)*
    - Yes → set pdfPath
14. [Decision] `Auth.isAuthenticated()? (Google Drive)`
    - No → log warning; skip upload; file cleaned by PM2 daemon; return 200
    - Yes → continue
15. [Predefined Process] `drive.uploadPdf(pdfPath, referenceNumber, {type, referenceNumber, requestId})`
16. [Decision] `Upload success?`
    - Yes → `fs.unlinkSync(pdfPath)` (cleanup temp file)
    - No → log error; leave file for daemon
17. [Process] `Return 200 OK`
18. [Terminator] `End`

Critical rule: Draw a bordered note on the diagram — *"All branches must terminate at step 17 (return 200). Paymongo retries delivery until it receives 200."*

---

## 22) Draw-Order Script: Generate PDF (Figure X.16)

**Endpoint:** `POST /api/pdf/generate` | **Controller:** `pdfController.js`

Layout model: top-to-bottom; Drive auth branch exits right; FINALLY block drawn with dashed border below main flow, feeding into response decision.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Receive body: type (template key), data (request data object)`
3. [Process] `Initialize: pdfPath=null, uploaded=null, errorToReturn=null`
4. [Predefined Process] `pdfService({templateKey:type, rawData:data})` — render PDF to tmp path
5. [Decision] `PDF generation success?`
   - No → `errorToReturn={status:500, error}`; jump to FINALLY (step 11)
   - Yes → `pdfPath = result.path`
6. [Predefined Process] `requestService.createRequestIfMissing(data)` — find by referenceNumber or create new Request in MongoDB
7. [Process] `namePrefix = request.referenceNumber; requestId = request._id`
8. [Decision] `Auth.isAuthenticated()? (Google Drive)`
   - No → `errorToReturn={status:200, authenticated:false, authUrl}`; jump to FINALLY (step 11)
   - Yes → continue
9. [Predefined Process] `drive.uploadPdf(pdfPath, namePrefix, {type, referenceNumber, requestId})`
10. [Decision] `Upload success?`
    - Yes → `uploaded = result`
    - No → `errorToReturn={status:500, error}`
11. [Process] `FINALLY (always runs): if pdfPath && fs.existsSync(pdfPath) → fs.unlinkSync(pdfPath)` *(dashed-border box — guaranteed cleanup)*
12. [Decision] `uploaded set?`
    - Yes → return 200 `{uploaded:true, file:uploaded}`
    - No → return `errorToReturn.status` with error body
13. [Terminator] `End`

Symbol note: Step 11 uses a Process box with dashed border and annotation "Always executes (finally)".

---

## 23) Draw-Order Script: Update Request Status (Figure X.17)

**Endpoint:** `PATCH /api/pdf/status/:fileId` | **Controller:** `pdfController.js`

Layout model: top-to-bottom; admin auth gate first; three-tier identifier resolution in the middle; WebSocket broadcast at the end.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Receive params: fileId OR referenceNumber; body: status`
3. [Process] `auth.isAdminLoggedIn()` — verify Google admin session
4. [Decision] `Admin authenticated?`
   - No → return 401 Unauthorized
   - Yes → continue
5. [Process] `identifier = params.fileId OR params.referenceNumber`
6. [Decision] `Any identifier present?`
   - No → return 400 "identifier required"
   - Yes → continue
7. [Process] `Validate: status ∈ ["Pending","Processing","For Pick-up","Completed","Cancelled"]`
8. [Decision] `Status valid?`
   - No → return 400 "Invalid status value"
   - Yes → continue
9. [Data Store] MongoDB attempt 1: `Request.findOneAndUpdate({_id:identifier}, {status}, {new:true})`
10. [Decision] `Found by fileId (_id)?`
    - Yes → go to step 13
    - No → continue
11. [Data Store] MongoDB attempt 2: `Request.findOneAndUpdate({referenceNumber:identifier}, {status}, {new:true})`
12. [Decision] `Found by referenceNumber?`
    - Yes → go to step 13
   - No → [External Entity] Query Google Drive — get file metadata; extract referenceNumber from filename; retry findOneAndUpdate by resolved referenceNumber
13. [Decision] `Request found and updated?`
    - No → return 500 "Request not found"
    - Yes → continue
14. [Process] `websocketHandler.broadcastQueueUpdate()` — notify all queue WebSocket subscribers
15. [Process] `Return 200 with updated request document`
16. [Terminator] `End`

---

## 24) Draw-Order Script: Print Dispatch (Figure X.18)

**Endpoint:** `POST /api/print/` | **Controller:** `printController.js`

Layout model: single platform decision splits into two parallel vertical branches (Linux left, Windows right); both converge at End.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Receive body: {referenceNumber, fullName, document, amount, paymentMethod, ...receipt fields}`
3. [Decision] `Runtime platform = Linux (VPS)?`

**Left branch (Linux / VPS deployment):**
4a. [Process] `websocketHandler.isPrintAgentAvailable()` — checks `printAgents.size > 0` and at least one ws.isAuthenticated
5a. [Decision] `Print agent connected?`
    - No → return 503 "No print agent connected"
    - Yes → continue
6a. [Process] `jobId = crypto.randomUUID(); pendingJobs.set(jobId, resolveCallback)`
6b. [Process] `Send {type:"print-job", jobId, data:req.body}` over WebSocket to first authenticated agent
7a. [Decision] `result.success?` (async wait for "print-result" message callback)
    - Yes → return 200 "Receipt sent to printer"
    - No → return 500 with error from agent

**Right branch (Windows / local kiosk):**
4b. [Predefined Process] `choosePrinter()` — scan installed printers; match thermal printer by name pattern or use default
5b. [Decision] `Thermal printer found?`
    - No → return 500 "No thermal printer found"
    - Yes → continue
6c. [Predefined Process] `buildPayload(req.body)` — construct ESC/POS byte sequence: header, referenceNumber, document, amount, QR code (tracking URL), footer cut command
7b. [Predefined Process] `sendToPrinter(printer, payload)` — invoke PowerShell to send raw bytes to printer USB port
8b. [Decision] `PowerShell result.ok?`
    - Yes → return 200 "Receipt sent"
    - No → return 500 with stderr output

9. [Terminator] `End`

Catch: any unhandled exception in either branch → 500 with error.message.

---

## 25) Draw-Order Script: WebSocket Agent Registration & Print Dispatch (Figure X.19)

**Protocol:** WebSocket `wss://` (path `/`) | **Service:** `websocketHandler.js`

Layout model: three stacked phases — Connection/Registration (top), Print Job Dispatch (middle), Queue Broadcast (bottom). Heartbeat shown in right margin annotation.

**Phase 1 — Connection & Registration:**
1. [Terminator] `Start (incoming WebSocket upgrade request)`
2. [Input/Output] `Connection headers: x-agent-type, x-agent-secret`
3. [Process] `Set: ws.isAuthenticated=false; ws.isAlive=true; register event listeners (message, close, error, pong)`
4. [Input/Output] `Receive message: {type:"register", agentSecret, capabilities:[]}`
5. [Decision] `agentSecret matches AGENT_SECRET?`
   - No → send `{type:"error", message:"Invalid agent secret"}`; ws.close(4001)
   - Yes → continue
6. [Process] `agentId = crypto.randomBytes(8).toString("hex")`
7. [Process] `ws.isAuthenticated=true; printAgents.set(agentId, ws)`
8. [Process] `Send {type:"registered", agentId}` back to print agent

**Phase 2 — Print Job Dispatch:**
9. [Input/Output] `sendPrintJob(jobData) called by POST /api/print/`
10. [Process] `jobId = crypto.randomUUID(); jobData.jobId = jobId`
11. [Process] `pendingJobs.set(jobId, resolveCallback)`
12. [Process] `Select first authenticated agent from printAgents Map`
13. [Decision] `agent ws.readyState = OPEN?`
    - No → resolveCallback({success:false, error:"Agent unavailable"})
    - Yes → `agent.send({type:"print-job", jobId, data:jobData})`
14. [Input/Output] `Receive from agent: {type:"print-result", jobId, success, error}`
15. [Process] `callback = pendingJobs.get(jobId); callback(success, error); pendingJobs.delete(jobId)`
16. [Process] `Return result to POST /api/print/ HTTP caller`

**Phase 3 — Queue Broadcast:**
17. [Input/Output] `broadcastQueueUpdate() called` (triggered by webhook handler or status update)
18. [Decision] `queueClients.size > 0?`
    - No → return (no-op)
    - Yes → continue
19. [Predefined Process] `queueService.getQueueSnapshot()` — DB query; split into nowServing / forPickup
20. [Process] `For each ws in queueClients: if ws.readyState=OPEN → ws.send({type:"queue-update", payload:snapshot})`

**Heartbeat (right margin annotation):**
- Timer: every 30 seconds — ping all `wss.clients`
- If `ws.isAlive=false` at ping time → `ws.terminate()` (dead connection cleanup)
- On `pong` received → `ws.isAlive=true`

---

## 26) Draw-Order Script: Get Queue Snapshot (Figure X.20)

**Endpoint:** `GET /api/queue/` | **Controller:** `queueController.js` + `queueService.js`

Layout model: short linear flow — DB query, map, split, return.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Receive GET /api/queue/ (no body or query params)`
3. [Data Store] MongoDB: `Request.find({deleted:{$ne:true}, status:{$in:["Processing","For Pick-up"]}}).sort({createdAt:1, _id:1}).select("referenceNumber document type fullName status updatedAt createdAt")`
4. [Process] `Map each result to: {_id, referenceNumber, document:(document||type||"-"), fullName, status, updatedAt, createdAt}`
5. [Process] `nowServing = results.filter(r => r.status === "Processing")`
6. [Process] `forPickup = results.filter(r => r.status === "For Pick-up")`
7. [Process] `snapshot = {nowServing, forPickup, updatedAt: new Date().toISOString()}`
8. [Process] `Return 200 with snapshot`
9. [Terminator] `End`

Note: The same query runs inside `broadcastQueueUpdate()` (Figure X.19, Phase 3) when triggered by payment webhook or status update.

---

## 27) Draw-Order Script: Request OTP — Phone (Figure X.21)

**Endpoint:** `POST /api/auth/request-otp` | **Controller:** `authController.js` + `smsOTP.js`

Layout model: top-to-bottom; dev-bypass branch on right after OTP generation; TextBee external call at base.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Receive body: phoneNumber, fullName`
3. [Decision] `phoneNumber present?`
   - No → return 400 "Phone number required"
   - Yes → continue
4. [Data Store] MongoDB: `User.findOne({phoneNumber})` — determine isNewUser flag
5. [Process] `isNewUser = (user === null)`
6. [Process] `OTP = crypto.randomInt(100000, 999999)`
7. [Process] `expiresAt = Date.now() + (5 × 60 × 1000)`
8. [Process] `Format phone: remove spaces/dashes; "0XXXXXXXXX" → "+63XXXXXXXXX"`
9. [Decision] `NODE_ENV = "development" AND SMS_DEV_BYPASS = "true"?`
   - Yes → log OTP to console; skip TextBee call; set devMode=true
   - No → continue
10. [External Entity] `POST https://api.textbee.dev/api/v1/gateway/devices/{DEVICE_ID}/sendSMS`
    — Header: `x-api-key: TEXTBEE_API_KEY`
    — Body: `{recipients:[formattedPhone], message:"Your verification code is: ${OTP}. Valid for 5 minutes."}`
11. [Decision] `SMS sent successfully?`
    - No → return 500
    - Yes → continue
12. [Process] `Sign JWT: payload={phoneNumber, otp, expiresAt, fullName, isNewUser}; expiry=5min`
13. [Process] `Return 200: {success, message, contact, otpToken, isNewUser, [devOtp if devMode]}`
14. [Terminator] `End`

---

## 28) Draw-Order Script: Verify OTP — Phone (Figure X.22)

**Endpoint:** `POST /api/auth/verify-otp` | **Controller:** `authController.js` + `smsOTP.js` + `tokenManager.js`

Layout model: top-to-bottom; JWT decode → two OTP validity checks → user upsert branch → token issuance.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Receive body: phoneNumber, otp (entered by user), otpToken (JWT from Figure X.21 step 12)`
3. [Decision] `otp AND otpToken present?`
   - No → return 400 "OTP and token required"
   - Yes → continue
4. [Process] `jwt.verify(otpToken, JWT_SECRET)` → extract: storedOTP, expiresAt, verifiedPhone, fullName, isNewUser
5. [Decision] `Token valid and not expired?`
   - No → return 400 "OTP token expired or invalid"
   - Yes → continue
6. [Decision] `Date.now() > expiresAt?`
   - Yes → return 400 "OTP expired"
   - No → continue
7. [Decision] `enteredOTP = storedOTP?`
   - No → return 400 "Invalid OTP"
   - Yes → continue
8. [Data Store] MongoDB: `User.findOne({phoneNumber:verifiedPhone})`
9. [Decision] `User found?`
   - No → [Data Store] Create: `new User({phoneNumber, firstName, lastName, isPhoneVerified:true, authProvider:"phone", isActive:true, lastLoginAt:now}).save()`
   - Yes → [Data Store] Update: `user.isPhoneVerified=true; user.lastLoginAt=now; user.save()`
10. [Predefined Process] `tokenManager.generateTokens(user._id, {phoneNumber, firstName})` — returns `{accessToken, refreshToken}`
11. [Process] `Return 200: {success, message, token:accessToken, refreshToken, user:{_id, phoneNumber, firstName, lastName}}`
12. [Terminator] `End`

---

## 29) Draw-Order Script: Google Auth (Figure X.23)

**Endpoint:** `POST /api/auth/google` | **Controller:** `authController.js`

Layout model: top-to-bottom; Google userinfo external call → email guard → find-or-create user branch → token issuance.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Receive body: googleToken, email, fullName, googleId, profilePicture`
3. [Decision] `googleToken AND email present?`
   - No → return 400 "googleToken and email required"
   - Yes → continue
4. [External Entity] `GET https://www.googleapis.com/userinfo/v2/me` — Header: `Authorization: Bearer googleToken`
5. [Decision] `Response status = 200?`
   - No → return 401 "Invalid or expired Google token"
   - Yes → parse googleUser: {email, name, id, picture}
6. [Decision] `googleUser.email = request.email?`
   - No → return 401 "Token email does not match"
   - Yes → continue
7. [Data Store] MongoDB: `User.findOne({$or:[{email:googleUser.email},{googleId:googleUser.id}]})`
8. [Decision] `User found?`

**No — new user:**
9a. [Process] `Split fullName or googleUser.name → firstName (first token), lastName (rest)`
10a. [Data Store] Create: `new User({email, googleId, firstName, lastName, profilePicture, isEmailVerified:true, isActive:true, authProvider:"google", lastLoginAt:now}).save()`

**Yes — existing user (patch missing fields):**
9b. [Decision] `user.googleId missing?` → set `user.googleId = googleUser.id`
10b. [Decision] `user.profilePicture missing?` → set `user.profilePicture = googleUser.picture`
11b. [Process] `user.isEmailVerified=true; user.lastLoginAt=now; user.save()`

12. [Predefined Process] `tokenManager.generateTokens(user._id, {email, firstName, googleId})`
13. [Process] `Return 200: {success, message, token:accessToken, refreshToken, user:{...}}`
14. [Terminator] `End`

---

## 30) Draw-Order Script: Refresh Access Token (Figure X.24)

**Endpoint:** `POST /api/auth/refresh-token` | **Controller:** `authController.js` + `tokenManager.js`

Layout model: short linear — token in → verify → DB check → new token out.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Receive body: refreshToken`
3. [Decision] `refreshToken present?`
   - No → return 400 "Refresh token required"
   - Yes → continue
4. [Process] `tokenManager.verifyRefreshToken(refreshToken)` — `jwt.verify(token, REFRESH_SECRET)` → extract decoded.userId
5. [Decision] `Token valid and not expired?`
   - No → return 401 "Invalid or expired refresh token"
   - Yes → continue
6. [Data Store] MongoDB: `User.findById(decoded.userId)`
7. [Decision] `User found AND user.isActive = true?`
   - No → return 401 "User not found or deactivated"
   - Yes → continue
8. [Predefined Process] `tokenManager.generateTokens(user._id, {phoneNumber, firstName})` — issues new access token; refresh token is NOT rotated
9. [Process] `Return 200: {success, accessToken}`
10. [Terminator] `End`

---

## 31) Draw-Order Script: Fee Policy Service (Figure X.25)

**Type:** Internal service — no HTTP endpoint | **Source:** `services/feePolicy.js`
**Referenced as:** Predefined Process in Figures X.12, X.13, X.14

Layout model: top-to-bottom; BASE_FEES lookup and normalization steps first; clearance special-case branch at bottom.

Build order:
1. [Terminator] `Start`
2. [Input/Output] `Input: {document:string, purpose:string, isStudent:any}`
3. [Process] `Normalize: docKey = document.toLowerCase().trim()`
4. [Process] `Lookup BASE_FEES map:`
   - `"barangay clearance"` → 50
   - `"barangay indigency certificate"` → 0
   - `"barangay residency certificate"` → 50
   - `"first time job seeker certificate"` → 0
   - `"barangay work permit"` → 100
   - `"certificate of good moral character"` → 50
   - `"barangay business permit"` → 300
   - `"barangay building clearance"` → 300
   - `(default)` → 0
5. [Process] `baseFee = BASE_FEES[docKey] ?? 0`
6. [Process] `Normalize isStudent: ("true" | "1" | true) → true; else → false`
7. [Process] `isWorkRelated = /work|employment|job|business/i.test(purpose)`
8. [Decision] `docKey = "barangay clearance"?`
   - No → `amount = baseFee; reason = "standard_fee"`; go to step 11
   - Yes → continue (clearance special case)
9. [Decision] `isStudent = true AND isWorkRelated = false?`
   - Yes → `amount = 0; reason = "student_non_work_clearance"`
   - No → `amount = baseFee; reason = "standard_clearance_fee"`
10. [Process] `amount and reason resolved`
11. [Process] `Return {amount, reason}`
12. [Terminator] `End`

Business rule note: A student requesting a Barangay Clearance for a non-work purpose (e.g., scholarship application) is exempt from the ₱50 base fee. All other documents use a fixed fee regardless of student status or purpose.

---

## Expanded Package Summary

You now have **25 diagrams total** across 4 categories:

**Group 1 — Process Flows (Figures X.1–X.6):**
- X.1: System Context
- X.2: Citizen Request Processing *(with endpoint cross-references)*
- X.3: Admin Operations *(with endpoint cross-references)*
- X.4: Request Lifecycle State
- X.5: Payment Integration *(with endpoint cross-references)*
- X.6: Print Integration *(with endpoint cross-references)*

**Group 2 — Systems & Architecture (Figures X.7–X.9):**
- X.7: Deployment Architecture (infrastructure diagram)
- X.8: Hardware-Software Interface (CE swimlane emphasis)
- X.9: Data Flow Diagram L0 + L1 (systems design notation)

**Group 3 — Resilience & Security (Figures X.10–X.11):**
- X.10: Error Handling & Recovery
- X.11: Authentication & Security Flow

**Group 4 — Endpoint Detail (Figures X.12–X.25):**
- X.12: `POST /api/request/create-request` — fee computation, counter upsert, reference number generation (`DOCCODE-YEAR-NNNN`)
- X.13: `POST /api/payment/create-checkout` — Paymongo API call, centavo conversion, URL fallback resolution
- X.14: `POST /api/payment/create-cash-payment` — `isFreeRequest` branch, immediate PDF generation path (no gateway)
- X.15: `POST /api/payment/handle-webhook` — event type guard, DB status update, push notification, PDF + Drive upload, all errors return 200
- X.16: `POST /api/pdf/generate` — PDF service, `createRequestIfMissing`, Drive auth branch, guaranteed `finally` cleanup
- X.17: `PATCH /api/pdf/status/:fileId` — admin auth gate, 3-tier identifier resolution (fileId → referenceNumber → Drive filename), WebSocket broadcast
- X.18: `POST /api/print/` — platform branch: Linux WebSocket dispatch path vs Windows ESC/POS PowerShell path
- X.19: WebSocket `wss://` — agent registration (`x-agent-secret`), print job dispatch via `pendingJobs` Map, queue broadcast fan-out, heartbeat
- X.20: `GET /api/queue/` — `$in` status filter, `createdAt` sort, split into `nowServing` / `forPickup`
- X.21: `POST /api/auth/request-otp` — `crypto.randomInt` OTP, dev-bypass decision, TextBee SMS API, JWT-embedded OTP + expiry
- X.22: `POST /api/auth/verify-otp` — JWT decode, OTP match + expiry check, find-or-create user, token issuance
- X.23: `POST /api/auth/google` — Google userinfo API verify, email guard, find-or-patch-or-create user, token issuance
- X.24: `POST /api/auth/refresh-token` — refresh JWT verify, `isActive` check, new access token (no rotation)
- X.25: `computeDocumentFee()` — fee matrix lookup, student exemption rule, work-related regex, returns `{amount, reason}`

This package provides **complete traceability** from citizen interaction down to individual function calls — covering process flows, hardware-software integration, data flows, error resilience, security, and per-endpoint implementation detail, as expected of a Computer Engineering thesis with significant software components.
