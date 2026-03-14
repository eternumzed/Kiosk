# Thesis Flowchart Implementation Pack

This folder contains strict-flowchart standards and ready-to-draw specifications for the Kiosk thesis.

## Files

- `flowchart-legend.md` - Official symbol legend and strict drafting rules.
- `figure-captions.md` - Figure title/caption templates for manuscript and defense deck.
- `diagram-specs.md` - Implementation-ready flow definitions for required diagrams.
- `review-checklist.md` - Pre-defense audit checklist for notation correctness.

## Scope

These artifacts are intentionally strict and use ANSI/ISO-style flowchart conventions to fit panel expectations.

## Main Diagram Set

**Group 1 — Process Flows (X.1–X.6)**
1. System Context (high-level actors and integrations)
2. Citizen Request Flow (kiosk and mobile journey)
3. Admin Operations Flow (dashboard and queue management)
4. Request Lifecycle State Flow (status transitions)
5. Payment Integration Flow (Cash and E-wallet branches)
6. Print Integration Flow (print agent dispatch)

**Group 2 — Systems & Architecture (X.7–X.9)**
7. Deployment Architecture (physical infrastructure and network)
8. Hardware-Software Interface (embedded systems swimlane)
9. Data Flow Diagram L0+L1 (systems decomposition — DFD notation)

**Group 3 — Resilience & Security (X.10–X.11)**
10. Error Handling & Recovery (failure paths and admin escalation)
11. Authentication & Security Flow (bcrypt, JWT, HMAC-SHA256, replay prevention)

**Group 4 — Endpoint Detail (X.12–X.25)**
12. `POST /api/request/create-request` — fee policy, counter upsert, reference number construction
13. `POST /api/payment/create-checkout` — Paymongo API, URL resolution, centavo conversion
14. `POST /api/payment/create-cash-payment` — isFreeRequest branch, immediate PDF generation
15. `POST /api/payment/handle-webhook` — event guard, pipeline, always-200 rule
16. `POST /api/pdf/generate` — PDF service, Drive auth, guaranteed finally cleanup
17. `PATCH /api/pdf/status/:fileId` — admin gate, 3-tier identifier resolution, WS broadcast
18. `POST /api/print/` — platform split: Linux WebSocket vs Windows ESC/POS PowerShell
19. WebSocket `wss://` — agent lifecycle, pendingJobs dispatch, queue fan-out, heartbeat
20. `GET /api/queue/` — status filter, sort, nowServing/forPickup split
21. `POST /api/auth/request-otp` — crypto OTP, dev bypass, TextBee SMS, JWT-embedded OTP
22. `POST /api/auth/verify-otp` — two-stage validation, find-or-create user, token issuance
23. `POST /api/auth/google` — Google userinfo verify, email guard, find-or-patch user
24. `POST /api/auth/refresh-token` — refresh JWT verify, isActive check, new access token
25. `computeDocumentFee()` — BASE_FEES map, student exemption rule, work-related regex

## Implementation Notes

- Do not mix UML activity symbols with classic flowchart symbols in the same figure.
- If your drawing tool has multiple symbol libraries, lock one standard before drawing.
- Use off-page connectors for multi-page charts instead of long crossing arrows.
- Groups 1–3 are overview/architecture diagrams; Group 4 diagrams are drawn from actual controller source code and show every branch, external call, and error path.
- See `diagram-specs.md` sections 7–31 for the full draw-order script of every figure.
- See `defense-scripts.md` for the 90-second talking script for each figure.
