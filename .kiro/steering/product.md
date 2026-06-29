# Product: Closing Management System

A React/TypeScript front-end embedded inside Microsoft Power Apps (as a custom page / PCF component). It is used by property management staff at AKAM Associates to manage real estate closing workflows.

## Core Capabilities

- **Closing Tickets** – The primary entity. Each ticket tracks a property transaction from open to close.
- **Invoice / Charge Management** – Staff add payment line items (charges) to a closing ticket. These are stored as `cr7de_invoicedetails` records in Dataverse.
- **Invoice Generation** – Triggers the `NSC_Generate_Invoice` Power Automate flow to produce a PDF invoice.
- **New Owner Tickets** – Creates a new-owner handoff packet via the `NSC_Generate_New_Owner_Ticket` flow.
- **Ledger Views** – Buyer and Seller ledger summaries derived from charge records.
- **Document Preview** – Inline PDF viewer (via `react-pdf` / `pdfjs-dist`) for generated documents.

## Key Stakeholders / Data Sources

| Source | Purpose |
|---|---|
| Dataverse (CDS) | Primary data store for all ticket and charge records |
| SharePoint Online | Building list lookup (`buildinglist`) |
| Power Automate | Invoice and new-owner-ticket generation flows |
| Office 365 Outlook | Email delivery of generated documents |

## Deployment

The app is bundled with Vite and deployed to Power Apps using the Power Platform CLI (`pac`). It targets three environments: local dev, UAT, and Production (see `power.config.json`).
