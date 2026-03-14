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
    ShowEwallet["Open E-wallet<br/>Checkout"]
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
    PayDecision -->|E-wallet| ShowEwallet
    RecordCash --> UpdatePayment
    ShowEwallet --> UpdatePayment
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
    MethodDecision{Cash or<br/>E-wallet?}
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
    MethodDecision -->|E-wallet| CreateCheckout
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
---

## Figure X.12: Create Request — POST /api/request/create-request (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ReadBody["Receive body:<br/>fullName, document,<br/>contactNumber, email,<br/>address, templateFields"]
    ResolveUser["Resolve userId<br/>from JWT or body"]
    ComputeFee[["computeDocumentFee<br/>(see Figure X.25)"]]
    FreeDecision{isStudent AND<br/>non-work purpose?}
    SetZero["amount = 0"]
    SetBase["amount = baseFee"]
    CounterUpsert[("Counter.findOneAndUpdate<br/>{name, year} $inc seq")]
    GetDocCode[["getDocCode(document)<br/>→ templateCode"]]
    BuildRef["Build referenceNumber:<br/>DOCCODE-YEAR-NNNN"]
    SaveRequest[("new Request(...).save()")]
    CallCheckout[["POST /api/payment/<br/>create-checkout (internal)"]]
    CheckoutOk{Checkout<br/>succeeded?}
    Return200["Return 200:<br/>checkout session data"]
    Return500["Return 500:<br/>error message"]
    End(["END"])

    Start --> ReadBody
    ReadBody --> ResolveUser
    ResolveUser --> ComputeFee
    ComputeFee --> FreeDecision
    FreeDecision -->|Yes| SetZero
    FreeDecision -->|No| SetBase
    SetZero --> CounterUpsert
    SetBase --> CounterUpsert
    CounterUpsert --> GetDocCode
    GetDocCode --> BuildRef
    BuildRef --> SaveRequest
    SaveRequest --> CallCheckout
    CallCheckout --> CheckoutOk
    CheckoutOk -->|Yes| Return200
    CheckoutOk -->|No| Return500
    Return200 --> End
    Return500 --> End
```

---

## Figure X.13: Create Checkout Session — POST /api/payment/create-checkout (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ReadBody["Receive body:<br/>newRequest object"]
    ComputeFee[["computeDocumentFee<br/>(see Figure X.25)"]]
    ReturnUrlDecision{returnUrl<br/>provided?}
    SuccessUrlA["successUrl = returnUrl<br/>/confirmation?ref=..."]
    SuccessUrlB["successUrl = KIOSK_URL<br/>/confirmation?ref=..."]
    CancelUrlDecision{cancelUrl<br/>provided?}
    CancelUrlA["cancelUrl = provided"]
    CancelUrlB["cancelUrl = KIOSK_URL/payment"]
    ConvertCentavos["amountCentavos = amount × 100"]
    EncodeAuth["Base64 encode<br/>PAYMONGO_SECRET_KEY"]
    CallPaymongo[["POST api.paymongo.com<br/>/v1/checkout_sessions"]]
    PaymongoOk{Response 2xx?}
    Return200["Return 200:<br/>session attributes"]
    Return500["Return 500:<br/>error details"]
    End(["END"])

    Start --> ReadBody
    ReadBody --> ComputeFee
    ComputeFee --> ReturnUrlDecision
    ReturnUrlDecision -->|Yes| SuccessUrlA
    ReturnUrlDecision -->|No| SuccessUrlB
    SuccessUrlA --> CancelUrlDecision
    SuccessUrlB --> CancelUrlDecision
    CancelUrlDecision -->|Yes| CancelUrlA
    CancelUrlDecision -->|No| CancelUrlB
    CancelUrlA --> ConvertCentavos
    CancelUrlB --> ConvertCentavos
    ConvertCentavos --> EncodeAuth
    EncodeAuth --> CallPaymongo
    CallPaymongo --> PaymongoOk
    PaymongoOk -->|Yes| Return200
    PaymongoOk -->|No| Return500
    Return200 --> End
    Return500 --> End
```

---

