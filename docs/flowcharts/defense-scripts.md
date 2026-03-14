# Defense Presentation Scripts

Use these 90-second talking points for each diagram during your thesis defense.

---

## Figure X.1: System Context (90 seconds)

**Opening:**
"This is our System Context diagram, which shows the major actors and components in the kiosk ecosystem."

**Components:**
"We model Citizen and Admin as external entities outside the system boundary. Citizens interact through the Kiosk Client at the terminal or through the Mobile App for tracking, while Admins interact through the Admin Dashboard for queue operations."

**Central Hub:**
"The Backend API is still the central hub, but the flow is lifecycle-based. After request submission, the backend branches by payment method instead of executing all integrations at once."

**Lifecycle Branching:**
"For cash, the backend stores the paid request in MongoDB, then continues to document generation and upload. For e-wallet, it stores a pending request first, creates a Paymongo checkout session, waits for webhook confirmation, updates payment status in MongoDB, then proceeds to upload. This is why Paymongo appears only on the e-wallet branch."

**Data & Integrations:**
"MongoDB handles request and status persistence. Paymongo is used only for checkout and webhook confirmation in e-wallet flow. Google Drive stores generated documents after payment is already in the correct state."

**Printing Pipeline:**
"The Print Agent is a Windows daemon service that receives print jobs from the backend, formats them as ESC/POS thermal printer commands, and dispatches to the XP-58 thermal printer. Status feedback loops back to the backend for user notifications."

**Why This Matters:**
"This context diagram establishes system boundaries and sequencing discipline: branch first by payment mode, then invoke the correct external integration. It proves the architecture is modular and operationally correct, not just visually connected."

---

## Figure X.2: Citizen Request Processing (90 seconds)

**Opening:**
"This flowchart details the complete journey a citizen takes from selecting a document to receiving their printed certificate."

**User Entry & Validation:**
"A citizen starts by viewing available document types—we support eight barangay and national templates. They fill out their request data, providing name, contact, address, and document-specific fields. The system validates their input in real-time. If invalid, we display targeted error messages and loop back for correction—this prevents upstream failures."

**Payment Branching:**
"Once validated, the system asks for payment method. For cash payments, we record the transaction immediately. For e-wallet, we redirect to the Paymongo checkout interface. The citizen completes payment, and the gateway sends a webhook callback to confirm. We verify the callback signature to prevent fraud. Both paths converge at payment status update."

**Document Generation:**
"With payment confirmed, the backend generates the PDF using our Carbone templating engine with the citizen's data. We upload it to Google Drive for long-term storage and retrieval. The request is queued for the print agent."

**Print Execution:**
"The print agent receives the job, formats it as ESC/POS commands for thermal printing, and sends it to the physical printer. If printing succeeds, we update the request status to 'For Pickup' and notify the citizen. If it fails, we flag it for manual admin handling."

**Why This Matters:**
"This end-to-end flow demonstrates robust error handling, payment security, and integration with external services—all critical for a thesis defending software engineering rigor."

---

## Figure X.3: Admin Operations (90 seconds)

**Opening:**
"This diagram shows the admin dashboard workflow, highlighting oversight and intervention points."

**Authentication:**
"An admin logs in with credentials or via Google OAuth. Authentication succeeds or fails—on failure, they see an error and the flow terminates. This ensures only authorized personnel access the system."

**Queue Monitoring:**
"Once authenticated, the admin loads the queue dashboard. They review all pending requests in real-time, thanks to our WebSocket-based updates. The dashboard shows request details, payment status, and print job outcomes."

**Intervention Decision:**
"The system asks: Do any requests need manual intervention? This covers edge cases—payment mismatches, user contact info corrections, or print retries. If yes, the admin corrects the metadata, payment status, or initiates a reprint. If no, we proceed to print queue monitoring."

**Print Queue Oversight:**
"The admin monitors the thermal printer's job queue. If a job hasn't printed within an expected timeframe, the admin can requeue or diagnose the printer. Successful print jobs move to the 'Mark Completed' step. The admin closes the request in the system, triggering final notifications to the citizen."

**Why This Matters:**
"This workflow demonstrates our system's resilience—admins aren't passive observers; they're empowered with intervention tools. This is production-ready operational design, not a prototype."

---

