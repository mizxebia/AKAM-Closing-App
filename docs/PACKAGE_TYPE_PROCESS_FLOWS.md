# NSC — Process Flow by Package Type

This document breaks down the closing-ticket process flow **per Package Type**,
since each one triggers different automation and form behavior. For the full
stage-by-stage reference (field requirements, validation rules, etc.) see
[`NSC_Ticket_Lifecycle.md`](./NSC_Ticket_Lifecycle.md) — this doc layers
package-type-specific differences on top of that base flow.

| Code | Package Type | Status |
|---|---|---|
| `396620000` | Condo Sale | ✅ Enabled |
| `396620001` | Coop Sale | ✅ Enabled |
| `396620002` | Sponser | 🚧 Upcoming — Developer Mode only |
| `396620003` | Tranfer New T Code | 🚧 Upcoming — Developer Mode only |
| `396620004` | Coop Tranfer | 🚧 Upcoming — Developer Mode only |

> **Dataverse history note:** `396620002` was originally "coop_transfer" and
> was renamed to "Sponser"; a new, distinct "Coop Tranfer" option was added at
> `396620004` to take over the original Coop Transfer meaning. Any older
> documentation or data referencing `396620002` as Coop Transfer predates
> this remap.

> **Availability gating:** In the ticket creation form's Package Type
> dropdown, only Condo Sale and Coop Sale are selectable by default — the
> other three show as "(Upcoming)" and are disabled, since their automation
> isn't built out yet. They become selectable only when Developer Mode is
> enabled. (`src/features/closingTickets/utils/ticketCreation.ts` —
> `ENABLED_PACKAGE_TYPES`)

> 🔍 **Verified against the real solution.** Findings marked 🔍 below were
> confirmed by reading the actual exported Dataverse solution (cloud flow
> JSON definitions under `Workflows/`), not inferred from this app's code
> alone. Everything else in this doc is based on the app's own behavior and
> the in-app Help Centre, which may not perfectly match the live flows.
>
> The exported solution's desktop (RPA) flows are **not** readable the
> same way — they're opaque binary packages, not JSON — so anything
> about a desktop bot's *internal* branching (as opposed to which cloud
> flow dispatches it) comes from a separate, direct review of that bot's
> actual logic rather than from the export. The Sponser section below
> calls this out explicitly where it applies.

---

## Condo Sale & Coop Sale (`396620000` / `396620001`)

These two package types share an identical process flow — the full,
automated 13-stage pipeline:

| Stage | Type | Flow / Actor | Trigger | Success → Ticket Status / Bot Status | Failure → Ticket Status / Bot Status |
|---|---|---|---|---|---|
| 1 | User | Create Closing Ticket | User fills form | Draft / Draft | — |
| 2 | ☁️ Cloud | `NSC_DOMECILE_DUMP` | Bot Status = Draft | Processing / Domecile Dump Retrieved | Failed / Failed Domecile Dump Retrieval |
| 3 | 🖥️ Desktop | `NSC Yardi Seller Details` | Stage 2 success | Processing / Seller Info Retrieved | Failed / Failed Seller Info Retrieval |
| 4 | 🖥️ Desktop | `NSC Purchase Application Form Download` | Stage 3 success | Processing / Form Downloaded | Processing / Failed Form Download *(stays in Processing — auto-retried)* |
| 5 | ☁️ Cloud | `NSC_PurchaseFormUpload` | Stage 4 success | Processing / Purchase Form Upload Onedrive | Failed / Failed Purchase Form Upload Onedrive |
| 6 | ☁️ Cloud | `NSC_PurchaseApplication_DataExtraction` | Stage 5 success | Ready For Post Closing / Purchase Form Data Extracted | Failed / Failed Purchase Form Data Extraction |
| 7a | User | Upload RPTT/ACRIS doc | User uploads + saves | Ready For Post Closing / RPTT Uploaded | — |
| 7b | User | "Move to Post Closing" | User clicks button | Post Closing / RPTT Uploaded (unchanged) | — |
| 8 | ☁️ Cloud | `NSC_RPTT_DataExtraction` | Bot Status = RPTT Uploaded | Validate Closings / RPTT Extracted | Failed / Failed RPTT Extraction |
| 9 | 🖥️ Desktop | `NSC Fetch YARDI Charges` | Stage 8 success | Validate Closings / YARDI Charges Fetched | Failed / — |
| 9b | User | "Auto Move Charges" *(optional)* | User clicks button | Bot Status → Yardi Charges Updated | — |
| 10 | User | "Validate" | User clicks Validate (New Owner Ticket tab) | Transferring Building / Information Validated | — |
| 11 🔍 | 🖥️ Desktop | `NSC Yardi Seller Update` | Bot Status = Information Validated | Transferring Building / Seller Details Updated | Failed / Failed Seller Info Retrieval |
| 12 | 🖥️ Desktop | `NSC Yardi Create New Owner` | Stage 11 success | **Completed** / Owner Record Created | Failed / Failed Create New Owner |
| 13a | User | Upload Batch And Cheque Document | Send to AR tab | Completed (unchanged) | — |
| 13b | User | "Send to AR Team" | User clicks Send | **Sent to AR** / email delivered | Unchanged — error shown, retry |