## Figure X.14: Create Cash Payment — POST /api/payment/create-cash-payment (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ReadBody["Receive body:<br/>fullName, document,<br/>contactNumber, userId..."]
    ResolveUser["Resolve userId<br/>from JWT or body"]
    ComputeFee[["computeDocumentFee<br/>(see Figure X.25)"]]
    FreeDecision{amount = 0?<br/>isFreeRequest}
    StatusFree["status=Processing<br/>paymentStatus=Paid<br/>paymentMethod=Free"]
    StatusCash["status=Pending<br/>paymentStatus=Pending<br/>paymentMethod=Cash"]
    BuildRef["Counter upsert +<br/>getDocCode → buildRef"]
    SaveRequest[("new Request(...).save()")]
    GenPDF[["pdfService({templateKey,<br/>rawData})"]]
    PDFOk{PDF generated?}
    DriveOk{Drive<br/>authenticated?}
    UploadDrive[["drive.uploadPdf(...)"]]
    UploadOk{Upload success?}
    DeleteTemp["fs.unlinkSync(pdfPath)"]
    SkipUpload["Log warning;<br/>leave for daemon"]
    Return200["Return 200:<br/>{referenceNumber, status,<br/>paymentMethod}"]
    End(["END"])

    Start --> ReadBody
    ReadBody --> ResolveUser
    ResolveUser --> ComputeFee
    ComputeFee --> FreeDecision
    FreeDecision -->|Yes| StatusFree
    FreeDecision -->|No| StatusCash
    StatusFree --> BuildRef
    StatusCash --> BuildRef
    BuildRef --> SaveRequest
    SaveRequest --> GenPDF
    GenPDF --> PDFOk
    PDFOk -->|No| Return200
    PDFOk -->|Yes| DriveOk
    DriveOk -->|No| SkipUpload
    DriveOk -->|Yes| UploadDrive
    UploadDrive --> UploadOk
    UploadOk -->|Yes| DeleteTemp
    UploadOk -->|No| SkipUpload
    DeleteTemp --> Return200
    SkipUpload --> Return200
    Return200 --> End
```

---

## Figure X.15: Handle Payment Webhook — POST /api/payment/handle-webhook (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ExtractEvent["Extract event<br/>from webhook body"]
    EventTypeOk{event.type =<br/>checkout_session.payment.paid?}
    Return200Ignore["Return 200 (ignore)"]
    ExtractData["Extract: refNum,<br/>rawPaymentMethod"]
    MapMethod["Map method code<br/>to display label"]
    UpdateDB[("findOneAndUpdate:<br/>status=Processing,<br/>paymentStatus=Paid, paidAt")]
    FoundOk{Request found?}
    Warn["Log warning;<br/>return 200"]
    UserIdOk{userId present?}
    PushNotif["PushNotificationService<br/>(non-blocking)"]
    BroadcastWS["broadcastQueueUpdate()<br/>WebSocket fanout"]
    GenPDF[["pdfService({templateKey, rawData})"]]
    PDFOk{PDF success?}
    LogPDFErr["Log error"]
    DriveOk{Drive authenticated?}
    SkipUpload["Log warning"]
    UploadDrive[["drive.uploadPdf(...)"]]
    UploadOk{Upload success?}
    DeleteTemp["fs.unlinkSync(pdfPath)"]
    Return200["Return 200 OK"]
    End(["END"])

    Start --> ExtractEvent
    ExtractEvent --> EventTypeOk
    EventTypeOk -->|No| Return200Ignore
    Return200Ignore --> End
    EventTypeOk -->|Yes| ExtractData
    ExtractData --> MapMethod
    MapMethod --> UpdateDB
    UpdateDB --> FoundOk
    FoundOk -->|No| Warn
    Warn --> End
    FoundOk -->|Yes| UserIdOk
    UserIdOk -->|Yes| PushNotif
    UserIdOk -->|No| BroadcastWS
    PushNotif --> BroadcastWS
    BroadcastWS --> GenPDF
    GenPDF --> PDFOk
    PDFOk -->|No| LogPDFErr
    LogPDFErr --> Return200
    PDFOk -->|Yes| DriveOk
    DriveOk -->|No| SkipUpload
    SkipUpload --> Return200
    DriveOk -->|Yes| UploadDrive
    UploadDrive --> UploadOk
    UploadOk -->|Yes| DeleteTemp
    UploadOk -->|No| Return200
    DeleteTemp --> Return200
    Return200 --> End
```

