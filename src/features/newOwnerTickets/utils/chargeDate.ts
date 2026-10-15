/**
 * Derives the Scheduled Charges Start Date from a Closing Date: always
 * the 1st of the month following the Closing Date, regardless of where
 * in the month the closing falls.
 *
 * Example: closing date = Nov 10 → Dec 1. Closing date = Nov 2 → Dec 1.
 *
 * `closingDateInput` is a plain `yyyy-mm-dd` date-input value (not a full
 * ISO timestamp) — parsed as UTC so the result is never off by a day
 * due to the local timezone.
 */
export function computeChargeDate(closingDateInput: string): string {
  if (!closingDateInput) {
    return ''
  }

  const closingDate = new Date(`${closingDateInput}T00:00:00Z`)

  if (Number.isNaN(closingDate.getTime())) {
    return ''
  }

  const year = closingDate.getUTCFullYear()
  const month = closingDate.getUTCMonth()

  // Date.UTC normalizes an out-of-range month (e.g. 12 for December + 1)
  // into January of the following year, so December correctly rolls over.
  return new Date(Date.UTC(year, month + 1, 1)).toISOString().slice(0, 10)
}
