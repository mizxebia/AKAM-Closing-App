# New Sales Closure (NSC) — Complete Ticket Lifecycle Documentation

---

## 1. Executive Summary

The **New Sales Closure (NSC)** application is a React/TypeScript single-page application embedded inside Microsoft Power Apps, used by property management staff at **AKAM Associates** to manage real estate closing workflows. The application orchestrates the full lifecycle of a closing ticket — from initial creation through automated document retrieval, manual review, YARDI ownership transfer, and final handoff to the Accounts Receivable (AR) team.

The lifecycle is governed by two primary status fields:

- **Ticket Status** (`cr7de_ticketstatus`) — the human-visible lifecycle state
- **Bot Status** (`cr109_botstatus`) — the granular automation progress marker

The application spans **13 stages** across a typical ticket lifecycle, involving coordination between Dataverse (data store), Power Automate (cloud and desktop flows), Domecile (document repository), YARDI (property management/accounting system), SharePoint (building list), and OneDrive (document storage).

---

## 2. Application Overview

### What the Application Does

The Closing Management System automates the real estate closing process at AKAM Associates. When a property unit changes ownership (sale or transfer), staff use this application to track and manage every step — from retrieving seller data and closing documents, through invoice generation, charge reconciliation, and ultimately creating the new owner record in YARDI.

### Primary Purpose and Business Objective

- **Eliminate manual tracking** of closings across spreadsheets and emails
- **Enforce process order** — each stage must complete before the next can begin
- **Automate data retrieval** from Domecile, YARDI, and document extraction via Power Automate
- **Provide a single audit trail** for all changes and actions
- **Reduce errors** by validating data before ownership transfer

### Types of Tickets Processed

The application processes **Closing Tickets** for three package types:

| Numeric Code | Package Type | Description |
|---|---|---|
| `396620000` | Condo Sale | Condominium unit sale |
| `396620001` | Coop Sale | Cooperative apartment sale |
| `396620002` | Coop Transfer | Cooperative apartment transfer (buyer already exists in YARDI) |

Each closing ticket also has a **Transaction Type**:

| Numeric Code | Transaction Type |
|---|---|
| `396620000` | All Cash |
| `396620001` | Financing |
| `396620002` | Transfer |
| `396620003` | Trust Transfer |

### Key Components/Modules

| Module | Purpose | Location |
|---|---|---|
| `closingTickets` | Primary feature — ticket CRUD, dashboard, detail page, form, workflow tabs | `src/features/closingTickets/` |
| `newOwnerTickets` | New Owner Ticket form, document viewer, validation logic | `src/features/newOwnerTickets/` |
| `invoices` | Invoice line items management and invoice PDF generation | `src/features/invoices/` |
| `charges` | YARDI charges — unpaid charges, scheduled charges, seller/buyer ledgers | `src/features/charges/` |
| `auditLog` | Write-only audit service for all data changes and actions | `src/features/auditLog/` |
| `devTools` | Developer mode — status overrides, manual document uploads, bulk operations | `src/features/devTools/` |
| `generated` | Auto-generated Dataverse service wrappers and TypeScript models | `src/generated/` |

---

## 3. Components and Integrations

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Microsoft Power Apps                             │
│                      (Custom Page host frame)                           │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │           React SPA  (src/)  — Vite + TypeScript                │   │
│   │                                                                 │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │   │
│   │  │ closingTickets│  │   invoices   │  │     newOwnerTickets   │ │   │
│   │  │   (primary)  │  │  (Invoice    │  │  (New Owner Ticket    │ │   │
│   │  │              │  │   tab)       │  │   tab + PDF viewer)   │ │   │
│   │  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘ │   │
│   │         │                 │                      │              │   │
│   │  ┌──────┴───────┐  ┌──────┴───────┐              │              │   │
│   │  │   charges    │  │  auditLog    │              │              │   │
│   │  │ (Yardi tab)  │  │  (write-only)│              │              │   │
│   │  └──────┬───────┘  └──────┬───────┘              │              │   │
│   │         │                 │                      │              │   │
│   │  ┌──────▼─────────────────▼──────────────────────▼──────────┐  │   │
│   │  │               src/generated/  (DO NOT EDIT)              │  │   │
│   │  │   Services (CRUD wrappers) + Models (TypeScript types)   │  │   │
│   │  └──────────────────────────┬────────────────────────────────┘  │   │
│   └─────────────────────────────┼─────────────────────────────────┘   │
│                                 │  Power Apps connector runtime        │
│              ┌──────────────────┼─────────────────────┐               │
│              ▼                  ▼                     ▼               │
│     ┌────────────────┐  ┌───────────────┐  ┌────────────────────┐    │
│     │   Dataverse    │  │  SharePoint   │  │  Power Automate    │    │
│     │  (9 entities)  │  │ Building List │  │  (Cloud + Desktop  │    │
│     │                │  │               │  │   Flows)           │    │
│     └────────────────┘  └───────────────┘  └────────────────────┘    │
│                                                                       │
│     ┌────────────────┐  ┌───────────────┐  ┌────────────────────┐    │
│     │   Domecile     │  │   YARDI       │  │   OneDrive         │    │
│     │ (Doc Repo)     │  │ (Accounting)  │  │ (File Storage)     │    │
│     └────────────────┘  └───────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dataverse Entities

| Entity Logical Name | Purpose |
|---|---|
| `cr7de_closingticketdetailses` | Primary closing ticket records |
| `cr7de_newownerticketdetailses` | New owner ticket records (linked by `cr7de_ticketid`) |
| `cr7de_invoicedetailses` | Invoice line items (linked by `cr7de_ticketid`) |
| `crc5c_unpaidchargeses` | Unpaid charges from YARDI |
| `crc5c_copyscheduledchargeses` | Scheduled charges from YARDI |
| `crc5c_sellerledgers` | Seller ledger entries |
| `crc5c_buyerledgers` | Buyer ledger entries |
| `crc5c_manualchargeses` | Manually created charge entries |
| `cr7de_appchangelogs` | Audit log entries |

### Power Automate Flows (Triggered by Application)

| Flow Name | Service Class | Trigger Input | Purpose |
|---|---|---|---|
| `nsc_generate_invoice` | `NSC_Generate_InvoiceService` | Ticket ID (string) | Generates the closing invoice PDF |
| `nsc_generate_new_owner_ticket` | `NSC_Generate_New_Owner_TicketService` | Ticket ID (string) | Generates the New Owner Ticket PDF |
| `nsc_send_email_to_ar` | `NSC_Send_Email_To_ARService` | Ticket ID (string) | Sends closing documents to the AR Team via email |

### Power Automate Flows (External/Background — Not Triggered by Application)

These flows run independently (triggered by Dataverse record changes or scheduled) and are identified from the bot status progression in the codebase:

| Flow Name | Purpose |
|---|---|
| NSC_DOMECILE_DUMP (Cloud Flow) | Retrieves Domecile data for tickets with Bot Status = Draft |
| NSC Yardi Seller Details (Desktop Flow) | Retrieves seller information from YARDI |
| NSC Purchase Application Form Download (Desktop Flow) | Downloads the Purchase Application Form |
| NSC_PurchaseFormUpload (Cloud Flow) | Uploads the Purchase Application Form to OneDrive |
| NSC_PurchaseApplication_DataExtraction (Cloud Flow) | Extracts data from the Purchase Application Form |
| NSC_RPTT_DataExtraction (Cloud Flow) | Extracts data from the RPTT document |
| NSC Fetch YARDI Charges (Desktop Flow) | Fetches charges from YARDI |
| NSC Yardi Seller Update (Desktop Flow) | Updates seller details in YARDI |
| NSC Yardi Create New Owner (Desktop Flow) | Creates the new owner record in YARDI |

### External System Integrations

