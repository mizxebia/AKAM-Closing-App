import type {
  Cr7de_closingticketdetailses,
  Cr7de_closingticketdetailsescr109_botstatus,
  Cr7de_closingticketdetailsescr109_transactiontypedeal,
  Cr7de_closingticketdetailsescr7de_ticketstatus,
} from '../../../generated/models/Cr7de_closingticketdetailsesModel'

export type ClosingTicketRecord =
  Cr7de_closingticketdetailses & {
    cr7de_name?: string
  }

export type ClosingTicketColumnKey =
  | 'cr7de_ticketid'
  | 'cr7de_nyccode'
  | 'cr7de_buildingname'
  | 'cr7de_unitnumber'
  | 'cr7de_ticketstatus'
  | 'createdon'
  | 'modifiedon'

export type ClosingTicketColumn = {
  key: ClosingTicketColumnKey
  label: string
}

export type ClosingTicketFilters = {
  status: ClosingTicketTab
  buildingCode: string
  unit: string
}

export type ClosingTicketStatusLabel =
  | 'Draft'
  | 'Processing'
  | 'Post Closing'
  | 'Validate'
  | 'Completed'

export type ClosingTicketTab =
  | 'All'
  | ClosingTicketStatusLabel

export type ClosingTicketStatusTone =
  | 'draft'
  | 'processing'
  | 'postClosing'
  | 'validate'
  | 'completed'
  | 'default'

export type ClosingTicketStatusDisplay = {
  label: string
  tone: ClosingTicketStatusTone
}

export type TicketStatusOption = {
  value: ClosingTicketTab
  label: ClosingTicketTab
}

export type ClosingTicketCreateInput = Partial<
  Pick<
    Cr7de_closingticketdetailses,
    | 'cr109_botstatus'
    | 'cr109_buyer2name'
    | 'cr109_saleprice'
    | 'cr109_seller2name'
    | 'cr109_shares'
    | 'cr109_transactiontypedeal'
    | 'cr7de_buildingaddress'
    | 'cr7de_buildingname'
    | 'cr7de_buildingnotondomicile'
    | 'cr7de_buyerexistsinyardi'
    | 'cr7de_buyername'
    | 'cr7de_buyertcode'
    | 'cr7de_closingagentemail'
    | 'cr7de_closingagentname'
    | 'cr7de_closingagentphone'
    | 'cr7de_closingdate'
    | 'cr7de_notes'
    | 'cr7de_nyccode'
    | 'cr7de_sellername'
    | 'cr7de_sellertcode'
    | 'cr7de_ticketid'
    | 'cr7de_ticketstatus'
    | 'cr7de_titlerole'
    | 'cr7de_unitnumber'
  >
>

export type ClosingTicketUpdateInput =
  ClosingTicketCreateInput

export type ClosingTicketFormState = {
  cr109_botstatus: '' | Cr7de_closingticketdetailsescr109_botstatus
  cr109_buyer2name: string
  cr109_saleprice: string
  cr109_seller2name: string
  cr109_shares: string
  cr109_transactiontypedeal:
    | ''
    | Cr7de_closingticketdetailsescr109_transactiontypedeal
  cr7de_buildingaddress: string
  cr7de_buildingname: string
  cr7de_buildingnotondomicile: boolean
  cr7de_buyerexistsinyardi: boolean
  cr7de_buyername: string
  cr7de_buyertcode: string
  cr7de_closingagentemail: string
  cr7de_closingagentname: string
  cr7de_closingagentphone: string
  cr7de_closingdate: string
  cr7de_notes: string
  cr7de_nyccode: string
  cr7de_sellername: string
  cr7de_sellertcode: string
  cr7de_ticketid: string
  cr7de_ticketstatus:
    | ''
    | Cr7de_closingticketdetailsescr7de_ticketstatus
  cr7de_titlerole: string
  cr7de_unitnumber: string
}
