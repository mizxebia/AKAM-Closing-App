import type {
  ClosingTicketCreateInput,
  ClosingTicketRecord,
  ClosingTicketUpdateInput,
} from '../../closingTickets/types/closingTicket'
import type {
  NewOwnerTicketInput,
  NewOwnerTicketRecord,
} from '../types/newOwnerTicket'

type ClosingTicketSharedSource =
  | ClosingTicketRecord
  | ClosingTicketCreateInput
  | ClosingTicketUpdateInput

const hasOwn = <T extends object>(
  value: T,
  key: PropertyKey
) => Object.prototype.hasOwnProperty.call(value, key)

function setIfPresent<
  TSource extends object,
  TTarget extends object,
  TSourceKey extends keyof TSource,
  TTargetKey extends keyof TTarget,
>(
  source: TSource,
  target: TTarget,
  sourceKey: TSourceKey,
  targetKey: TTargetKey
) {
  if (hasOwn(source, sourceKey)) {
    target[targetKey] =
      source[sourceKey] as unknown as TTarget[TTargetKey]
  }
}

export function buildNewOwnerPayloadFromClosingTicket(
  closingTicket: ClosingTicketSharedSource
): NewOwnerTicketInput {
  const payload: NewOwnerTicketInput = {}

  setIfPresent(
    closingTicket,
    payload,
    'cr7de_ticketid',
    'cr7de_ticketid'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr7de_unitnumber',
    'cr7de_unit'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr7de_closingdate',
    'cr7de_closingdate'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr7de_buildingaddress',
    'cr7de_address'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr7de_buildingname',
    'cr109_buildingname'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr7de_nyccode',
    'cr109_nyccode'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr7de_buyername',
    'cr7de_newprimaryownername'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr109_buyer2name',
    'cr7de_newsecondaryownername'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr7de_buyertcode',
    'cr109_primaryownertcode'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr7de_sellername',
    'cr7de_sellername'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr7de_sellertcode',
    'cr7de_sellertcode'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr109_seller2name',
    'cr109_seller2name'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr109_saleprice',
    'cr109_purchaseprice'
  )
  setIfPresent(
    closingTicket,
    payload,
    'cr109_shares',
    'cr109_shares'
  )

  return payload
}

export function buildClosingPayloadFromNewOwnerTicket(
  newOwnerTicket: NewOwnerTicketInput | NewOwnerTicketRecord
): ClosingTicketUpdateInput {
  const payload: ClosingTicketUpdateInput = {}

  setIfPresent(
    newOwnerTicket,
    payload,
    'cr7de_ticketid',
    'cr7de_ticketid'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr7de_unit',
    'cr7de_unitnumber'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr7de_closingdate',
    'cr7de_closingdate'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr7de_address',
    'cr7de_buildingaddress'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr109_buildingname',
    'cr7de_buildingname'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr109_nyccode',
    'cr7de_nyccode'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr7de_newprimaryownername',
    'cr7de_buyername'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr7de_newsecondaryownername',
    'cr109_buyer2name'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr109_primaryownertcode',
    'cr7de_buyertcode'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr7de_sellername',
    'cr7de_sellername'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr7de_sellertcode',
    'cr7de_sellertcode'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr109_seller2name',
    'cr109_seller2name'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr109_purchaseprice',
    'cr109_saleprice'
  )
  setIfPresent(
    newOwnerTicket,
    payload,
    'cr109_shares',
    'cr109_shares'
  )

  return payload
}
