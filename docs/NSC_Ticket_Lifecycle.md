# New Sales Closure – Ticket Lifecycle

---

## Stage 1 – Ticket Creation

**Trigger:** A user creates a new ticket in the application by providing the Building Code, Unit, and Package Type.

### Standard Path (Building on Domecile)

| Field | Value |
|---|---|
| Ticket Status | Draft |
| Bot Status | Draft |

The ticket then advances through Stage 2 (Domecile Data Retrieval) automatically.

### Alternative Path (Building Not on Domecile)

When the **Building not on Domecile** flag is checked during ticket creation, the automated Domecile and Seller retrieval stages are skipped entirely. The user **must** upload the Purchase Application Form at creation time (it is required). The ticket is created with the following initial statuses, bypassing Stages 2–5:

| Field | Value |
|---|---|
| Ticket Status | Processing |
| Bot Status | FormDownloaded |

The ticket then continues from Stage 6 (Purchase Form Data Extraction) onward.

---

## Stage 2 – Domecile Data Retrieval

**Automation:** NSC_DOMECILE_DUMP (Cloud Flow)
**Trigger:** The bot processes tickets where the Bot Status is Draft.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | Processing | DomecileDumpRetrieved |
| Failure | Failed | FailedDomecileDumpRetrieval |

---

## Stage 3 – Seller Information Retrieval

**Automation:** NSC Yardi Seller Details (Desktop Flow)
**Trigger:** Runs after successful Domecile data retrieval.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | Processing | SellerInfoRetrieved |
| Failure | Failed | FailedSellerInfoRetrieval |

---

## Stage 4 – Purchase Application Form Download

**Automation:** NSC Purchase Application Form Download (Desktop Flow)
**Trigger:** Runs after successful seller information retrieval.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | Processing | FormDownloaded |
| Failure | Processing | FailedFormDownload |

> **Note:** A failed form download does not change the ticket status to Failed. The ticket remains in Processing because this step can be automatically retried.

---

## Stage 5 – Purchase Application Form Upload to OneDrive

**Automation:** NSC_PurchaseFormUpload (Cloud Flow)
**Trigger:** Runs after the Purchase Application Form has been downloaded successfully.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | Processing | PurchaseFormUploadOnedrive |
| Failure | Failed | FailedPurchaseFormUploadOnedrive |

---

## Stage 6 – Purchase Form Data Extraction

**Automation:** NSC_PurchaseApplication_DataExtraction (Cloud Flow)
**Trigger:** Runs after the Purchase Application Form has been uploaded to OneDrive.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | ReadyForPostClosing | PurchaseFormDataExtracted |
| Failure | Failed | FailedPurchaseFormDataExtraction |

---

## Stage 7 – RPTT Upload and Move to Post Closing

### Step 1 – Upload RPTT Document

**Trigger:** The user uploads the RPTT/ACRIS document and saves the ticket.

| Action | Ticket Status | Bot Status |
|---|---|---|
| RPTT uploaded and saved | ReadyForPostClosing | RPTTUploaded |

The ticket remains in ReadyForPostClosing while the Bot Status changes to RPTTUploaded.

### Step 2 – Move to Post Closing

The **Move to Post Closing** button becomes available only after the RPTT document has been uploaded.

| Action | Ticket Status | Bot Status |
|---|---|---|
| User clicks Move to Post Closing | PostClosing | RPTTUploaded |

### Rollback Behavior

If the user deletes the RPTT document while the ticket is in either PostClosing or ValidateClosings, the application automatically rolls the ticket back.

| Current Status | New Ticket Status | New Bot Status |
|---|---|---|
| PostClosing | ReadyForPostClosing | PurchaseFormDataExtracted |
| ValidateClosings | ReadyForPostClosing | PurchaseFormDataExtracted |

---

## Stage 8 – RPTT Data Extraction