## Figure X.4: Request Lifecycle (90 seconds)

**Opening:**
"This state machine diagram defines the lifecycle of a request as it moves through our system."

**States Overview:**
"There are six possible states: Pending, Processing, For Pickup, Completed, Failed, and Cancelled."

**Happy Path:**
"A request starts in Pending when first submitted. Once payment is verified or administratively approved, it transitions to Processing. In Processing, the PDF is generated and queued for printing. When printing completes, the status moves to For Pickup. Finally, when the citizen claims their document or the admin closes the ticket, it becomes Completed."

**Exception Paths:**
"If either PDF generation or printing encounters an error, the request moves to Failed. A manual admin intervention or reprint action can move Failed requests back to Processing. Alternatively, if a request sits in Pending too long without payment or is manually cancelled, it transitions to Cancelled—this prevents orphaned requests from cluttering the queue."

**Triggers & Guards:**
"Each arrow represents a specific event: 'Payment verified' triggers the Pending→Processing transition, 'PDF + print done' triggers Processing→For Pickup. This explicit state design ensures no ambiguous request states."

**Why This Matters:**
"State machines are a formal, proven way to manage complex processes. This diagram shows the panel that we applied rigorous software engineering principles to prevent invalid state transitions and customer confusion."

---

## Figure X.5: Payment Integration (90 seconds)

**Opening:**
"Payment is critical to our system. This diagram details how we handle two different payment methods securely."

**Method Selection:**
"When a citizen's request requires payment, they select cash or e-wallet. These branches represent two distinct workflows."

**Cash Branch:**
"For cash, the system records the payment immediately in MongoDB with a timestamp. We then move to the payment status update step."

**E-wallet Branch:**
"For e-wallet, we create a checkout session with Paymongo and display a QR code or link to the citizen. The citizen scans and completes the payment on their phone. Paymongo sends us a webhook callback confirming payment. Critically, we verify the callback's HMAC signature—this prevents malicious actors from spoofing payment confirmations."

**Status Reconciliation:**
"Both branches converge at the payment status update. We make a final decision: Has payment been confirmed? If yes, we mark the request as paid and continue processing the document generation and printing. If no—perhaps the webhook arrived but verification failed—we mark the request as unpaid/failed and notify the citizen to retry."

**Security Emphasis:**
"This double-verification approach ensures no fraudulent payments slip through. Webhook signature validation is industry standard and demonstrates our attention to security."

**Why This Matters:**
"Payment fraud and chargebacks are real risks in government services. Our design shows mature security practices, not naive payment handling."

---

## Figure X.6: Print Integration (90 seconds)

**Opening:**
"The thermal printer is the final output device. This diagram shows how we dispatch, execute, and handle print jobs reliably."

**Job Creation:**
"When a request is ready, the backend creates a print job object containing the PDF data, metadata, and thermal printer settings. The job is sent to our Print Agent service."

**Print Agent Dispatch:**
"The Print Agent, running as a Windows daemon, receives the job over a WebSocket connection. It formats the PDF content into ESC/POS commands—the bytecode language of thermal printers. This formatted command is sent to the XP-58 printer."

**Execution & Response:**
"The printer executes the command, physically printing the document. It sends a response back: success or failure. If successful, we update the request status in the database and notify the citizen and admin that their document is ready for pickup. If failure—printer jammed, paper out, connectivity lost—we retry the job once or escalate to the admin queue."

**Resilience:**
"Our single-retry strategy balances resilience with user experience. Most transient printer issues resolve on retry. Persistent failures escalate to admins, who can diagnose and intervene."

**Why This Matters:**
"Hardware integration is notoriously fragile. Our design addresses printer failures gracefully, preventing silent failures and citizen frustration. This shows systems thinking."

---

## Quick Reference: Opening Line for Any Diagram

*Use this if panelists ask you to summarize a diagram in one sentence:*

- **Figure X.1:** "This system context shows external entities, internal components, and the branch-based request lifecycle through the backend API."
- **Figure X.2:** "This citizen workflow demonstrates end-to-end request processing with robust validation, dual payment methods, and error recovery."
- **Figure X.3:** "This admin workflow shows how operators oversee the queue, validate requests, and manage exceptions through the dashboard."
- **Figure X.4:** "This state machine ensures requests never enter invalid states and handles exception scenarios like payment failure or print errors."
- **Figure X.5:** "This payment flow secures two payment methods—cash and e-wallet—with cryptographic verification to prevent fraud."
- **Figure X.6:** "This print integration demonstrates reliable hardware dispatch with failure handling and user notification."