| System | URL Pattern | Role |
|---|---|---|
| **Domecile** | `https://akam.domecile.com/` | Document repository — the application links to the Domecile package URL for each ticket |
| **YARDI** | `https://096836akama.yardione.com/` | Property management/accounting — seller/buyer T-Codes, charges, owner records |
| **SharePoint** | Building List connector | Provides building lookup data (address, NYC code, legal name) |
| **OneDrive** | Via Power Automate | Stores uploaded Purchase Application Forms for data extraction |

---

## 4. Ticket Lifecycle — End to End

### Stage 1 — Ticket Creation

**Trigger:** User clicks "Create New Closing" on the dashboard and fills the creation form.

**What the application does:**
1. Generates a unique Ticket ID in format `CL-XXXXXXXXX` (9-digit random number)
2. Auto-populates the closing agent name and email from the current user's identity
3. Looks up the NYC Code against the cached SharePoint building list to auto-fill Legal Name
4. Validates the form (see Business Rules section)
5. Creates the closing ticket record in Dataverse via `Cr7de_closingticketdetailsesService.create()`
6. Creates/syncs a corresponding New Owner Ticket record via `syncNewOwnerTicketFromClosingTicket()`
7. Uploads any pending files (Purchase Application Form if building not on Domecile)
8. Writes a `create` audit log entry

**Two creation paths exist:**

#### Path A — Standard (Building on Domecile)

| Field | Value |
|---|---|
| Ticket Status | `716070000` → **Draft** |
| Bot Status | Not explicitly set (defaults to none/empty until external flow sets it to Draft `396620004`) |

The ticket is saved with Draft status. External Power Automate flows detect the new Draft ticket and begin automated processing (Stage 2).

#### Path B — Building Not on Domecile

When the "Building not on Domecile" flag (`cr7de_buildingnotondomicile`) is checked:

| Field | Value |
|---|---|
| Ticket Status | `716070005` → **Processing** |
| Bot Status | `396620001` → **FormDownloaded** |

The Purchase Application Form **must** be uploaded at creation time (validated). The ticket skips Stages 2–5 (automated Domecile/Seller retrieval) and continues from Stage 6.

**Relevant code:** `CreateClosingTicketForm` in `src/features/closingTickets/components/CreateClosingTicketForm.tsx`

---

### Stage 2 — Domecile Data Retrieval

**Trigger:** External Power Automate Cloud Flow (`NSC_DOMECILE_DUMP`) detects tickets with Bot Status = Draft.

**What happens:** The flow retrieves the Domecile document package data for the building/unit and writes the `cr109_domecilepackageurl` and other extracted data to the closing ticket record.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | `716070005` → **Processing** | `396620006` → **DomecileDumpRetrieved** |
| Failure | `716070007` → **Failed** | `396620009` → **FailedDomecileDumpRetrieval** |

**Handled by:** External Power Automate flow (not triggered by the application).

---

### Stage 3 — Seller Information Retrieval

**Trigger:** External Power Automate Desktop Flow (`NSC Yardi Seller Details`) runs after successful Domecile data retrieval.

**What happens:** The flow retrieves seller information from YARDI using the Seller T-Code and populates seller name, building details, and other fields on the closing ticket.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | `716070005` → **Processing** | `396620000` → **SellerInfoRetrieved** |
| Failure | `716070007` → **Failed** | `396620005` → **FailedSellerInfoRetrieval** |

**Handled by:** External Power Automate flow.

---

### Stage 4 — Purchase Application Form Download

**Trigger:** External Power Automate Desktop Flow (`NSC Purchase Application Form Download`) runs after successful seller information retrieval.

**What happens:** The flow downloads the Purchase Application Form from Domecile.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | `716070005` → **Processing** | `396620001` → **FormDownloaded** |
| Failure | `716070005` → **Processing** | `396620008` → **FailedFormDownload** |

> **Note:** A failed form download does **not** change the ticket status to Failed. The ticket remains in Processing because the download can be retried automatically.

**Handled by:** External Power Automate flow.

---

### Stage 5 — Purchase Application Form Upload to OneDrive

**Trigger:** External Power Automate Cloud Flow (`NSC_PurchaseFormUpload`) runs after the form has been downloaded.

**What happens:** The flow uploads the Purchase Application Form to OneDrive for data extraction.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | `716070005` → **Processing** | `396620015` → **PurchaseFormUploadOnedrive** |
| Failure | `716070007` → **Failed** | `396620016` → **FailedPurchaseFormUploadOnedrive** |

**Handled by:** External Power Automate flow.

---

### Stage 6 — Purchase Form Data Extraction

**Trigger:** External Power Automate Cloud Flow (`NSC_PurchaseApplication_DataExtraction`) runs after the form has been uploaded to OneDrive.

**What happens:** The flow extracts structured data from the Purchase Application Form (buyer details, transaction details, etc.) and writes them to the closing ticket record.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | `716070006` → **ReadyForPostClosing** | `396620013` → **PurchaseFormDataExtracted** |
| Failure | `716070007` → **Failed** | `396620014` → **FailedPurchaseFormDataExtraction** |

This is the first stage where the ticket becomes visible to the user for manual interaction (the ticket moves from Processing to ReadyForPostClosing).

**Handled by:** External Power Automate flow.

---

### Stage 7 — RPTT Upload and Move to Post Closing

This is the first **user-driven** stage after initial automation.

#### Step 7a — Upload RPTT Document

**Trigger:** User uploads the RPTT (Real Property Transfer Tax Return) / ACRIS document via the Closing Details form and saves.

**What the application does:**
1. Uploads the file to Dataverse via `uploadClosingTicketFile()` to column `cr109_rpttdocument`
2. Updates the bot status to RPTTUploaded via `updateClosingTicket()`
3. Writes an audit log entry

| Action | Ticket Status | Bot Status |
|---|---|---|
| RPTT uploaded and saved | `716070006` → **ReadyForPostClosing** (unchanged) | `396620010` → **RPTTUploaded** |

**Relevant code:** `EditClosingTicketForm` in `CreateClosingTicketForm.tsx`, lines handling `pendingFiles.cr109_rpttdocument`

#### Step 7b — Move to Post Closing

**Trigger:** User clicks the "Move to Post Closing" button (visible only when Ticket Status = ReadyForPostClosing **and** RPTT document has been uploaded).

**What the application does:**
1. Calls `updateClosingTicket()` with `cr7de_ticketstatus: 716070004` (PostClosing)
2. Writes an audit log entry

| Action | Ticket Status | Bot Status |
|---|---|---|
| User clicks Move to Post Closing | `716070004` → **PostClosing** | `396620010` → **RPTTUploaded** (unchanged) |

**Relevant code:** `handleMoveToPostClosing()` in `CreateClosingTicketForm.tsx`

#### Rollback Behavior — RPTT Document Deletion

If the user deletes the RPTT document while the ticket is in PostClosing or ValidateClosings, the application automatically rolls back:

| Current Status | New Ticket Status | New Bot Status |
|---|---|---|
| PostClosing | `716070006` → **ReadyForPostClosing** | (unchanged) |
| ValidateClosings | `716070006` → **ReadyForPostClosing** | `396620013` → **PurchaseFormDataExtracted** |

**Relevant code:** `handleDeleteDocument()` in `CreateClosingTicketForm.tsx`

---

### Stage 8 — RPTT Data Extraction

**Trigger:** External Power Automate Cloud Flow (`NSC_RPTT_DataExtraction`) detects tickets with Bot Status = RPTTUploaded.

**What happens:** The flow extracts property transfer data from the RPTT document.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | `716070001` → **ValidateClosings** | `396620020` → **RPTTExtracted** |
| Failure | `716070007` → **Failed** | `396620019` → **FailedRPTTExtraction** |

**Handled by:** External Power Automate flow.

---

### Stage 9 — Fetch YARDI Charges

**Trigger:** External Power Automate Desktop Flow (`NSC Fetch YARDI Charges`) runs after RPTT data extraction.

**What happens:** The flow fetches unpaid charges, scheduled charges, and ledger data from YARDI and writes them to the corresponding Dataverse entities.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | `716070001` → **ValidateClosings** | `396620011` → **YARDIChargesFetched** |
| Failure | `716070007` → **Failed** | `396620012` → **FailedYardiChargesFetch** |

