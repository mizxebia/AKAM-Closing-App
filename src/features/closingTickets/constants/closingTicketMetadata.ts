export const closingTicketTableName = 'cr7de_closingticketdetails'

export const closingTicketSearchFields = [
  'cr7de_nyccode',
  'cr7de_unitnumber',
] as const

export const closingTicketTabs = [
  'All',
  'My Tickets',
  'Draft',
  'Processing',
  'Ready for Post Closing',
  'Post Closing',
  'Validate Closings',
  'Transferring Building',
  'Completed',
  'Sent to AR',
  'Failed',
] as const

/**
 * Internal/automation-only statuses — hidden from the status tab bar
 * unless Developer Mode is enabled (see showDeveloperStatusTabs on
 * ClosingTicketFilters). They still match normally by label everywhere
 * else (search, formatting, etc.) regardless of Developer Mode.
 */
export const developerOnlyClosingTicketTabs = new Set<
  (typeof closingTicketTabs)[number]
>(['Processing', 'Transferring Building'])