**Closing remark:** "This demonstrates our defensive design—no single point of failure brings down the entire system."

---

## Figure X.7: Deployment Architecture (90 seconds)

**Opening:**
"This diagram shows where every component physically lives—the infrastructure layer that many software teams neglect."

**Physical Kiosk:**
"At a typical barangay hall, we have a kiosk terminal—a Windows PC with a touch display for citizen input. Connected via USB is the XP-58 thermal printer, which produces the printed certificates."

**Network Link:**
"The kiosk communicates with our backend via internet—either public WiFi or a cellular data connection. All communication is encrypted (HTTPS), so even public networks are secure."

**Backend Infrastructure:**
"Our backend runs on a virtual private server in the cloud. It hosts the Express.js API, Node.js services, and MongoDB database. Everything runs containerized for scalability and fault isolation."

**External Integrations:**
"For payments, we integrate Paymongo's online API. For document archival, Google Drive provides long-term secure storage. Both integrations happen over HTTPS with OAuth for authentication."

**Hardware-Software Boundary:**
"Notice the USB connection to the printer and the network connection to the server. This is where hardware meets software. The backend doesn't directly touch the printer—the Print Agent service manages that hardware interface, which is Figure X.8."

**Why CE panelists care:**
"This deployment diagram proves you understand infrastructure, not just code. You've shown you can design systems that actually run in production, with network considerations, hardware placement, and external service dependencies."

---

## Figure X.8: Hardware-Software Interface (90 seconds)

**Opening:**
"This diagram is the **Computer Engineering core** of your thesis. It shows the three-layer architecture: hardware devices, protocol drivers that bridge to software, and the backend logic."

**Hardware Layer:**
"At the bottom, we have the physical touch display, the thermal printer, and the network interface. These are hardware components controlled by low-level drivers."

**Driver/Protocol Layer:**
"The middle layer translates between hardware and software. The USB driver manages communication with the printer. The ESC/POS command formatter converts our document data into the bytecode the thermal printer understands. The WebSocket client on the kiosk handles real-time communication with the backend."

**Flow Example—Printing:**
"When a citizen's document is ready, the Backend API sends a job object to the Print Agent. The Print Agent formats it as ESC/POS bytes—commands like 'set font size', 'print image', 'cut paper'. These bytes go through the USB driver to the physical printer. The printer responds with status—'success' or 'error'. That status loops back to the backend, which notifies the citizen."

**Why This Is Computer Engineering:**
"This is **embedded systems thinking**. You're coupling software processes to hardware devices using standard protocols. You understand USB handshaking, ESC/POS thermal printer bytecode, and WebSocket protocol stacks. That's not just software engineering—that's systems engineering."

**Why It Matters:**
"Many student theses gloss over the hardware layer. Your panel sees this diagram and immediately recognizes you've designed a real system, not a theoretically nice prototype."

---

## Figure X.9: Data Flow Diagram L0+L1 (90 seconds)

**Opening:**
"This is a Data Flow Diagram—a systems engineering standard that describes how data moves through your system, independent of implementation."

**Level 0 (Context):**
"At the highest level, we have four external entities: Citizens submit requests, Admins issue commands, Paymongo processes payments, and Google Drive stores documents. The central 'Kiosk System' bubble represents all our logic combined. Data flows between the system and each entity."

**Level 1 (Decomposition):**
"When we zoom in, the system breaks into six processes:
1. **Validate Request** – ensures citizen input is complete and correct.
2. **Process Payment** – handles cash or e-wallet.
3. **Generate Document** – creates the PDF.
4. **Queue Print Job** – sends it to the printer.
5. **Update Status** – tracks progress through the system.
6. **Notify Stakeholders** – tells citizen and admin.

Along with three data stores:
- MongoDB for persistent request/payment/user data.
- Google Drive for archival PDFs.
- Cache for temporary session and queue data."

**Data Flow Logic:**
"Citizen sends request data → Validate process stores it in MongoDB → Payment process approves it → Generate process creates PDF and stores in Drive → Print process succeeds or fails → Update status in MongoDB → Notify sends messages to citizen and admin."

