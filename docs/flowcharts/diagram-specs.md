# Chapter 3 Flowchart Specifications (Implementation Draft)

This file defines the Chapter 3 diagram package for thesis defense and manuscript use.

## 1) Scope and Deliverables

This package includes:
1. Strict flowcharts for macro user flows and API endpoint flows.
2. Architecture diagrams (kept in Chapter 3, but explicitly marked as non-flowcharts).
3. A single convention block so all figures use the same notation rules.

## 2) Standards and Conventions (Strict)

### 2.1 Symbol Set (ISO 5807 / ANSI style)

| Symbol | Use |
|---|---|
| Terminator | Start or End only |
| Process | Internal processing step |
| Decision | Exactly one condition, explicit Yes and No exits |
| Input/Output | User input, API payload, or response body |
| Display | UI rendering to kiosk/mobile/admin |
| Data Store | MongoDB/Google Drive persistence |
| Predefined Process | Reusable service/subroutine |
| Predefined Process | Paymongo, TextBee, Google APIs, users |
| Off-page Connector | Cross-page continuation |
| On-page Connector | Line de-cluttering within same page |

### 2.2 Non-negotiable Flow Rules

1. Every non-terminator symbol has an outgoing path.
2. Every Decision has explicit `Yes` and `No` arrow labels.
3. Every path ends at one of:
- `End` terminator,
- paired off-page connector,
- or a Data Store handoff explicitly followed by a continuation.
4. No branch is left dangling.
5. Branch merges must point to one explicit target symbol.

### 2.3 Off-page Connector Rule (for paper diagrams)

1. On manuscript diagrams, label both sides with the same ID only (example: `A1` and `A1`).
2. In drafting text, `A1 OUT -> A1 IN` may be used for clarity.
3. Source page: connector is the last symbol on that page.
4. Target page: matching connector is the first symbol on the next page.
5. Off-page connector uses the off-page connector shape, not an on-page circle.

### 2.4 Terminology Lock

Use these exact status terms consistently:
- `Pending`
- `Processing`
- `For Pick-up`
- `Completed`
- `Cancelled`

Use these payment status terms where applicable:
- `Unpaid`
- `Pending`
- `Processing`
- `Paid`
- `Failed`

### 2.5 Response Shape Rule (Authoritative)

Use this rule consistently across all strict flowcharts:
1. Any `Return STATUS_CODE` node is an `Input/Output` symbol (parallelogram).
2. `Start` and `End` are `Terminator` symbols.
3. `Decision:` steps are `Decision` symbols with explicit `Yes` and `No` exits.
4. `X OUT` and `X IN` are `Off-page Connector` symbols.

## 3) Figure Numbering (Chapter 3)

### A. Macro User Flows
- `C3-1` Kiosk Client End-to-End Flow
- `C3-2` Mobile App End-to-End Flow
- `C3-3` Admin Dashboard End-to-End Flow

Scope note for thesis readability:
- `C3-1` is the primary transactional kiosk objective flow (request -> payment -> document generation -> print/output).
- Auxiliary kiosk functions (`Track Request`, `Help Video`) are separated into dedicated pages (`C3-35`, `C3-36`) and referenced from `C3-1`.

### B. Architecture Diagrams (Non-flowchart notation)
- `C3-4` Deployment Architecture
- `C3-5` Hardware-Software Interface
- `C3-6` Data Flow Diagram (L0 and L1)

### C. Essential Endpoint Flowcharts (Core + Admin Operations)
- `C3-7` `POST /api/request/create-request/`
- `C3-8` `POST /api/payment/create-checkout`
- `C3-9` `POST /api/payment/create-cash-payment`
- `C3-10` `POST /api/payment/handle-webhook`
- `C3-11` Generate PDF Service (`backend/services/pdf/generatePdf.js`)
- `C3-12` `PATCH /api/pdf/status/:fileId`
- `C3-13` `PATCH /api/pdf/status/ref/:referenceNumber`
- `C3-14` `POST /api/print/`
- `C3-15` `GET /api/queue/`
- `C3-16` `POST /api/auth/request-otp`
- `C3-17` `POST /api/auth/verify-otp`
- `C3-18` `POST /api/auth/google`
- `C3-19` `POST /api/auth/refresh-token`
- `C3-20` `WebSocket wss:// (path /)`
- `C3-21` `GET /api/pdf/auth/check`
- `C3-22` `GET /api/pdf/auth/init`
- `C3-23` `GET /api/pdf/auth/callback`
- `C3-24` `GET /api/pdf/list`
- `C3-25` `GET /api/pdf/trash`
- `C3-26` `DELETE /api/pdf/delete/:fileId`
- `C3-27` `DELETE /api/pdf/delete-multiple`
- `C3-28` `POST /api/pdf/restore/:fileId`
- `C3-29` `POST /api/pdf/restore-multiple`
- `C3-30` `DELETE /api/pdf/trash/:fileId`
- `C3-31` `DELETE /api/pdf/trash-multiple`
- `C3-32` `GET /api/pdf/download/:fileId`
- `C3-33` `POST /api/pdf/auth/logout`
- `C3-34` `POST /api/pdf/auth/disconnect`

### D. Auxiliary Kiosk UI Flowcharts (Non-endpoint)
- `C3-35` `GET /api/request/track-request/:referenceNumber` (auxiliary kiosk endpoint flow)
- `C3-36` Help Button Tutorial Video Flow

### E. Auxiliary Mobile UI Flowcharts (Non-endpoint)
- `C3-37` Mobile Request Details Screen Flow

### F. Additional Essential In-Use Flows (Previously Missing)
- `C3-39` Google Drive Upload Service (`backend/services/google/Drive.js` -> `uploadPdf`)
- `C3-40` `PATCH /api/request/hide` (+ `PATCH /api/request/hide/:requestId`, `PATCH /api/request/hide/ref/:referenceNumber`)
- `C3-41` `PATCH /api/request/unhide` (+ `PATCH /api/request/unhide/:requestId`, `PATCH /api/request/unhide/ref/:referenceNumber`)
- `C3-42` `POST /api/auth/push-token`
- `C3-43` `DELETE /api/auth/push-token`
- `C3-44` `GET /api/auth/google/mobile`
- `C3-45` `GET /api/auth/google/mobile/callback`
- `C3-46` Push Notification Dispatch Service (`sendRequestStatusNotification`)
- `C3-47` Token Generation Service (`tokenManager.generateTokens`)

