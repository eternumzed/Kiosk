# Figure Caption Templates

Use these captions in your manuscript and defense deck.

## Standard Caption Format

`Figure X.Y. <Diagram Name>. <One-sentence purpose statement>.`

## Ready-to-Use Captions

1. Figure X.1. System Context Flowchart. Shows external actors, major software components, and data exchanges across the kiosk ecosystem.
2. Figure X.2. Citizen Request Processing Flowchart. Describes the end-to-end citizen journey from document selection to printed output and pickup tracking.
3. Figure X.3. Admin Operations Flowchart. Shows how administrators monitor queue, validate requests, supervise printing, and close transactions.
4. Figure X.4. Request Lifecycle State Flowchart. Defines request status transitions and the event triggers that move a request between states.
5. Figure X.5. Payment Integration Flowchart. Details cash and GCash branches, including gateway callback handling and status reconciliation.
6. Figure X.6. Print Integration Flowchart. Describes print job dispatch, print-agent communication, printer response handling, and completion feedback.
7. Figure X.7. System Deployment Architecture Diagram. Maps physical kiosk location, network connectivity, backend infrastructure, and external service integrations (Paymongo, Google Drive) in their production environment.
8. Figure X.8. Hardware-Software Interface Flowchart. Illustrates three-layer communication: hardware devices (display, printer, network), driver/protocol middleware (USB driver, ESC/POS formatter, WebSocket), and software backend (React client, Print Agent, Express API, MongoDB); shows data and signal flow across the physical-digital boundary.
9. Figure X.9. Data Flow Diagram (Level 0–1 Decomposition). Level 0 shows context (external entities: Citizen, Admin, Paymongo, Google Drive; central system process). Level 1 decomposes into six core processes (validate, payment, generate, queue, update, notify) and three data stores (MongoDB, Google Drive, cache); illustrates data movement abstracted from implementation technology.
10. Figure X.10. Error Handling & Recovery Flowchart. Details failure paths across payment gateway timeout, payment rejection, PDF generation failure, and print execution failure; shows retry logic, admin escalation, and citizen notification at each exception point.
11. Figure X.11. Authentication & Security Flow. Dual-path flowchart: Left branch shows admin authentication via HTTPS, password hashing (bcrypt/Argon2), and JWT token issuance; right branch shows payment webhook security via HMAC-SHA256 signature verification and timestamp validation to prevent replay attacks; both converge at authorized action gate.

## Defense Slide Subtitle Template

`Notation: Figures X.1–X.6 use ANSI/ISO flowchart symbols; Figures X.7–X.9 use standard architecture/systems notation; Figures X.10–X.11 return to strict flowchart symbols for exception and security flows. All symbols are documented in the symbol legend.`
