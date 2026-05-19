import type {
  Cr7de_newownerticketdetailses,
  Cr7de_newownerticketdetailsesstatecode,
  Cr7de_newownerticketdetailsesstatuscode,
} from '../../../generated/models/Cr7de_newownerticketdetailsesModel'

export type NewOwnerTicketRecord =
  Cr7de_newownerticketdetailses

export type EditableNewOwnerTicketField =
  | 'cr109_additional_occupants1name'
  | 'cr109_additionaloccupant2name'
  | 'cr109_additionaloccupant3name'
  | 'cr109_amountfinanced'
  | 'cr109_buyer1address'
  | 'cr109_buyer1city'
  | 'cr109_buyer1state'
  | 'cr109_buyer1zip'
  | 'cr109_buyer2address'
  | 'cr109_buyer2city'
  | 'cr109_buyer2state'
  | 'cr109_buyer2zip'
  | 'cr109_lendersname'
  | 'cr109_primaryhomephonenumber'
  | 'cr109_primaryworkphonenumber'
  | 'cr109_purchaseprice'
  | 'cr109_purchaser1occupancy'
  | 'cr109_purchaser1purchasedate'
  | 'cr109_purchaser2occupancy'
  | 'cr109_secondaryownerhomephonenumber'
  | 'cr109_secondaryownerworkphonenumber'
  | 'cr109_seller1address'
  | 'cr109_seller1city'
  | 'cr109_seller1state'
  | 'cr109_seller1zip'
  | 'cr109_seller2address'
  | 'cr109_seller2city'
  | 'cr109_seller2name'
  | 'cr109_seller2ssnein'
  | 'cr109_seller2state'
  | 'cr109_seller2zip'
  | 'cr109_shares'
  | 'cr7de_address'
  | 'cr7de_alternatemailingaddress'
  | 'cr7de_closingdate'
  | 'cr7de_forwardingaddressforseller'
  | 'cr7de_newprimaryownername'
  | 'cr7de_newsecondaryownername'
  | 'cr7de_paymentappliedtoselleraccount'
  | 'cr7de_primaryowneremail'
  | 'cr7de_primaryownerssnein'
  | 'cr7de_primaryphonenumber'
  | 'cr7de_secondaryowneremail'
  | 'cr7de_secondaryownerssnein'
  | 'cr7de_secondaryphonenumber'
  | 'cr7de_selleraccountzerobalanceconfirmed'
  | 'cr7de_sellercontactemail'
  | 'cr7de_sellercontactnumber'
  | 'cr7de_sellername'
  | 'cr7de_sellerssnein'
  | 'cr7de_sellertcode'
  | 'cr7de_ticketid'
  | 'cr7de_unit'
  | 'statecode'
  | 'statuscode'

export type NewOwnerTicketInput = Partial<
  Pick<Cr7de_newownerticketdetailses, EditableNewOwnerTicketField>
>

export type NewOwnerTicketFormState = {
  cr109_additional_occupants1name: string
  cr109_additionaloccupant2name: string
  cr109_additionaloccupant3name: string
  cr109_amountfinanced: string
  cr109_buyer1address: string
  cr109_buyer1city: string
  cr109_buyer1state: string
  cr109_buyer1zip: string
  cr109_buyer2address: string
  cr109_buyer2city: string
  cr109_buyer2state: string
  cr109_buyer2zip: string
  cr109_lendersname: string
  cr109_primaryhomephonenumber: string
  cr109_primaryworkphonenumber: string
  cr109_purchaseprice: string
  cr109_purchaser1occupancy: string
  cr109_purchaser1purchasedate: string
  cr109_purchaser2occupancy: string
  cr109_secondaryownerhomephonenumber: string
  cr109_secondaryownerworkphonenumber: string
  cr109_seller1address: string
  cr109_seller1city: string
  cr109_seller1state: string
  cr109_seller1zip: string
  cr109_seller2address: string
  cr109_seller2city: string
  cr109_seller2name: string
  cr109_seller2ssnein: string
  cr109_seller2state: string
  cr109_seller2zip: string
  cr109_shares: string
  cr7de_address: string
  cr7de_alternatemailingaddress: string
  cr7de_closingdate: string
  cr7de_forwardingaddressforseller: string
  cr7de_newprimaryownername: string
  cr7de_newsecondaryownername: string
  cr7de_paymentappliedtoselleraccount: string
  cr7de_primaryowneremail: string
  cr7de_primaryownerssnein: string
  cr7de_primaryphonenumber: string
  cr7de_secondaryowneremail: string
  cr7de_secondaryownerssnein: string
  cr7de_secondaryphonenumber: string
  cr7de_selleraccountzerobalanceconfirmed: boolean
  cr7de_sellercontactemail: string
  cr7de_sellercontactnumber: string
  cr7de_sellername: string
  cr7de_sellerssnein: string
  cr7de_sellertcode: string
  cr7de_ticketid: string
  cr7de_unit: string
  statecode: Cr7de_newownerticketdetailsesstatecode | ''
  statuscode: Cr7de_newownerticketdetailsesstatuscode | ''
}
