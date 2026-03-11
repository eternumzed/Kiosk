# Mermaid Diagram Starters

These Mermaid diagrams represent the flowchart content and can be:
1. Rendered directly in Mermaid Live Editor (mermaid.live)
2. Imported into Draw.io via Mermaid plugin
3. Used as reference while drawing in Visio/Draw.io with strict ANSI symbols

**Note:** Mermaid renders with modern UML-style symbols. Your final thesis diagrams must convert to strict ANSI flowchart symbols per the legend. These are scaffolds only.

---

## Figure X.1: System Context (Mermaid Reference)

```mermaid
graph TB
    Citizen["Citizen<br/>(Actor)"]
    Admin["Admin<br/>(Actor)"]
    
    Kiosk["Kiosk Client<br/>(Web)"]
    Mobile["Mobile App<br/>(Tracking)"]
    AdminDash["Admin Dashboard<br/>(Web)"]
    
    API["Backend API<br/>(Core)"]
    MongoDB[("MongoDB<br/>(Data Store)")]
    Paymongo["Paymongo<br/>(Gateway)"]
    Drive["Google Drive<br/>(PDF Storage)"]
    
    PrintAgent["Print Agent<br/>(Service)"]
    Printer["Thermal Printer<br/>(XP-58)"]
    
    Citizen -->|Request details| Kiosk
    Citizen -->|Track status| Mobile
    Admin -->|Queue actions| AdminDash
    
    Kiosk -->|Submit request| API
    Mobile -->|Status/query| API
    AdminDash -->|Manage queue| API
    
    API <-->|Store/Retrieve| MongoDB
    API <-->|Checkout/Webhook| Paymongo
    API <-->|Upload/Fetch PDF| Drive
    
    API -->|Print job| PrintAgent
    PrintAgent -->|ESC/POS cmd| Printer
    PrintAgent -->|Print status| API
    
    API -->|Realtime updates| AdminDash
    API -->|Status notify| Mobile
```

---

## Figure X.2: Citizen Request Processing (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ShowDocs["Display<br/>Document List"]
    EnterData["Enter Request<br/>Data"]
    Validate["Validate<br/>Fields"]
    ValidDecision{Valid<br/>Input?}
    ShowError["Display<br/>Validation Error"]
    SubmitReq["Submit<br/>Request"]
    PayDecision{Payment<br/>Method?}
    RecordCash["Record Cash<br/>Payment"]
    ShowGCash["Open GCash<br/>Checkout"]
    UpdatePayment["Update Payment<br/>Status"]
    GenPDF["Generate<br/>PDF"]
    UploadDrive["Upload to<br/>Drive"]
    QueuePrint["Queue Print<br/>Job"]
    PrintDecision{Print<br/>Success?}
    FlagReprint["Flag for<br/>Reprint/Manual"]
    UpdateStatus["Update Request<br/>Status"]
    ShowPickup["Display Reference<br/>& Pickup Info"]
    End(["END"])
    
    Start --> ShowDocs
    ShowDocs --> EnterData
    EnterData --> Validate
    Validate --> ValidDecision
    ValidDecision -->|No| ShowError
    ShowError --> EnterData
    ValidDecision -->|Yes| SubmitReq
    SubmitReq --> PayDecision
    PayDecision -->|Cash| RecordCash
    PayDecision -->|GCash| ShowGCash
    RecordCash --> UpdatePayment
    ShowGCash --> UpdatePayment
    UpdatePayment --> GenPDF
    GenPDF --> UploadDrive
    UploadDrive --> QueuePrint
    QueuePrint --> PrintDecision
    PrintDecision -->|No| FlagReprint
    PrintDecision -->|Yes| UpdateStatus
    FlagReprint --> End
    UpdateStatus --> ShowPickup
    ShowPickup --> End