**Why DFD Matters:**
"DFDs are agnostic to technology—SQL, MongoDB, REST, gRPC—doesn't matter in a DFD. It focuses on *what data flows where*. Panelists from any discipline understand this. It's a lingua franca of systems design."

---

## Figure X.10: Error Handling & Recovery (90 seconds)

**Opening:**
"Real systems fail. This diagram shows how our system gracefully handles failures instead of crashing."

**Payment Failure Scenario:**
"When we call Paymongo, what if there's no response? We log the timeout and queue the request for manual review. We notify the citizen that payment is delayed—they're not left wondering if their request was lost. That's good UX and good engineering."

**Payment Rejection:**
"If Paymongo rejects the transaction—insufficient funds, invalid card—we mark it as failed and notify the citizen to retry. We don't charge them repeatedly or lock them in an error state."

**PDF Generation Failure:**
"Carbone PDF generation rarely fails, but if it does—corrupt template, out of memory—we log the error, flag the request for admin intervention, and notify the admin. An admin can manually recreate the PDF or investigate the root cause."

**Print Failure & Retry:**
"If the printer fails—paper jam, offline, connection lost—we retry once. Most transient failures resolve on retry. If it still fails, we escalate to the admin queue. The admin sees the request, diagnoses the printer issue, and manually completes or retries the job."

**Notification Pattern:**
"Throughout every failure path, the citizen or admin is notified. They're not left in the dark. That's production-ready design."

**Why This Matters:**
"Panelists see this diagram and recognize you've thought about operations, not just happy-path coding. You understand that resilience is a feature, not an accident."

---

## Figure X.11: Authentication & Security Flow (90 seconds)

**Opening:**
"For a government service handling citizen data and payment, security isn't optional—it's foundational. This diagram shows two critical security gates."

**Admin Authentication (Left Branch):**
"An admin enters their credentials. We immediately check: is the connection HTTPS? If not, we reject—no unencrypted credentials. If yes, we hash their password using bcrypt or Argon2—industry-standard password hashing that makes cracking computationally expensive. We compare the hash against what we stored in MongoDB. If it matches, we issue a JWT token—a signed, stateless credential the admin uses for subsequent requests."

**Why HTTPS matters:**
"Man-in-the-middle attackers can't intercept credentials if the channel is encrypted. This is table-stakes for any web service."

**Payment Webhook Security (Right Branch):**
"Paymongo sends a webhook callback to confirm payment. But what if an attacker forges a fake webhook, claiming a payment succeeded when it didn't? We prevent this using HMAC-SHA256 signature verification. Paymongo signs the webhook with a shared secret. We recompute the signature and check it matches. If it doesn't, we reject the webhook—possible tampering."

**Replay Attack Prevention:**
"Even with a valid signature, an attacker could capture a real webhook and resend it repeatedly, causing multiple charges. We prevent this by checking the webhook timestamp. If it's more than 5 minutes old, we reject it—likely a replay attack."

**Convergence:**
"Both authentication paths, if successful, grant authorization. Only authorized actions proceed. Unauthorized access is denied at each gate."

**Why This Demonstrates Engineering Rigor:**
"Many student projects overlook security. Your panel sees HMAC-SHA256, timestamp validation, bcrypt, and JWT, and recognizes you've studied industry best practices. You're not just passing data around—you're protecting it."

---

## Quick Reference: All 11 Figures Summarized (One Sentence Each)

---

## Figure X.12: Create Request — POST /api/request/create-request (90 seconds)

**Opening:**
"This diagram drills into exactly what happens when a citizen submits a request—from the moment the form data arrives to the moment the payment gateway is invoked."

**Fee Computation Branch:**
"The first thing we do is compute the document fee using our fee policy service. This isn't a simple flat rate—there's a student exemption rule. If a citizen is a student and the purpose is NOT work-related—say, a scholarship application—the fee is zero. This business rule is enforced programmatically, not by admin discretion."

**Reference Number Construction:**
"We then increment an atomic counter in MongoDB, specific to the current year, and combine it with the document type code and zero-padded sequence number to produce a reference like 'BRGY-CLR-2025-0042'. This ensures references are human-readable, unique, and sortable."

