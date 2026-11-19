// 396620002 was originally "coop_transfer" and is now "Sponser"; the separate
// "Coop Tranfer" option (396620004) has since been removed from Dataverse.
export const SPONSER_PACKAGE_TYPE = 396620002

/** A buyer created fresh under a new T-code — they don't already exist in
 * Yardi, so "Buyer exists in Yardi" is always false for this package type. */
export const TRANSFER_NEW_TCODE_PACKAGE_TYPE = 396620003

/** cr109_botstatus value for "Domecile Dump Retrieved". A Sponser-package
 * draft skips the automated Domecile retrieval stage, so it's created
 * straight at this bot status. */
export const DOMECILE_DUMP_RETRIEVED_BOT_STATUS_VALUE = 396620006

export function generateTicketId() {
  const randomNumber = Math.floor(Math.random() * 1_000_000_000)

  return `CL-${String(randomNumber).padStart(9, '0')}`
}
