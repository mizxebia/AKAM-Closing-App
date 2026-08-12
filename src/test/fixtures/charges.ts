import type { ScheduledChargeRecord } from '../../features/charges/types/charges'

function baseScheduledCharge(
  overrides: Partial<ScheduledChargeRecord>
): ScheduledChargeRecord {
  return {
    crc5c_copyscheduledchargesid: 'charge-0000',
    cr109_chargeamount: '100.00',
    ...overrides,
  } as unknown as ScheduledChargeRecord
}

export const scheduledChargeFixtures: ScheduledChargeRecord[] = [
  baseScheduledCharge({
    crc5c_copyscheduledchargesid: 'charge-confirmed-1',
    cr109_chargeamount: '250.00',
  }),
  baseScheduledCharge({
    crc5c_copyscheduledchargesid: 'charge-tbd-1',
    cr109_chargeamount: 'TBD',
  }),
  baseScheduledCharge({
    crc5c_copyscheduledchargesid: 'charge-tbd-lowercase',
    cr109_chargeamount: ' tbd ',
  }),
  baseScheduledCharge({
    crc5c_copyscheduledchargesid: 'charge-empty-amount',
    cr109_chargeamount: undefined,
  }),
]