**Checkout Call:**
"Finally, we call our own payment create-checkout endpoint internally via HTTP. This keeps the checkout logic centralized and reusable. The response—a Paymongo session URL—is returned directly to the client."

**Why This Matters:**
"This diagram shows our request ingestion is deterministic and traceable from day one. Panel members can follow from input to storage to payment handoff without ambiguity."

---

## Figure X.13: Create Checkout Session — POST /api/payment/create-checkout (90 seconds)

**Opening:**
"This diagram details the handshake with Paymongo—how we translate our internal request data into a valid payment session."

**URL Resolution:**
"We dynamically resolve success and cancel redirect URLs. If the client provides a return URL, we use it. If not, we fall back to the configured kiosk URL. This lets us serve both the kiosk web client and the mobile app with the same endpoint."

**Paymongo API Call:**
"We convert the document fee from pesos to centavos—Paymongo requires integer centavos, not decimals. We Base64-encode our secret key for HTTP Basic authentication, which is the Paymongo API standard. We include all allowed e-wallet methods supported by our Paymongo checkout configuration."

**Why This Matters:**
"Currency conversion bugs and auth encoding errors are common integration failures. Charting this explicitly shows we understand the Paymongo API contract at a technical level, not just conceptually."

---

## Figure X.14: Create Cash Payment — POST /api/payment/create-cash-payment (90 seconds)

**Opening:**
"Not every citizen uses the same e-wallet provider. This diagram covers the cash payment path—and it has a critical branch that the e-wallet path does not."

**isFreeRequest Branch:**
"If the computed fee is zero—for a free document type like Barangay Indigency, or a student clearance—we mark the request as Processing immediately, with payment status Paid and method Free. The request bypasses the payment gateway entirely."

**Immediate PDF Generation:**
"Unlike the e-wallet path, which waits for a webhook before generating the PDF, the cash path generates the PDF immediately after saving the request. There's no external dependency to wait on—the admin is physically present to accept payment."

**Why This Matters:**
"The isFreeRequest branch is a real-world policy decision turned into code. Showing it in a diagram demonstrates that we account for edge cases in our business logic, not just the happy path."

---

## Figure X.15: Handle Payment Webhook — POST /api/payment/handle-webhook (90 seconds)

**Opening:**
"This is the most complex endpoint in the system. It's the asynchronous callback Paymongo sends us when a citizen's e-wallet payment succeeds—and it triggers the entire downstream pipeline."

**Event Guard & Always-200 Rule:**
"The first decision is whether the event type is 'checkout_session.payment.paid'. If not, we return 200 and ignore it. This is critical: Paymongo retries delivery until it gets a 200. If we ever return an error, Paymongo will resend the webhook repeatedly. Every branch in this handler must end with 200."

**Downstream Pipeline:**
"On a valid payment event, we update the request status to Processing, optionally send a push notification to the citizen's mobile app—non-blocking—broadcast a queue update via WebSocket to the admin dashboard, generate the PDF, check Google Drive authentication, upload the PDF, and clean up the temporary file."

**Why This Matters:**
"Webhook handlers are where many systems fail silently. Our explicit always-200 rule, non-blocking side effects, and guaranteed cleanup show production-grade webhook design."

---

## Figure X.16: Generate PDF — POST /api/pdf/generate (90 seconds)

**Opening:**
"This diagram covers on-demand PDF generation—used both from the webhook flow and directly when an admin needs to regenerate a document."

**createRequestIfMissing:**
"After PDF generation, we call a service that checks: does a request with this reference number already exist in MongoDB? If yes, we use it. If no, we create one. This makes the endpoint idempotent—calling it multiple times for the same data doesn't create duplicate records."

**Guaranteed Cleanup:**
"Regardless of what happens—PDF generation success, Drive upload failure, auth error—the finally block always runs and deletes the temporary file from the local filesystem. On the diagram, this box has a dashed border to indicate it always executes."

**Why This Matters:**
"The finally block is a software engineering safety net. Charting it explicitly shows awareness of resource management and operational hygiene."

---

## Figure X.17: Update Request Status — PATCH /api/pdf/status/:fileId (90 seconds)

**Opening:**
"This endpoint is how admins finalize a request—marking it For Pickup or Completed. It has a layered security and identifier resolution design."