Stage 13b fires three flows in sequence: `NSC_Generate_New_Owner_Ticket` →
`NSC_Generate_Invoice` → `NSC_Send_Email_To_AR`.

🔍 **Invoice generation branches by package type.** `NSC_Generate_Invoice`
checks `cr109_packagetype` per ticket: Condo Sale (`396620000`) calls a
dedicated Azure Function endpoint (`condo_invoice_pdf_generation`, its own
template); **every other package type** — Coop Sale today, and Sponser /
Tranfer New T Code / Coop Tranfer once enabled — falls through to a single
shared generic endpoint (`invoice_pdf_generation`). There is no further
per-package-type branching here — Coop Sale, Sponser, and both Transfer
types will all get the same generic invoice template unless this flow is
updated.

🔍 **Stage 11 (Seller Details Update) is real and wired up — confirmed
two ways.** The desktop flow `NSCYardiSellerUpdate`
(uiFlowId `791392a8-3da0-f011-b41c-000d3a9b514b`) is invoked:
- Inline inside both scheduler flows (`NSC_PROD2_Schedule` and
  `NSC_UAT2_Schedule`), under the `Seller_Update_and_Create_New_Owner`
  branch — it polls `cr109_botstatus eq 396620007` (Information Validated)
  every run and fires the bot unattended when any rows are pending, then
  waits 5 minutes before re-polling.
- Also exposed as its own standalone child flow,
  `NSC_YARDI_Seller_Update_Unattended`, which wraps the same uiFlowId for a
  manual/on-demand trigger (`Request` / Button trigger) — useful for
  re-running a single ticket without waiting for the next scheduler pass.

Both paths call the identical desktop bot and send the same
success/failure emails to `cr109_NSC_ErrorEmails`; neither path appeared to
require any further changes.

### Alternate path — "Building not on Domicile" flag

Available on any package type. When checked, Stages 2–5 are skipped
entirely — the ticket is created directly at **Processing / FormDownloaded**
and resumes at Stage 6. The user must manually upload the Purchase
Application Form before saving.

🔍 **The real dispatch logic for this path is more specific than the
app-level description above.** The production scheduler
(`NSC_UAT2_Schedule`) that triggers Stage 3 (Seller Info Retrieval) matches
on:
```
(cr109_botstatus eq 396620006) or
(cr7de_buildingnotondomicile eq true and cr109_botstatus eq 396620013)
```
i.e. either the normal "Domecile Dump Retrieved" trigger, **or** — for
Building-Not-On-Domicile tickets specifically — once Bot Status reaches
"Purchase Form Data Extracted" (396620013), since that path skips Seller
Info Retrieval originally and this is where it gets run instead, after the
manually-uploaded form has been extracted.

### Rollback rule

If the RPTT document is deleted while the ticket is in Post Closing or
Validate Closings, the ticket automatically rolls back to Ready For Post
Closing, re-running Stage 8 (RPTT extraction) and Stage 9 (YARDI charges
fetch) once a new document is uploaded.