**Handled by:** External Power Automate flow.

---

### Stage 9a — YARDI Charges Updated (Optional)

**Trigger:** External automation or user-driven charge reconciliation marks charges as updated.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Charges Updated | `716070001` → **ValidateClosings** | `396620021` → **YardiChargesUpdated** |

---

### Stage 10 — Validation

**Performed by:** User (application logic in `NewOwnerTicketTab`)

#### Preconditions for Validation

The **Validate** button becomes visible only when **all** of the following conditions are met:

1. Ticket Status = `716070001` (**ValidateClosings**)
2. Bot Status = `396620011` (**YARDIChargesFetched**) OR `396620021` (**YardiChargesUpdated**)
3. All three required documents are present on the closing ticket:
   - Purchase Application Form (`cr109_purchaseapplicationform`)
   - RPTT Document (`cr109_rpttdocument`)
   - New Owner Ticket PDF (`cr109_newownerticketpdf`)
4. No scheduled charges have an unconfirmed "TBD" amount (`isUnconfirmedChargeAmount()`)

#### What happens on Validate

1. Application calls `updateClosingTicket()` with:
   - `cr7de_ticketstatus: 716070002` (TransferringBuilding)
   - `cr109_botstatus: 396620007` (InformationValidated)
2. Writes an `action` audit log entry with `Validate Closing` and a curated snapshot of the New Owner Ticket data
3. Triggers `onGenerateTicket()` to regenerate the New Owner Ticket PDF with the latest data

| Action | Ticket Status | Bot Status |
|---|---|---|
| User clicks Validate | `716070002` → **TransferringBuilding** | `396620007` → **InformationValidated** |

#### Post-Validation Behavior

Once validation is completed:
- The application becomes **read-only** — the form is locked
- Users can no longer edit ticket details, charges, or documents
- The closing details form shows a "Processing..." indicator
- External automation takes over for the final stages

**Relevant code:** `validateClosingTicket()` in `src/features/newOwnerTickets/components/NewOwnerTicketTab.tsx`

---

### Stage 11 — Seller Details Update

**Trigger:** External Power Automate Desktop Flow (`NSC Yardi Seller Update`) detects tickets with Bot Status = InformationValidated.

**What happens:** The flow updates the seller's details in YARDI based on the validated closing ticket data.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | `716070002` → **TransferringBuilding** (unchanged) | `396620002` → **SellerDetailsUpdated** |
| Failure | `716070007` → **Failed** | `396620017` → **FailedSellerDetailsUpdate** |

**Handled by:** External Power Automate flow.

---

### Stage 12 — Create New Owner

**Trigger:** External Power Automate Desktop Flow (`NSC Yardi Create New Owner`) runs after seller details have been updated.

**What happens:** The flow creates the new owner record in YARDI, transferring ownership of the unit.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | `716070008` → **Completed** | `396620003` → **OwnerRecordCreated** |
| Failure | `716070007` → **Failed** | `396620018` → **FailedCreateNewOwner** |

**Handled by:** External Power Automate flow.

---

### Stage 13 — Send to AR Team (Post-Completion)

**Trigger:** User accesses the "Send to AR Team" tab, which appears only when the ticket is **Completed** (with Bot Status = OwnerRecordCreated) **or** already **Sent to AR**.

#### What the user does:
1. Uploads the **Cheques Document** and **Batch Document** (if not already present)
2. Reviews/edits the pre-populated email subject and body
3. Optionally saves a draft (`handleSaveDraft()`)
4. Clicks "Send to AR Team" (`handleSend()`)

#### What the application does on Send:
1. Persists the email subject and body to the closing ticket (`cr109_emailsubject`, `cr109_emailbody`)
2. Regenerates the New Owner Ticket PDF via `NSC_Generate_New_Owner_TicketService.Run()`
3. Triggers the Send to AR email flow via `NSC_Send_Email_To_ARService.Run()`
4. Refreshes the closing ticket record
5. Writes an `action` audit log entry

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | `396620001` → **SenttoAR** | `396620022` → **SentToAR** |
| Flow Failure | Error displayed | Unchanged |

**Relevant code:** `handleSendToAR()` in `ClosingTicketDetailsPage.tsx`, `SendToATeamTab.tsx`

---

## 5. Ticket Status Lifecycle

### All Ticket Status Values

| Numeric Code | Dataverse Label | Display Label | Description |
|---|---|---|---|
| `716070000` | Draft | Draft | Ticket created, awaiting automated processing |
| `716070005` | Processing | Processing | Automated processing underway (Stages 2–5) |
| `716070006` | ReadyForPostClosing | Ready for Post Closing | Purchase form data extracted; awaiting RPTT upload |
| `716070004` | PostClosing | Post Closing | User has uploaded RPTT and moved to post-closing |
| `716070001` | ValidateClosings | Validate Closings | RPTT extracted and YARDI charges fetched; ready for validation |
| `716070002` | TransferringBuilding | Transferring Building | Validated; YARDI ownership transfer in progress |
| `716070007` | Failed | Failed | Processing failed at any automated stage |
| `716070008` | Completed | Completed | New owner record created; ticket lifecycle complete |
| `396620001` | SenttoAR | Sent to AR | Documents sent to Accounts Receivable team |

### Ticket Status Progression (Normal Path)

```
Draft → Processing → ReadyForPostClosing → PostClosing → ValidateClosings → TransferringBuilding → Completed → SenttoAR
```

---

## 6. Bot Status Lifecycle

### All Bot Status Values — Success States

| Numeric Code | Label | Stage |
|---|---|---|
| `396620004` | Draft | Stage 1 — Initial |
| `396620006` | DomecileDumpRetrieved | Stage 2 — Domecile data retrieved |
| `396620000` | SellerInfoRetrieved | Stage 3 — Seller info from YARDI |
| `396620001` | FormDownloaded | Stage 4 — Purchase form downloaded |
| `396620015` | PurchaseFormUploadOnedrive | Stage 5 — Form uploaded to OneDrive |
| `396620013` | PurchaseFormDataExtracted | Stage 6 — Form data extracted |
| `396620010` | RPTTUploaded | Stage 7 — RPTT document uploaded |
| `396620020` | RPTTExtracted | Stage 8 — RPTT data extracted |
| `396620011` | YARDIChargesFetched | Stage 9 — YARDI charges fetched |
| `396620021` | YardiChargesUpdated | Stage 9a — YARDI charges updated |
| `396620007` | InformationValidated | Stage 10 — User validated |
| `396620002` | SellerDetailsUpdated | Stage 11 — Seller updated in YARDI |
| `396620003` | OwnerRecordCreated | Stage 12 — New owner created |
| `396620022` | SentToAR | Stage 13 — Sent to AR team |

### All Bot Status Values — Failure States

| Numeric Code | Label | Failure Description |
|---|---|---|
| `396620009` | FailedDomecileDumpRetrieval | Domecile dump could not be retrieved |
| `396620005` | FailedSellerInfoRetrieval | Seller information could not be retrieved from YARDI |
| `396620008` | FailedFormDownload | Purchase application form failed to download |
| `396620016` | FailedPurchaseFormUploadOnedrive | Purchase form could not be uploaded to OneDrive |
| `396620014` | FailedPurchaseFormDataExtraction | Purchase form data extraction failed |
| `396620019` | FailedRPTTExtraction | RPTT document extraction failed |
| `396620012` | FailedYardiChargesFetch | YARDI charges could not be fetched |
| `396620017` | FailedSellerDetailsUpdate | Seller details update failed |
| `396620018` | FailedCreateNewOwner | New owner record could not be created |
| `396620023` | FailedtoSendtoAR | Failed to send to AR team |

---

## 7. Ticket Status ↔ Bot Status Transition Matrix

