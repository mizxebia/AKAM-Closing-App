import type { ClosingTicketRecord } from '../../features/closingTickets/types/closingTicket'

/**
 * Sanitized, representative shapes of records this app actually loads from
 * Dataverse — used so tests exercise the same variety of "real" tickets
 * (different statuses, missing docs, different creators) without touching
 * the live environment. No real names/emails/SSNs — every value below is
 * fabricated for testing.
 */
function baseClosingTicket(
  overrides: Partial<ClosingTicketRecord> & Record<string, unknown>
): ClosingTicketRecord {
  return {
    cr7de_closingticketdetailsid: 'closing-0000',
    cr7de_ticketid: 'CT-0000',
    cr7de_nyccode: '1234',
    cr7de_buildingname: 'Test Towers',
    cr7de_unitnumber: '1A',
    cr7de_ticketstatus: 716070000,
    cr109_botstatus: 396620004,
    createdon: '2026-01-05T10:00:00Z',
    modifiedon: '2026-01-06T10:00:00Z',
    _createdby_value: 'user-guid-1',
    ['_createdby_value@OData.Community.Display.V1.FormattedValue']:
      'Test User #',
    ...overrides,
  } as unknown as ClosingTicketRecord
}

export const closingTicketFixtures: ClosingTicketRecord[] = [
  baseClosingTicket({
    cr7de_closingticketdetailsid: 'closing-draft-1',
    cr7de_ticketid: 'CT-1001',
    cr7de_ticketstatus: 716070000, // Draft
    cr109_botstatus: 396620004, // Draft
  }),
  baseClosingTicket({
    cr7de_closingticketdetailsid: 'closing-validate-1',
    cr7de_ticketid: 'CT-1002',
    cr7de_buildingname: 'Riverside Court',
    cr7de_unitnumber: '5B',
    cr7de_ticketstatus: 716070001, // ValidateClosings
    cr109_botstatus: 396620011, // YARDIChargesFetched
  }),
  baseClosingTicket({
    cr7de_closingticketdetailsid: 'closing-completed-1',
    cr7de_ticketid: 'CT-1003',
    cr7de_buildingname: 'Harbor View',
    cr7de_unitnumber: '12C',
    cr7de_ticketstatus: 716070008, // Completed
    cr109_botstatus: 396620021, // YardiChargesUpdated
  }),
  baseClosingTicket({
    cr7de_closingticketdetailsid: 'closing-failed-1',
    cr7de_ticketid: 'CT-1004',
    cr7de_buildingname: 'Failed Retrieval Building',
    cr7de_unitnumber: '3D',
    cr7de_ticketstatus: 716070007, // Failed
    cr109_botstatus: 396620005, // FailedSellerInfoRetrieval
  }),
  baseClosingTicket({
    cr7de_closingticketdetailsid: 'closing-mine-1',
    cr7de_ticketid: 'CT-1005',
    cr7de_buildingname: 'My Tickets Building',
    cr7de_unitnumber: '9F',
    cr7de_ticketstatus: 716070000,
    _createdby_value: 'current-user-guid',
    ['_createdby_value@OData.Community.Display.V1.FormattedValue']:
      'Current User #',
  }),
]