## 4) Connector Registry (Authoritative)

| Connector Pair | Source | Target |
|---|---|---|
| `A1 OUT -> A1 IN` | C3-1 step 12 (E-wallet handoff) | C3-1 step 13 (webhook completed path) |
| `K1 OUT -> K1 IN` | C3-1 step 22 (print fail escalation) | C3-3 step 11 (admin intervention queue) |
| `M1 OUT -> M1 IN` | C3-2 step 20 (mobile issue escalation) | C3-3 step 11 (admin intervention queue) |
| `P1 OUT -> P1 IN` | C3-14 step 9/16 (print escalation) | C3-3 step 11 (admin intervention queue) |

## 5) Macro Flowcharts

## C3-1) Kiosk Client End-to-End Flow

Start: Citizen begins at kiosk terminal.
End: Citizen receives reference/pickup info, or case is escalated to admin.

Required steps:
1. Start (Terminator)
2. Display language and home options (Display)
3. Decision: `Request document` selected? (Decision)
4. If No -> Track Request Selected? (Decision):
Yes → Track Request (Predefined Process, ref. C3-35)
No  → Decision: Help selected?
              ├── Yes → Help Tutorial Video (Predefined Process, ref. C3-36)
              └── No  → [back to Display home options]
5. If Yes -> Enter personal info (Input/Output)
6. Validate personal info (Process)
7. Decision: Valid personal info? (Decision)
8. If No -> Show validation errors (Display) -> return to step 5
9. If Yes -> Select document type (Display)
10. Fill document fields and review (Input/Output)
11. Decision: Payment method is E-wallet? (Decision)
12. If Yes -> Call `POST /api/request/create-request/` (Predefined Process, ref. C3-7) -> Open checkout URL (Display)
→ Await payment callback / webhook (Process)
→ Update payment status (Process)
14. If No -> Call `POST /api/payment/create-cash-payment` (Predefined Process, ref. C3-9) -> Display Processing/ Please Wait (Display)
15. Generate PDF (Predefined Process, ref. C3-11)
16. Upload PDF to Google Drive (Predefined Process, ref. C3-39)
17. Display confirmation and trackable reference number (Display)
18. Decision: Print receipt requested by user? (Decision)
19. If No -> Keep current page or return home (Display) -> End (Terminator)
20. If Yes -> Call `POST /api/print/` (Predefined Process, ref. C3-14)
21. Decision: Receipt print request successful? (Decision)
22. If No -> Show print error/manual assistance message (Display) -> `K1 OUT` (Off-page Connector)
23. If Yes -> Show success feedback (Display)
24. End (Terminator)

Decision: User print receipt?
├── Yes → Predefined Process: Print Receipt (ref. C3-14) → End
└── No  → End

## C3-2) Mobile App End-to-End Flow

Start: User opens mobile app.
End: Request submitted/tracked successfully, or escalated to admin.

Required steps:
1. Start (Terminator)
2. Load app and check session token (Process)
3. Decision: Access token valid? (Decision), If Yes -> Step 10
4. If No -> Show authentication options (Display)
5. Decision: Use OTP authentication? (Decision)
6. If Yes -> Request OTP then verify OTP (Predefined Process: C3-16, C3-17)
7. If No -> Google auth flow (Predefined Process: C3-18)
8. Decision: Authentication successful? (Decision)
9. If No -> Show auth error (Display) -> End (Terminator)
10. If Yes -> Load dashboard and request history (Display)
11. Register pending Expo push token with backend (Predefined Process, ref. C3-42)
12. Decision: Create new request? (Decision)
13. If No -> Open request details/tracking (Display) -> End (Terminator)
14. If Yes -> Select document and fill form (Input/Output)
15. Review payment and choose Online/Cash/Free (Display)

*
16. Decision: Payment path is Online and fee > 0? (Decision)
17. If Yes -> Call `POST /api/request/create-request/` (Predefined Process, ref. C3-7) -> Open PayMongo checkout and wait deep-link callback (Display)
18. If No -> Call `POST /api/payment/create-cash-payment` (Predefined Process, ref. C3-9)
*

*
Decision: Fee > 0?
├── No  → Create Cash Payment (Predefined Process, ref. C3-9) [free document path]
└── Yes → Decision: Payment method is E-wallet?
              ├── Yes → Create Document Request (Predefined Process, ref. C3-7) → Display: PayMongo checkout
                        Process: Update payment status
                        Predefined Process: Generate PDF (ref. C3-11)
                        Predefined Process: Upload PDF to Google Drive (ref. C3-39)
              └── No  → Create Cash Payment (Predefined Process, ref. C3-9)
*

Display: Confirmation screen with reference number
→ Decision: Track Request selected?
    ├── Yes → Track Request (Predefined Process, ref. C3-35) → End
    └── No  → Decision: Go to Home selected?
                  ├── Yes → End
                  └── No  → [arrow back to Display: Confirmation screen]

## C3-3) Admin Dashboard End-to-End Flow

Start: Admin opens dashboard.
End: Queue and document actions finalized.

Required steps:
1. Start (Terminator)
2. Check admin Drive auth session (Process)
3. Decision: Session valid? (Decision), If Yes -> Step 7
4. If No -> Init OAuth then callback (Predefined Process: C3-22, C3-23)
5. Decision: Auth successful? (Decision)
6. If No -> Show access denied/error (Display) -> End (Terminator)
7. If Yes -> Load queue and file lists (Display)
8. Connect WebSocket and send `subscribe-queue` (Predefined Process: C3-20)
9. Decision: Continue monitoring session? (Decision)
10. If No -> Run logout flow (Predefined Process: C3-33) -> End (Terminator)
11. If Yes -> Intervention intake node (`K1 IN` / `M1 IN` / `P1 IN`) (Off-page Connector -> Process)
12. Decision: Intervention required? (Decision)
13. If No -> Continue monitoring loop to step 8 (On-page Connector)
14. If Yes -> Decision: Action is status update? (Decision)
15. If Yes -> Run C3-12 or C3-13 (Predefined Process) -> return to step 8 (On-page Connector)
16. If No -> Decision: Action is PDF file operation? (Decision)
17. If Yes -> Run C3-24..C3-32 as needed (Predefined Process) -> return to step 8 (On-page Connector)
18. If No -> Decision: Action is Drive disconnect? (Decision)
19. If Yes -> Run C3-34 (Predefined Process) -> return to step 8 (On-page Connector)
20. If No -> Run C3-33 (Predefined Process) -> return to step 8 (On-page Connector)