| Stage | Trigger/Condition | Ticket Status Before | Ticket Status After | Bot Status Before | Bot Status After | Application Action | Next Stage |
|---|---|---|---|---|---|---|---|
| 1 — Creation (Standard) | User creates ticket | *(none)* | `Draft` (716070000) | *(none)* | *(empty — set by flow to Draft)* | `createClosingTicket()` + `syncNewOwnerTicketFromClosingTicket()` | Stage 2 |
| 1 — Creation (Not on Domecile) | User creates ticket with flag | *(none)* | `Processing` (716070005) | *(none)* | `FormDownloaded` (396620001) | `createClosingTicket()` + upload PAF | Stage 6 |
| 2 — Domecile Retrieval ✓ | External flow | `Draft` (716070000) | `Processing` (716070005) | `Draft` (396620004) | `DomecileDumpRetrieved` (396620006) | *(external)* | Stage 3 |
| 2 — Domecile Retrieval ✗ | External flow failure | `Draft` (716070000) | `Failed` (716070007) | `Draft` (396620004) | `FailedDomecileDumpRetrieval` (396620009) | *(external)* | *(terminal)* |
| 3 — Seller Info ✓ | External flow | `Processing` (716070005) | `Processing` (716070005) | `DomecileDumpRetrieved` (396620006) | `SellerInfoRetrieved` (396620000) | *(external)* | Stage 4 |
| 3 — Seller Info ✗ | External flow failure | `Processing` (716070005) | `Failed` (716070007) | `DomecileDumpRetrieved` (396620006) | `FailedSellerInfoRetrieval` (396620005) | *(external)* | *(terminal)* |
| 4 — Form Download ✓ | External flow | `Processing` (716070005) | `Processing` (716070005) | `SellerInfoRetrieved` (396620000) | `FormDownloaded` (396620001) | *(external)* | Stage 5 |
| 4 — Form Download ✗ | External flow failure | `Processing` (716070005) | `Processing` (716070005) | `SellerInfoRetrieved` (396620000) | `FailedFormDownload` (396620008) | *(external — retryable)* | Retry Stage 4 |
| 5 — Form Upload ✓ | External flow | `Processing` (716070005) | `Processing` (716070005) | `FormDownloaded` (396620001) | `PurchaseFormUploadOnedrive` (396620015) | *(external)* | Stage 6 |
| 5 — Form Upload ✗ | External flow failure | `Processing` (716070005) | `Failed` (716070007) | `FormDownloaded` (396620001) | `FailedPurchaseFormUploadOnedrive` (396620016) | *(external)* | *(terminal)* |
| 6 — Form Extraction ✓ | External flow | `Processing` (716070005) | `ReadyForPostClosing` (716070006) | `PurchaseFormUploadOnedrive` (396620015) | `PurchaseFormDataExtracted` (396620013) | *(external)* | Stage 7 |
| 6 — Form Extraction ✗ | External flow failure | `Processing` (716070005) | `Failed` (716070007) | `PurchaseFormUploadOnedrive` (396620015) | `FailedPurchaseFormDataExtraction` (396620014) | *(external)* | *(terminal)* |
| 7a — RPTT Upload | User uploads RPTT | `ReadyForPostClosing` (716070006) | `ReadyForPostClosing` (716070006) | `PurchaseFormDataExtracted` (396620013) | `RPTTUploaded` (396620010) | `updateClosingTicket()` | Stage 7b |
| 7b — Move to Post Closing | User clicks button | `ReadyForPostClosing` (716070006) | `PostClosing` (716070004) | `RPTTUploaded` (396620010) | `RPTTUploaded` (396620010) | `updateTicketStatus()` | Stage 8 |
| 7 — RPTT Delete (rollback) | User deletes RPTT doc | `PostClosing`/`ValidateClosings` | `ReadyForPostClosing` (716070006) | varies | `PurchaseFormDataExtracted` (396620013)* | `handleDeleteDocument()` | Stage 7a |
| 8 — RPTT Extraction ✓ | External flow | `PostClosing` (716070004) | `ValidateClosings` (716070001) | `RPTTUploaded` (396620010) | `RPTTExtracted` (396620020) | *(external)* | Stage 9 |
| 8 — RPTT Extraction ✗ | External flow failure | `PostClosing` (716070004) | `Failed` (716070007) | `RPTTUploaded` (396620010) | `FailedRPTTExtraction` (396620019) | *(external)* | *(terminal)* |
| 9 — YARDI Charges ✓ | External flow | `ValidateClosings` (716070001) | `ValidateClosings` (716070001) | `RPTTExtracted` (396620020) | `YARDIChargesFetched` (396620011) | *(external)* | Stage 10 |
| 9 — YARDI Charges ✗ | External flow failure | `ValidateClosings` (716070001) | `Failed` (716070007) | `RPTTExtracted` (396620020) | `FailedYardiChargesFetch` (396620012) | *(external)* | *(terminal)* |
| 10 — Validation | User clicks Validate | `ValidateClosings` (716070001) | `TransferringBuilding` (716070002) | `YARDIChargesFetched`/`YardiChargesUpdated` | `InformationValidated` (396620007) | `validateClosingTicket()` | Stage 11 |
| 11 — Seller Update ✓ | External flow | `TransferringBuilding` (716070002) | `TransferringBuilding` (716070002) | `InformationValidated` (396620007) | `SellerDetailsUpdated` (396620002) | *(external)* | Stage 12 |
| 11 — Seller Update ✗ | External flow failure | `TransferringBuilding` (716070002) | `Failed` (716070007) | `InformationValidated` (396620007) | `FailedSellerDetailsUpdate` (396620017) | *(external)* | *(terminal)* |
| 12 — Create Owner ✓ | External flow | `TransferringBuilding` (716070002) | `Completed` (716070008) | `SellerDetailsUpdated` (396620002) | `OwnerRecordCreated` (396620003) | *(external)* | Stage 13 |
| 12 — Create Owner ✗ | External flow failure | `TransferringBuilding` (716070002) | `Failed` (716070007) | `SellerDetailsUpdated` (396620002) | `FailedCreateNewOwner` (396620018) | *(external)* | *(terminal)* |
| 13 — Send to AR ✓ | User sends to AR | `Completed` (716070008) | `SenttoAR` (396620001) | `OwnerRecordCreated` (396620003) | `SentToAR` (396620022) | `NSC_Send_Email_To_ARService.Run()` | *(terminal — lifecycle complete)* |

> *\* Bot status reset on RPTT deletion only applies when rolling back from ValidateClosings. From PostClosing, only the Ticket Status rolls back.*

---

## 8. Business Rules and Validations

### Closing Ticket Creation Validations

Performed in `validateForm()` in `CreateClosingTicketForm.tsx`:

| Rule | Condition | Error Message |
|---|---|---|
| Ticket ID required | `cr7de_ticketid` is empty | "Ticket ID is required." |
| Ticket Status required | `cr7de_ticketstatus` is empty | "Ticket status is required." |
| Unit Number required | `cr7de_unitnumber` is empty | "Unit number is required." |
| NYC Code required | `cr7de_nyccode` is empty | "NYC code is required." |
| Package Type required | `cr109_packagetype` is empty | "Package type is required." |
| Seller T-Code required | `cr7de_sellertcode` is empty | "Seller T-Code is required." |
| Seller T-Code format | Does not start with 'T' | "Seller T-Code must start with the letter 'T'." |
| Buyer T-Code required (Coop Transfer) | Package Type = Coop Transfer and `cr7de_buyertcode` is empty | "Buyer T-Code is required for Coop Transfer." |
| Email format | `cr7de_closingagentemail` present but not valid email | "Enter a valid email address." |
| PAF required (Not on Domecile) | Building not on Domecile flag = true and no PAF file | "Purchase Application Form is required when building is not on Domecile." |

### NYC Code Validation

Only building codes starting with "NY" are considered valid (`hasNycCode()` in `buildingListCache.ts`). The building lookup filters the SharePoint list by this prefix.

### Coop Transfer Auto-Flags