**Admin Auth Gate:**
"The first check is admin authentication. Only admins with a valid Google OAuth session can update statuses. Unauthenticated calls are rejected immediately with 401."

**Three-Tier Identifier Resolution:**
"We accept either a MongoDB _id or a referenceNumber. First we try _id. If that fails, referenceNumber. If that also fails, we query Google Drive metadata and extract the reference from the filename. This makes the endpoint resilient to multiple calling conventions from different clients."

**WebSocket Broadcast:**
"After a successful update, we immediately broadcast a queue snapshot to all connected admin dashboards via WebSocket. Admins see status changes in real time without polling."

**Why This Matters:**
"The three-tier resolution and live broadcast remove the need for manual refresh. That's reactive, real-time system design."

---

## Figure X.18: Print Dispatch — POST /api/print/ (90 seconds)

**Opening:**
"This diagram has the most visible Computer Engineering content—it literally branches by operating system, showing our system runs differently on Linux servers versus Windows kiosk terminals."

**Linux Branch:**
"In production on the VPS, we check if a Print Agent is connected via WebSocket. If not, we return 503 immediately. If yes, we send the print job as a JSON message, register a callback in our pending jobs map, and await the result asynchronously."

**Windows Branch:**
"On the kiosk terminal, we enumerate installed Windows printers via PowerShell, find our thermal printer, construct the ESC/POS byte sequence including QR code and receipt formatting, and send raw bytes through PowerShell. We check the exit code for success."

**Why This Matters:**
"This platform branching shows we designed for real deployment constraints—the printer is USB-only on Windows, but the Linux server uses network-based dispatch. That's embedded systems and infrastructure thinking in one diagram."

---

## Figure X.19: WebSocket Agent Lifecycle (90 seconds)

**Opening:**
"Our print dispatch and real-time queue updates both depend on WebSocket. This diagram shows how that server manages connections, authenticates agents, dispatches jobs, and broadcasts updates."

**Agent Registration:**
"When the Print Agent connects from the Windows kiosk, it sends a register message with a shared secret. Invalid secret closes the connection with code 4001. Valid agents are assigned a random ID and stored in a Map."

**Print Job Dispatch:**
"When the HTTP print endpoint calls sendPrintJob, we assign a UUID job ID, store a promise resolver callback in our pendingJobs Map, and send the job to the agent. When the agent replies with a print-result message containing that job ID, we retrieve and invoke the callback—bridging async WebSocket events with synchronous HTTP responses."

**Queue Broadcast:**
"Admin dashboard clients subscribe to queue updates. When any status changes, we broadcast a fresh snapshot to all subscribers. This is the engine behind real-time dashboard updates."

**Why This Matters:**
"This architecture decouples Windows print hardware from the Linux server cleanly. The WebSocket protocol bridges the physical-network boundary—a real distributed systems design pattern."

---

## Figure X.20: Queue Snapshot — GET /api/queue/ (90 seconds)

**Opening:**
"This is the simplest endpoint in the system, but it's the data backbone of the admin dashboard's real-time view."

**Query Design:**
"We query MongoDB for requests in either Processing or For Pick-up status, excluding soft-deleted records, sorted by creation time ascending—first in, first served."

**Split Into Arrays:**
"We separate results into nowServing—actively Processing requests—and forPickup—completed requests awaiting citizen pickup. Each maps to a distinct visual section on the dashboard."

**Why This Matters:**
"This endpoint is called every time the queue broadcasts. Its performance directly affects dashboard responsiveness, which is why the MongoDB query uses a status-and-createdAt index."

---

## Figure X.21: Request OTP — POST /api/auth/request-otp (90 seconds)

**Opening:**
"Phone-based OTP is one of two authentication methods for the mobile app. This diagram covers how a verification code is generated and delivered."

**Cryptographic OTP:**
"We use Node.js crypto.randomInt to generate a cryptographically secure 6-digit OTP—not Math.random. It expires in 5 minutes."

**Dev Bypass:**
"There's an explicit dev bypass decision. When NODE_ENV is development and a flag is set, we skip the SMS API call and return the OTP in the response body. In production, this branch is never reached."

**JWT-Embedded OTP:**
"Rather than storing the OTP in a database, we embed it in a JWT token. The token is returned to the client. This is stateless—no OTP store to query, no cleanup job needed."