---

## Figure X.16: Generate PDF — POST /api/pdf/generate (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ReadBody["Receive body: type, data"]
    Init["Init: pdfPath=null<br/>uploaded=null<br/>errorToReturn=null"]
    GenPDF[["pdfService({templateKey, rawData})"]]
    PDFOk{PDF success?}
    SetPDFError["errorToReturn={status:500}"]
    CreateReq[["createRequestIfMissing(data)"]]
    SetMeta["namePrefix=refNum<br/>requestId=req._id"]
    DriveOk{Drive authenticated?}
    SetAuthError["errorToReturn={status:200,<br/>authUrl}"]
    UploadDrive[["drive.uploadPdf(...)"]]
    UploadOk{Upload success?}
    SetUploaded["uploaded = result"]
    SetUploadError["errorToReturn={status:500}"]
    Finally["FINALLY — always executes:<br/>fs.unlinkSync(pdfPath)"]
    UploadedOk{uploaded set?}
    Return200["Return 200:<br/>{uploaded:true, file}"]
    ReturnError["Return errorToReturn<br/>status + body"]
    End(["END"])

    Start --> ReadBody
    ReadBody --> Init
    Init --> GenPDF
    GenPDF --> PDFOk
    PDFOk -->|No| SetPDFError
    SetPDFError --> Finally
    PDFOk -->|Yes| CreateReq
    CreateReq --> SetMeta
    SetMeta --> DriveOk
    DriveOk -->|No| SetAuthError
    SetAuthError --> Finally
    DriveOk -->|Yes| UploadDrive
    UploadDrive --> UploadOk
    UploadOk -->|Yes| SetUploaded
    UploadOk -->|No| SetUploadError
    SetUploaded --> Finally
    SetUploadError --> Finally
    Finally --> UploadedOk
    UploadedOk -->|Yes| Return200
    UploadedOk -->|No| ReturnError
    Return200 --> End
    ReturnError --> End
```

---

## Figure X.17: Update Request Status — PATCH /api/pdf/status/:fileId (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ReadParams["params: fileId or referenceNumber<br/>body: status"]
    AdminOk{isAdminLoggedIn?}
    Return401["Return 401 Unauthorized"]
    IdentifierOk{Identifier present?}
    Return400Id["Return 400:<br/>identifier required"]
    StatusOk{status in valid enum?}
    Return400Status["Return 400:<br/>invalid status"]
    FindById[("MongoDB attempt 1:<br/>find by _id")]
    FoundById{Found by _id?}
    FindByRef[("MongoDB attempt 2:<br/>find by referenceNumber")]
    FoundByRef{Found by ref?}
    DriveQuery[["Drive fallback:<br/>extract ref from filename"]]
    FoundFinal{Found?}
    Return500["Return 500: not found"]
    Broadcast["broadcastQueueUpdate()"]
    Return200["Return 200:<br/>updated request"]
    End(["END"])

    Start --> ReadParams
    ReadParams --> AdminOk
    AdminOk -->|No| Return401
    Return401 --> End
    AdminOk -->|Yes| IdentifierOk
    IdentifierOk -->|No| Return400Id
    Return400Id --> End
    IdentifierOk -->|Yes| StatusOk
    StatusOk -->|No| Return400Status
    Return400Status --> End
    StatusOk -->|Yes| FindById
    FindById --> FoundById
    FoundById -->|Yes| Broadcast
    FoundById -->|No| FindByRef
    FindByRef --> FoundByRef
    FoundByRef -->|Yes| Broadcast
    FoundByRef -->|No| DriveQuery
    DriveQuery --> FoundFinal
    FoundFinal -->|No| Return500
    FoundFinal -->|Yes| Broadcast
    Return500 --> End
    Broadcast --> Return200
    Return200 --> End
```

---