*
1.  Start (Terminator)  

2.  Check admin Drive auth session (Process)

3.  Decision: Session valid?
    ├── No  → Display: Sign in with Google Drive button (Display)
    │         → Decision: Admin clicks Sign in?
    │             ├── No  → End (Terminator)
    │             └── Yes → Initialize OAuth and Callback
    │                        (Predefined Process, ref. C3-22, C3-23)
    │                        → Decision: Auth successful?
    │                            ├── No  → Display: Access denied/error → End (Terminator)
    │                            └── Yes → [○ A1 merge into step 5]
    └── Yes → Decision: Authorized?
                ├── No  → Display: Access denied/error → End (Terminator)
                └── Yes → [○ A1 merge into step 5]

5.  [Merge] Prepare Dashboard (Process)

6.  Display: Load queue and file lists (Display)

7.  Connect WebSocket and subscribe to queue
    (Predefined Process, ref. C3-20)

8.  Decision: Continue session?
    ├── No  → Logout
    │         (Predefined Process, ref. C3-33)
    │         → End (Terminator)
    └── Yes → Decision: Action is status update?
                ├── Yes → Progress Request Status
                │         (Predefined Process, ref. C3-12 / C3-13)
                │         → [arrow back to step 7]
                └── No  → Decision: Manage a PDF File?
                          ├── Yes → PDF File Operation
                          │         (Predefined Process, ref. C3-24 to C3-32)
                          │         → [arrow back to step 7]
                          └── No  → Decision: Action is Drive disconnect?
                                    ├── Yes → Disconnect Drive
                                    │         (Predefined Process, ref. C3-34)
                                    │         → [arrow back to step 7]
                                    └── No  → [arrow back to step 8]
*

## 6) Architecture Diagrams (Non-flowchart)

These are intentionally not strict flowcharts.

## C3-4) Deployment Architecture (Non-flowchart)

Include nodes and links:
1. Kiosk Terminal (touch display, browser, local network)
2. Mobile App (Expo/React Native client)
3. Admin Dashboard (web client)
4. Backend API server (Express)
5. MongoDB
6. Paymongo
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
- Paymongo
- Google Drive

L1 processes:
- Validate request
- Process payment
- Generate document
- Dispatch print
- Update status
- Notify clients

## 7) Endpoint Flowcharts

All endpoint flowcharts below must be drawn as strict flowcharts.

## C3-7) `POST /api/request/create-request/` Create Request - 4

Start: Request creation call received.
End: Checkout payload returned or error returned.

1. Start (Terminator)
2. Receive request payload body (Input/Output)
3. Extract base fields and template fields (Process)
4. Resolve userId from `Authorization` token or body fallback (Process)
5. Compute document fee via fee policy (Predefined Process, ref. C3-38)
6. Increment yearly counter (`Counter.findOneAndUpdate`) (Data Store)
7. Build reference number from doc code + year + sequence (Process)
8. Create request record with status `Pending` (Data Store)
9. Build payment payload with return/cancel URLs (Process)
10. Call `POST /api/payment/create-checkout` (Predefined Process, ref. C3-8)
11. Decision: Checkout call successful? (Decision)
12. If No -> Return 500 error payload (Input/Output) -> End (Terminator)
13. If Yes -> Return 200 checkout attributes (Input/Output) -> End (Terminator)

## C3-8) `POST /api/payment/create-checkout` Create Checkout - 5

Start: Checkout creation call received.
End: Checkout URL returned or failure returned.

1. Start (Terminator)
2. Receive request/payment payload (Input/Output)
3. Recompute fee using backend policy (Process)
4. Resolve success/cancel URLs from payload or kiosk defaults (Process)
5. Convert PHP amount to centavos (Process)
6. Input/Output: Call PayMongo checkout session API and receive response (Input/Output)
7. Decision: PayMongo API call successful? (Decision)
8. If No -> Return 500 with error details (Input/Output) -> End (Terminator)
9. If Yes -> Return 200 with checkout attributes (Input/Output) -> End (Terminator)

## C3-9) `POST /api/payment/create-cash-payment` Create Cash Payment - 6

Start: Cash payment call received.
End: Request persisted and response returned.

1. Start (Terminator)
2. Receive payload (Input/Output)
3. Extract base/template fields and resolve userId from token/body (Process)
4. Compute fee and classify free vs cash (Process)
5. Increment yearly counter and generate reference number (Data Store -> Process)
6. Set status/payment fields (`Processing/Paid/Free` for free, `Pending/Pending/Cash` otherwise) (Process)
7. Create request record (Data Store)
8. Decision: Request create successful? (Decision)
9. If No -> Return 500 error payload (Input/Output) -> End (Terminator)
10. If Yes -> Generate PDF then upload to Drive (Predefined Process, ref. C3-11, C3-39)
11. Return 200 with reference/status/payment fields (Input/Output) -> End (Terminator)

## C3-10) `POST /api/payment/handle-webhook` - Handle Webhook - 7

Start: Paymongo webhook POST received.
End: HTTP 200 always returned on handled paths; HTTP 500 on outer failure.

Always-200 rule: every handled branch calls `res.sendStatus(200)` — Paymongo requires this to stop retries.

1. Start (Terminator)
2. Receive webhook payload (`req.body.data`) (Input/Output)
3. Parse `event.attributes.type` (Process)
4. Decision: Event type is `checkout_session.payment.paid`? (Decision)
5. If No -> Return 200 (Input/Output) -> End (Terminator)
6. If Yes -> Extract `referenceNumber` and `paymentMethod` from checkout attributes (Process)
7. Resolve `paymentLabel` from method string (e.g. `gcash` → `GCash`) (Process)
8. Update request record: `status=Processing`, `paymentStatus=Paid`, `paymentMethod`, `paidAt` (Data Store)
9. Decision: Record found and updated? (Decision)
10. If No -> Log warning; continue to step 11 (Process)
11. If Yes -> Send push notification to linked user when `userId` exists (Predefined Process, ref. C3-46)
12. Broadcast queue update (Predefined Process, ref. C3-20)
13. Generate PDF and upload to Drive (Predefined Process, ref. C3-11, C3-39)
14. Return 200 (Input/Output) -> End (Terminator)
15. Outer catch -> Return 500 (Input/Output) -> End (Terminator)

