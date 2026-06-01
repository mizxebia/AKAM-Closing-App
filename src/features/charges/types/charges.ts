import type { Crc5c_copyscheduledchargeses } from '../../../generated/models/Crc5c_copyscheduledchargesesModel'
import type { Crc5c_unpaidchargeses } from '../../../generated/models/Crc5c_unpaidchargesesModel'

export type UnpaidChargeRecord = Crc5c_unpaidchargeses
export type ScheduledChargeRecord =
  Crc5c_copyscheduledchargeses

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
