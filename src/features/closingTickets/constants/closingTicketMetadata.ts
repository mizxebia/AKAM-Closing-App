export const closingTicketTableName = 'cr7de_closingticketdetails'

export const closingTicketSearchFields = [
  'cr7de_nyccode',
  'cr7de_unitnumber',
] as const

export const closingTicketTabs = [
  'All',
  'Draft',
  'Processing',
  'Ready for Post Closing',
  'Post Closing',
  'Validated',
  'Transferring Building',
  'Failed',
  'Completed',
] as const
