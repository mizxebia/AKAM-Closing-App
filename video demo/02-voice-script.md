# Voice Script — Closing Management System Demo

Full narration text, scene by scene. Read at a relaxed, conversational pace (~140 words/minute). Timecodes are targets, not exact cue points — pair them with `03-video-script.md` for on-screen actions.

---

## Scene 0 — Intro (0:00–0:10)

> This is the Closing Management System — built for AKAM Associates to manage every step of a real estate closing, from the day a deal opens to the day the building ownership officially transfers. Let's take a look around.

---

## Scene 1 — App Shell & Navigation (0:10–0:25)

> At the top of the app, you've always got the AKAM logo, the Closing Suite name, and a Help Center button that opens a full in-app guide — we'll come back to that later. On the right, you can see who's currently signed in.

---

## Scene 2 — Dashboard (0:25–1:10)

> When you open the app, you land on the dashboard. At a glance, you can see your total closings, how many were created this month, and how many are currently active.
>
> Below that is the full list of closing tickets — Closing ID, Building, Unit, Status, who created it, and when. You can search across everything — building, unit, buyer or seller name, even the status — just by typing. You can filter by status using these tabs: All, My Tickets, Draft, Ready for Post Closing, Validate Closings, Failed, and Completed. And you can sort by newest or oldest, or hit refresh to pull the latest data.
>
> Clicking any row opens that ticket's full workspace. And to start something new, there's a Create New Closing button right here.

---

## Scene 3 — Create a New Closing Ticket (1:10–2:25)

> Let's create one. The Ticket ID is generated automatically, and every new ticket starts in Draft status.
>
> You fill in the Unit Number, and the NYC Code — if you don't know it offhand, there's a "Find by address" helper that looks it up for you. Then the Package Type — Condo Sale, Coop Sale, or Coop Transfer — and the Seller's T-Code, which always has to start with the letter "T".
>
> Now here's something worth pointing out: if you set the Package Type to Coop Transfer, the app automatically checks "Buyer exists in Yardi" for you, and a Buyer T-Code field appears — because Coop Transfer buyers are already set up in the Yardi system. That Buyer T-Code becomes required, and it's automatically saved to the ticket and carried over to the New Owner Ticket record behind the scenes.
>
> And it works both ways — if you try to check "Buyer exists in Yardi" manually while the package type is something else, the app stops you and asks first: it'll pop up a confirmation, explaining that checking this flag means switching the Package Type to Coop Transfer, with a clear choice to go ahead or cancel. And once it's set to Coop Transfer, that flag is locked on — you can't accidentally uncheck it without changing the package type back.
>
> There are two more flags here: "Building not on Domecile," which — if checked — requires you to upload a Purchase Application Form before you can save. And that's it — click Save, and the ticket is created, along with a matching New Owner Ticket that's started automatically in the background.

---

## Scene 4 — Closing Ticket Workspace Overview (2:25–3:00)

> Opening a ticket brings you into its workspace. At the top, you've got quick links straight out to Domecile and Yardi, plus a button back to the dashboard.
>
> Every ticket moves through a lifecycle: Draft, Processing, Ready for Post Closing, Post Closing, Validate Closings, Transferring Building, and finally Completed. If something goes wrong along the way, the ticket moves to Failed, and the app tells you exactly what happened in plain language — right here in a banner.
>
> Once a ticket is out of Draft, four tabs appear: Closing Details, Invoice, Yardi Charges, and New Owner Ticket. Let's go through each one.

---

## Scene 5 — Closing Details Tab (3:00–3:50)

> This is where you manage the core details — buyer and seller names, T-Codes, transaction type, sale price, shares, and the closing agent's contact info.
>
> Down here are the documents. The Purchase Application Form, if the building wasn't on Domecile. And the RPTT document — but notice this one's disabled right now. It can only be uploaded once the ticket reaches "Ready for Post Closing" status. If you ever delete it after that point, the ticket automatically rolls back a step, so nothing falls out of sync.
>
> Once that RPTT document is uploaded, this "Move to Post Closing" button lights up, and you're on your way to the next stage.

---

## Scene 6 — Invoice Tab (3:50–4:50)

> The Invoice tab is where payment line items get added. You pick the payment type, who's paying — buyer or seller — the amount, or "TBD" if it's not known yet, and who it's payable to. You can add as many rows as you need, then save them all at once.
>
> Below, every payment shows up in a table, split into Seller Cheques, Buyer Cheques, and Payments, Fees, and Adjustments — and you can edit or delete any of them right here. Credits show up with a clear "Credit" tag. At the bottom, running totals show exactly what's owed and what's been paid on both sides.
>
> When you're ready, hit Generate Invoice, and the app produces a PDF. Once it exists, View Invoice opens it right inside the app for a quick review.

---

## Scene 7 — Yardi Charges Tab (4:50–6:10)

> This tab bridges the ticket with Yardi's accounting data. Scheduled Charges are the recurring charges — pulled in automatically or added manually — and you can edit amounts, dates, and flag which ones should move.
>
> Unpaid Charges are what's still owed. You can mark a charge "Partially Paid," which — for safety — automatically disables the "Move" option on it, since a partial charge should never be moved as if it were fully settled.
>
> Now, matching payments to charges by hand can be tedious — so there's an Auto Move Charges button. It automatically matches buyer payments to unpaid charges with the same code and amount, and flags them to move — no manual matching required.
>
> If any scheduled charge is still marked "TBD," you'll see a clear warning that the ticket can't be validated until that's resolved.
>
> And finally, the Buyer and Seller Ledgers — a running record of every charge, payment, and balance. Toggle "Check with Invoice" to line up ledger entries against the actual invoice payments, which makes reconciliation straightforward.

---

## Scene 8 — New Owner Ticket Tab (6:10–7:15)

> This is the paperwork that registers the new owner. Start by clicking Generate New Owner Ticket, which produces the document.
>
> The form itself covers everything: the ticket and property details, Buyer 1 and Buyer 2 information, Seller information, financials like purchase price and financing, and any additional occupants.
>
> One rule worth calling out — if a buyer's Occupancy is set to "Absent," their address becomes required, since the app needs somewhere to send documentation.
>
> Alongside the form is a document viewer, so you can flip between the Purchase Application Form, the RPTT document, and the New Owner Ticket PDF without leaving the page.
>
> When everything's in place — the ticket status is Validate Closings, Yardi charges have been fetched, all three documents exist, and nothing's still marked TBD — the Validate button becomes available. This is the final, permanent step: once you validate, the ticket locks, moves to Transferring Building, and the ownership transfer paperwork is locked in. The app double-checks with you before locking it in, since there's no undo.

---

## Scene 9 — Help Center (7:15–7:50)

> Anywhere in the app, the Help Center is one click away. It's got a searchable Quick Reference for every status, a full visual map of the entire closing process from start to finish, and dedicated guides for Payments, Yardi Charges, and New Owner Tickets — so help is always exactly where you need it.

---

## Scene 10 — Closing Recap (7:50–8:15)

> To recap the journey: a ticket starts in Draft, moves through Processing, Ready for Post Closing, Post Closing, and Validate Closings, then Transferring Building, and finally Completed. Every step is tracked, every document is in one place, and the app enforces the rules along the way — so nothing slips through the cracks.

---

## Scene 11 — Outro (8:15–8:25)

> That's the Closing Management System — one place to manage the entire closing process, from open to close. Thanks for watching.