---

## Sponser (`396620002`)

🚧 Not yet enabled for general use — selectable only in Developer Mode.

Differences from the standard flow:

- **Skips Stage 2 (Domicile retrieval) automatically.** On create, the
  ticket is written directly at Bot Status **"Domecile Dump Retrieved"**,
  jumping straight into Stage 3 (Seller Information Retrieval). *(Source:
  `ticketCreation.ts` — `DOMECILE_DUMP_RETRIEVED_BOT_STATUS_VALUE`; wired up
  in `CreateClosingTicketForm.tsx`'s submit handler.)*
- **"Building not on Domicile" is forced `true`** and locked — cannot be
  unchecked while Package Type is Sponser.
- **No Purchase Application Form** — the field is hidden and not required,
  since there's no sale/purchase transaction to document for this package
  type.

🔍 **Confirmed — and worse than a simple stall: the real-world Sponser
case loops indefinitely instead of ever reaching Seller Info Retrieved.**
This refines the earlier finding below, based on reading the desktop
bot's (`NSCYardiSellerDetails`) actual internal RPA logic, not just the
cloud scheduler's dispatch filters.

**Stage 3 does fire**, on the same `cr109_botstatus eq 396620006`
(Domecile Dump Retrieved) scheduler match as every other package type —
a Sponser ticket is created directly at that bot status. The bot's
extraction steps (reading T-code, names, phone, email, SSN, and the
seller ledger from Yardi) run identically for every package type; nothing
there checks `cr109_packagetype`.

**The branch that matters is inside the bot's own "Update Info To
Database" step**, and it checks two conditions *in this order*:

1. **Is `cr7de_buildingnotondomicile` true?** If so: set Ticket Status to
   Ready For Post Closing (`716070006`) and the unit number — **Bot
   Status is left unchanged.** The package-type check below is never
   reached.
2. **Else, is Package Type = Sponser (`396620002`)?** If so: set Bot
   Status to Purchase Form Data Extracted (`396620013`) and Ticket
   Status to Ready For Post Closing (`716070006`).

Any failure, for any package type, sets Bot Status to Failed Seller Info
Retrieval (`396620005`) and Ticket Status to Failed (`716070007`).

**Sponser tickets always hit branch 1, not branch 2** — the app forces
and locks `cr7de_buildingnotondomicile = true` for Sponser (see above),
and that check is evaluated first. So in practice:

- Bot Status **never advances past "Domecile Dump Retrieved"
  (`396620006`)** — branch 1 doesn't touch it, and branch 2 (the one that
  would set `396620013`) is unreachable for a real Sponser ticket.
- Because Bot Status never leaves `396620006`, it keeps matching the
  exact same scheduler dispatch filter (`cr109_botstatus eq 396620006`)
  on every future run of `NSC_PROD2_Schedule` / `NSC_UAT2_Schedule`
  (every ~2 hours).
- **Net effect: not a one-time stall, but an indefinite reprocessing
  loop.** The bot re-extracts the same seller info and re-sets Ticket
  Status to Ready For Post Closing every cycle, forever — it never
  progresses, and nothing currently stops it from re-running.

(The earlier version of this section assumed Bot Status reached "Seller
Info Retrieved" (`396620000`) before stalling there — that was based on
the cloud dispatch filters alone, without visibility into the desktop
bot's internal branch order. With that order now confirmed, Bot Status
never actually reaches `396620000` for a real Sponser ticket at all.)

---

## Tranfer New T Code (`396620003`)

🚧 Not yet enabled for general use — selectable only in Developer Mode.

Differences from the standard flow:

- **"Buyer exists in Yardi" is forced `false`** and locked — this buyer is
  new to Yardi by definition, so there's nothing to confirm.
- Buyer T-Code field stays hidden (shown only for Coop Tranfer).

🔍 **Confirmed: no flow in the exported solution branches on this package
type at all.** Unlike Sponser, Tranfer New T Code tickets aren't excluded
by any dispatch filter — they'd follow the exact same Stage 2→12 dispatch
path as Condo Sale/Coop Sale (since nothing in `Workflows/` checks
`cr109_packagetype` except `NSC_Generate_Invoice`, see above). In practice
it would still need the same things every other ticket needs (Domecile
data, Purchase Application Form) to actually progress — the field-level
differences noted above don't change anything at the automation layer.

