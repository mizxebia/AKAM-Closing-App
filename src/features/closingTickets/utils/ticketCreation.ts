// Dataverse re-mapped this choice set: 396620002 ("coop_transfer") was
// renamed to "Sponser" and a new, distinct "Coop Tranfer" option was added
// at 396620004 — that's the value Coop Transfer logic now targets.
export const COOP_TRANSFER_PACKAGE_TYPE = 396620004

/** The only package types currently selectable when creating a ticket — the
 * rest (Sponser, Tranfer New T Code, Coop Tranfer) are shown but disabled
 * as "Upcoming" until those workflows are built out. */
export const ENABLED_PACKAGE_TYPES = new Set([
  396620000, // condo_sale
  396620001, // coop_sale
])

export const SPONSER_PACKAGE_TYPE = 396620002

/** A buyer created fresh under a new T-code — unlike Coop Transfer, they
 * don't already exist in Yardi, so there's no Buyer T-Code to collect and
 * "Buyer exists in Yardi" is always false for this package type. */
export const TRANSFER_NEW_TCODE_PACKAGE_TYPE = 396620003

/** cr109_botstatus value for "Domecile Dump Retrieved". A Sponser-package
 * draft skips the automated Domecile retrieval stage, so it's created
 * straight at this bot status. */
export const DOMECILE_DUMP_RETRIEVED_BOT_STATUS_VALUE = 396620006

export function generateTicketId() {
  const randomNumber = Math.floor(Math.random() * 1_000_000_000)

  return `CL-${String(randomNumber).padStart(9, '0')}`
}