**Automation:** NSC_RPTT_DataExtraction (Cloud Flow)
**Trigger:** The bot processes tickets where the Bot Status is RPTTUploaded.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | ValidateClosings | RPTTExtracted |
| Failure | Failed | FailedRPTTExtraction |

---

## Stage 9 – Fetch YARDI Charges

**Automation:** NSC Fetch YARDI Charges (Desktop Flow)
**Trigger:** Runs after successful RPTT data extraction.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | ValidateClosings | YARDIChargesFetched |
| Failure | Failed | Not specified |

---

## Stage 10 – Validation

**Performed By:** User (Application)

### Validation Requirements

The **Validate** button is available only when all of the following conditions are met:

- Ticket Status is **ValidateClosings**
- Purchase Application Form is available
- RPTT document is available
- New Owner Ticket PDF is available

### Validation Result

| Action | Ticket Status | Bot Status |
|---|---|---|
| User clicks Validate | TransferringBuilding | InformationValidated |

### Post-Validation Behavior

Once validation is completed:

- The application becomes **read-only**.
- Users can no longer edit ticket details.
- Documents cannot be added, removed, or replaced.
- Charges cannot be modified.

---

## Stage 11 – Seller Details Update

**Automation:** NSC Yardi Seller Update (Desktop Flow)
**Trigger:** The bot processes tickets where the Bot Status is InformationValidated.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | TransferringBuilding | SellerDetailsUpdated |
| Failure | Failed | FailedSellerInfoRetrieval |

---

## Stage 12 – Create New Owner

**Automation:** NSC Yardi Create New Owner (Desktop Flow)
**Trigger:** Runs after the seller details have been updated successfully.

| Outcome | Ticket Status | Bot Status |
|---|---|---|
| Success | Completed | OwnerRecordCreated |
| Failure | Failed | FailedCreateNewOwner |

---

## Ticket Status Progression

| Ticket Status | Description |
|---|---|
| Draft | Ticket has been created and is awaiting processing. |
| Processing | Initial automated processing is underway, including Domecile data retrieval, seller information retrieval, and Purchase Application Form processing. |
| ReadyForPostClosing | Purchase Application Form extraction is complete and the ticket is ready for RPTT upload. |
| PostClosing | The user has uploaded the RPTT document and moved the ticket to the post-closing stage. |
| ValidateClosings | RPTT extraction and YARDI charge retrieval have been completed, and the ticket is ready for user validation. |
| TransferringBuilding | User validation is complete and YARDI ownership transfer is in progress. |
| Completed | The New Owner record has been created successfully and the ticket is complete. |
| Failed | Processing failed during one of the automated stages. |

---

## Bot Status Progression

| Stage | Bot Status |
|---|---|
| Ticket Created | Draft |
| Domecile Data Retrieved | DomecileDumpRetrieved |
| Seller Information Retrieved | SellerInfoRetrieved |
| Purchase Form Downloaded | FormDownloaded |
| Purchase Form Uploaded | PurchaseFormUploadOnedrive |
| Purchase Form Extracted | PurchaseFormDataExtracted |
| RPTT Uploaded | RPTTUploaded |
| RPTT Extracted | RPTTExtracted |
| YARDI Charges Retrieved | YARDIChargesFetched |
| Information Validated | InformationValidated |
| Seller Details Updated | SellerDetailsUpdated |
| Owner Created | OwnerRecordCreated |

### Failure Bot Statuses

| Failure Stage | Bot Status |
|---|---|
| Domecile Retrieval | FailedDomecileDumpRetrieval |
| Seller Information Retrieval | FailedSellerInfoRetrieval |
| Purchase Form Download | FailedFormDownload |
| Purchase Form Upload | FailedPurchaseFormUploadOnedrive |
| Purchase Form Data Extraction | FailedPurchaseFormDataExtraction |
| RPTT Data Extraction | FailedRPTTExtraction |
| Fetch YARDI Charges | Not specified |
| Create New Owner | FailedCreateNewOwner |