When Package Type is changed to Coop Transfer (`396620002`):
- `cr7de_buyerexistsinyardi` is automatically set to `true`
- When Package Type is changed away from Coop Transfer, `cr7de_buyerexistsinyardi` is reset to `false` and `cr7de_buyertcode` is cleared

### New Owner Ticket Validations

Performed in `validateForm()` in `NewOwnerTicketTab.tsx`:

| Rule | Condition |
|---|---|
| Ticket ID required | `cr7de_ticketid` is empty |
| Unit required | `cr7de_unit` is empty |
| Valid email format | `cr7de_primaryowneremail`, `cr7de_secondaryowneremail`, `cr7de_sellercontactemail` — only validated when containing '@' |
| Buyer 1 address required (Absent) | When `cr109_purchaser1occupancy` = 'Absent', address/city/state/zip become required |
| Buyer 2 address required (Absent) | When `cr109_purchaser2occupancy` = 'Absent', address/city/state/zip become required |

### Validation Gate (Stage 10)

Validate button requires:
1. Ticket Status = ValidateClosings (`716070001`)
2. Bot Status = YARDIChargesFetched (`396620011`) OR YardiChargesUpdated (`396620021`)
3. All documents present: Purchase Application Form, RPTT, New Owner Ticket PDF
4. No scheduled charges with amount = "TBD"

### Read-Only Lock Rules

The form becomes read-only when Ticket Status is:
- `Processing` (`716070005`) — automation is running
- `TransferringBuilding` (`716070002`) — post-validation automation
- `Completed` (`716070008`) — lifecycle complete
- `SenttoAR` (`396620001`) — sent to AR

### "Fully Completed" Determination

A ticket is considered "fully completed" when:
- Ticket Status = `Completed` (`716070008`) **AND**
- Bot Status = `OwnerRecordCreated` (`396620003`)

This gates the visibility of the "Send to AR Team" tab.

### Text Normalization

- All string fields are trimmed via `trimStringFields()` before saving to Dataverse
- Empty strings are converted to `undefined` via `normalizeText()`
- Name/SSN/address fields default to `'N/A'` when blank via `normalizeOrNA()`
- SSN/EIN fields accept digits only, max 9 characters

### Data Sync Between Closing Ticket and New Owner Ticket

Shared fields are automatically synchronized bidirectionally:
- **Closing → New Owner:** `buildNewOwnerPayloadFromClosingTicket()` maps fields like `cr7de_unitnumber` → `cr7de_unit`, `cr7de_buyername` → `cr7de_newprimaryownername`, etc.
- **New Owner → Closing:** `buildClosingPayloadFromNewOwnerTicket()` maps fields back

Sync occurs on every save of either form.

---

## 9. Decision Points and Exception Paths

### Decision Point 1: Building on Domecile?

```
Ticket Creation
    ├── Building on Domecile (flag = false)
    │     → Ticket Status: Draft
    │     → Bot Status: (empty/Draft)
    │     → Enters automated Stages 2-6
    │
    └── Building NOT on Domecile (flag = true)
          → Requires PAF upload at creation
          → Ticket Status: Processing
          → Bot Status: FormDownloaded
          → Skips to Stage 6
```

### Decision Point 2: Each Automated Stage

```
Automated Stage (External Flow)
    ├── Success → Bot Status advances → Next Stage
    └── Failure → Ticket Status: Failed
                → Bot Status: Failed[StageName]
                → Ticket appears as "Failed" on dashboard
                → Failure reason displayed in UI
```

### Decision Point 3: RPTT Upload Readiness

```
ReadyForPostClosing
    ├── RPTT not uploaded → "Move to Post Closing" button hidden
    └── RPTT uploaded → Bot Status: RPTTUploaded
          → "Move to Post Closing" button visible
```

### Decision Point 4: RPTT Document Deletion

```
User deletes RPTT document
    ├── Current status: PostClosing
    │     → Rolls back to ReadyForPostClosing
    │
    └── Current status: ValidateClosings
          → Rolls back to ReadyForPostClosing
          → Bot Status reset to PurchaseFormDataExtracted
```

### Decision Point 5: Validate Button Availability

```
ValidateClosings status?
    ├── No → Validate button hidden
    └── Yes
          ├── Bot Status = YARDIChargesFetched or YardiChargesUpdated?
          │     ├── No → Validate button hidden
          │     └── Yes
          │           ├── All 3 documents present? (PAF, RPTT, New Owner PDF)
          │           │     ├── No → Warning: "Missing document(s)..."
          │           │     └── Yes
          │           │           ├── Any scheduled charges = "TBD"?
          │           │           │     ├── Yes → Warning: "Validation blocked..."
          │           │           │     └── No → Validate button visible
```

### Decision Point 6: Send to AR Availability

```
Ticket Status = Completed AND Bot Status = OwnerRecordCreated?
    ├── No → Send to AR tab hidden
    └── Yes → Send to AR tab visible
                ├── Both AR documents uploaded? (Cheques + Batch)
                │     ├── No → Send button disabled
                │     └── Yes → Send button enabled
```

### Failure Reasons Displayed in UI

When a ticket has Ticket Status = Failed, the application displays a specific failure reason based on the Bot Status:

| Bot Status (Numeric) | Failure Reason Displayed |
|---|---|
| `396620005` | "Seller information could not be retrieved from the source system." |
| `396620008` | "The purchase application form failed to download." |
| `396620009` | "The Domicile dump could not be retrieved." |
| `396620012` | "YARDI charges could not be fetched." |
| `396620014` | "Purchase form data extraction failed." |
| `396620016` | "Purchase form could not be uploaded to OneDrive." |
| `396620017` | "Seller details update failed." |
| `396620018` | "New owner record could not be created." |
| `396620019` | "RPTT document extraction failed." |
| *(any other)* | "An unexpected error occurred during processing." |

**Relevant code:** `BOT_STATUS_FAILURE_REASONS` and `getFailureReason()` in `ClosingTicketDetailsPage.tsx`

---

## 10. Bot Processing Lifecycle

### When Bots Are Triggered

Bots (Power Automate flows) are triggered in two ways:

1. **External/Background flows** — Triggered automatically by Dataverse record changes (bot status field updates). These are **not** triggered by the application directly. The application writes status values; the flows watch for those values.

2. **Application-triggered flows** — Three flows are triggered directly by user actions in the application:

   | Flow | When Triggered | Why | Input |
   |---|---|---|---|
   | `NSC_Generate_InvoiceService.Run()` | User clicks "Generate Invoice" on the Invoice tab | Generates the invoice PDF from invoice line items | `{ text: ticketId }` |
   | `NSC_Generate_New_Owner_TicketService.Run()` | User clicks "Generate New Owner Ticket" on the New Owner Ticket tab; or as part of validation; or before sending to AR | Generates/regenerates the New Owner Ticket PDF | `{ text: ticketId }` |
   | `NSC_Send_Email_To_ARService.Run()` | User clicks "Send to AR Team" on the Send to AR tab | Sends closing documents via email to AR | `{ text: ticketId }` |

### What Information Is Passed to Flows

All three application-triggered flows receive a single input: the **Ticket ID** (the human-readable `CL-XXXXXXXXX` string, not the Dataverse GUID). The flow uses this to look up the full closing ticket record and associated data in Dataverse.

### How the Application Knows Whether a Flow Succeeded or Failed

1. The flow service returns a `result` object with `success: boolean` and `error?: { message }`.
2. The flow also returns `result.data?.status` — a string value. The application checks if this is `'failed'` (case-insensitive).
3. If either check fails, the application throws an error and displays it to the user.

```typescript
if (!result.success) {
  throw new Error(result.error?.message || 'Flow failed.')
}
if (result.data?.status?.trim().toLowerCase() === 'failed') {
  throw new Error('Flow returned Failed.')
}
```

### How Bot Results Affect Ticket Status

For **external** flows: The flow itself updates both the Ticket Status and Bot Status in Dataverse. The application reads these on the next refresh.

For **application-triggered** flows: The application calls `refreshClosingRecord()` after the flow completes, which re-fetches the ticket from Dataverse to pick up any status changes made by the flow.