## C3-11) Generate PDF Service - 8


1.  Start (Terminator)
2.  Receive templateKey and rawData (Input/Output)
3.  Decision: Template exists for templateKey?
    ├── No  → Throw invalid template error (Input/Output) → End (Terminator)
    └── Yes → Render base PDF via Carbone (Process)
4.  Decision: Template has images?
    ├── No  → Return final PDF path (Input/Output) → End (Terminator)
    └── Yes → Embed images into PDF (Process)
              → Decision: New file produced?
                  ├── Yes → Delete intermediate base PDF (Process)
                  │         → Decision: Deletion successful?
                  │             ├── No  → Log cleanup warning (Input/Output)
                  │             │         → [continue]
                  │             └── Yes → [continue]
                  └── No  → [continue]
              → Return final PDF path (Input/Output) → End (Terminator)

## C3-12) `PATCH /api/pdf/status/:fileId`

Start: Admin status update by file ID.
End: Updated status returned or error returned.

1. Start (Terminator)
2. Receive `fileId` path param + `status` body (Input/Output)
3. Check admin logged-in session (`isAdminLoggedIn`) (Process)
4. Decision: Authorized? (Decision)
5. If No -> Return 401 `Not authenticated` (Input/Output) -> End (Terminator)
6. If Yes -> Decision: Identifier present? (Decision)
7. If No -> Return 400 missing identifier (Input/Output) -> End (Terminator)
8. If Yes -> Validate status in `Pending|Processing|For Pick-up|Completed|Cancelled` (Process)
9. Decision: Status valid? (Decision)
10. If No -> Return 400 invalid status (Input/Output) -> End (Terminator)
11. If Yes -> Update request status via drive service (Data Store)
12. Decision: Update path succeeded? (Decision)
13. If No -> Return 500 update failed (Input/Output) -> End (Terminator)
14. If Yes -> Send push/fallback notifications + broadcast queue update (Predefined Process, ref. C3-46, C3-20) -> Return 200 success payload (Input/Output) -> End (Terminator)

## C3-13) `PATCH /api/pdf/status/ref/:referenceNumber`

Start: Admin status update by reference number.
End: Updated status returned or error returned.

1. Start (Terminator)
2. Receive `referenceNumber` path param + `status` body (Input/Output)
3. Check admin logged-in session (`isAdminLoggedIn`) (Process)
4. Decision: Authorized? (Decision)
5. If No -> Return 401 `Not authenticated` (Input/Output) -> End (Terminator)
6. If Yes -> Decision: Identifier present? (Decision)
7. If No -> Return 400 missing identifier (Input/Output) -> End (Terminator)
8. If Yes -> Validate status in `Pending|Processing|For Pick-up|Completed|Cancelled` (Process)
9. Decision: Status valid? (Decision)
10. If No -> Return 400 invalid status (Input/Output) -> End (Terminator)
11. If Yes -> Update request status via drive service (Data Store)
12. Decision: Update path succeeded? (Decision)
13. If No -> Return 500 update failed (Input/Output) -> End (Terminator)
14. If Yes -> Send push/fallback notifications + broadcast queue update (Predefined Process, ref. C3-46, C3-20) -> Return 200 success payload (Input/Output) -> End (Terminator)

## C3-14) `POST /api/print/` Print Receipt

Start: Print dispatch endpoint called.
End: Print result returned.


1. Start (Terminator)
2. Receive print payload (Input/Output)
3. Decision: Runtime is Linux/non-Windows path? (Decision)
4. If Yes -> Check print agent availability (`isPrintAgentAvailable`) (Process)
5. Decision: Agent available? (Decision)
6. If No -> Return 503 no-agent message (Input/Output) -> End (Terminator)
7. If Yes -> Send print job via WebSocket and wait callback (Predefined Process, ref. C3-20)
8. Decision: Agent callback success? (Decision)
9. If No -> Return 500 print failure (Input/Output) -> `P1 OUT` (Off-page Connector) -> End (Terminator)
10. If Yes -> Return 200 receipt sent (Input/Output) -> End (Terminator)
11. If No (from step 3) -> Choose local Windows printer (Process)
12. Decision: Printer found? (Decision)
13. If No -> Return 500 no-printer message (Input/Output) -> End (Terminator)
14. If Yes -> Build ESC/POS payload and send bytes to printer (Process)
15. Decision: Local print success? (Decision)
16. If No -> Return 500 printing error (Input/Output) -> `P1 OUT` (Off-page Connector) -> End (Terminator)
17. If Yes -> Return 200 receipt sent (Input/Output) -> End (Terminator)

## C3-15) `GET /api/queue/`

Start: Queue snapshot request received.
End: Queue payload returned.

1. Start (Terminator)
2. Query requests where status in `Processing`, `For Pick-up` and not deleted (Data Store)
3. Decision: Query success? (Decision)
4. No -> Return 500 error payload (Input/Output) -> End (Terminator)
5. Yes -> Sort/map rows (Process)
6. Split into `nowServing` and `forPickup` (Process)
7. Return 200 snapshot payload (Input/Output) -> End (Terminator)

## C3-16) `POST /api/auth/request-otp`

Start: OTP request call received.
End: OTP token response returned.

1. Start (Terminator)
2. Receive `phoneNumber` and optional `fullName` (Input/Output)
3. Decision: `phoneNumber` provided? (Decision)
4. No -> Return 400 `Phone number is required` (Input/Output) -> End (Terminator)
5. Yes -> Check if user exists (Data Store)
6. Generate OTP and expiry (Process)
7. Decision: OTP provider send successful? (Decision)
8. No -> Return 500 failed-to-send OTP (Input/Output) -> End (Terminator)
9. If Yes -> Continue OTP response build path (Process)
10. Sign temporary OTP JWT payload (Process)
11. Decision: Dev mode enabled by service? (Decision)
12. If Yes -> Return 200 with `devOtp` and `otpToken` (Input/Output) -> End (Terminator)
13. If No -> Return 200 with `otpToken` (Input/Output) -> End (Terminator)

## C3-17) `POST /api/auth/verify-otp`

Start: OTP verification call received.
End: Access/refresh tokens returned or error.