**Why This Matters:**
"Stateless OTP via JWT avoids race conditions on verification. The dev bypass shows operational maturity—production and development behave differently, and we document that explicitly."

---

## Figure X.22: Verify OTP — POST /api/auth/verify-otp (90 seconds)

**Opening:**
"This diagram closes the OTP loop—verifying the citizen's entered code, creating or updating their account, and issuing session tokens."

**Two-Stage Validation:**
"We perform two separate validity checks: first, verify the JWT signature; second, check the expiry timestamp. These are distinct failures with distinct error messages."

**Find or Create User:**
"After OTP verification, we look up the user by phone number. If they exist, we update their verified status. If not, we create their account. This upsert pattern means citizens never need to explicitly register."

**Why This Matters:**
"Stateless session management, implicit registration, and two-stage OTP validation are all industry best practices. Documenting them shows we understand authentication security deeply."

---

## Figure X.23: Google Authentication — POST /api/auth/google (90 seconds)

**Opening:**
"Google OAuth is how admins sign in and how mobile users with Google accounts authenticate. This diagram shows token verification and user synchronization."

**Token Verification:**
"We don't blindly trust the Google token sent by the client. We call Google's userinfo endpoint to get the account's actual email. If this call fails, the token was forged or expired."

**Email Match Guard:**
"We compare Google's returned email against the email the client claimed. If they don't match, we reject—preventing token reuse attacks."

**Find or Patch User:**
"We search for an existing user by email OR Google ID. If found, we patch only missing fields—never overwriting existing data. If not found, we create a new account."

**Why This Matters:**
"The email match guard is a security detail most student projects miss. This diagram demonstrates federated identity management done correctly."

---

## Figure X.24: Refresh Access Token — POST /api/auth/refresh-token (90 seconds)

**Opening:**
"Access tokens are short-lived for security. This diagram shows how the mobile app silently refreshes them without requiring the user to log in again."

**Stateless Verification:**
"We verify the refresh token using our JWT secret—no database lookup for the token itself. We then query MongoDB to confirm the user still exists and is still active."

**No Token Rotation:**
"We issue a new access token only. The same refresh token remains valid until it expires—a deliberate tradeoff: simplicity over mitigating refresh token theft."

**Why This Matters:**
"Short-lived access tokens limit stolen-token exposure. This is the standard OAuth 2.0 token refresh pattern. Charting it shows we understand the security rationale behind token lifetimes."

---

## Figure X.25: Fee Policy Service — computeDocumentFee() (90 seconds)

**Opening:**
"This isn't an HTTP endpoint—it's an internal service function called by three different controllers. We gave it its own diagram because it encodes the barangay's billing rules, and panelists often ask about fees."

**Fee Lookup Table:**
"We maintain a BASE_FEES map: Clearance ₱50, Indigency ₱0, Residency ₱50, First Time Job Seeker Certificate ₱0, Work Permit ₱100, Good Moral Character ₱50, Business Permit ₱300, Building Clearance ₱300."

**Student Exemption Logic:**
"The special case is Barangay Clearance. If the requestor is a student AND their stated purpose doesn't match work, employment, job, or business—checked with a regex—the fee is zero. A student applying for school enrollment pays nothing. A student applying for employment pays ₱50."

**Why This Matters:**
"Fee exemptions in government services are legal and policy-driven. Encoding them explicitly in a service function—rather than scattered across controllers or left to admin discretion—shows rigorous requirements engineering."

---

## Quick Reference: All 25 Figures Summarized (One Sentence Each)