### What Happens After Bot Completion

- **Success path:** The ticket record is refreshed from Dataverse, and the UI updates to reflect the new status. If the flow generated a document (invoice/PDF), it's available for viewing.
- **Failure path:** An error banner is displayed with the error message. An `action` audit log entry is written recording the failure.

---

## 11. Successful End-to-End Example

### Scenario: Standard Condo Sale Closing

**Building:** 10 Park Avenue (NYC Code: NYC10010) — Building is on Domecile
**Unit:** 9E
**Package Type:** Condo Sale
**Seller T-Code:** T12345

---

**Step 1 — Ticket Creation** (User action)

| Event | Ticket Status | Bot Status |
|---|---|---|
| User fills form and clicks Save | **Draft** (716070000) | *(empty)* |
| New Owner Ticket record created automatically | | |
| Audit log entry: `create` on `cr7de_closingticketdetailses` | | |

Ticket ID generated: `CL-482910375`

---

**Step 2 — Domecile Data Retrieval** (Automated)

| Event | Ticket Status | Bot Status |
|---|---|---|
| NSC_DOMECILE_DUMP flow retrieves documents | **Processing** (716070005) | **DomecileDumpRetrieved** (396620006) |
| Domecile package URL written to record | | |

---

**Step 3 — Seller Info Retrieval** (Automated)

| Event | Ticket Status | Bot Status |
|---|---|---|
| NSC Yardi Seller Details retrieves seller data | **Processing** (716070005) | **SellerInfoRetrieved** (396620000) |
| Seller name, building name populated | | |

---

**Step 4 — Form Download** (Automated)

| Event | Ticket Status | Bot Status |
|---|---|---|
| Purchase Application Form downloaded from Domecile | **Processing** (716070005) | **FormDownloaded** (396620001) |

---

**Step 5 — Form Upload to OneDrive** (Automated)

| Event | Ticket Status | Bot Status |
|---|---|---|
| Form uploaded to OneDrive for extraction | **Processing** (716070005) | **PurchaseFormUploadOnedrive** (396620015) |

---

**Step 6 — Purchase Form Data Extraction** (Automated)

| Event | Ticket Status | Bot Status |
|---|---|---|
| AI/OCR extracts buyer details, amounts from form | **ReadyForPostClosing** (716070006) | **PurchaseFormDataExtracted** (396620013) |
| Buyer name, purchase price, etc. populated | | |

---

**Step 7a — RPTT Upload** (User action)

| Event | Ticket Status | Bot Status |
|---|---|---|
| User uploads RPTT document and saves | **ReadyForPostClosing** (716070006) | **RPTTUploaded** (396620010) |
| "Move to Post Closing" button appears | | |

---

**Step 7b — Move to Post Closing** (User action)

| Event | Ticket Status | Bot Status |
|---|---|---|
| User clicks "Move to Post Closing" | **PostClosing** (716070004) | **RPTTUploaded** (396620010) |

---

**Step 8 — RPTT Data Extraction** (Automated)

| Event | Ticket Status | Bot Status |
|---|---|---|
| RPTT data extracted successfully | **ValidateClosings** (716070001) | **RPTTExtracted** (396620020) |

---

**Step 9 — YARDI Charges Fetched** (Automated)

| Event | Ticket Status | Bot Status |
|---|---|---|
| Charges fetched from YARDI | **ValidateClosings** (716070001) | **YARDIChargesFetched** (396620011) |
| Unpaid charges, scheduled charges, ledgers populated | | |

---

**Step 9.5 — Invoice Generation** (User action)

| Event | Ticket Status | Bot Status |
|---|---|---|
| User adds invoice line items (fees, charges) | *(unchanged)* | *(unchanged)* |
| User clicks "Generate Invoice" | *(unchanged)* | *(unchanged)* |
| NSC_Generate_Invoice flow creates invoice PDF | | |

---

**Step 9.6 — New Owner Ticket Generation** (User action)

| Event | Ticket Status | Bot Status |
|---|---|---|
| User reviews/edits New Owner Ticket form and saves | *(unchanged)* | *(unchanged)* |
| User clicks "Generate New Owner Ticket" | *(unchanged)* | *(unchanged)* |
| NSC_Generate_New_Owner_Ticket flow creates PDF | | |

---

**Step 10 — Validation** (User action)

All preconditions met: PAF ✓, RPTT ✓, New Owner PDF ✓, No TBD charges ✓

| Event | Ticket Status | Bot Status |
|---|---|---|
| User clicks "Validate" | **TransferringBuilding** (716070002) | **InformationValidated** (396620007) |
| Form locks to read-only | | |
| New Owner Ticket PDF regenerated | | |
| Audit log: `Validate Closing` action | | |

---

**Step 11 — Seller Details Update** (Automated)

| Event | Ticket Status | Bot Status |
|---|---|---|
| Seller details updated in YARDI | **TransferringBuilding** (716070002) | **SellerDetailsUpdated** (396620002) |

---

**Step 12 — New Owner Created** (Automated)

| Event | Ticket Status | Bot Status |
|---|---|---|
| New owner record created in YARDI | **Completed** (716070008) | **OwnerRecordCreated** (396620003) |
| "Send to AR Team" tab appears | | |

---

**Step 13 — Send to AR** (User action)

| Event | Ticket Status | Bot Status |
|---|---|---|
| User uploads Cheques Document and Batch Document | *(unchanged)* | *(unchanged)* |
| User reviews email subject/body, clicks "Send to AR Team" | **SenttoAR** (396620001) | **SentToAR** (396620022) |
| AR team receives email with all closing documents | | |

**Lifecycle complete.**

---

## 12. Failure/Exception Examples

### Example A: Failed Domecile Retrieval

| Step | Event | Ticket Status | Bot Status |
|---|---|---|---|
| 1 | User creates ticket | **Draft** (716070000) | *(empty)* |
| 2 | NSC_DOMECILE_DUMP flow cannot find the building in Domecile | **Failed** (716070007) | **FailedDomecileDumpRetrieval** (396620009) |
| — | UI displays: "The Domicile dump could not be retrieved." | | |

**Resolution:** Not identifiable from the current implementation. The ticket remains in Failed state. Remediation would require manual intervention via Developer Tools (Status Override) or directly in Dataverse.

---

### Example B: Failed Purchase Form Data Extraction

| Step | Event | Ticket Status | Bot Status |
|---|---|---|---|
| 1–4 | Stages 1–4 complete successfully | **Processing** (716070005) | **FormDownloaded** (396620001) |
| 5 | Form uploaded to OneDrive | **Processing** (716070005) | **PurchaseFormUploadOnedrive** (396620015) |
| 6 | Extraction flow encounters corrupt or unreadable form | **Failed** (716070007) | **FailedPurchaseFormDataExtraction** (396620014) |
| — | UI displays: "Purchase form data extraction failed." | | |

---

### Example C: RPTT Document Deleted During ValidateClosings

| Step | Event | Ticket Status | Bot Status |
|---|---|---|---|
| 1–9 | Stages 1–9 complete successfully | **ValidateClosings** (716070001) | **YARDIChargesFetched** (396620011) |
| — | User deletes the RPTT document | **ReadyForPostClosing** (716070006) | **PurchaseFormDataExtracted** (396620013) |
| — | User must re-upload RPTT and repeat Stages 7–9 | | |

---

### Example D: Validation Blocked by TBD Charges

| Step | Event | Ticket Status | Bot Status |
|---|---|---|---|
| 1–9 | Stages 1–9 complete successfully | **ValidateClosings** (716070001) | **YARDIChargesFetched** (396620011) |
| — | Scheduled charges contain "TBD" amounts | *(unchanged)* | *(unchanged)* |
| — | UI warns: "Validation is blocked — one or more Scheduled Charges have an unconfirmed 'TBD' amount." | | |
| — | User must update TBD charges with actual amounts before Validate becomes available | | |

---

