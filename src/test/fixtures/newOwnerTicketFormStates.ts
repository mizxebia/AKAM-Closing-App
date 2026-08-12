import type {
  EditableNewOwnerTicketField,
  NewOwnerTicketFormState,
} from '../../features/newOwnerTickets/types/newOwnerTicket'

function baseFormState(
  overrides: Partial<NewOwnerTicketFormState> = {}
): NewOwnerTicketFormState {
  return {
    cr109_additional_occupants1name: '',
    cr109_additionaloccupant2name: '',
    cr109_additionaloccupant3name: '',
    cr109_amountfinanced: '',
    cr109_buildingname: 'Test Towers',
    cr109_buyer1address: '',
    cr109_buyer1city: '',
    cr109_buyer1state: '',
    cr109_buyer1zip: '',
    cr109_buyer2address: '',
    cr109_buyer2city: '',
    cr109_buyer2state: '',
    cr109_buyer2zip: '',
    cr109_lendersname: '',
    cr109_nyccode: '1234',
    cr109_primaryhomephonenumber: '',
    cr109_primaryownertcode: '',
    cr109_primaryworkphonenumber: '',
    cr109_purchaseprice: '500000',
    cr109_purchaser1occupancy: 'Present',
    cr109_purchaser1purchasedate: '',
    cr109_purchaser2occupancy: 'Present',
    cr109_secondaryownerhomephonenumber: '',
    cr109_secondaryownerworkphonenumber: '',
    cr109_seller1address: '',
    cr109_seller1city: '',
    cr109_seller1state: '',
    cr109_seller1zip: '',
    cr109_seller2address: '',
    cr109_seller2city: '',
    cr109_seller2name: '',
    cr109_seller2ssnein: '',
    cr109_seller2state: '',
    cr109_seller2zip: '',
    cr109_shares: '',
    cr7de_address: '123 Main St',
    cr7de_alternatemailingaddress: '',
    cr7de_closingdate: '2026-01-15',
    cr7de_forwardingaddressforseller: '',
    cr7de_newprimaryownername: 'Alex Buyer',
    cr7de_newsecondaryownername: '',
    cr7de_paymentappliedtoselleraccount: '',
    cr7de_primaryowneremail: '',
    cr7de_primaryownerssnein: '',
    cr7de_primaryphonenumber: '',
    cr7de_secondaryowneremail: '',
    cr7de_secondaryownerssnein: '',
    cr7de_secondaryphonenumber: '',
    cr7de_selleraccountzerobalanceconfirmed: false,
    cr7de_sellercontactemail: '',
    cr7de_sellercontactnumber: '',
    cr7de_sellername: 'Sam Seller',
    cr7de_sellerssnein: '',
    cr7de_sellertcode: '',
    cr7de_ticketid: 'CT-1001',
    cr7de_unit: '1A',
    statecode: '',
    statuscode: '',
    ...overrides,
  }
}

export interface NewOwnerTicketFixture {
  /** Short, descriptive name shown in test output. */
  name: string
  /** Simulates form state as it would be loaded for a real, existing ticket. */
  formState: NewOwnerTicketFormState
  /** Fields validateForm is expected to flag as errors for this fixture. Empty = expected to pass. */
  expectedErrorFields: EditableNewOwnerTicketField[]
}

/**
 * A representative sample of "existing ticket" shapes pulled from real usage
 * patterns of the New Owner Ticket form: some have a second buyer, some
 * don't, some have an absent occupant requiring a mailing address, some have
 * bad data. The data-driven suite (NewOwnerTicketTab.fixtures.test.ts) runs
 * every fixture here through the real validation/payload logic automatically
 * — add a fixture here to extend coverage without writing new test code.
 */
export const newOwnerTicketFixtures: NewOwnerTicketFixture[] = [
  {
    name: 'complete ticket with two buyers and two sellers',
    formState: baseFormState({
      cr7de_newsecondaryownername: 'Jamie Buyer',
      cr7de_secondaryownerssnein: '123456789',
      cr109_buyer2address: '123 Main St',
      cr109_buyer2city: 'New York',
      cr109_buyer2state: 'NY',
      cr109_buyer2zip: '10001',
      cr109_seller2name: 'Casey Seller',
      cr109_seller2ssnein: '987654321',
      cr109_seller2address: '456 Old Rd',
      cr109_seller2city: 'New York',
      cr109_seller2state: 'NY',
      cr109_seller2zip: '10002',
      cr7de_primaryowneremail: 'alex.buyer@example.com',
      cr7de_secondaryowneremail: 'jamie.buyer@example.com',
      cr7de_sellercontactemail: 'sam.seller@example.com',
    }),
    expectedErrorFields: [],
  },
  {
    name: 'single buyer, no second buyer or second seller on record',
    formState: baseFormState(),
    expectedErrorFields: [],
  },
  {
    name: 'buyer 1 occupancy Absent with mailing address provided',
    formState: baseFormState({
      cr109_purchaser1occupancy: 'Absent',
      cr109_buyer1address: '9 Forwarding Ave',
      cr109_buyer1city: 'New York',
      cr109_buyer1state: 'NY',
      cr109_buyer1zip: '10003',
    }),
    expectedErrorFields: [],
  },
  {
    name: 'buyer 1 occupancy Absent missing mailing address',
    formState: baseFormState({
      cr109_purchaser1occupancy: 'Absent',
    }),
    expectedErrorFields: [
      'cr109_buyer1address',
      'cr109_buyer1city',
      'cr109_buyer1state',
      'cr109_buyer1zip',
    ],
  },
  {
    name: 'buyer 2 occupancy Absent missing mailing address',
    formState: baseFormState({
      cr7de_newsecondaryownername: 'Jamie Buyer',
      cr109_purchaser2occupancy: 'Absent',
    }),
    expectedErrorFields: [
      'cr109_buyer2address',
      'cr109_buyer2city',
      'cr109_buyer2state',
      'cr109_buyer2zip',
    ],
  },
  {
    name: 'malformed buyer/seller email addresses',
    formState: baseFormState({
      cr7de_primaryowneremail: 'not-an-email@',
      cr7de_secondaryowneremail: '@missing-local.com',
      cr7de_sellercontactemail: 'sam.seller@',
    }),
    expectedErrorFields: [
      'cr7de_primaryowneremail',
      'cr7de_secondaryowneremail',
      'cr7de_sellercontactemail',
    ],
  },
  {
    name: 'missing required ticket id and unit',
    formState: baseFormState({
      cr7de_ticketid: '',
      cr7de_unit: '',
    }),
    expectedErrorFields: ['cr7de_ticketid', 'cr7de_unit'],
  },
]

export { baseFormState }