- **Figure X.1:** "This system context shows external entities, internal components, and the branch-based request lifecycle through the backend API."
- **Figure X.2:** "This citizen workflow demonstrates end-to-end request processing with robust validation, dual payment methods, and error recovery."
- **Figure X.3:** "This admin workflow shows how operators oversee the queue, validate requests, and manage exceptions through the dashboard."
- **Figure X.4:** "This state machine ensures requests never enter invalid states and handles exception scenarios like payment failure or print errors."
- **Figure X.5:** "This payment flow secures two payment methods—cash and e-wallet—with cryptographic verification to prevent fraud."
- **Figure X.6:** "This print integration demonstrates reliable hardware dispatch with failure handling and user notification."
- **Figure X.7:** "This deployment architecture maps physical kiosk, network connectivity, backend infrastructure, and external services to show the complete production environment."
- **Figure X.8:** "This hardware-software interface breaks down how the physical printer and touch display communicate with the backend through drivers and protocol layers—the heart of embedded systems design."
- **Figure X.9:** "This data flow diagram decomposes our system into six core processes and three data stores, showing what data moves where without technology bias—a systems engineering standard."
- **Figure X.10:** "This error handling flow demonstrates graceful failure recovery, admin escalation, and user notification across payment, PDF generation, and print scenarios."
- **Figure X.11:** "This security flow secures admin authentication with HTTPS, bcrypt, and JWT, and secures payment webhooks with HMAC-SHA256 signature verification and timestamp validation."
- **Figure X.12:** "This endpoint diagram shows how a citizen request is ingested—fee computation, student exemption decision, atomic reference number generation, and internal checkout invocation."
- **Figure X.13:** "This diagram details Paymongo checkout session creation—URL fallback resolution, centavo conversion, payment method list, and Basic auth encoding."
- **Figure X.14:** "This diagram shows the cash payment path with the isFreeRequest branch that immediately sets Processing status and triggers PDF generation without a gateway."
- **Figure X.15:** "This webhook handler diagram shows the full payment-confirmed pipeline—DB update, push notification, WebSocket broadcast, PDF generation, Drive upload—with all error paths returning 200."
- **Figure X.16:** "This PDF generation diagram shows the createRequestIfMissing fallback, Drive authentication branch, and the guaranteed finally-block temp file cleanup."
- **Figure X.17:** "This status update diagram shows the admin auth gate, three-tier identifier resolution across MongoDB and Google Drive, and real-time WebSocket broadcast."
- **Figure X.18:** "This print dispatch diagram branches by platform—Linux uses WebSocket agent dispatch, Windows uses ESC/POS PowerShell thermal printing."
- **Figure X.19:** "This WebSocket server diagram shows print agent registration with secret validation, async print job dispatch via pendingJobs callbacks, and queue snapshot broadcast."
- **Figure X.20:** "This queue snapshot diagram shows the MongoDB status filter, ascending sort, and split into nowServing and forPickup arrays that drive the real-time admin view."
- **Figure X.21:** "This OTP request diagram shows cryptographically secure OTP generation, dev-bypass decision, TextBee SMS delivery, and stateless JWT-embedded OTP issuance."
- **Figure X.22:** "This OTP verification diagram shows two-stage JWT and expiry validation, implicit find-or-create user upsert, and dual access/refresh token issuance."
- **Figure X.23:** "This Google auth diagram shows server-side token verification, email-match guard against token reuse, and selective user field patching."
- **Figure X.24:** "This token refresh diagram shows stateless JWT verification, active user check, and new access token issuance without refresh token rotation."
- **Figure X.25:** "This fee policy diagram encodes the barangay's billing rules—BASE_FEES lookup, student exemption via regex purpose matching—used by three controllers."

---

## Tips for Delivery (25 Figures — 4 Groups)

1. **Group by theme:** Present as four groups — "Process Flows" (X.1–X.6), "Systems Architecture" (X.7–X.9), "Resilience & Security" (X.10–X.11), and "Endpoint Detail" (X.12–X.25).
2. **Defense strategy:** Open with X.1 (context), walk through X.2–X.3 (citizen/admin), jump to X.8 (show hardware understanding), wrap with X.11 (security), then offer to drill into any endpoint diagram if panelists want implementation depth.
3. **Endpoint group intro line:** "These 14 diagrams map each HTTP endpoint to its exact internal logic — every branch, external call, and error path. We drew them to show the panel that our implementation matches our design."
4. **Emphasize CE aspects:** Pause on X.8 (embedded systems swimlanes), X.18 (platform-split print dispatch), and X.19 (WebSocket protocol lifecycle).
5. **Handle deep questions:** If asked "How does fee computation work?", reference X.25. If asked "What happens if Paymongo is down?", reference X.10 and X.15 together. If asked "How does real-time work?", reference X.19 and X.20 together.
6. **Close strong:** "We've designed not just software, but an integrated hardware-software system engineered for production reliability, security, and failure resilience—down to the level of individual API endpoints."