1. Start (Terminator)
2. Receive `phoneNumber`, `otp`, optional `fullName`, and `otpToken` (Input/Output)
3. Decision: `otp` and `otpToken` provided? (Decision)
4. No -> Return 400 missing required fields (Input/Output) -> End (Terminator)
5. Yes -> Verify OTP token signature/expiry (Process)
6. Decision: Token valid? (Decision)
7. No -> Return 400 expired/invalid token (Input/Output) -> End (Terminator)
8. Yes -> Verify OTP value/expiry against token data (Process)
9. Decision: OTP valid? (Decision)
10. If No -> Return 400 invalid OTP (Input/Output) -> End (Terminator)
11. If Yes -> Find user by phone (Data Store)
12. Decision: User exists? (Decision)
13. If No -> Create user (Data Store)
14. If Yes -> Update verification/login fields (Data Store)
15. Generate access/refresh tokens (Predefined Process, ref. C3-47)
16. Return 200 with token, refreshToken, and user info (Input/Output) -> End (Terminator)

## C3-18) `POST /api/auth/google`

Start: Google auth endpoint called.
End: Access/refresh tokens returned or error.

1. Start (Terminator)
2. Receive Google token and email payload (Input/Output)
3. Decision: `googleToken` and `email` present? (Decision)
4. No -> Return 400 missing fields (Input/Output) -> End (Terminator)
5. Yes -> Call Google userinfo API (Process)
6. Decision: Google token valid? (Decision)
7. No -> Return 401 invalid token (Input/Output) -> End (Terminator)
8. Yes -> Decision: Token email matches payload email? (Decision)
9. No -> Return 401 email mismatch (Input/Output) -> End (Terminator)
10. Yes -> Find user by email/googleId (Data Store)
11. Decision: User exists? (Decision)
12. No -> Create user (Data Store)
13. Yes -> Patch missing profile fields and login timestamp (Data Store)
14. Generate access/refresh tokens (Predefined Process, ref. C3-47) -> Return 200 success payload (Input/Output) -> End (Terminator)

## C3-19) `POST /api/auth/refresh-token`

Start: Refresh token endpoint called.
End: New access token returned or unauthorized.

1. Start (Terminator)
2. Receive `refreshToken` payload (Input/Output)
3. Decision: Token provided? (Decision)
4. No -> Return 400 `Refresh token required` (Input/Output) -> End (Terminator)
5. Yes -> Verify refresh token signature/expiry (Process)
6. Decision: Refresh token valid? (Decision)
7. No -> Return 401 token refresh failed (Input/Output) -> End (Terminator)
8. Yes -> Find user by token subject (Data Store)
9. Decision: Active user found? (Decision)
10. No -> Return 401 user missing/inactive (Input/Output) -> End (Terminator)
11. Yes -> Generate new access token (Process) -> Return 200 with access token (Input/Output) -> End (Terminator)

## C3-20) `WebSocket wss:// (path /)`

Start: Incoming WebSocket upgrade.
End: Agent/session registered, job dispatched, or connection closed.

1. Start (Terminator)
2. Accept WebSocket connection and initialize connection flags (Process)
3. Receive `register` message (`type=register`, `agentSecret`) (Input/Output)
4. Decision: Secret valid? (Decision)
5. No -> Send `error` and close socket (Input/Output) -> End (Terminator)
6. Yes -> Mark agent authenticated and store connection (Process)
7. Optionally receive `subscribe-queue` and send initial queue snapshot (Process)
8. Wait for `sendPrintJob()` dispatch from HTTP print path (Process)
9. Decision: Print job dispatched to agent? (Decision)
10. No -> Continue heartbeat/ping loop (Process) -> Step 8 (On-page connector)
11. Yes -> Create `jobId` and pending callback entry (Process)
12. Send `print-job` message to agent (Input/Output)
13. Decision: `print-result` received before timeout? (Decision)
14. No -> Resolve callback as timeout/failure (Process) -> End (Terminator)
15. Yes -> Resolve callback with success/failure payload (Process) -> End (Terminator)

## C3-21) `GET /api/pdf/auth/check`

Start: Admin auth-check request.
End: Auth status response.

1. Start (Terminator)
2. Read current admin auth/session state (`isAdminLoggedIn`) (Process)
3. Decision: Authenticated? (Decision)
4. No -> Return `{authenticated:false}` (Input/Output) -> End (Terminator)
5. Yes -> Return `{authenticated:true}` (Input/Output) -> End (Terminator)

## C3-22) `GET /api/pdf/auth/init`

Start: Admin auth init request.
End: OAuth URL response.

1. Start (Terminator)
2. Generate Google OAuth authorization URL (`auth.generateAuthUrl`) (Process)
3. Decision: URL generation succeeded? (Decision)
4. No -> Return 500 auth-init failure (Input/Output) -> End (Terminator)
5. Yes -> Return `{authUrl}` payload (Input/Output) -> End (Terminator)

## C3-23) `GET /api/pdf/auth/callback`

Start: Google OAuth callback request.
End: Token persisted or access denied.

1. Start (Terminator)
2. Receive callback query/code (Input/Output)
3. Decision: Authorization code present? (Decision)
4. No -> Return 400 missing code (Input/Output) -> End (Terminator)
5. Yes -> Exchange code for tokens with Google (Process)
6. Decision: Exchange/validation successful? (Decision)
7. No -> Return 500 authentication failed (Input/Output) -> End (Terminator)
8. Yes -> Decision: Admin identity allowed? (Decision)
9. No -> Return 403 access-denied page (Display) -> End (Terminator)
10. Yes -> Persist tokens/session then redirect `?auth=success` to admin app (Input/Output) -> End (Terminator)

## C3-24) `GET /api/pdf/list`

Start: List PDFs request.
End: List payload returned.

1. Start (Terminator)
2. Check admin logged-in state (Process)
3. Decision: Authorized? (Decision)
4. No -> Return 401 not-authenticated (Input/Output) -> End (Terminator)
5. Yes -> Query Drive PDF list (Data Store)
6. Decision: Query success? (Decision)
7. No -> Return 500 list failure (Input/Output) -> End (Terminator)
8. Yes -> Return 200 list payload (Input/Output) -> End (Terminator)

## C3-25) `GET /api/pdf/trash`

Start: List trashed PDFs request.
End: Trash list payload returned.