## Figure X.18: Print Dispatch — POST /api/print/ (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ReadBody["Receive body: receipt fields"]
    PlatformOk{Platform = Linux?}

    AgentOk{isPrintAgentAvailable?}
    Return503["Return 503:<br/>No agent connected"]
    SendWS["sendPrintJob via WebSocket"]
    WSResultOk{result.success?}
    Return200WS["Return 200: Receipt sent"]
    Return500WS["Return 500: agent error"]

    ChoosePrinter[["choosePrinter()"]]
    PrinterOk{Thermal printer found?}
    Return500NP["Return 500:<br/>No printer found"]
    BuildPayload[["buildPayload(body)<br/>ESC/POS + QR code"]]
    SendPrinter[["sendToPrinter()<br/>PowerShell raw bytes"]]
    PSResultOk{result.ok?}
    Return200PS["Return 200: Receipt sent"]
    Return500PS["Return 500: stderr"]
    End(["END"])

    Start --> ReadBody
    ReadBody --> PlatformOk
    PlatformOk -->|Yes - Linux| AgentOk
    AgentOk -->|No| Return503
    AgentOk -->|Yes| SendWS
    SendWS --> WSResultOk
    WSResultOk -->|Yes| Return200WS
    WSResultOk -->|No| Return500WS
    PlatformOk -->|No - Windows| ChoosePrinter
    ChoosePrinter --> PrinterOk
    PrinterOk -->|No| Return500NP
    PrinterOk -->|Yes| BuildPayload
    BuildPayload --> SendPrinter
    SendPrinter --> PSResultOk
    PSResultOk -->|Yes| Return200PS
    PSResultOk -->|No| Return500PS
    Return503 --> End
    Return200WS --> End
    Return500WS --> End
    Return500NP --> End
    Return200PS --> End
    Return500PS --> End
```

---

## Figure X.19: WebSocket Agent Lifecycle (Mermaid Reference)

```mermaid
graph TD
    Start(["WS Upgrade Request"])
    SetupHandlers["ws.isAuthenticated=false<br/>ws.isAlive=true<br/>Register event listeners"]
    MsgType{message.type}

    Register["type: register"]
    SecretOk{agentSecret matches?}
    RejectConn["Send error;<br/>ws.close(4001)"]
    AssignId["agentId = randomBytes(8)<br/>printAgents.set(agentId, ws)"]
    SendRegistered["Send {registered, agentId}"]

    PrintResult["type: print-result"]
    GetCallback["pendingJobs.get(jobId)"]
    RunCallback["callback(success, error)<br/>pendingJobs.delete(jobId)"]

    QueueSub["type: subscribe-queue"]
    AddClient["queueClients.add(ws)"]
    SendSnapshot[["sendQueueSnapshot(ws)"]]

    PingMsg["type: ping"]
    SendPong["ws.send({type:'pong'})"]

    End(["—"])

    Start --> SetupHandlers
    SetupHandlers --> MsgType
    MsgType -->|register| Register
    Register --> SecretOk
    SecretOk -->|No| RejectConn
    SecretOk -->|Yes| AssignId
    AssignId --> SendRegistered
    MsgType -->|print-result| PrintResult
    PrintResult --> GetCallback
    GetCallback --> RunCallback
    MsgType -->|subscribe-queue| QueueSub
    QueueSub --> AddClient
    AddClient --> SendSnapshot
    MsgType -->|ping| PingMsg
    PingMsg --> SendPong
    RejectConn --> End
    SendRegistered --> End
    RunCallback --> End
    SendSnapshot --> End
    SendPong --> End
```

---

## Figure X.20: Queue Snapshot — GET /api/queue/ (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    QueryDB[("Request.find:<br/>status in Processing, For Pick-up<br/>deleted != true<br/>sort createdAt ASC")]
    MapResults["Map to:<br/>{_id, referenceNumber, document<br/>fullName, status, updatedAt}"]
    SplitArrays["nowServing = filter Processing<br/>forPickup = filter For Pick-up"]
    BuildSnapshot["snapshot = {nowServing,<br/>forPickup, updatedAt: ISO}"]
    Return200["Return 200: snapshot"]
    End(["END"])

    Start --> QueryDB
    QueryDB --> MapResults
    MapResults --> SplitArrays
    SplitArrays --> BuildSnapshot
    BuildSnapshot --> Return200
    Return200 --> End
```

---

