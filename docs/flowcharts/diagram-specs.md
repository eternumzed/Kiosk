# Diagram Specifications (Implementation Draft)

This file defines what to draw in each required flowchart.

## 1) System Context Flowchart

Goal: Explain system boundaries and interfaces in one page.

Nodes to include:
- Citizen
- Admin
- Kiosk Client (Web)
- Mobile App
- Admin Dashboard (Web)
- Backend API
- MongoDB
- Paymongo
- Google Drive
- Print Agent
- Thermal Printer

Flow requirements:
1. Citizen -> Kiosk Client / Mobile App (input request details).
2. Kiosk Client / Mobile App -> Backend API (submit request).
3. Backend API <-> MongoDB (store/retrieve request and status).
4. Backend API <-> Paymongo (GCash payment + callback/webhook path).
5. Backend API <-> Google Drive (PDF upload/retrieval).
6. Backend API -> Print Agent -> Thermal Printer (print dispatch).
7. Backend API -> Admin Dashboard / Mobile App (status updates).

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
10. GCash branch -> Redirect to gateway (Display) -> wait for webhook (Off-page connector if split)
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
2. Decision: Cash or GCash?
3. Cash -> Record payment -> Mark paid
4. GCash -> Create gateway checkout -> User pays -> Receive webhook -> Verify signature -> Update payment status
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
3. Place Process rectangle labeled `Paymongo` on the right side.
4. Place Process rectangle labeled `Google Drive` below-right of `Backend API`.
5. Place Predefined Process box labeled `Print Agent` below `Backend API`.
6. Place Document/Process box labeled `Thermal Printer` below `Print Agent`.
7. Place Display symbol labeled `Kiosk Client (Web)` on left-middle.
8. Place Display symbol labeled `Mobile App` on left-bottom.
9. Place Display symbol labeled `Admin Dashboard (Web)` on left-top.
10. Place Input/Output symbol labeled `Citizen` far-left (between kiosk and mobile vertically).
11. Place Input/Output symbol labeled `Admin` far-left aligned with admin dashboard.

Flowline wiring order:
1. `Citizen` -> `Kiosk Client (Web)` with label `Request details`.
2. `Citizen` -> `Mobile App` with label `Track request`.
3. `Admin` -> `Admin Dashboard (Web)` with label `Queue actions`.
4. `Kiosk Client (Web)` -> `Backend API` with label `Submit request`.
5. `Mobile App` -> `Backend API` with label `Status/query`.
6. `Admin Dashboard (Web)` -> `Backend API` with label `Manage queue`.
7. `Backend API` <-> `MongoDB` with labels `Store` and `Retrieve`.
8. `Backend API` <-> `Paymongo` with labels `Checkout` and `Webhook callback`.
9. `Backend API` <-> `Google Drive` with labels `Upload PDF` and `Fetch file/meta`.
10. `Backend API` -> `Print Agent` with label `Print job`.
11. `Print Agent` -> `Thermal Printer` with label `ESC/POS command`.
12. `Print Agent` -> `Backend API` with label `Print status`.
13. `Backend API` -> `Admin Dashboard (Web)` with label `Realtime updates`.
14. `Backend API` -> `Mobile App` with label `Status notification`.

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
8. Decision `Payment method?`.
9. Left branch Process `Record cash payment`.
10. Right branch Display `Open GCash checkout`.
11. Off-page connector `A1` for webhook wait (if split page).
12. Process `Update payment status`.
13. Predefined Process `Generate PDF`.
14. Predefined Process `Upload to Drive`.
15. Process `Queue print job`.
16. Decision `Print success?`.
17. Left Process `Flag reprint/manual`.
18. Right Process `Update request status`.
19. Display `Show reference and pickup info`.
20. Terminator `End`.

Connection rules:
1. `Valid input?` No -> `Show validation errors` -> back to `Enter request data`.
2. `Payment method?` Cash and GCash branches must rejoin at `Update payment status`.
3. `Print success?` No branch ends at `Flag reprint/manual` then to End or admin handoff connector.
4. Keep rejoin points explicit; do not merge arrows without junction clarity.

## 9) Draw-Order Script: Admin Operations (Figure X.3)

Layout model: linear main path with one auth-failure branch and one print-failure branch.

Build order:
1. Terminator `Start`.
2. Input/Output `Enter credentials/OAuth`.
3. Process `Authenticate admin`.
4. Decision `Auth success?`.
5. Right Display `Show auth error`.
6. Display `Load queue dashboard`.
7. Process `Review pending requests`.
8. Decision `Needs intervention?`.
9. Right Process `Correct status/payment/print`.
10. Display `Monitor print queue`.
11. Decision `Job printed?`.
12. Left Process `Requeue or diagnose`.
13. Process `Mark request completed`.
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

Layout model: one decision split (Cash vs GCash) with reconciliation decision at the end.

Build order:
1. Terminator `Start`.
2. Input/Output `Select payment method`.
3. Decision `Cash or GCash?`.
4. Left Process `Record cash payment`.
5. Right Process `Create checkout session`.
6. Right Display `User completes payment`.
7. Right Input/Output `Receive webhook callback`.
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
3. Process `Send to print agent`.
4. Predefined Process `Format ESC/POS command`.
5. Process `Execute printer job`.
6. Decision `Printer success?`.
7. Left Process `Retry/escalate to admin`.
8. Right Process `Update request status`.
9. Display `Notify admin/citizen`.
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
4. **External Services:** Cloud shapes for `Paymongo`, `Google Drive`, `Admin Dashboard`
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

## Expanded Package Summary

You now have **11 diagrams total** across 3 categories:

**Process Flows (Figures X.1–X.6):**
- X.1: System Context
- X.2: Citizen Request Processing
- X.3: Admin Operations
- X.4: Request Lifecycle State
- X.5: Payment Integration
- X.6: Print Integration

**Systems & Architecture (Figures X.7–X.9):**
- X.7: Deployment Architecture (infrastructure)
- X.8: Hardware-Software Interface (CE emphasis)
- X.9: Data Flow Diagram L0+L1 (systems design)

**Resilience & Security (Figures X.10–X.11):**
- X.10: Error Handling & Recovery
- X.11: Authentication & Security Flow

This package now covers **hardware-software integration**, **data flows**, **error resilience**, and **security**—all critical for Computer Engineering thesis credibility.
