import type { ClosingTicketColumn } from '../types/closingTicket'

export const closingTicketColumns: ClosingTicketColumn[] = [
  {
    key: 'cr7de_ticketid',
    label: 'Closing ID',
    width: '130px',
  },
  {
    key: 'cr7de_nyccode',
    label: 'Building Code',
    width: '110px',
  },
  {
    key: 'cr7de_buildingname',
    label: 'Building Name',
    width: '190px',
  },
  {
    key: 'cr7de_unitnumber',
    label: 'Unit ID',
    width: '80px',
  },
  {
    key: 'cr7de_ticketstatus',
    label: 'Status',
    width: '160px',
  },
  {
    key: 'createdbyname',
    label: 'Created By',
    width: '140px',
  },
  {
    key: 'createdon',
    label: 'Created Date',
    width: '98px',
  },
  {
    key: 'modifiedon',
    label: 'Last Modified',
    width: '98px',
  },
]

/** Developer Mode only — appended to closingTicketColumns when enabled. */
export const botStatusColumn: ClosingTicketColumn = {
  key: 'cr109_botstatus',
  label: 'Bot Status',
  width: '170px',
}

/** Developer Mode only — shows why a Failed ticket failed; blank otherwise. */
export const failureReasonColumn: ClosingTicketColumn = {
  key: 'failureReason',
  label: 'Failure Reason',
  width: '190px',
}