## Figure X.21: Request OTP — POST /api/auth/request-otp (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ReadBody["Receive body:<br/>phoneNumber, fullName"]
    PhoneOk{phoneNumber present?}
    Return400["Return 400:<br/>phone required"]
    QueryUser[("User.findOne({phoneNumber})<br/>→ isNewUser flag")]
    GenOTP["OTP = crypto.randomInt(100000,999999)<br/>expiresAt = now + 5 min"]
    FormatPhone["Format: 0XXXXXXXXX → +63..."]
    DevBypass{NODE_ENV=dev AND<br/>SMS_DEV_BYPASS=true?}
    DevMode["Skip SMS;<br/>devMode=true"]
    SendSMS[["POST api.textbee.dev/sendSMS"]]
    SMSOk{SMS sent?}
    Return500SMS["Return 500: SMS error"]
    SignJWT["jwt.sign({phoneNumber, otp,<br/>expiresAt, fullName, isNewUser})"]
    Return200["Return 200:<br/>{otpToken, isNewUser, [devOtp]}"]
    End(["END"])

    Start --> ReadBody
    ReadBody --> PhoneOk
    PhoneOk -->|No| Return400
    Return400 --> End
    PhoneOk -->|Yes| QueryUser
    QueryUser --> GenOTP
    GenOTP --> FormatPhone
    FormatPhone --> DevBypass
    DevBypass -->|Yes| DevMode
    DevBypass -->|No| SendSMS
    DevMode --> SignJWT
    SendSMS --> SMSOk
    SMSOk -->|No| Return500SMS
    Return500SMS --> End
    SMSOk -->|Yes| SignJWT
    SignJWT --> Return200
    Return200 --> End
```

---

## Figure X.22: Verify OTP — POST /api/auth/verify-otp (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ReadBody["Receive body:<br/>otp, otpToken"]
    ParamsOk{otp AND otpToken present?}
    Return400Params["Return 400:<br/>params required"]
    VerifyJWT["jwt.verify(otpToken, JWT_SECRET)"]
    TokenOk{Token valid?}
    Return400Token["Return 400:<br/>token expired/invalid"]
    ExpiryOk{Date.now > expiresAt?}
    Return400Expiry["Return 400: OTP expired"]
    OTPMatch{enteredOTP = storedOTP?}
    Return400OTP["Return 400: Invalid OTP"]
    FindUser[("User.findOne({phoneNumber})")]
    UserFound{User found?}
    CreateUser[("Create User:<br/>phoneNumber, name,<br/>isPhoneVerified=true")]
    UpdateUser[("Update User:<br/>isPhoneVerified=true<br/>lastLoginAt=now")]
    GenTokens[["tokenManager.generateTokens()"]]
    Return200["Return 200:<br/>{token, refreshToken, user}"]
    End(["END"])

    Start --> ReadBody
    ReadBody --> ParamsOk
    ParamsOk -->|No| Return400Params
    Return400Params --> End
    ParamsOk -->|Yes| VerifyJWT
    VerifyJWT --> TokenOk
    TokenOk -->|No| Return400Token
    Return400Token --> End
    TokenOk -->|Yes| ExpiryOk
    ExpiryOk -->|Yes| Return400Expiry
    Return400Expiry --> End
    ExpiryOk -->|No| OTPMatch
    OTPMatch -->|No| Return400OTP
    Return400OTP --> End
    OTPMatch -->|Yes| FindUser
    FindUser --> UserFound
    UserFound -->|No| CreateUser
    UserFound -->|Yes| UpdateUser
    CreateUser --> GenTokens
    UpdateUser --> GenTokens
    GenTokens --> Return200
    Return200 --> End
```

---