```

---

## Figure X.3: Admin Operations (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    EnterCreds["Enter Credentials<br/>or OAuth"]
    AuthProcess["Authenticate<br/>Admin"]
    AuthDecision{Auth<br/>Success?}
    ShowAuthErr["Display Auth<br/>Error"]
    LoadDash["Load Queue<br/>Dashboard"]
    ReviewReqs["Review Pending<br/>Requests"]
    NeedIntervDecision{Needs<br/>Intervention?}
    CorrectData["Correct Status/<br/>Payment/Print"]
    MonitorQueue["Monitor Print<br/>Queue"]
    PrintJobDecision{Job<br/>Printed?}
    RequeueJob["Requeue or<br/>Diagnose"]
    MarkComplete["Mark Request<br/>Completed"]
    End(["END"])
    
    Start --> EnterCreds
    EnterCreds --> AuthProcess
    AuthProcess --> AuthDecision
    AuthDecision -->|No| ShowAuthErr
    ShowAuthErr --> End
    AuthDecision -->|Yes| LoadDash
    LoadDash --> ReviewReqs
    ReviewReqs --> NeedIntervDecision
    NeedIntervDecision -->|Yes| CorrectData
    CorrectData --> MonitorQueue
    NeedIntervDecision -->|No| MonitorQueue
    MonitorQueue --> PrintJobDecision
    PrintJobDecision -->|No| RequeueJob
    RequeueJob --> MonitorQueue
    PrintJobDecision -->|Yes| MarkComplete
    MarkComplete --> End
```

---

## Figure X.4: Request Lifecycle State (Mermaid Reference)

```mermaid
graph LR
    Pending["Pending"]
    Processing["Processing"]
    ForPickup["For Pickup"]
    Completed["Completed"]
    Failed["Failed"]
    Cancelled["Cancelled"]
    
    Pending -->|Payment verified| Processing
    Processing -->|PDF + print done| ForPickup
    ForPickup -->|Claim confirmed| Completed
    Processing -->|Generation/print error| Failed
    Pending -->|Timeout/cancel| Cancelled
```

---

## Figure X.5: Payment Integration (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    SelectMethod["Select Payment<br/>Method"]
    MethodDecision{Cash or<br/>GCash?}
    RecordCash["Record Cash<br/>Payment"]
    CreateCheckout["Create Checkout<br/>Session"]
    UserPays["User Completes<br/>Payment"]
    ReceiveWebhook["Receive Webhook<br/>Callback"]
    VerifyCallback["Verify Callback<br/>Signature"]
    UpdatePayment["Update Payment<br/>Status"]
    PaymentDecision{Payment<br/>Confirmed?}
    MarkFailed["Mark Unpaid/<br/>Failed"]
    ContinueProcess["Continue Request<br/>Processing"]
    End(["END"])
    
    Start --> SelectMethod
    SelectMethod --> MethodDecision
    MethodDecision -->|Cash| RecordCash
    MethodDecision -->|GCash| CreateCheckout
    RecordCash --> UpdatePayment
    CreateCheckout --> UserPays
    UserPays --> ReceiveWebhook
    ReceiveWebhook --> VerifyCallback
    VerifyCallback --> UpdatePayment
    UpdatePayment --> PaymentDecision
    PaymentDecision -->|No| MarkFailed
    PaymentDecision -->|Yes| ContinueProcess
    MarkFailed --> End
    ContinueProcess --> End
```

---

## Figure X.6: Print Integration (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    CreateJob["Create Print<br/>Job"]
    SendAgent["Send to Print<br/>Agent"]
    FormatESC["Format ESC/POS<br/>Command"]
    ExecutePrint["Execute Printer<br/>Job"]
    PrintDecision{Printer<br/>Success?}
    RetryEscalate["Retry or Escalate<br/>to Admin"]
    UpdateStatus["Update Request<br/>Status"]
    NotifyStakes["Notify Admin/<br/>Citizen"]
    End(["END"])
    
    Start --> CreateJob
    CreateJob --> SendAgent
    SendAgent --> FormatESC
    FormatESC --> ExecutePrint
    ExecutePrint --> PrintDecision
    PrintDecision -->|No| RetryEscalate
    PrintDecision -->|Yes| UpdateStatus
    RetryEscalate --> End
    UpdateStatus --> NotifyStakes
    NotifyStakes --> End
```

---

---

## Figure X.7: Deployment Architecture (Mermaid Reference)

