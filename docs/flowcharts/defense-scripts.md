# Defense Presentation Scripts

Use these 90-second talking points for each diagram during your thesis defense.

---

## Figure X.1: System Context (90 seconds)

**Opening:**
"This is our System Context diagram, which shows the major actors and components in the kiosk ecosystem."

**Components:**
"On the left, we have two types of users: Citizens who initiate document requests, and Admins who manage the queue. Citizens interact through the Kiosk Client, which is a web interface at the physical kiosk, or via the Mobile App for remote tracking. Admins use the Admin Dashboard to oversee operations."

**Central Hub:**
"The Backend API is the central processing hub. It receives requests from all client interfaces, orchestrates the entire workflow, and maintains real-time synchronization."

**Data & Integrations:**
"We use MongoDB to persistently store request data, payment records, and status information. For payments, we integrate with Paymongo to handle GCash transactions and webhooks. Generated certificates are uploaded to Google Drive for secure storage and easy admin access."

**Printing Pipeline:**
"The Print Agent is a Windows daemon service that receives print jobs from the backend, formats them as ESC/POS thermal printer commands, and dispatches to the XP-58 thermal printer. Status feedback loops back to the backend for user notifications."

**Why This Matters:**
"This context diagram establishes the system boundaries and shows panelists that we've designed modular, loosely-coupled integrations—each actor communicates through well-defined API contracts. This is enterprise-grade architecture."

---

## Figure X.2: Citizen Request Processing (90 seconds)

**Opening:**
"This flowchart details the complete journey a citizen takes from selecting a document to receiving their printed certificate."

**User Entry & Validation:**
"A citizen starts by viewing available document types—we support eight barangay and national templates. They fill out their request data, providing name, contact, address, and document-specific fields. The system validates their input in real-time. If invalid, we display targeted error messages and loop back for correction—this prevents upstream failures."

**Payment Branching:**
"Once validated, the system asks for payment method. For cash payments, we record the transaction immediately. For GCash, we redirect to the Paymongo checkout interface. The citizen completes payment, and the gateway sends a webhook callback to confirm. We verify the callback signature to prevent fraud. Both paths converge at payment status update."

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
"When a citizen's request requires payment, they select cash or GCash. These branches represent two distinct workflows."

**Cash Branch:**
"For cash, the system records the payment immediately in MongoDB with a timestamp. We then move to the payment status update step."

**GCash Branch:**
"For GCash, we create a checkout session with Paymongo and display a QR code or link to the citizen. The citizen scans and completes the payment on their phone. Paymongo sends us a webhook callback confirming payment. Critically, we verify the callback's HMAC signature—this prevents malicious actors from spoofing payment confirmations."

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

- **Figure X.1:** "This system context shows our modular architecture—actors, software components, and external integrations all communicating through a central backend API."
- **Figure X.2:** "This citizen workflow demonstrates end-to-end request processing with robust validation, dual payment methods, and error recovery."
- **Figure X.3:** "This admin workflow shows how operators oversee the queue, validate requests, and manage exceptions through the dashboard."
- **Figure X.4:** "This state machine ensures requests never enter invalid states and handles exception scenarios like payment failure or print errors."
- **Figure X.5:** "This payment flow secures two payment methods—cash and GCash—with cryptographic verification to prevent fraud."
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
2. **Process Payment** – handles cash or GCash.
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

- **Figure X.1:** "This system context shows our modular architecture—actors, software components, and external integrations all communicating through a central backend API."
- **Figure X.2:** "This citizen workflow demonstrates end-to-end request processing with robust validation, dual payment methods, and error recovery."
- **Figure X.3:** "This admin workflow shows how operators oversee the queue, validate requests, and manage exceptions through the dashboard."
- **Figure X.4:** "This state machine ensures requests never enter invalid states and handles exception scenarios like payment failure or print errors."
- **Figure X.5:** "This payment flow secures two payment methods—cash and GCash—with cryptographic verification to prevent fraud."
- **Figure X.6:** "This print integration demonstrates reliable hardware dispatch with failure handling and user notification."
- **Figure X.7:** "This deployment architecture maps physical kiosk, network connectivity, backend infrastructure, and external services to show the complete production environment."
- **Figure X.8:** "This hardware-software interface breaks down how the physical printer and touch display communicate with the backend through drivers and protocol layers—the heart of embedded systems design."
- **Figure X.9:** "This data flow diagram decomposes our system into six core processes and three data stores, showing what data moves where without technology bias—a systems engineering standard."
- **Figure X.10:** "This error handling flow demonstrates graceful failure recovery, admin escalation, and user notification across payment, PDF generation, and print scenarios."
- **Figure X.11:** "This security flow secures admin authentication with HTTPS, bcrypt, and JWT, and secures payment webhooks with HMAC-SHA256 signature verification and timestamp validation."

---

## Tips for Delivery (Revised for 11 Figures)

1. **Group by theme:** Present figures X.1–X.6 as "Process Flows," X.7–X.9 as "Systems Architecture," X.10–X.11 as "Resilience & Security."
2. **Emphasize CE aspects:** Pause on X.8 and highlight embedded systems, protocol layers, hardware-software coupling.
3. **Defense strategy:** Open with X.1 (context), then flow through citizen/admin paths (X.2–X.3), then jump to X.8 (show you understand hardware), then wrap with security (X.11).
4. **Handle interruptions:** If asked "What about hardware failures?", reference X.10 and X.8 together.
5. **Close strong:** "We've designed not just software, but an integrated hardware-software system engineered for production reliability, security, and failure resilience."