## Figure X.23: Google Authentication — POST /api/auth/google (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ReadBody["Receive body:<br/>googleToken, email, fullName"]
    ParamsOk{googleToken AND email present?}
    Return400["Return 400: params required"]
    VerifyGoogle[["GET googleapis.com/userinfo/v2/me<br/>Bearer googleToken"]]
    GoogleOk{Response 200?}
    Return401Token["Return 401: invalid token"]
    EmailMatch{googleUser.email<br/>= request.email?}
    Return401Email["Return 401: email mismatch"]
    FindUser[("User.findOne({email OR googleId})")]
    UserFound{User found?}
    SplitName["firstName, lastName<br/>= split fullName"]
    CreateUser[("Create User:<br/>email, googleId,<br/>isEmailVerified=true")]
    PatchFields["Patch missing:<br/>googleId, profilePicture<br/>Set lastLoginAt; save"]
    GenTokens[["tokenManager.generateTokens()"]]
    Return200["Return 200:<br/>{token, refreshToken, user}"]
    End(["END"])

    Start --> ReadBody
    ReadBody --> ParamsOk
    ParamsOk -->|No| Return400
    Return400 --> End
    ParamsOk -->|Yes| VerifyGoogle
    VerifyGoogle --> GoogleOk
    GoogleOk -->|No| Return401Token
    Return401Token --> End
    GoogleOk -->|Yes| EmailMatch
    EmailMatch -->|No| Return401Email
    Return401Email --> End
    EmailMatch -->|Yes| FindUser
    FindUser --> UserFound
    UserFound -->|No| SplitName
    SplitName --> CreateUser
    UserFound -->|Yes| PatchFields
    CreateUser --> GenTokens
    PatchFields --> GenTokens
    GenTokens --> Return200
    Return200 --> End
```

---

## Figure X.24: Refresh Token — POST /api/auth/refresh-token (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ReadBody["Receive body: refreshToken"]
    ParamsOk{refreshToken present?}
    Return400["Return 400: token required"]
    VerifyRefresh[["tokenManager.verifyRefreshToken()<br/>jwt.verify(token, REFRESH_SECRET)"]]
    TokenOk{Token valid?}
    Return401Token["Return 401: invalid/expired"]
    FindUser[("User.findById(decoded.userId)")]
    ActiveOk{User found AND isActive=true?}
    Return401User["Return 401:<br/>user not found/inactive"]
    GenTokens[["tokenManager.generateTokens()<br/>new accessToken only"]]
    Return200["Return 200:<br/>{success, accessToken}"]
    End(["END"])

    Start --> ReadBody
    ReadBody --> ParamsOk
    ParamsOk -->|No| Return400
    Return400 --> End
    ParamsOk -->|Yes| VerifyRefresh
    VerifyRefresh --> TokenOk
    TokenOk -->|No| Return401Token
    Return401Token --> End
    TokenOk -->|Yes| FindUser
    FindUser --> ActiveOk
    ActiveOk -->|No| Return401User
    Return401User --> End
    ActiveOk -->|Yes| GenTokens
    GenTokens --> Return200
    Return200 --> End
```

---

## Figure X.25: Fee Policy Service — computeDocumentFee() (Mermaid Reference)

```mermaid
graph TD
    Start(["START"])
    ReadInput["Input: {document, purpose, isStudent}"]
    Normalize["docKey = document.toLowerCase().trim()"]
    LookupFees["BASE_FEES map lookup:<br/>clearance=50, indigency=0,<br/>residency=50, FTJSC=0,<br/>work permit=100, GMC=50,<br/>BP=300, BLD=300"]
    SetBase["baseFee = BASE_FEES[docKey] ?? 0"]
    NormStudent["isStudent: 'true'|'1'|true → true"]
    CheckWork["isWorkRelated = /work|employment|<br/>job|business/i.test(purpose)"]
    ClearanceOk{docKey =<br/>'barangay clearance'?}
    StudentOk{isStudent=true AND<br/>NOT isWorkRelated?}
    SetFree["amount=0<br/>reason='student_non_work_clearance'"]
    SetStandardClear["amount=baseFee<br/>reason='standard_clearance_fee'"]
    SetDefault["amount=baseFee<br/>reason='standard_fee'"]
    Return["Return {amount, reason}"]
    End(["END"])

    Start --> ReadInput
    ReadInput --> Normalize
    Normalize --> LookupFees
    LookupFees --> SetBase
    SetBase --> NormStudent
    NormStudent --> CheckWork
    CheckWork --> ClearanceOk
    ClearanceOk -->|No| SetDefault
    ClearanceOk -->|Yes| StudentOk
    StudentOk -->|Yes| SetFree
    StudentOk -->|No| SetStandardClear
    SetFree --> Return
    SetStandardClear --> Return
    SetDefault --> Return
    Return --> End
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