1. Start (Terminator)
2. Check admin logged-in state (Process)
3. Decision: Authorized? (Decision)
4. No -> Return 401 not-authenticated (Input/Output) -> End (Terminator)
5. Yes -> Query Drive trash list (Data Store)
6. Decision: Query success? (Decision)
7. No -> Return 500 trash-list failure (Input/Output) -> End (Terminator)
8. Yes -> Return 200 trash payload (Input/Output) -> End (Terminator)

## C3-26) `DELETE /api/pdf/delete/:fileId`

Start: Soft-delete PDF request.
End: Deletion result returned.

1. Start (Terminator)
2. Check admin logged-in state (Process)
3. Decision: Authorized? (Decision)
4. No -> Return 401 not-authenticated (Input/Output) -> End (Terminator)
5. Yes -> Receive `fileId` path param (Input/Output)
6. Call soft-delete in service (`deleted=true`) and broadcast queue update (Process)
7. Decision: Operation successful? (Decision)
8. If No -> Return 500 delete failure (Input/Output) -> End (Terminator)
9. If Yes -> Return 200 success message (Input/Output) -> End (Terminator)

## C3-27) `DELETE /api/pdf/delete-multiple`

Start: Batch soft-delete request.
End: Batch result returned.

1. Start (Terminator)
2. Check admin logged-in state (Process)
3. Decision: Authorized? (Decision)
4. No -> Return 401 not-authenticated (Input/Output) -> End (Terminator)
5. Receive `fileIds` array payload (Input/Output)
6. Decision: Non-empty valid array? (Decision)
7. No -> Return 400 invalid file IDs (Input/Output) -> End (Terminator)
8. Yes -> Run bulk soft-delete service + queue broadcast (Process)
9. Decision: Bulk action successful? (Decision)
10. If No -> Return 500 deletion failure (Input/Output) -> End (Terminator)
11. If Yes -> Return 200 success message (Input/Output) -> End (Terminator)

## C3-28) `POST /api/pdf/restore/:fileId`

Start: Restore one trashed PDF request.
End: Restore result returned.

1. Start (Terminator)
2. Check admin logged-in state (Process)
3. Decision: Authorized? (Decision)
4. No -> Return 401 not-authenticated (Input/Output) -> End (Terminator)
5. Receive `fileId` path param (Input/Output)
6. Restore one record from trash + broadcast queue update (Process)
7. Decision: Restore successful? (Decision)
8. If No -> Return 500 restore failure (Input/Output) -> End (Terminator)
9. If Yes -> Return 200 restore result (Input/Output) -> End (Terminator)

## C3-29) `POST /api/pdf/restore-multiple`

Start: Batch restore request.
End: Batch restore summary returned.

1. Start (Terminator)
2. Check admin logged-in state (Process)
3. Decision: Authorized? (Decision)
4. No -> Return 401 not-authenticated (Input/Output) -> End (Terminator)
5. Receive `fileIds` array payload (Input/Output)
6. Decision: Valid non-empty array? (Decision)
7. No -> Return 400 invalid file IDs (Input/Output) -> End (Terminator)
8. Yes -> Run bulk restore + broadcast queue update (Process)
9. Decision: Restore action successful? (Decision)
10. If No -> Return 500 restore failure (Input/Output) -> End (Terminator)
11. If Yes -> Return 200 restore summary (Input/Output) -> End (Terminator)

## C3-30) `DELETE /api/pdf/trash/:fileId`

Start: Permanent delete one file request.
End: Permanent delete result.

1. Start (Terminator)
2. Check admin logged-in state (Process)
3. Decision: Authorized? (Decision)
4. No -> Return 401 not-authenticated (Input/Output) -> End (Terminator)
5. Receive `fileId` path param (Input/Output)
6. Permanently delete one file from trash service (Data Store)
7. Decision: Delete successful? (Decision)
8. If No -> Return 500 permanent-delete failure (Input/Output) -> End (Terminator)
9. If Yes -> Return 200 delete result (Input/Output) -> End (Terminator)

## C3-31) `DELETE /api/pdf/trash-multiple`

Start: Batch permanent delete request.
End: Batch result returned.

1. Start (Terminator)
2. Check admin logged-in state (Process)
3. Decision: Authorized? (Decision)
4. No -> Return 401 not-authenticated (Input/Output) -> End (Terminator)
5. Receive `fileIds` array payload (Input/Output)
6. Decision: Valid non-empty array? (Decision)
7. No -> Return 400 invalid file IDs (Input/Output) -> End (Terminator)
8. Yes -> Run bulk permanent-delete service (Data Store)
9. Decision: Operation successful? (Decision)
10. If No -> Return 500 permanent-delete failure (Input/Output) -> End (Terminator)
11. If Yes -> Return 200 success summary (Input/Output) -> End (Terminator)

## C3-32) `GET /api/pdf/download/:fileId`

Start: Download file request.
End: Stream response or error.

1. Start (Terminator)
2. Check admin logged-in state (Process)
3. Decision: Authorized? (Decision)
4. No -> Return 401 not-authenticated (Input/Output) -> End (Terminator)
5. Receive `fileId` path param (Input/Output)
6. Request PDF stream from Drive service (Data Store)
7. Decision: Stream retrieval succeeded? (Decision)
8. If No -> Return 500 download failed (Input/Output) -> End (Terminator)
9. If Yes -> Return streamed PDF response (Input/Output) -> End (Terminator)

## C3-33) `POST /api/pdf/auth/logout`

Start: Admin logout request.
End: Session cleared result.

1. Start (Terminator)
2. Clear admin login state via `auth.logout()` (Process)
3. Return 200 logout success payload (Input/Output)
4. End (Terminator)

## C3-34) `POST /api/pdf/auth/disconnect`

Start: Admin disconnect-drive request.
End: Drive token revoked or error.

1. Start (Terminator)
2. Receive disconnect request (Input/Output)
3. Revoke Drive token and clear local token state (`auth.disconnectDrive`) (Process)
4. Return 200 disconnect success payload (Input/Output) -> End (Terminator)

## C3-35) `GET /api/request/track-request/:referenceNumber`

Start: Track request lookup called from kiosk tracking UI.
End: Matching request payload returned or error returned.

