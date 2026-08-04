# Closing Management System — App Documentation

This document explains, in simple terms, everything you can do in the Closing Management System app. It is meant for anyone using the app day-to-day, not developers.

## What is this app?

The Closing Management System helps AKAM Associates staff manage the process of closing on a property — from the day a deal starts until the building ownership is fully transferred. Everything related to a single property sale is tracked as a **Closing Ticket**.

---

## 1. Getting Around the App

At the top of the app you will always see:

- The **AKAM logo** and app name.
- A **Help Center** button — opens a guide with search, a step-by-step picture of the whole closing process, and separate guides for Payments, Yardi Charges, and New Owner Tickets.
- Your name/initials, showing who is logged in.

---

## 2. The Dashboard (Home Screen)

When you open the app, you land on the dashboard, which shows:

- **Summary cards** — Total Closings, Closings created this month, and Active Cases (tickets currently in progress).
- A **list of all Closing Tickets** with columns for Closing ID, Building Code, Building Name, Unit ID, Status, who created it, and when.

### What you can do here

- **Search** — type anything (building, unit, buyer/seller name, status, etc.) to filter the list.
- **Filter by status** using tabs: All, My Tickets, Draft, Ready for Post Closing, Validate Closings, Failed, Completed.
- **Sort** the list by newest or oldest.
- **Refresh** the list to pull the latest data.
- **Click any row** to open that ticket and see its full details.
- **Create New Closing** — opens a form to start a brand-new closing ticket.

---

## 3. Creating a New Closing Ticket

Click **Create New Closing** and fill in:

- Unit Number
- NYC Code (you can look this up by address using the **Find by Address** helper)
- Package Type
- Seller T-Code (must start with the letter "T")
- Location of Closing
- Two checkboxes:
  - **Building not on Domecile** — check this if the building isn't already set up in the Domecile system. If checked, you must also upload a **Purchase Application Form** before saving.
  - **Buyer exists in Yardi** — check if the buyer is already in the Yardi accounting system.

If you set **Package Type** to **Coop Transfer**, the app automatically checks **Buyer exists in Yardi** for you, and a **Buyer T-Code** field appears so you can enter the buyer's T-Code. This T-Code is saved on the ticket and is also carried over automatically to the matching New Owner Ticket record.

Once saved, a new ticket is created with status **Draft**, and a matching New Owner Ticket is automatically started behind the scenes.

---

## 4. Inside a Closing Ticket

Opening a ticket shows a header with the Ticket ID and quick links to open the deal in **Domecile** and **Yardi** (external systems). If a ticket has failed, a banner explains why in plain language.

A ticket moves through these statuses over its lifetime:

**Draft → Processing → Ready for Post Closing → Post Closing → Validate Closings → Transferring Building → Completed**

(A ticket can also land on **Failed** if something goes wrong — the app tells you what to fix.)

Tickets that are **Transferring Building** or **Completed** are locked and can no longer be edited. Tickets that are **Processing** are partly locked while the system works in the background.

Every ticket has up to four tabs (the last two only appear once the ticket is past Draft):

### 4a. Closing Details tab

- Edit buyer/seller info, T-Codes, transaction details (sale price, shares), and the closing agent's contact info.
- Upload documents:
  - **Purchase Application Form** (only needed if "Building not on Domecile" was checked).
  - **RPTT Document** — you can only upload this while the ticket is "Ready for Post Closing." Deleting it will move the ticket status back a step.
- **Move to Post Closing** button — appears once the ticket is "Ready for Post Closing," and only works after the RPTT document is uploaded.
- **Save** your changes at any time.

### 4b. Invoice tab

- **Add Payments** — add one or more payment/charge line items: pick the payment type, who's paying (Buyer/Seller), the amount (or "TBD" if not known yet), who it's payable to, and a cheque number if relevant.
- Add notes about the invoice.
- **Save Payments** to record everything you entered.
- View, edit, or delete existing payment records, grouped as Seller Cheques, Buyer Cheques, and Payments/Fees/Adjustments. Refunds/credits are shown with a "Credit" tag.
- See running totals for what the Seller and Buyer owe or have paid.
- **Generate Invoice** (or **Regenerate Invoice**) — creates a PDF invoice.
- **View Invoice** — opens the generated PDF to review.

### 4c. Yardi Charges tab

- **Scheduled Charges** — recurring charges pulled from Yardi (or added manually). You can edit amounts/dates and mark charges to be "Moved." Manually added charges can be deleted.
- **Add Scheduled Charge** — manually add a charge (choose the charge type, amount, dates, and other details).
- **Unpaid Charges** — charges still owed. You can mark a charge "Partially Paid" (which prevents it from being moved) or flag it to "Move."
- **Auto Move Charges** — automatically matches buyer payments to unpaid charges with the same amount and code, so you don't have to match them by hand.
- If any scheduled charge still shows "TBD," you'll see a warning that the ticket cannot move forward until it's resolved.
- **Seller Ledger** and **Buyer Ledger** — a running record of charges, payments, and balance for each party. Use **Check with Invoice** to cross-reference ledger entries against the invoice payments for reconciliation.
- **Refresh** to sync the latest charges from Yardi.

### 4d. New Owner Ticket tab

This is the paperwork needed to register the new owner.

- **Generate New Owner Ticket** — creates the New Owner Ticket document. Do this before trying to validate the ticket.
- Fill in details for the ticket, Buyer 1 & 2, Seller, financial info (purchase price, financing, shares), and any additional occupants.
  - If a buyer's Occupancy is set to "Absent," you must also fill in that buyer's address.
- **Validate** — the final step that locks in all the information and moves the deal to "Transferring Building." This is permanent, so the app asks you to confirm before doing it. You can only validate once:
  - The ticket status is "Validate Closings"
  - Yardi charges have been fetched
  - The Purchase Application Form, RPTT, and New Owner Ticket documents are all uploaded/generated
  - No scheduled charge is still "TBD"
  - If something is missing, a banner tells you exactly what.
- A document viewer lets you preview the Purchase Application Form, RPTT, and New Owner Ticket PDF side-by-side with the form.

---

## 5. Help Center

Click **Help Center** any time to:

- Search a quick-reference guide to every status and what it means.
- View a visual, step-by-step map of the entire closing process.
- Read dedicated guides for Payments, Yardi Charges, and New Owner Tickets.

---

## 6. Good to Know (Key Rules)

- Seller T-Codes must start with "T".
- You can only upload the RPTT document while a ticket is "Ready for Post Closing"; removing it sends the ticket back a step.
- A charge marked "Partially Paid" can never be flagged to "Move."
- A scheduled charge left as "TBD" blocks the New Owner Ticket from being validated.
- If a buyer's occupancy is "Absent," their address becomes required.
- Validating a New Owner Ticket is permanent — the ticket locks and cannot be changed afterward.
