import type { Cr7de_newownerticketdetailses } from '../../../generated/models/Cr7de_newownerticketdetailsesModel'

export type NewOwnerTicketRecord =
  Cr7de_newownerticketdetailses

export type NewOwnerTicketInput = Partial<
  Pick<
    Cr7de_newownerticketdetailses,
    | 'cr7de_ticketid'
    | 'cr7de_unit'
    | 'cr7de_closingdate'
    | 'cr7de_newprimaryownername'
    | 'cr7de_primaryowneremail'
    | 'cr7de_primaryphonenumber'
    | 'cr7de_newsecondaryownername'
    | 'cr7de_secondaryowneremail'
    | 'cr7de_secondaryphonenumber'
    | 'cr7de_sellername'
    | 'cr7de_sellertcode'
    | 'cr7de_sellercontactemail'
    | 'cr7de_sellercontactnumber'
    | 'cr7de_selleraccountzerobalanceconfirmed'
    | 'cr7de_address'
    | 'cr7de_forwardingaddressforseller'
    | 'cr109_purchaseprice'
    | 'cr109_amountfinanced'
    | 'cr109_lendersname'
    | 'cr109_shares'
  >
>

export type NewOwnerTicketFormState = {
  cr7de_ticketid: string
  cr7de_unit: string
  cr7de_closingdate: string
  cr7de_newprimaryownername: string
  cr7de_primaryowneremail: string
  cr7de_primaryphonenumber: string
  cr7de_newsecondaryownername: string
  cr7de_secondaryowneremail: string
  cr7de_secondaryphonenumber: string
  cr7de_sellername: string
  cr7de_sellertcode: string
  cr7de_sellercontactemail: string
  cr7de_sellercontactnumber: string
  cr7de_selleraccountzerobalanceconfirmed: boolean
  cr7de_address: string
  cr7de_forwardingaddressforseller: string
  cr109_purchaseprice: string
  cr109_amountfinanced: string
  cr109_lendersname: string
  cr109_shares: string
}
