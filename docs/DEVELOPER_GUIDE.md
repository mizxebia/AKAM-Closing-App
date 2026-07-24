# Closing Management System — Developer Guide

> **Audience:** Future developers, automation engineers, support engineers, future reference.
> This document assumes the original developer is unavailable. It is sufficient to understand,
> maintain, troubleshoot, extend and redeploy the application from scratch.

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Dataverse Data Model](#5-dataverse-data-model)
6. [SharePoint Integration](#6-sharepoint-integration)
7. [Power Automate Flows](#7-power-automate-flows)
8. [Authentication & Identity](#8-authentication--identity)
9. [Feature Modules](#9-feature-modules)
10. [Business Logic Reference](#10-business-logic-reference)
11. [Audit Log System](#11-audit-log-system)
12. [Configuration & Deployment](#12-configuration--deployment)
13. [Dependencies](#13-dependencies)
14. [Common Troubleshooting](#14-common-troubleshooting)

---

## 1. Application Overview

### Purpose

The **Closing Management System** is a React/TypeScript single-page application embedded
inside Microsoft Power Apps as a custom page. It is used exclusively by property management
staff at **AKAM Associates** to manage real estate closing workflows from ticket creation
through ownership transfer.

### Problem It Solves

A real estate closing at AKAM involves coordinating data from multiple sources:
- Domecile (document repository)
- YARDI (property management / accounting system)
- Physical documents: RPTT (Real Property Transfer Tax Return) and Purchase Application Form (PAF)

Without this system, staff manually tracked all of this across spreadsheets and emails.
The application automates the entire lifecycle — from ticket creation to new owner creation in
YARDI — reducing manual data entry, enforcing process order, and providing a single audit trail.

### High-Level Workflow

```
Staff creates closing ticket
       ↓
Automation retrieves Domecile data, seller info, purchase form (via Power Automate Desktop)
       ↓
Staff uploads RPTT → moves to Post Closing
       ↓
Automation extracts RPTT data, fetches YARDI charges
       ↓
Staff reviews charges (optionally runs Auto Move), generates New Owner Ticket
       ↓
Staff clicks Validate → ticket locks permanently
       ↓
Automation updates seller in YARDI, creates new owner record
       ↓
Ticket status: Completed
```

### Main Business Process

The application implements the **New Sales Closure (NSC)** workflow. A closing ticket
progresses through 12 discrete stages controlled by two fields:

| Field | Dataverse column | Meaning |
|---|---|---|
| Ticket Status | `cr7de_ticketstatus` | Human-visible lifecycle state |
| Bot Status | `cr109_botstatus` | Granular automation progress marker |

The application is the UI layer. The automation runs entirely in Power Automate (cloud and
desktop flows). The app reads bot status to determine what to show/hide and writes it only
when the user performs a specific action (e.g. Upload RPTT, Validate, Auto Move Charges).


---

## 2. Architecture

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
│     │  (9 entities)  │  │ Building List │  │  (4 flows)         │    │
│     └────────────────┘  └───────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **No router.** Navigation is state-driven — `selectedRecordId` in `ClosingTicketPage`
  switches between list and detail views. No URL changes.
- **No global state library.** `useState`/`useReducer` + prop drilling.
  Data is fetched fresh per component mount and refreshed after mutations.
- **Generated service layer is the only Dataverse access point.** Feature `api/` folders
  wrap the generated services — components never call generated services directly.
- **Fire-and-forget audit log.** `writeChangeLog` never throws and never blocks.
- **Building list cache is a module-level singleton.** Concurrent callers share one
  in-flight fetch; result is held in memory for the session.


---

## 3. Technology Stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Language | TypeScript | ~5.9.3 | Strict mode. Project references (app + node configs). |
| UI Framework | React | ^19.2.0 | No class components. |
| Build Tool | Vite | ^7.2.4 | `base: './'` required for Power Apps. |
| Styling | Tailwind CSS v4 | ^4.3.0 | Via `@tailwindcss/vite` plugin. No `tailwind.config.js`. |
| Component Library | shadcn/ui | n/a | Radix UI primitives. Live in `src/components/ui/`. **Do not modify manually.** |
| Icons | lucide-react | ^1.16.0 | |
| Animation | Framer Motion | ^12.39.0 | Used for table row entry and tab transitions. |
| Platform SDK | `@microsoft/power-apps` | ^1.0.3 | Dataverse connector, context API, file operations. |
| Platform Vite plugin | `@microsoft/power-apps-vite` | ^1.0.2 | Wraps build output for `pac` deployment. |
| Utility | clsx + tailwind-merge | ^2.1.1 / ^3.6.0 | Combined as `cn()` in `src/lib/utils.ts`. |
| PDF rendering | react-pdf + pdfjs-dist | ^10.4.1 / ^5.7.284 | Inline document viewer. |

**Design tokens:** `src/styles/tokens.css`
- Brand primary: `#1E3A47` (deep teal)
- Brand accent: `#C9A96E` (gold)
- Font: `Inter` (body), `Playfair Display` (headings/italic display)


---

## 4. Project Structure

```
my-app/
├── .power/
│   └── schemas/
│       ├── appschemas/
│       │   └── dataSourcesInfo.ts          ← connector config consumed by generated services
│       ├── dataverse/                       ← one JSON schema per Dataverse entity
│       ├── logicflows/                      ← Power Automate flow schemas
│       └── sharepointonline/               ← SharePoint list schema
├── docs/
│   ├── NSC_Ticket_Lifecycle.md             ← business lifecycle reference
│   └── DEVELOPER_GUIDE.md                  ← this file
├── src/
│   ├── main.tsx                            ← React entry, ErrorBoundary
│   ├── App.tsx                             ← root component, prefetchBuildings()
│   ├── App.css                             ← global CSS (form, table, badge, sheet styles)
│   ├── index.css                           ← CSS reset / base
│   ├── assets/                             ← logos, logoData.ts (base64 exports)
│   ├── components/
│   │   ├── ui/                             ← shadcn/ui primitives (DO NOT EDIT)
│   │   ├── enterprise/                     ← app-level layout (PageHeader, StatCard, etc.)
│   │   ├── dashboard/                      ← DashboardCard widget
│   │   ├── feedback/                       ← StatusBanner, ProcessingDots
│   │   ├── filters/                        ← SearchFilter, SelectFilter
│   │   └── icons/                          ← DashboardIcons
│   ├── features/
│   │   ├── auditLog/                       ← write-only audit service
│   │   ├── charges/                        ← YARDI charges tab
│   │   ├── closingTickets/                 ← primary feature (ticket CRUD + UI)
│   │   ├── invoices/                       ← invoice payments tab
│   │   └── newOwnerTickets/               ← new owner ticket form + PDF viewer
│   ├── generated/                          ← AUTO-GENERATED. DO NOT EDIT.
│   │   ├── models/                         ← TypeScript interfaces + enum maps
│   │   ├── services/                       ← CRUD service wrappers
│   │   └── index.ts                        ← barrel export
│   ├── hooks/
│   │   └── useAutoClear.ts                 ← clears state after timeout (toasts)
│   ├── lib/
│   │   └── utils.ts                        ← cn() helper
│   └── styles/
│       └── tokens.css                      ← design token CSS variables
├── power.config.json                       ← Power Platform deployment config
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── package.json
```

### Architecture Rules

1. **Feature `api/` → generated services only.** Components must never import from `src/generated/` directly.
2. **Cross-feature imports via barrel `index.ts` only.** Never `import { X } from '../../charges/components/ChargesWorkspace'` from outside the `charges/` feature.
3. **`src/generated/` is read-only.** Regenerate with `@microsoft/power-apps` tooling when schemas change.
4. **`src/components/ui/` is read-only.** These are shadcn/ui primitives; customise by wrapping, not editing.


---

## 5. Dataverse Data Model

All tables live in the default Dataverse environment under the `default.cds` database.
Publisher prefixes: `cr7de_` (AKAM custom) and `crc5c_` (charges tables).

### 5.1 Primary Entity — `cr7de_closingticketdetails`

Entity set: `cr7de_closingticketdetailses`

**Key fields:**

| Column | Type | Values / Notes |
|---|---|---|
| `cr7de_closingticketdetailsid` | GUID PK | Auto-generated by Dataverse |
| `cr7de_ticketid` | string | Human-readable ID, format `CL-XXXXXXXXX`. **This is the business key.** |
| `cr7de_ticketstatus` | picklist | `716070000` Draft, `716070005` Processing, `716070006` ReadyForPostClosing, `716070004` PostClosing, `716070001` ValidateClosings, `716070002` TransferringBuilding, `716070007` Failed, `716070008` Completed |
| `cr109_botstatus` | picklist | 22 values (see §10.1). Controls button visibility and automation triggers. |
| `cr109_packagetype` | picklist | `396620000` condo_sale, `396620001` coop_sale, `396620002` coop_transfer |
| `cr109_transactiontypedeal` | picklist | AllCash, Financing, Transfer, TrustTransfer |
| `cr7de_buildingnotondomicile` | bool | When true: skips stages 2–5, requires manual PAF upload, ticket starts at Processing/FormDownloaded |
| `cr7de_nyccode` | string | Yardi building ID (e.g. `NYC12345`). Looked up from SharePoint Building List. |
| `cr7de_sellertcode` | string | Required on create. Must start with `T` (case-insensitive). |
| `cr7de_notes` | string (4000) | Invoice notes — stored on the closing ticket, displayed in Invoice tab. |
| `cr109_purchaseapplicationform` | file | Binary. Column name used for upload: `'cr109_purchaseapplicationform'` |
| `cr109_rpttdocument` | file | Binary. Upload triggers `RPTTUploaded` bot status. Delete rolls back to `ReadyForPostClosing`. |
| `cr109_newownerticketpdf` | file | Generated by `NSC_Generate_New_Owner_Ticket` flow. |
| `cr109_closingticketdetailspdf` | file | Generated by `NSC_Generate_Invoice` flow. |

### 5.2 Invoice Details — `cr7de_invoicedetails`

Entity set: `cr7de_invoicedetailses`

| Column | Type | Notes |
|---|---|---|
| `cr7de_ticketid` | string | Link to parent closing ticket (Ticket ID, not GUID). |
| `cr109_dueatclosing` | picklist | 59-value charge type list (AdjournmentFee → WorkingCapital). |
| `cr7de_paidby` | picklist | `716070000` Seller, `716070001` Buyer. Used by Auto Move and ledger reconciliation. |
| `cr7de_payableto` | picklist | `716070000` Building, `716070001` AKAMAssociates_Inc, `716070002` Other. Auto Move only matches Building. |
| `cr7de_amount` | string | Stored as decimal string (e.g. `"1340.70"`). |
| `cr7de_notapplicabletoledger` | bool | Excludes row from ledger reconciliation ("N/A" checkbox in form). |
| `cr109_otherpayableto` | string | Free text, used when `cr7de_payableto = Other`. |

### 5.3 New Owner Ticket — `cr7de_newownerticketdetails`

Entity set: `cr7de_newownerticketdetailses`

Linked to a closing ticket via `cr7de_ticketid` (business key, not GUID).
The service uses an OData filter to look up the record: `cr7de_ticketid eq 'CL-...'`.

Key fields: buyer/seller full name + address + city/state/zip + SSN/EIN, occupancy (Present/Absent),
additional occupants (3 fields, auto-set to `N/A` if empty on save), financial fields (purchase price,
amount financed, shares, lender name), seller T-Code, forwarding address, zero-balance confirmed.

### 5.4 Unpaid Charges — `crc5c_unpaidcharges`

Entity set: `crc5c_unpaidchargeses`. Read from YARDI by the `NSC Fetch YARDI Charges` desktop flow.

| Column | Notes |
|---|---|
| `crc5c_ticketid` | Link to closing ticket (Ticket ID). |
| `cr109_chargecode` | YARDI GL charge code (e.g. `cable`, `mainten`, `flipta`). |
| `cr109_amount` | Decimal string. |
| `cr109_notes` | Contains month/year in format `Description (MM/YYYY)`. Used by Auto Move for latest-first sorting. |
| `cr109_move` | bool. Ticked = charge transfers to new owner. Disabled when `cr109_partiallypaid = true`. |
| `cr109_partiallypaid` | bool. When ticked, Move toggle is disabled. |

### 5.5 Scheduled Charges — `crc5c_copyscheduledcharges`

Entity set: `crc5c_copyscheduledchargeses`. Populated by the charges desktop flow + manual creation.

| Column | Notes |
|---|---|
| `cr109_manual` | bool. True = user-created; these rows can be deleted from the app. Bot-created rows cannot. |
| `cr109_move` | Same semantics as unpaid charges. |
| `cr109_partiallypaid` | Same semantics as unpaid charges. |

### 5.6 Ledger Tables

`crc5c_sellerledgers` and `crc5c_buyerledgers` — read-only from the app's perspective.
Written by the `syncBuyerLedgerWithUnpaidCharge` function in `chargesService.ts` as a
side-effect when an unpaid charge's Move flag is toggled.

### 5.7 Audit Log — `cr7de_appchangelog`

Entity set: `cr7de_appchangelogs`. Written by `writeChangeLog()`. Never read by the app.

| Column | Notes |
|---|---|
| `cr7de_ticketid` | Human-readable ticket reference (e.g. `CL-000123456`). |
| `cr7de_tablename` | Dataverse entity name (e.g. `cr7de_invoicedetailses`). |
| `cr7de_olddata` | JSON string of old field values. Null for creates. Max 4000 chars. |
| `cr7de_newdata` | JSON string of new field values. Null for deletes. Max 4000 chars. |
| `cr7de_modifiedby` | User display name resolved from Power Apps context. |

### 5.8 Manual Charges — `crc5c_manualcharges`

Used to create manual scheduled charges. Creating one also creates a corresponding
`crc5c_copyscheduledcharges` row with `cr109_manual = true`. The 19-value picklist maps
to YARDI charge codes: Assessment 1 (`specasmt`), Bike Storage (`bike`), etc.


---

## 6. SharePoint Integration

**Site:** `https://akam.sharepoint.com/sites/Operations`
**List:** Building List (table ID `e598be35-f24d-493b-9066-83475cc440a5`)

### Purpose

The Building List provides a searchable lookup of all AKAM-managed buildings. Users search by
address in the `BuildingCodeLookup` sheet to find a building's **NYC Code** (Yardi ID, stored
in `field_0`). When selected, the NYC Code and Legal Name are auto-populated in the create form.

### Access Pattern

`BuildingListService.getAll()` — generated service wrapper. The app paginates through all
pages (5000 rows per page) until all buildings are loaded. The result is held in a module-level
singleton cache (`src/features/closingTickets/data/buildingListCache.ts`).

```typescript
// Cache behaviour
getBuildings()              // Returns cached data or fetches if not cached
getBuildings({ forceRefresh: true })  // Bypasses cache, re-fetches all pages
prefetchBuildings()         // Called once on App mount (fire-and-forget)
clearBuildingsCache()       // For testing only
```

**Important:** The cache is in-memory only — it does not persist across page reloads.
The `prefetchBuildings()` call on app startup ensures data is ready before the user opens
the Building Lookup sheet.

### Key Fields

| SP Field | Column | Meaning |
|---|---|---|
| `field_0` | Yardi ID | NYC Code used throughout the app (e.g. `NYC12345`) |
| `Title` | Address | Street address — primary search text |
| `field_37` | Building Name | Display name |
| `field_6` | Legal Name | Auto-filled in create form |

The `buildingListCache.ts` normalises each row into a `BuildingRow` type and builds a
`searchText` string for fast client-side fuzzy search.


---

## 7. Power Automate Flows

The app triggers two flows. All other flows are triggered by the Dataverse bot status field
(outside the app's control). **The app never calls flow endpoints directly** — it uses the
generated service wrappers.

### 7.1 App-triggered Flows

#### `NSC_Generate_Invoice`

- **Trigger:** User clicks "Generate Invoice" in the Invoice tab.
- **Input:** `{ text: ticketId }` — the human-readable `CL-` ticket reference.
- **Output:** `{ status: string }` — `"failed"` (lowercase) means failure.
- **App action after success:** Refreshes closing record and invoice list; updates bot status display.
- **Service wrapper:** `NSC_Generate_InvoiceService.Run({ text: ticketId })`
- **Button visibility:** Invoice tab → visible when records > 0 (any invoice line exists).
- **Depends on:** `shared_office365` connection for email delivery.

#### `NSC_Generate_New_Owner_Ticket`

- **Trigger 1:** User clicks "Generate New Owner Ticket" in the New Owner Ticket tab.
- **Trigger 2:** Automatically called after successful Validate (user clicks "Yes, validate and lock").
- **Input:** `{ text: ticketId }`
- **Output:** `{ status: string }`
- **Service wrapper:** `NSC_Generate_New_Owner_TicketService.Run({ text: ticketId })`
- **Depends on:** `shared_office365`.

### 7.2 Automation-triggered Flows (background, app does not call these)

These are triggered by the `NSC_DOMECILE_DUMP` cloud flow, desktop flows running on a dedicated
VM, or Dataverse change triggers. The app only reads the result via the `cr109_botstatus` field.

| Flow | Type | Triggered when | What it does |
|---|---|---|---|
| `NSC_DOMECILE_DUMP` | Cloud | BotStatus = Draft | Fetches Domecile data for the building |
| `NSC Yardi Seller Details` | Desktop | Follows Domecile success | Retrieves seller info from YARDI |
| `NSC Purchase Application Form Download` | Desktop | Follows seller info success | Downloads PAF from Domecile |
| `NSC_PurchaseFormUpload` | Cloud | Follows form download success | Uploads PAF to OneDrive |
| `NSC_PurchaseApplication_DataExtraction` | Cloud | Follows OneDrive upload | Extracts PAF data via AI Builder |
| `NSC_RPTT_DataExtraction` | Cloud | BotStatus = RPTTUploaded | Extracts RPTT data |
| `NSC Fetch YARDI Charges` | Desktop | Follows RPTT extraction | Fetches unpaid/scheduled charges |
| `NSC Yardi Seller Update` | Desktop | BotStatus = InformationValidated | Updates seller record in YARDI |
| `NSC Yardi Create New Owner` | Desktop | Follows seller update | Creates new owner record in YARDI |

### 7.3 Bot Status Reference

The `cr109_botstatus` field is the primary state machine for the automation. Numeric values:

| Value | Name | Set by |
|---|---|---|
| 396620004 | Draft | App (on create) |
| 396620006 | DomecileDumpRetrieved | Cloud flow |
| 396620000 | SellerInfoRetrieved | Desktop flow |
| 396620001 | FormDownloaded | Desktop flow (or App when building not on Domecile) |
| 396620015 | PurchaseFormUploadOnedrive | Cloud flow |
| 396620013 | PurchaseFormDataExtracted | Cloud flow |
| 396620010 | RPTTUploaded | App (on RPTT save) |
| 396620020 | RPTTExtracted | Cloud flow |
| 396620011 | YARDIChargesFetched | Desktop flow |
| 396620021 | YardiChargesUpdated | App (Auto Move Charges button) |
| 396620007 | InformationValidated | App (Validate button) |
| 396620002 | SellerDetailsUpdated | Desktop flow |
| 396620003 | OwnerRecordCreated | Desktop flow |
| 396620009 | FailedDomecileDumpRetrieval | Cloud flow |
| 396620005 | FailedSellerInfoRetrieval | Desktop flow |
| 396620008 | FailedFormDownload | Desktop flow |
| 396620016 | FailedPurchaseFormUploadOnedrive | Cloud flow |
| 396620014 | FailedPurchaseFormDataExtraction | Cloud flow |
| 396620019 | FailedRPTTExtraction | Cloud flow |
| 396620012 | FailedYardiChargesFetch | Desktop flow |
| 396620017 | FailedSellerDetailsUpdate | Desktop flow |
| 396620018 | FailedCreateNewOwner | Desktop flow |


---

## 8. Authentication & Identity

### How Auth Works

The app is embedded in Power Apps as a **custom page**. It inherits the authenticated Power
Platform session. There is no OAuth redirect, no login screen, and no token management in
the React code. The Power Apps connector runtime injects authentication headers into every
Dataverse and SharePoint API call transparently.

**There are no `.env` files and no `import.meta.env` references.** All environment
targeting is handled in `power.config.json` and selected at deploy time via `pac org select`.

### User Identity Resolution

`useCurrentUser.ts` and `auditLogService.ts` both resolve the current user's identity for
display and audit purposes. Three-tier fallback (in order):

```typescript
// Tier 1 — primary (works in deployed Power Apps)
import { getContext } from '@microsoft/power-apps/app'
const ctx = await getContext()
ctx.user.fullName           // Display name
ctx.user.userPrincipalName  // email / UPN
ctx.user.objectId           // AAD GUID — matches _createdby_value in Dataverse

// Tier 2 — dynamic import fallback
const { app } = await import('@microsoft/power-apps')
await app.getContext()

// Tier 3 — Xrm fallback (legacy Power Apps context)
window.Xrm?.Utility?.getGlobalContext()?.userSettings
```

The audit log caches the resolved user identity as a shared Promise so it is only fetched once.

### "My Tickets" Filter

The "My Tickets" tab filter uses the user's AAD GUID (`userId` from `useCurrentUser`)
and compares it against the `_createdby_value@OData.Community.Display.V1.FormattedValue`
OData annotation on each record (because the SDK does not populate `createdbyname` directly).

### Environments

| Environment | ID | Usage |
|---|---|---|
| Development | `e1cba263-...` | Local dev (`npm run dev`) |
| UAT | `e0789024-...` | Staging / QA |
| Production | `a23f5944-...` | Live |

Switch with: `pac org select --environment <id>`


---

## 9. Feature Modules

### 9.1 `closingTickets` (primary feature)

**Entry point:** `ClosingTicketPage` (exported from `index.ts`).

The page renders in one of two modes, switched by local state (`selectedRecordId`):
- **List mode:** `ClosingTicketDashboard` + `ClosingTicketFilters` + `ClosingTicketTable`
- **Detail mode:** `ClosingTicketDetailsPage`

`ClosingTicketDetailsPage` manages all data loading and owns:
- `useInvoices(ticketId)` — invoice records
- `useCharges(ticketId)` — unpaid/scheduled/ledger charges
- `record` state — the current closing ticket (refreshed after every mutation)

It renders four tabs:
1. **Closing Details** — `EditClosingTicketForm` (read-only when Processing, TransferringBuilding, or Completed)
2. **Invoice** — `ChargesWorkspace` (invoices)
3. **Yardi Charges** — `ChargesWorkspace` (YARDI charges) — hidden in Draft status
4. **New Owner Ticket** — `NewOwnerTicketWorkspace` — hidden in Draft status

**Read-only rules:**
- Processing → Closing Details and New Owner Ticket tabs are read-only (automation running)
- TransferringBuilding OR Completed → entire detail view is read-only (locked)

**Completed status display:** When `cr7de_ticketstatus = Completed`, read-only banner shows
"Completed Successfully — this ticket is locked." (green). For all other read-only states, it
shows the animated "Processing..." indicator.

### 9.2 `invoices`

Manages invoice payment line items (`cr7de_invoicedetails`). These appear in the Invoice tab
and are linked to a closing ticket by `cr7de_ticketid`.

**Invoice grouping:** Records are grouped into Seller Cheques (`cr7de_paidby = Seller`),
Buyer Cheques (`cr7de_paidby = Buyer`), and Other. The grouping drives the Invoice tab display
and the Auto Move Charges algorithm.

**Generate Invoice button:** Only shown when at least one invoice record exists. Calls
`NSC_Generate_Invoice` flow, then refreshes the closing record and invoice list.

**Notes field:** Stored on the closing ticket (`cr7de_notes`), not on invoice rows. Displayed
in the Invoice Details section and editable inline.

### 9.3 `charges`

Manages YARDI-sourced charge data. Four sub-tables: unpaid charges, scheduled charges,
seller ledger, buyer ledger.

**Auto Move Charges algorithm** (`computeAutoMoveIds`):
1. Filter invoices to Buyer Cheques (`cr7de_paidby = Buyer`) where `Payable To = Building`.
2. Map each invoice's `cr109_dueatclosing` enum to a YARDI GL code via `INVOICE_GL_CODE_MAP`.
3. Normalise amounts to `toFixed(2)` for exact comparison.
4. Group eligible (non-partial) unpaid charges by `glCode|amount`.
5. Sort each group by month extracted from Notes (`(MM/YYYY)` pattern) — latest first.
6. One-to-one match: each Buyer Cheque consumes the first available unpaid charge.
7. Returns a `Set<string>` of charge IDs to mark `cr109_move = true`.
8. After matching, updates `cr109_botstatus` to `YardiChargesUpdated (396620021)`.

Button visibility: `botStatus === YARDIChargesFetched (396620011) OR YardiChargesUpdated (396620021)`.
During execution, both Unpaid and Scheduled charge tables become read-only (`readOnly || autoMoving`).

**Move toggle:** Disabled when `cr109_partiallypaid = true` for that row.

**Buyer Ledger sync:** When an unpaid charge's Move flag is toggled via Save All, `syncBuyerLedgerWithUnpaidCharge` creates, updates, or deletes buyer ledger rows and recalculates running balances.

### 9.4 `newOwnerTickets`

Manages `cr7de_newownerticketdetails` records. One record per closing ticket, linked by `cr7de_ticketid`.

**Record lifecycle:**
- `ensureNewOwnerTicketForClosingTicket()` — called on tab mount. If no record exists for this ticket ID, creates one pre-populated from the closing ticket (stitched fields — see §10.3).
- `saveNewOwnerTicket()` — create or update. After a Dataverse UPDATE (204 No Content), re-fetches the record to ensure the record ID is preserved for subsequent saves.
- After save, writes stitched fields back to the closing ticket via `updateClosingTicket`.

**Validate button conditions:**
- `cr7de_ticketstatus === ValidateClosings (716070001)`
- `cr109_botstatus === YARDIChargesFetched (396620011) OR YardiChargesUpdated (396620021)`
- All three documents present (Purchase Form, RPTT, New Owner Ticket PDF)

On Validate: ticket status → `TransferringBuilding`, bot status → `InformationValidated`,
then `NSC_Generate_New_Owner_Ticket` flow is automatically triggered to regenerate the PDF.

**Form field constraints:**
- SSN/EIN fields (Buyer 1 and Buyer 2): digits only, max 9 characters, letters blocked with inline warning.
- Occupancy fields: dropdown constrained to `Present` / `Absent` (no free text).
- Additional Occupants: empty values automatically saved as `N/A`.

### 9.5 `auditLog`

Write-only. No read operations. Called by every `api/` service after a successful mutation.
See §11 for full documentation.


---

## 10. Business Logic Reference

### 10.1 Ticket Status Machine

```
       ┌─────────────┐
       │    DRAFT    │  ← created by user
       └──────┬──────┘
              │ (automation picks up)
       ┌──────▼──────┐
       │  PROCESSING │  ← Domecile/seller/form retrieval in progress
       └──────┬──────┘
              │ (form extracted)
  ┌───────────▼───────────┐
  │  READY FOR POST       │  ← user uploads RPTT + clicks Move to Post Closing
  │  CLOSING              │
  └───────────┬───────────┘
              │
       ┌──────▼──────┐
       │ POST CLOSING│  ← RPTT extraction + YARDI charges fetch in progress
       └──────┬──────┘
              │
  ┌───────────▼───────────┐
  │  VALIDATE CLOSINGS    │  ← user reviews, auto-moves charges, generates ticket
  └───────────┬───────────┘
              │ (Validate button clicked)
  ┌───────────▼───────────┐
  │  TRANSFERRING BUILDING│  ← locked, seller update + owner creation in progress
  └───────────┬───────────┘
              │
       ┌──────▼──────┐
       │  COMPLETED  │  ← done, fully read-only
       └─────────────┘
              (any stage can transition to FAILED on automation error)
```

**Building not on Domecile path:** Ticket is created with status `Processing` and bot status
`FormDownloaded`, skipping stages 2–5. The user must upload the Purchase Application Form
manually before saving (required field when `cr7de_buildingnotondomicile = true`).

### 10.2 RPTT Rollback Rule

If the RPTT document is deleted while the ticket is in `PostClosing` or `ValidateClosings`:
- Ticket status resets to `ReadyForPostClosing`
- Bot status resets to `PurchaseFormDataExtracted` (when coming from ValidateClosings)
- This is handled in `handleDeleteDocument` in `CreateClosingTicketForm.tsx`.

### 10.3 Stitched Fields (Closing Ticket ↔ New Owner Ticket)

Fourteen fields are kept in sync between the closing ticket and the new owner ticket record.
The sync runs in both directions:
- **On new owner ticket save:** `buildClosingPayloadFromNewOwnerTicket()` writes back to the closing ticket.
- **On closing ticket sync:** `syncNewOwnerTicketFromClosingTicket()` writes forward to the new owner ticket.

| Closing ticket field | New owner ticket field |
|---|---|
| `cr7de_ticketid` | `cr7de_ticketid` |
| `cr7de_unitnumber` | `cr7de_unit` |
| `cr7de_closingdate` | `cr7de_closingdate` |
| `cr7de_buildingaddress` | `cr7de_address` |
| `cr7de_buildingname` | `cr109_buildingname` |
| `cr7de_nyccode` | `cr109_nyccode` |
| `cr7de_buyername` | `cr7de_newprimaryownername` |
| `cr109_buyer2name` | `cr7de_newsecondaryownername` |
| `cr7de_buyertcode` | `cr109_primaryownertcode` |
| `cr7de_sellername` | `cr7de_sellername` |
| `cr7de_sellertcode` | `cr7de_sellertcode` |
| `cr109_seller2name` | `cr109_seller2name` |
| `cr109_saleprice` | `cr109_purchaseprice` |
| `cr109_shares` | `cr109_shares` |

### 10.4 Invoice-to-YARDI Charge Mapping

The `INVOICE_GL_CODE_MAP` in `ChargesWorkspace.tsx` maps each `cr109_dueatclosing` enum value
(integer) to a YARDI GL charge code string. This is the sole mapping used by both:
- The **Auto Move Charges** algorithm
- The **Check with Invoice** ledger reconciliation view

If a new invoice charge type needs to be matched against YARDI charges, add an entry to
both `INVOICE_GL_CODE_MAP` and `INVOICE_TITLE_MAP` in `ChargesWorkspace.tsx`.

### 10.5 Seller T-Code Validation

Enforced in the create form (`validateForm` in `CreateClosingTicketForm.tsx`):
- Field is required
- Value must start with `T` or `t` (case-insensitive)
- Validated on blur and on submit
- Error message: "Must begin with 'T'."
- Errors cleared immediately on next valid keystroke

### 10.6 New Owner Ticket — Automation Source Rules

| Data | Source document | Notes |
|---|---|---|
| Buyer names, addresses, SSN/EIN | RPTT | Never overwritten by PAF |
| Seller names | RPTT (Grantor 1/2) | Never overwritten by PAF |
| Contact info (phone, email) | Purchase Application Form | Applicant → Primary Owner, Co-Applicant → Alternate |
| Owner occupancy | Purchase Application Form | Present/Absent comparison against Occupants list |
| Additional occupants | Purchase Application Form | Age ≥ 18, Relationship = Other, empties saved as N/A |
| Financial fields | Purchase Application Form | Purchase price, amount financed, shares, lender |
| Seller phone/email | Purchase Application Form | Only contact fields from PAF for sellers |

For Trust/LLC/Estate purchases: legal entity = Primary Owner (EIN), Applicant = primary contact.


---

## 11. Audit Log System

**File:** `src/features/auditLog/api/auditLogService.ts`
**Table:** `cr7de_appchangelog`

### Usage Pattern

Every service function that mutates data calls `writeChangeLog()` after a successful operation.
The call is fire-and-forget — the function never throws and never blocks the caller.

```typescript
writeChangeLog({
  ticketId: 'CL-000123456',          // Human-readable CL- reference
  tableName: 'cr7de_invoicedetailses',
  operation: 'update',               // 'create' | 'update' | 'delete'
  oldData: extractOldValues(existingRecord, changedFields),
  newData: changedFields as Record<string, unknown>,
})
```

### `extractOldValues`

Extracts only the fields that changed, from the old record:

```typescript
// changedFields = { cr7de_amount: '1340.70' }
// oldRecord = { cr7de_amount: '1200.00', cr7de_paidby: 1, ... }
// result = { cr7de_amount: '1200.00' }
extractOldValues(oldRecord, changedFields)
```

This produces a minimal symmetric diff, not a full record snapshot.

### Why `ownerid` / `owneridtype` are Omitted

Dataverse rejects create payloads that include `ownerid` or `owneridtype` as primitive string
values (they are navigation properties requiring special OData format). These fields are
deliberately excluded from the `writeChangeLog` create call to avoid 400 errors.

### User Identity Cache

The current user is resolved once and cached as a shared Promise. Subsequent `writeChangeLog`
calls within the same session reuse the cached identity without additional network calls.

---

## 12. Configuration & Deployment

### `power.config.json` Structure

```json
{
  "id": "<app-guid>",
  "displayName": "Closing App",
  "build": { "outputDirectory": "./dist", "entryFile": "index.html" },
  "localDev": { "url": "http://localhost:3000" },
  "environments": [
    { "name": "Dev",  "environmentId": "e1cba263-..." },
    { "name": "UAT",  "environmentId": "e0789024-..." },
    { "name": "Prod", "environmentId": "a23f5944-..." }
  ],
  "connectionReferences": [ ... ],
  "databaseReferences": [ ... ]
}
```

### Local Development

```bash
npm install
npm run dev          # starts Vite dev server at http://localhost:5173
```

In development, Dataverse calls go through the Power Apps connector emulated by the Vite
plugin. You must be authenticated with a Power Platform environment.

### Build

```bash
npm run build        # type-check (tsc -b) + Vite build → dist/
```

Output in `dist/`. The `base: './'` in `vite.config.ts` produces relative asset URLs
required by the Power Apps host frame.

### Deploy

```bash
pac auth create                           # authenticate once
pac org select --environment <env-id>     # target environment
npm run build
pac power-fx push                         # deploy to selected environment
```

### Regenerating Generated Files

If a Dataverse schema changes (new field, new entity, changed enum):

```bash
@microsoft/power-apps generate             # regenerates src/generated/
```

After regeneration: review `src/generated/models/` for new/changed types and update any
feature `types/` or `api/` files that depend on them.

---

## 13. Dependencies

### Critical Runtime Dependencies

| Package | Why it matters |
|---|---|
| `@microsoft/power-apps` | All Dataverse access, SharePoint connector, Power Automate flow invocation, user context |
| `react` + `react-dom` v19 | React 19 features (no `React.FC`, direct `use()` support) |
| `framer-motion` | Table row animations, tab transition — removing causes visual regression |
| `lucide-react` | All icons throughout the app |
| `react-pdf` + `pdfjs-dist` | Inline PDF viewer for RPTT, Purchase Form, New Owner Ticket PDF, Invoice PDF |

### Why `base: './'` Must Stay in vite.config.ts

Power Apps serves the app from a subpath inside the Power Apps runtime. Absolute asset URLs
(`/assets/...`) fail because the browser resolves them relative to `https://powerapps.com`.
Relative URLs (`./assets/...`) work correctly.

### shadcn/ui Components in Use

`alert-dialog`, `button`, `sheet` (slide-in panels), `accordion`, `badge`, `breadcrumb`,
`calendar`, `input`, `select`, `dialog`. These are in `src/components/ui/` — do not edit.
To add a new component: `npx shadcn-ui@latest add <component>`.

---

## 14. Common Troubleshooting

### "No records loaded / blank page"

1. Check `useClosingTickets.ts` error state — likely an auth or environment mismatch.
2. Confirm `pac org select` points to the correct environment.
3. Check Dataverse entity permissions for the current user's role.

### "Building Lookup shows no results"

1. Check SharePoint connection in `power.config.json` — connection reference `9c0a4a2e-...`.
2. Verify SharePoint site `https://akam.sharepoint.com/sites/Operations` is accessible.
3. Check browser console for 401/403 — may need SharePoint connection permission refresh.
4. `buildingListCache.ts` logs all fetch attempts; check browser console for `[BuildingCodeLookup]` messages.

### "Invoice not generating"

1. Confirm `NSC_Generate_Invoice` flow connection reference is configured.
2. Check Power Automate flow run history in the target environment.
3. The app returns an error if `result.data.status.toLowerCase() === 'failed'`.

### "Auto Move Charges ran but no charges were ticked"

1. Verify the Invoice tab has Buyer Cheques (`cr7de_paidby = Buyer`) with `Payable To = Building`.
2. Check that YARDI charge codes in `cr109_chargecode` match the GL codes in `INVOICE_GL_CODE_MAP`.
3. Amounts must match exactly after normalisation (`toFixed(2)`). Check for currency symbols or commas.
4. Partial charges (`cr109_partiallypaid = true`) are always skipped.

### "Validate button not appearing"

The Validate button requires **all three** of the following:
1. `cr7de_ticketstatus === 716070001` (ValidateClosings)
2. `cr109_botstatus === 396620011` (YARDIChargesFetched) OR `396620021` (YardiChargesUpdated)
3. All three documents present: Purchase Application Form, RPTT, New Owner Ticket PDF

Check each condition via the Closing Details tab and the document panel.

### "Changes not saved / 204 response treated as error"

Dataverse UPDATE returns HTTP 204 No Content — `result.data` is null.
`saveNewOwnerTicket` handles this by re-fetching the record after a successful update.
If you see unexpected "create" calls instead of updates, check that `record.cr7de_newownerticketdetailsid` is preserved correctly after save.

### "Generated files are out of date"

Run `@microsoft/power-apps generate` from the project root after any schema change in
the target Dataverse environment. Commit the regenerated files.

### Clearing the Building List Cache

```typescript
import { clearBuildingsCache } from './data/buildingListCache'
clearBuildingsCache()  // next getBuildings() call will re-fetch from SharePoint
```

---

*Document generated: July 2026. Covers app version as of the Closing Management System
build at AKAM Associates. Maintained alongside the codebase in `docs/DEVELOPER_GUIDE.md`.*
