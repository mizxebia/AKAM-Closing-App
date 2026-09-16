import type { ClosingTicketColumn } from '../types/closingTicket'

export const closingTicketColumns: ClosingTicketColumn[] = [
  {
    key: 'cr7de_ticketid',
    label: 'Closing ID',
  },
  {
    key: 'cr7de_nyccode',
    label: 'Building Code',
  },
  {
    key: 'cr7de_buildingname',
    label: 'Building Name',
  },
  {
    key: 'cr7de_unitnumber',
    label: 'Unit ID',
  },
  {
    key: 'cr7de_ticketstatus',
    label: 'Status',
  },
  {
    key: 'createdbyname',
    label: 'Created By',
  },
  {
    key: 'createdon',
    label: 'Created Date',
  },
  {
    key: 'modifiedon',
    label: 'Last Modified',
  },
]

/** Developer Mode only — appended to closingTicketColumns when enabled. */
export const botStatusColumn: ClosingTicketColumn = {
  key: 'cr109_botstatus',
  label: 'Bot Status',
}

/** Developer Mode only — shows why a Failed ticket failed; blank otherwise. */
export const failureReasonColumn: ClosingTicketColumn = {
  key: 'failureReason',
  label: 'Failure Reason',
}