### Example E: Failed Owner Creation

| Step | Event | Ticket Status | Bot Status |
|---|---|---|---|
| 1–11 | Stages 1–11 complete successfully | **TransferringBuilding** (716070002) | **SellerDetailsUpdated** (396620002) |
| 12 | NSC Yardi Create New Owner flow fails | **Failed** (716070007) | **FailedCreateNewOwner** (396620018) |
| — | UI displays: "New owner record could not be created." | | |

---

### Example F: Send to AR Flow Failure

| Step | Event | Ticket Status | Bot Status |
|---|---|---|---|
| 1–12 | Ticket is Completed | **Completed** (716070008) | **OwnerRecordCreated** (396620003) |
| 13 | NSC_Send_Email_To_AR flow returns Failed | *(unchanged)* | *(unchanged)* |
| — | UI displays error: "Send to AR flow returned Failed." | | |
| — | User can retry by clicking Send again | | |

---

## 13. Complete Lifecycle Flow Diagram

```
                              ┌─────────────────────┐
                              │   USER CREATES       │
                              │   CLOSING TICKET      │
                              └──────────┬────────────┘
                                         │
                              ┌──────────▼────────────┐
                              │ Building on Domecile?  │
                              └──────────┬────────────┘
                         ┌───────────────┼───────────────┐
                         │ YES                           │ NO
                         ▼                               ▼
              ┌──────────────────┐            ┌──────────────────────┐
              │ Ticket: Draft    │            │ Must upload PAF      │
              │ Bot: (empty)     │            │ Ticket: Processing   │
              └────────┬─────────┘            │ Bot: FormDownloaded  │
                       │                      └──────────┬───────────┘
                       ▼                                 │
              ┌──────────────────┐                       │
              │ STAGE 2          │                       │
              │ Domecile Dump    │                       │
              │ Retrieval        │                       │
              └────────┬─────────┘                       │
                  ┌────┴────┐                            │
                  │ OK?     │                            │
              ┌───┘         └───┐                        │
              ▼ YES         ▼ NO                         │
    ┌──────────────┐  ┌──────────┐                       │
    │ Bot:         │  │ FAILED   │                       │
    │ DomecileDump │  │ Bot:     │                       │
    │ Retrieved    │  │ Failed   │                       │
    └──────┬───────┘  │ Domecile │                       │
           │          └──────────┘                       │
           ▼                                             │
    ┌──────────────────┐                                 │
    │ STAGE 3          │                                 │
    │ Seller Info      │                                 │
    │ Retrieval        │                                 │
    └────────┬─────────┘                                 │
        ┌────┴────┐                                      │
        │ OK?     │                                      │
    ┌───┘         └───┐                                  │
    ▼ YES         ▼ NO                                   │
  ┌──────────┐  ┌──────────┐                             │
  │ Bot:     │  │ FAILED   │                             │
  │ Seller   │  │ Bot:     │                             │
  │ InfoRetr │  │ Failed   │                             │
  └────┬─────┘  │ SellerInf│                             │
       │        └──────────┘                             │
       ▼                                                 │
  ┌──────────────────┐                                   │
  │ STAGE 4          │                                   │
  │ Form Download    │                                   │
  └────────┬─────────┘                                   │
      ┌────┴────┐                                        │
      │ OK?     │                                        │
  ┌───┘         └───┐                                    │
  ▼ YES         ▼ NO                                     │
┌──────────┐  ┌───────────────┐                          │
│ Bot:     │  │ Bot: Failed   │                          │
│ FormDown │  │ FormDownload  │                          │
│ loaded   │  │ (retryable,   │                          │
└────┬─────┘  │ stays Proc.)  │                          │
     │        └───────────────┘                          │
     ▼                                                   │
┌──────────────────┐                                     │
│ STAGE 5          │                                     │
│ Form Upload      │                                     │
│ to OneDrive      │                                     │
└────────┬─────────┘                                     │
    ┌────┴────┐                                          │
    │ OK?     │                                          │
┌───┘         └───┐                                      │
▼ YES         ▼ NO                                       │
┌──────────┐  ┌──────────┐                               │
│ Bot:     │  │ FAILED   │                               │
│ Purchase │  │ Bot:     │                               │
│ FormUpld │  │ Failed   │                               │
└────┬─────┘  │ FormUpld │                               │
     │        └──────────┘                               │
     ▼                                    ┌──────────────┘
┌──────────────────┐                      │
│ STAGE 6          │◄─────────────────────┘
│ Purchase Form    │
│ Data Extraction  │
└────────┬─────────┘
    ┌────┴────┐
    │ OK?     │
┌───┘         └───┐
▼ YES         ▼ NO
┌──────────────────┐  ┌──────────┐
│ Ticket:          │  │ FAILED   │
│ ReadyForPost     │  │ Bot:     │
│ Closing          │  │ Failed   │
│ Bot: PurchaseForm│  │ FormExtr │
│ DataExtracted    │  └──────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ STAGE 7a — User uploads RPTT         │
│ Bot: RPTTUploaded                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ STAGE 7b — User clicks               │
│ "Move to Post Closing"               │
│ Ticket: PostClosing                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────┐
│ STAGE 8          │
│ RPTT Data        │
│ Extraction       │
└────────┬─────────┘
    ┌────┴────┐
    │ OK?     │
┌───┘         └───┐
▼ YES         ▼ NO
┌──────────────────┐  ┌──────────┐
│ Ticket:          │  │ FAILED   │
│ ValidateClosings │  │ Bot:     │
│ Bot: RPTTExtr    │  │ Failed   │
└────────┬─────────┘  │ RPTTExtr │
         │            └──────────┘
         ▼
┌──────────────────┐
│ STAGE 9          │
│ YARDI Charges    │
│ Fetch            │
└────────┬─────────┘
    ┌────┴────┐
    │ OK?     │
┌───┘         └───┐
▼ YES         ▼ NO
┌──────────────────┐  ┌──────────┐
│ Bot: YARDI       │  │ FAILED   │
│ ChargesFetched   │  │ Bot:     │
└────────┬─────────┘  │ Failed   │
         │            │ YardiChrg│
         ▼            └──────────┘
┌──────────────────────────────────────┐
│ User: Generate Invoice (optional)    │
│ User: Generate New Owner Ticket      │
│ User: Review charges, resolve TBDs   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ STAGE 10 — VALIDATION                │
│ [All docs present? No TBD charges?]  │
│                                      │
│ ├── NO → Button hidden/blocked       │
│ └── YES → User clicks Validate       │
│     Ticket: TransferringBuilding     │
│     Bot: InformationValidated        │
│     Form locks to READ-ONLY         │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────┐
│ STAGE 11         │
│ Seller Details   │
│ Update in YARDI  │
└────────┬─────────┘
    ┌────┴────┐
    │ OK?     │
┌───┘         └───┐
▼ YES         ▼ NO
┌──────────────────┐  ┌──────────┐
│ Bot: SellerDet   │  │ FAILED   │
│ ails Updated     │  │ Bot:     │
└────────┬─────────┘  │ Failed   │
         │            │ SellerUpd│
         ▼            └──────────┘
┌──────────────────┐
│ STAGE 12         │
│ Create New Owner │
│ in YARDI         │
└────────┬─────────┘
    ┌────┴────┐
    │ OK?     │
┌───┘         └───┐
▼ YES         ▼ NO
┌──────────────────┐  ┌──────────┐
│ Ticket:          │  │ FAILED   │
│ COMPLETED        │  │ Bot:     │
│ Bot: OwnerRecord │  │ Failed   │
│ Created          │  │ CreateOwn│
└────────┬─────────┘  └──────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ STAGE 13 — SEND TO AR TEAM          │
│ User uploads Cheques + Batch docs    │
│ User reviews email, clicks Send      │
│ Ticket: SenttoAR                     │
│ Bot: SentToAR                        │
└──────────────────────────────────────┘
         │
         ▼
   ┌───────────────┐
   │  LIFECYCLE    │
   │  COMPLETE     │
   └───────────────┘
```