```mermaid
graph LR
    Citizen["👤 Citizens<br/>(Barangay Hall)"]
    
    Kiosk["💻 Kiosk Terminal<br/>(Touch Display)"]
    Printer["🖨️ XP-58<br/>Thermal Printer"]
    
    Network["🌐 Network<br/>(Internet/LAN)"]
    
    Backend["🖥️ Backend Server<br/>(VPS/Cloud)"]
    DB[(["MongoDB<br/>(Data Store)"])]
    
    Paymongo["💳 Paymongo<br/>(Payment Gateway)"]
    Drive["☁️ Google Drive<br/>(PDF Storage)"]
    
    Citizen -->|USB/Power| Kiosk
    Kiosk -->|USB| Printer
    Kiosk -->|HTTP/WebSocket| Network
    Network -->|API<br/>Requests| Backend
    Backend <-->|OAuth<br/>Webhook| Paymongo
    Backend <-->|REST<br/>API| Drive
    Backend --> DB
```

---

## Figure X.8: Hardware-Software Interface (Mermaid Reference)

```mermaid
graph TB
    subgraph Hardware["Hardware Layer"]
        Display["Touch Display"]
        HDPrinter["XP-58 Printer"]
        Net["Network Interface"]
    end
    
    subgraph Driver["Driver/Protocol Layer"]
        USBDriver["USB Driver"]
        ESCFormatter["ESC/POS Formatter"]
        WSClient["WebSocket Client"]
        HTTPHandler["HTTP Handler"]
    end
    
    subgraph Software["Software Backend"]
        UIClient["Kiosk Client<br/>(React)"]
        PrintAgent["Print Agent<br/>(Node.js)"]
        API["Backend API<br/>(Express.js)"]
        MongoDB[("MongoDB")]
    end
    
    Display -->|Touch events| WSClient
    WSClient -->|JSON data| UIClient
    UIClient -->|WebSocket| API
    
    API -->|Job object| PrintAgent
    PrintAgent -->|PDF + settings| ESCFormatter
    ESCFormatter -->|Command bytes| USBDriver
    USBDriver -->|USB endpoint| HDPrinter
    HDPrinter -->|Status| USBDriver
    USBDriver -->|Result| PrintAgent
    PrintAgent -->|Callback| API
    API <-->|Query/Store| MongoDB
```

---

## Figure X.9: Data Flow Diagram L0+L1 (Mermaid Reference - L0 only)

```mermaid
graph TB
    Citizen["👤 Citizen"]
    Admin["👨‍💼 Admin"]
    Paymongo["💳 Paymongo"]
    Drive["☁️ Google Drive"]
    
    System["(0) Kiosk System"]
    
    Citizen -->|Request:<br/>name, doc type| System
    System -->|Response:<br/>ref#, status| Citizen
    Admin -->|Command:<br/>approve, reprint| System
    System -->|Status:<br/>queue info| Admin
    System <-->|Checkout,<br/>Webhook| Paymongo
    System <-->|Upload PDF,<br/>Retrieve| Drive
```

---

## Figure X.10: Error Handling & Recovery (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    CallGateway["Call Payment<br/>Gateway"]
    GWRespond{Gateway<br/>Responds?}
    LogTimeout["Log Timeout<br/>Error"]
    QueueManual["Queue for<br/>Manual Review"]
    NotifyDelay["Notify Citizen:<br/>Delayed"]
    
    PaymentCheck{Payment<br/>Confirmed?}
    PaymentFail["Mark Payment<br/>Failed"]
    NotifyInsufficent["Notify Citizen:<br/>Insufficient Funds"]
    
    ProceedPDF["Proceed to PDF<br/>Generation"]
    PDFCheck{PDF<br/>Success?}
    PDFFail["Log Error &<br/>Flag for Admin"]
    NotifyAdminPDF["Notify Admin:<br/>Manual PDF Needed"]
    
    QueuePrint["Queue Print<br/>Job"]
    PrintCheck{Print<br/>Success?}
    RetryOnce["Retry Once"]
    RetryCheck{Retry<br/>Success?}
    Escalate["Escalate<br/>to Admin"]
    NotifyAdminPrinter["Notify Admin:<br/>Printer Error"]
    
    MarkComplete["Mark<br/>Completed"]
    NotifyPickup["Notify Citizen:<br/>Ready for Pickup"]
    End(["END"])
    
    Start --> CallGateway
    CallGateway --> GWRespond
    GWRespond -->|No| LogTimeout
    LogTimeout --> QueueManual
    QueueManual --> NotifyDelay
    NotifyDelay --> End
    GWRespond -->|Yes| PaymentCheck
    PaymentCheck -->|No| PaymentFail
    PaymentFail --> NotifyInsufficent
    NotifyInsufficent --> End
    PaymentCheck -->|Yes| ProceedPDF
    ProceedPDF --> PDFCheck
    PDFCheck -->|No| PDFFail
    PDFFail --> NotifyAdminPDF
    NotifyAdminPDF --> End
    PDFCheck -->|Yes| QueuePrint
    QueuePrint --> PrintCheck
    PrintCheck -->|No| RetryOnce
    RetryOnce --> RetryCheck
    RetryCheck -->|No| Escalate
    Escalate --> NotifyAdminPrinter
    NotifyAdminPrinter --> End
    RetryCheck -->|Yes| MarkComplete
    PrintCheck -->|Yes| MarkComplete
    MarkComplete --> NotifyPickup
    NotifyPickup --> End
