# Figure Caption Templates

Use these captions in your manuscript and defense deck.

## Standard Caption Format

`Figure X.Y. <Diagram Name>. <One-sentence purpose statement>.`

## Ready-to-Use Captions

1. Figure X.1. System Context Flowchart. Shows external actors, major software components, and data exchanges across the kiosk ecosystem.
2. Figure X.2. Citizen Request Processing Flowchart. Describes the end-to-end citizen journey from document selection to printed output and pickup tracking.
3. Figure X.3. Admin Operations Flowchart. Shows how administrators monitor queue, validate requests, supervise printing, and close transactions.
4. Figure X.4. Request Lifecycle State Flowchart. Defines request status transitions and the event triggers that move a request between states.
5. Figure X.5. Payment Integration Flowchart. Details cash and e-wallet branches, including gateway callback handling and status reconciliation.
6. Figure X.6. Print Integration Flowchart. Describes print job dispatch, print-agent communication, printer response handling, and completion feedback.
7. Figure X.7. System Deployment Architecture Diagram. Maps physical kiosk location, network connectivity, backend infrastructure, and external service integrations (Paymongo, Google Drive) in their production environment.
8. Figure X.8. Hardware-Software Interface Flowchart. Illustrates three-layer communication: hardware devices (display, printer, network), driver/protocol middleware (USB driver, ESC/POS formatter, WebSocket), and software backend (React client, Print Agent, Express API, MongoDB); shows data and signal flow across the physical-digital boundary.
9. Figure X.9. Data Flow Diagram (Level 0–1 Decomposition). Level 0 shows context (external entities: Citizen, Admin, Paymongo, Google Drive; central system process). Level 1 decomposes into six core processes (validate, payment, generate, queue, update, notify) and three data stores (MongoDB, Google Drive, cache); illustrates data movement abstracted from implementation technology.
10. Figure X.10. Error Handling & Recovery Flowchart. Details failure paths across payment gateway timeout, payment rejection, PDF generation failure, and print execution failure; shows retry logic, admin escalation, and citizen notification at each exception point.
11. Figure X.11. Authentication & Security Flow. Dual-path flowchart: Left branch shows admin authentication via HTTPS, password hashing (bcrypt/Argon2), and JWT token issuance; right branch shows payment webhook security via HMAC-SHA256 signature verification and timestamp validation to prevent replay attacks; both converge at authorized action gate.
12. Figure X.12. Create Request Endpoint Flowchart. Documents the internal logic of POST /api/request/create-request: student fee exemption decision via computeDocumentFee, atomic counter upsert, DOCCODE-YEAR-NNNN reference number construction, MongoDB write, and internal invocation of the checkout session endpoint.
13. Figure X.13. Create Checkout Session Endpoint Flowchart. Documents the internal logic of POST /api/payment/create-checkout: fee re-computation, success/cancel URL fallback resolution, peso-to-centavo conversion, Paymongo Basic auth encoding, and checkout session API call with multi-method payment support.
14. Figure X.14. Create Cash Payment Endpoint Flowchart. Documents the internal logic of POST /api/payment/create-cash-payment: isFreeRequest branch that sets status directly to Processing and paymentMethod to Free, reference number generation, immediate synchronous PDF generation and Google Drive upload without a gateway webhook.
15. Figure X.15. Handle Payment Webhook Endpoint Flowchart. Documents the internal logic of POST /api/payment/handle-webhook: event-type guard, MongoDB status update to Processing, non-blocking push notification, WebSocket queue broadcast, PDF generation, Drive authentication check, conditional upload, and guaranteed temp file cleanup; all error paths return HTTP 200 to satisfy Paymongo retry semantics.
16. Figure X.16. Generate PDF Endpoint Flowchart. Documents the internal logic of POST /api/pdf/generate: PDF service invocation, idempotent createRequestIfMissing fallback, Google Drive authentication branch returning authUrl when unauthenticated, upload error capture, and guaranteed finally-block temporary file deletion.
17. Figure X.17. Update Request Status Endpoint Flowchart. Documents the internal logic of PATCH /api/pdf/status/:fileId: admin OAuth session gate, status enum validation, three-tier identifier resolution (MongoDB _id → referenceNumber → Google Drive filename extraction), and real-time WebSocket queue broadcast on success.
18. Figure X.18. Print Dispatch Endpoint Flowchart. Documents the internal logic of POST /api/print/: platform decision between Linux (WebSocket agent availability check → async job dispatch via pendingJobs callback) and Windows (PowerShell printer enumeration → ESC/POS payload construction → raw byte send via USB).
19. Figure X.19. WebSocket Agent Lifecycle Flowchart. Documents the websocketHandler service: print agent connection and x-agent-secret authentication, agentId assignment, print job dispatch via pendingJobs Map with async callback resolution, queue subscriber fan-out broadcast on status change, and 30-second heartbeat with dead-connection termination.
20. Figure X.20. Queue Snapshot Endpoint Flowchart. Documents the internal logic of GET /api/queue/: MongoDB query filtered by active statuses (Processing, For Pick-up), ascending createdAt sort, projection to minimal fields, and split into nowServing and forPickup arrays for the real-time admin dashboard.
21. Figure X.21. Request OTP Endpoint Flowchart. Documents the internal logic of POST /api/auth/request-otp: cryptographically secure OTP generation via crypto.randomInt, development bypass decision, phone number formatting to E.164, TextBee SMS API call, and stateless JWT issuance with OTP and expiry embedded in payload.
22. Figure X.22. Verify OTP Endpoint Flowchart. Documents the internal logic of POST /api/auth/verify-otp: JWT signature verification, separate OTP expiry check, OTP value match, implicit find-or-create user upsert in MongoDB, and dual access-token/refresh-token issuance via tokenManager.
23. Figure X.23. Google Authentication Endpoint Flowchart. Documents the internal logic of POST /api/auth/google: server-side Google userinfo API token verification, email-address match guard against token reuse, MongoDB find-by-email-or-googleId, selective field patching for existing users, new user creation for unknown accounts, and token issuance.
24. Figure X.24. Refresh Token Endpoint Flowchart. Documents the internal logic of POST /api/auth/refresh-token: stateless JWT refresh-token verification, MongoDB user existence and isActive check, and new access token issuance without refresh token rotation.
25. Figure X.25. Fee Policy Service Flowchart. Documents the internal logic of computeDocumentFee(): BASE_FEES map lookup for eight document types, isStudent boolean normalization, work-related purpose regex evaluation, and Barangay Clearance student-exemption branch that reduces the fee to zero for non-work requests.

## Defense Slide Subtitle Template

`Notation: Figures X.1–X.6 use ANSI/ISO flowchart symbols; Figures X.7–X.9 use standard architecture/systems notation; Figures X.10–X.11 return to strict flowchart symbols for exception and security flows; Figures X.12–X.25 use strict ANSI/ISO flowchart symbols to document individual endpoint logic. All symbols are documented in the symbol legend.`