---

## 14. Open Questions / Logic Not Identifiable from Code

| # | Question | Notes |
|---|---|---|
| 1 | **How are Failed tickets remediated?** | The application provides a Developer Tools panel with a Status Override feature, but no standard user-facing recovery workflow is implemented. Remediation of failed tickets likely requires developer/admin intervention or manual Dataverse updates. |
| 2 | **Exact trigger mechanism for external flows** | The codebase shows the bot status values that external flows produce, but the actual trigger conditions (e.g., Dataverse plugin triggers, scheduled polling) are defined in the Power Automate flows themselves, which are external to this codebase. |
| 3 | **Retry logic for failed automated stages** | Stage 4 (Form Download) failure does not change Ticket Status to Failed, implying auto-retry. Whether other failed stages have auto-retry is not identifiable from the application code — it would be defined in the Power Automate flow configuration. |
| 4 | **YARDI charge reconciliation ("Auto Move") logic** | The charges module includes a `cr109_move` flag and charge status management, but the full "Auto Move" business logic (how charges from seller ledger are moved to buyer ledger) is partially implemented in the UI and partially in external flows. The complete reconciliation algorithm is not fully identifiable from UI code alone. |
| 5 | **Bot Status = Draft vs. empty on creation** | On standard ticket creation, the application does not explicitly set `cr109_botstatus`. The existing lifecycle document states it is set to `Draft` (396620004), which is likely done by the first external flow that picks up the ticket. |
| 6 | **YardiChargesUpdated trigger** | The bot status `YardiChargesUpdated` (396620021) is referenced in validation logic but the exact trigger (whether it's set by external flow or by the application's charge update logic) is not identifiable from the code. |
| 7 | **SenttoAR status — who sets it?** | The Ticket Status `SenttoAR` (396620001) and Bot Status `SentToAR` (396620022) are read by the application, but the actual update is likely performed by the `NSC_Send_Email_To_AR` Power Automate flow, not by the application directly. |
| 8 | **Failed Seller Details Update bot status** | The lifecycle document shows `FailedSellerInfoRetrieval` (396620005) for Stage 11 failure, but the code defines a separate `FailedSellerDetailsUpdate` (396620017). The 396620017 value appears in `BOT_STATUS_FAILURE_REASONS`. Both may be used depending on the specific flow. |

---

## 15. Source Code Reference — Files/Functions Used for Each Major Stage

| Stage | Primary File(s) | Key Functions/Components |
|---|---|---|
| **1 — Ticket Creation** | `src/features/closingTickets/components/CreateClosingTicketForm.tsx` | `CreateClosingTicketForm`, `buildPayload()`, `validateForm()`, `createInitialFormState()` |
| | `src/features/closingTickets/api/closingTicketsService.ts` | `createClosingTicket()` |
| | `src/features/closingTickets/utils/ticketCreation.ts` | `generateTicketId()`, `COOP_TRANSFER_PACKAGE_TYPE` |
| | `src/features/newOwnerTickets/api/newOwnerTicketService.ts` | `syncNewOwnerTicketFromClosingTicket()` |
| **2–6 — Automated Stages** | `src/generated/models/Cr7de_closingticketdetailsesModel.ts` | Bot status enum definitions |
| | `src/features/closingTickets/components/ClosingTicketDetailsPage.tsx` | `BOT_STATUS_FAILURE_REASONS`, `getFailureReason()` |
| **7 — RPTT Upload** | `src/features/closingTickets/components/CreateClosingTicketForm.tsx` | `EditClosingTicketForm` (RPTT upload handling), `handleMoveToPostClosing()`, `handleDeleteDocument()` |
| | `src/features/closingTickets/api/closingTicketsService.ts` | `uploadClosingTicketFile()`, `deleteClosingTicketFile()`, `updateClosingTicket()` |
| **8–9 — RPTT Extraction + YARDI** | *(External flows — not in codebase)* | |
| **10 — Validation** | `src/features/newOwnerTickets/components/NewOwnerTicketTab.tsx` | `validateClosingTicket()`, `validateForm()`, `showValidateButton` logic |
| | `src/features/charges/utils/scheduledChargeValidation.ts` | `getUnconfirmedScheduledCharges()` |
| | `src/features/newOwnerTickets/utils/dataverseFileUtils.ts` | `hasDocument()`, `NEW_OWNER_DOCUMENTS` |
| **11–12 — Seller Update + Owner Creation** | *(External flows — not in codebase)* | |
| **13 — Send to AR** | `src/features/closingTickets/components/SendToATeamTab.tsx` | `SendToATeamTab`, `handleSend()`, `handleSaveDraft()` |
| | `src/features/closingTickets/components/ClosingTicketDetailsPage.tsx` | `handleSendToAR()`, `handleGenerateNewOwnerTicket()` |
| | `src/generated/services/NSC_Send_Email_To_ARService.ts` | `NSC_Send_Email_To_ARService.Run()` |
| **Invoice Generation** | `src/features/closingTickets/components/ClosingTicketDetailsPage.tsx` | `handleGenerateInvoice()` |
| | `src/generated/services/NSC_Generate_InvoiceService.ts` | `NSC_Generate_InvoiceService.Run()` |
| | `src/features/invoices/api/invoiceService.ts` | `createInvoiceDetail()`, `updateInvoiceDetail()`, `deleteInvoiceDetail()` |
| **New Owner Ticket** | `src/features/newOwnerTickets/components/NewOwnerTicketTab.tsx` | `NewOwnerTicketTab`, `saveRecord()` |
| | `src/features/newOwnerTickets/components/NewOwnerTicketForm.tsx` | `NewOwnerTicketForm` |
| | `src/features/newOwnerTickets/api/newOwnerTicketService.ts` | `saveNewOwnerTicket()`, `ensureNewOwnerTicketForClosingTicket()` |
| | `src/features/newOwnerTickets/utils/sharedTicketFields.ts` | `buildNewOwnerPayloadFromClosingTicket()`, `buildClosingPayloadFromNewOwnerTicket()` |
| **Charges** | `src/features/charges/api/chargesService.ts` | All charge CRUD operations |
| | `src/features/charges/hooks/useCharges.ts` | `useCharges()` — fetches and reconciles all charge types |
| **Audit Log** | `src/features/auditLog/api/auditLogService.ts` | `writeChangeLog()`, `writeActionLog()`, `extractOldValues()`, `getChangeLogs()` |
| **Dashboard** | `src/features/closingTickets/components/ClosingTicketPage.tsx` | `ClosingTicketPage` — main entry point |
| | `src/features/closingTickets/components/ClosingTicketDashboard.tsx` | `ClosingTicketDashboard` — stat cards |
| | `src/features/closingTickets/components/ClosingTicketTable.tsx` | `ClosingTicketTable` — ticket list |
| **Filtering** | `src/features/closingTickets/utils/closingTicketFilters.ts` | `filterClosingTickets()` |
| | `src/features/closingTickets/utils/closingTicketFormatters.ts` | `formatClosingTicketStatus()`, `getClosingTicketStatusDisplay()` |
| **Building Lookup** | `src/features/closingTickets/data/buildingListCache.ts` | `getBuildings()`, `prefetchBuildings()`, `toBuildingRow()` |
| | `src/features/closingTickets/components/BuildingCodeLookup.tsx` | `BuildingCodeLookup` — NYC Code search dialog |
| **Documents** | `src/features/newOwnerTickets/utils/dataverseFileUtils.ts` | Document definitions (`NEW_OWNER_DOCUMENTS`, `GENERATED_CLOSING_DOCUMENTS`, `AR_TEAM_DOCUMENTS`) |
| | `src/features/closingTickets/components/GeneratedDocumentsWorkspace.tsx` | `GeneratedDocumentsWorkspace` |
| | `src/features/closingTickets/components/InvoiceDocumentViewer.tsx` | `InvoiceDocumentViewer` |

---

*Document generated from codebase analysis. Last updated: August 2026.*