1. Start (Terminator)
2. Receive `referenceNumber` path param (Input/Output)
3. Normalize/trim reference number string (Process)
4. Query request by `referenceNumber` (Data Store)
5. Decision: Query executed successfully? (Decision)
6. If No -> Return 500 error payload (Input/Output) -> End (Terminator)
7. If Yes -> Decision: Matching record found? (Decision)
8. If No -> Return 404 not-found payload (Input/Output) -> End (Terminator)
9. If Yes -> Return 200 with request array/payload (Input/Output) -> End (Terminator)

## C3-36) Help Button Tutorial Video Flow

Start: User taps Help button on kiosk home screen.
End: User returns to Home screen.

1. Start (Terminator)
2. User selects `Help` on Home screen (Input/Output)
3. Navigate to Help page (Display)
4. Load and render tutorial video player (`/kiosk-tutorial.mp4`) (Process)
5. Decision: Video loaded/playable? (Decision)
6. If No -> Show playback error/fallback message (Display) -> Step 8
7. If Yes -> Play tutorial video with controls (Display)
8. Decision: User taps Back button? (Decision)
9. If No -> Continue viewing/replay loop -> Step 7 (On-page Connector)
10. If Yes -> Navigate back to Home screen (Display) -> End (Terminator)

## C3-37) Mobile Request Details Screen Flow

Start: User opens one request from mobile `My Requests`.
End: Request remains visible, or is hidden from `My Requests` list.

1. Start (Terminator)
2. User taps a request item in `My Requests` (Input/Output)
3. App displays Request Details screen (Display)
4. Decision: User taps `Hide from My Requests`? (Decision)
5. If No -> Stay on Request Details screen (Display) -> End (Terminator)
6. If Yes -> Show updating state on button (Display)
7. Save hidden state for this request (Process)
8. Decision: Hide action succeeded? (Decision)
9. If No -> Show error alert and keep request visible (Display) -> End (Terminator)
10. If Yes -> Confirm hidden state and remove from `My Requests` list view (Display) -> End (Terminator)

## C3-38) Compute Document Fee (Fee Policy)

Start: Fee computation called with document, purpose, isStudent
End: Fee amount and reason returned

1.  Start (Terminator)
2.  Receive document, purpose, isStudent (Input/Output)
3.  Normalize document name to lowercase trimmed string (Process)
4.  Look up base fee from fee schedule (Process)
5.  Decision: Document is Barangay Clearance?
    ├── No  → Return fee amount and reason: standard_fee (Input/Output)
    │         → End (Terminator)
    └── Yes → Normalize isStudent to boolean (Process)
              → Evaluate purpose for work-related keywords (Process)
              → Decision: Is student AND purpose is non-work?
                  ├── Yes → Return amount: 0, reason: student_non_work_clearance
                  │         (Input/Output) → End (Terminator)
                  └── No  → Return amount: 50, reason: standard_clearance_fee
                            (Input/Output) → End (Terminator)

## C3-39) Google Drive Upload Service (`uploadPdf`) - 9

Start: Upload service called with local PDF path and metadata.
End: Drive file metadata returned (or error propagated).

1. Start (Terminator)
2. Receive `{pdfPath, namePrefix, meta}` (Input/Output)
3. Ensure Google token is valid (`ensureValidToken`) (Process)
4. Decision: `namePrefix` looks like reference number (contains `-`)? (Decision)
5. If Yes -> Build filename as `${namePrefix}.pdf` (Process)
6. If No -> Build timestamped filename `${namePrefix || 'Document'}_<timestamp>.pdf` (Process)
7. Upload file to Google Drive folder via `drive.files.create` (Data Store)
8. Decision: Upload call successful? (Decision)
9. If No -> Propagate upload error to caller (Input/Output) -> End (Terminator)
10. If Yes -> Build request update payload (`fileId`, links, size, uploadedAt, type) (Process)
11. Decision: `meta.requestId` present? (Decision)
12. If Yes -> Update request by Mongo `_id` (Data Store)
13. If No -> Decision: `meta.referenceNumber` present? (Decision)
14. If Yes -> Update request by `referenceNumber` (Data Store)
15. If No -> Log warning for missing request identifier and continue (Process)
16. Create public-read Drive permission (`role=reader,type=anyone`) (Data Store)
17. Return Drive file metadata (`id,name,webViewLink,webContentLink,...`) (Input/Output) -> End (Terminator)

## C3-40) `PATCH /api/request/hide*` (Request Visibility Hide)

Start: Authenticated mobile user hides request from My Requests.
End: Visibility updated or error returned.

1. Start (Terminator)
2. Verify access token / resolve `userId` (Process)
3. Decision: Authenticated user present? (Decision)
4. If No -> Return 401 unauthorized (Input/Output) -> End (Terminator)
5. Receive identifier from body/path (`requestId` and/or `referenceNumber`) (Input/Output)
6. Decision: Any identifier provided? (Decision)
7. If No -> Return 400 identifier required (Input/Output) -> End (Terminator)
8. Update matching request with `{hiddenByUser:true, hiddenAt:now}` for this `userId` (Data Store)
9. Decision: Request found/updated? (Decision)
10. If No -> Return 404 request not found (Input/Output) -> End (Terminator)
11. If Yes -> Broadcast queue update (Predefined Process, ref. C3-20)
12. Return 200 success with updated request (Input/Output) -> End (Terminator)

## C3-41) `PATCH /api/request/unhide*` (Request Visibility Unhide)

Start: Authenticated mobile user unhides request.
End: Visibility restored or error returned.

1. Start (Terminator)
2. Verify access token / resolve `userId` (Process)
3. Decision: Authenticated user present? (Decision)
4. If No -> Return 401 unauthorized (Input/Output) -> End (Terminator)
5. Receive identifier from body/path (`requestId` and/or `referenceNumber`) (Input/Output)
6. Decision: Any identifier provided? (Decision)
7. If No -> Return 400 identifier required (Input/Output) -> End (Terminator)
8. Update matching request with `{hiddenByUser:false, hiddenAt:null}` for this `userId` (Data Store)
9. Decision: Request found/updated? (Decision)
10. If No -> Return 404 request not found (Input/Output) -> End (Terminator)
11. If Yes -> Broadcast queue update (Predefined Process, ref. C3-20)
12. Return 200 success with updated request (Input/Output) -> End (Terminator)

## C3-42) `POST /api/auth/push-token`

Start: Authenticated mobile client registers Expo push token.
End: Token saved or validation/auth error returned.

