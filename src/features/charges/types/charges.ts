import type { Crc5c_copyscheduledchargeses } from '../../../generated/models/Crc5c_copyscheduledchargesesModel'
import type { Crc5c_unpaidchargeses } from '../../../generated/models/Crc5c_unpaidchargesesModel'
import type { Crc5c_sellerledgers } from '../../../generated/models/Crc5c_sellerledgersModel'
import type { Crc5c_buyerledgers } from '../../../generated/models/Crc5c_buyerledgersModel'
import type { Crc5c_manualchargeses } from '../../../generated/models/Crc5c_manualchargesesModel'
import type { Crc5c_manualchargesescr109_chargecode, Crc5c_manualchargesescr109_epaytype, Crc5c_manualchargesescr109_type } from '../../../generated/models/Crc5c_manualchargesesModel'

export type UnpaidChargeRecord = Crc5c_unpaidchargeses
export type ScheduledChargeRecord = Crc5c_copyscheduledchargeses
export type SellerLedgerRecord = Crc5c_sellerledgers
export type BuyerLedgerRecord = Crc5c_buyerledgers
export type ManualChargeRecord = Crc5c_manualchargeses

export type ManualChargeCreateInput = {
  crc5c_ticketid: string
  cr109_chargecode?: Crc5c_manualchargesescr109_chargecode
  cr109_amount?: string
  cr109_datefrom?: string
  cr109_dateto?: string
  cr109_type?: Crc5c_manualchargesescr109_type
  cr109_epaytype?: Crc5c_manualchargesescr109_epaytype
  cr109_ratesqft?: string
  cr109_maxpostings?: string
  cr109_hold?: boolean
  cr109_notes?: string
}

export type UnpaidChargeUpdateInput = Partial<
  Pick<
    Crc5c_unpaidchargeses,
    | 'cr109_amount'
    | 'cr109_chargecode'
    | 'cr109_date'
    | 'cr109_move'
    | 'cr109_notes'
    | 'cr109_partiallypaid'
  >
>

export type ScheduledChargeUpdateInput = Partial<
  Pick<
    Crc5c_copyscheduledchargeses,
    | 'cr109_chargeamount'
    | 'cr109_chargecode'
    | 'cr109_chargefrom'
    | 'cr109_chargeto'
    | 'cr109_move'
    | 'cr109_partiallypaid'
  >
>
