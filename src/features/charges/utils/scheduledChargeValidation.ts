import type { ScheduledChargeRecord } from '../types/charges'

export function isUnconfirmedChargeAmount(amount?: string) {
  return (amount ?? '').trim().toLowerCase() === 'tbd'
}

export function getUnconfirmedScheduledCharges(
  scheduledCharges: ScheduledChargeRecord[]
) {
  return scheduledCharges.filter((charge) =>
    isUnconfirmedChargeAmount(charge.cr109_chargeamount)
  )
}