1. Start (Terminator)
2. Verify access token / resolve `userId` (Process)
3. Decision: Authenticated user present? (Decision)
4. If No -> Return 401 unauthorized (Input/Output) -> End (Terminator)
5. Receive `{expoPushToken, pushDeviceId}` payload (Input/Output)
6. Decision: `expoPushToken` present and valid format? (Decision)
7. If No -> Return 400 invalid/missing token (Input/Output) -> End (Terminator)
8. Clear same token/device from other users to enforce unique mapping (Data Store)
9. Update current user push token/device fields (Data Store)
10. Decision: User update successful? (Decision)
11. If No -> Return 404 user not found (Input/Output) -> End (Terminator)
12. If Yes -> Return 200 registration success (Input/Output) -> End (Terminator)

## C3-43) `DELETE /api/auth/push-token`

Start: Authenticated mobile client removes Expo push token.
End: Token removed or error returned.

1. Start (Terminator)
2. Verify access token / resolve `userId` (Process)
3. Decision: Authenticated user present? (Decision)
4. If No -> Return 401 unauthorized (Input/Output) -> End (Terminator)
5. Unset `expoPushToken` and `expoPushDeviceId` from user record (Data Store)
6. Decision: Remove operation successful? (Decision)
7. If No -> Return 500 remove-token failure (Input/Output) -> End (Terminator)
8. If Yes -> Return 200 remove success (Input/Output) -> End (Terminator)

## C3-44) `GET /api/auth/google/mobile`

Start: Mobile app initiates Google OAuth browser flow.
End: Redirect to Google consent page.

1. Start (Terminator)
2. Read optional `redirectUrl` query (Input/Output)
3. Decision: Server OAuth credentials configured? (Decision)
4. If No -> Return 500 oauth-not-configured (Input/Output) -> End (Terminator)
5. If Yes -> Build backend callback URL `/api/auth/google/mobile/callback` (Process)
6. Encode state with mobile redirect URL (Process)
7. Build Google OAuth URL with scopes `openid email profile` (Process)
8. Redirect to Google authorization page (Input/Output) -> End (Terminator)

## C3-45) `GET /api/auth/google/mobile/callback`

Start: Google redirects back with auth result.
End: Redirect back to mobile deep link with success or error payload.

1. Start (Terminator)
2. Receive callback query `{code,error,state}` (Input/Output)
3. Parse state and resolve mobile redirect URL (Process)
4. Decision: `error` present OR `code` missing? (Decision)
5. If Yes -> Redirect mobile deep link with error params (Input/Output) -> End (Terminator)
6. If No -> Decision: OAuth credentials configured? (Decision)
7. If No -> Redirect with oauth-not-configured error (Input/Output) -> End (Terminator)
8. If Yes -> Exchange code for Google access token (Process)
9. Decision: Token exchange succeeded? (Decision)
10. If No -> Redirect with token-exchange error (Input/Output) -> End (Terminator)
11. If Yes -> Fetch Google user profile (Process)
12. Decision: User profile fetch succeeded? (Decision)
13. If No -> Redirect with user-info error (Input/Output) -> End (Terminator)
14. If Yes -> Find/create local user, issue app tokens, and redirect mobile deep link with auth payload (Process -> Input/Output) -> End (Terminator)

## C3-46) Push Notification Dispatch Service (`sendRequestStatusNotification`)

Start: Status-change flow requests push notification to a user.
End: Notification sent, skipped, or failure logged without breaking caller flow.

1. Start (Terminator)
2. Receive `{userId, referenceNumber, documentType, newStatus, requestId}` (Input/Output)
3. Lookup user and push token details (Data Store)
4. Decision: Valid Expo push token available? (Decision)
5. If No -> Skip send and return non-fatal result (Input/Output) -> End (Terminator)
6. If Yes -> Build notification payload (title/body/data) (Process)
7. Send push notification via Expo notifications endpoint (Input/Output)
8. Decision: Send request successful? (Decision)
9. If No -> Log warning/error and return non-fatal failure (Process -> Input/Output) -> End (Terminator)
10. If Yes -> Return success result to caller (Input/Output) -> End (Terminator)

## C3-47) Token Generation Service (`tokenManager.generateTokens`)

Start: Auth flow needs new access/refresh tokens.
End: Signed token pair returned.

1. Start (Terminator)
2. Receive user/session payload for claims (Input/Output)
3. Build access token claims and expiry window (Process)
4. Sign access token with JWT secret (Process)
5. Build refresh token claims and longer expiry (Process)
6. Sign refresh token with refresh secret (Process)
7. Return `{token/accessToken, refreshToken}` (Input/Output) -> End (Terminator)



## 8) Cross-reference Matrix (Macro Flow -> Endpoint Flowcharts)

| Macro Step | Endpoint Figure |
|---|---|
| Kiosk submit request | C3-7 |
| Kiosk e-wallet checkout | C3-8 |
| Kiosk cash payment | C3-9 |
| Webhook payment finalization | C3-10 |
| PDF generation and Drive upload | C3-11, C3-39 |
| Print dispatch | C3-14 |
| Queue updates | C3-15, C3-20 |
| OTP auth | C3-16, C3-17 |
| Google auth | C3-18 |
| Mobile Google OAuth redirect flow | C3-44, C3-45 |
| Token refresh | C3-19 |
| Admin auth/init/callback | C3-21, C3-22, C3-23 |
| Admin file list/trash/manage | C3-24 to C3-32 |
| Admin auth logout/disconnect | C3-33, C3-34 |
| Kiosk manual/QR track request | C3-35 |
| Kiosk help video flow | C3-36 |
| Mobile request details view/toggle hide | C3-37 |
| Mobile request visibility endpoints | C3-40, C3-41 |
| Mobile push token lifecycle | C3-42, C3-43 |
| Push notification dispatch | C3-46 |
| Access/refresh token generation | C3-47 |

## 9) Final Validation Checklist

Before diagram reconstruction in diagrams.net, verify:
1. Every Decision has `Yes` and `No` labels.
2. No process/display/input node has missing outgoing continuation.
3. Every off-page connector ID appears exactly once as source and once as target.
4. Off-page target connector is the first symbol on target page.
5. Endpoint figure title exactly matches route method and path.
6. Architecture diagrams are clearly marked as non-flowcharts.