---

## Coop Tranfer (`396620004`)

🚧 Not yet enabled for general use — selectable only in Developer Mode.

Differences from the standard flow:

- **"Buyer exists in Yardi" is forced `true`** and locked — Coop Transfer
  buyers already exist in Yardi by definition. Checking this flag manually
  on any other package type prompts a confirmation dialog that switches
  Package Type to Coop Tranfer.
- **Buyer T-Code becomes a required field**, and **Buyer Unit Number**
  appears — both hidden/not required on every other package type.
- **No Purchase Application Form** — same as Sponser, hidden and not
  required.

🔍 **Confirmed: no flow in the exported solution branches on this package
type either**, and unlike Sponser, nothing in the app forces
`cr7de_buildingnotondomicile` to `true` for Coop Tranfer — that checkbox
stays editable and defaults to `false`. So, per the dispatch filters, a
Coop Tranfer ticket would actually **pass through** Stage 2 (Domecile Dump)
and Stage 4 (Purchase Application Form Download) the same as Condo/Coop
Sale — it would not stall the way Sponser does.

This surfaces a different inconsistency worth flagging: the app **hides**
the Purchase Application Form upload field for Coop Tranfer (same as
Sponser — see base flow above), implying no PAF is needed, but nothing in
the backend automation actually knows that. Stage 4's desktop flow would
still attempt to download a purchase application form for a Coop Tranfer
ticket by default, since the dispatch filter doesn't exclude it. Whether
that step then fails, no-ops, or succeeds against bad/missing data isn't
knowable from the flow definitions alone — that's inside the desktop
flow's own RPA logic, which isn't exported as readable text the way cloud
flows are.

---

## Source references

| Behavior | File |
|---|---|
| Package type constants, enabled-type gating | `src/features/closingTickets/utils/ticketCreation.ts` |
| Form field locking/visibility per package type, create-time status overrides | `src/features/closingTickets/components/CreateClosingTicketForm.tsx` |
| In-app documented flow (Condo Sale / Coop Sale) | `src/features/closingTickets/components/HelpCentreModal.tsx` |
| Full stage-by-stage base flow reference | `docs/NSC_Ticket_Lifecycle.md` |
| 🔍 Bot Status option-set values | `src/generated/models/Cr7de_closingticketdetailsesModel.ts` |
| 🔍 Real dispatch filters (Stage 3/4 scheduler) | Exported solution — `Workflows/NSC_PROD2_Schedule-*.json`, `Workflows/NSC_UAT2_Schedule-*.json` |
| 🔍 Invoice generation package-type branch | Exported solution — `Workflows/NSC_Generate_Invoice-*.json` |
| 🔍 Per-stage cloud flow definitions (Domecile Dump, Purchase Form Upload/Extraction, RPTT Extraction, Send to AR) | Exported solution — `Workflows/NSC_DOMECILE_DUMP-*.json`, `NSC_PurchaseFormUpload-*.json`, `NSC_PurchaseApplication_DataExtraction-*.json`, `NSC_RPTT_DataExtraction-*.json`, `NSC_Send_Email_To_AR-*.json` |
| 🔍 Stage 11 (Seller Details Update) dispatch + standalone flow | Exported solution — `Workflows/NSC_PROD2_Schedule-*.json` (`Seller_Update_and_Create_New_Owner` branch), `Workflows/NSC_YARDI_Seller_Update_Unattended-9191CE22-C04A-F111-BEC6-7CED8D1A5D5B.json` |
| Sponser branch order inside `NSCYardiSellerDetails` ("Update Info To Database" step) | Direct review of the desktop bot's own logic — **not** from the exported solution (desktop flows aren't exported as readable JSON) |

> The exported solution isn't tracked in this repo (it's a local admin-portal
> export, not source code) — the 🔍 findings above were read from a one-time
> export and should be re-verified from a fresh export if the flows change.