```

---

## Figure X.11: Authentication & Security Flow (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    
    subgraph AdminAuth["Admin Authentication"]
        AdminCred["Enter ID &<br/>Password"]
        SendHTTPS["Send over<br/>HTTPS/TLS"]
        CheckHTTPS{HTTPS<br/>Active?}
        RejectInsecure["Reject:<br/>Insecure"]
        HashPwd["Hash Password<br/>bcrypt/Argon2"]
        CompareHash["Compare with<br/>MongoDB Hash"]
        Match{Match?}
        ShowError["Show: Invalid<br/>Credentials"]
        GenJWT["Generate<br/>JWT Token"]
        ReturnToken["Return Token<br/>to Client"]
    end
    
    subgraph WebhookSec["Payment Webhook Security"]
        ReceiveWebhook["Receive Webhook<br/>from Paymongo"]
        ExtractHMAC["Extract HMAC<br/>Signature"]
        ComputeHMAC["Compute<br/>HMAC-SHA256"]
        ValidSig{Signature<br/>Valid?}
        RejectSig["Reject Webhook<br/>Signature Mismatch"]
        VerifyTS["Verify Timestamp<br/>Within 5 min"]
        TSValid{Timestamp<br/>Valid?}
        RejectReplay["Reject:<br/>Replay Attack"]
        MarkPaid["Mark Payment<br/>Confirmed"]
    end
    
    AuthSuccess["Proceed with<br/>Authorized Action"]
    End(["END"])
    
    Start --> AdminCred
    AdminCred --> SendHTTPS
    SendHTTPS --> CheckHTTPS
    CheckHTTPS -->|No| RejectInsecure
    RejectInsecure --> End
    CheckHTTPS -->|Yes| HashPwd
    HashPwd --> CompareHash
    CompareHash --> Match
    Match -->|No| ShowError
    ShowError --> End
    Match -->|Yes| GenJWT
    GenJWT --> ReturnToken
    ReturnToken --> AuthSuccess
    
    Start --> ReceiveWebhook
    ReceiveWebhook --> ExtractHMAC
    ExtractHMAC --> ComputeHMAC
    ComputeHMAC --> ValidSig
    ValidSig -->|No| RejectSig
    RejectSig --> End
    ValidSig -->|Yes| VerifyTS
    VerifyTS --> TSValid
    TSValid -->|No| RejectReplay
    RejectReplay --> End
    TSValid -->|Yes| MarkPaid
    MarkPaid --> AuthSuccess
    
    AuthSuccess --> End
```

---

## How to Use These Mermaid Diagrams

1. **Copy the code block** (between triple backticks)
2. **Paste into Mermaid Live Editor**: https://mermaid.live
3. **Export as SVG** and use as visual reference overlay while drawing in Visio/Draw.io
4. **Draw.io Import**: Use Mermaid plugin to import directly and convert to strict ANSI symbols
5. **Keep finalized diagrams** as ANSI-compliant; these Mermaid versions are scaffolds only

---

## Conversion Notes for ANSI Compliance

When converting from Mermaid to strict ANSI:
- Round/oval nodes → Terminators (Start/End)
- Rectangle nodes → Process boxes
- Diamond nodes → Decision (already strict)
- Cylinder → Data Store (MongoDB)
- Use display symbol for "Display" labeled nodes
- Ensure all bidirectional arrows split into two separate arrows
