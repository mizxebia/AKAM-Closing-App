import {
  EnvironmentvariabledefinitionsService,
  EnvironmentvariablevaluesService,
} from '../../../generated'

const CHARGES_CHECK_DATE_SCHEMA_NAME = 'cr109_NSC_Charges_Check_Date'

// Cache the resolved threshold as a promise so concurrent callers share the
// same in-flight lookup rather than each firing their own Dataverse queries.
let _chargesCheckDatePromise: Promise<number | null> | null = null

async function resolveChargesCheckDateThreshold(): Promise<
  number | null
> {
  try {
    const definitionResult =
      await EnvironmentvariabledefinitionsService.getAll({
        select: ['environmentvariabledefinitionid', 'defaultvalue'],
        filter: `schemaname eq '${CHARGES_CHECK_DATE_SCHEMA_NAME}'`,
        top: 1,
      })

    const definition = definitionResult.success
      ? definitionResult.data?.[0]
      : undefined

    if (!definition) {
      console.warn(
        `[chargeDate] Environment variable "${CHARGES_CHECK_DATE_SCHEMA_NAME}" was not found.`
      )
      return null
    }

    let rawValue = definition.defaultvalue
    const definitionId = definition.environmentvariabledefinitionid

    // An explicit value (set per-environment) overrides the definition's
    // default value, same as how Power Platform resolves env vars elsewhere.
    if (definitionId) {
      const valueResult = await EnvironmentvariablevaluesService.getAll({
        select: ['value'],
        filter: `_environmentvariabledefinitionid_value eq ${definitionId}`,
        top: 1,
      })

      const overrideValue = valueResult.success
        ? valueResult.data?.[0]?.value
        : undefined

      if (
        overrideValue !== undefined &&
        overrideValue !== null &&
        overrideValue !== ''
      ) {
        rawValue = overrideValue
      }
    }

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      console.warn(
        `[chargeDate] Environment variable "${CHARGES_CHECK_DATE_SCHEMA_NAME}" has no value set.`
      )
      return null
    }

    const parsed = Number(rawValue)
    return Number.isFinite(parsed) ? parsed : null
  } catch (err) {
    console.warn(
      '[chargeDate] Failed to resolve NSC_Charges_Check_Date:',
      err
    )
    return null
  }
}

/**
 * Resolves the "NSC_Charges_Check_Date" environment variable — the
 * day-of-month cutoff used to decide which month a closing's charges
 * should post to. Resolved once per session and cached.
 */
export function getChargesCheckDateThreshold(): Promise<number | null> {
  if (!_chargesCheckDatePromise) {
    _chargesCheckDatePromise = resolveChargesCheckDateThreshold()
  }
  return _chargesCheckDatePromise
}

/**
 * Derives the Charge Date from a Closing Date and the Charges Check Date
 * threshold:
 *   - If the Closing Date falls on or before the threshold day of the
 *     month, the Charge Date is the 1st of that same month.
 *   - Otherwise, the Charge Date is the 1st of the following month.
 *
 * Example: threshold = 5, closing date = Nov 10 → Dec 1 (10 > 5).
 *          threshold = 5, closing date = Nov 2 → Nov 1 (2 <= 5).
 *
 * `closingDateInput` is a plain `yyyy-mm-dd` date-input value (not a full
 * ISO timestamp) — parsed as UTC so the result is never off by a day
 * due to the local timezone.
 */
export function computeChargeDate(
  closingDateInput: string,
  checkDateThreshold: number
): string {
  if (!closingDateInput) {
    return ''
  }

  const closingDate = new Date(`${closingDateInput}T00:00:00Z`)

  if (Number.isNaN(closingDate.getTime())) {
    return ''
  }

  const day = closingDate.getUTCDate()
  const year = closingDate.getUTCFullYear()
  const month = closingDate.getUTCMonth()
  const targetMonth = day <= checkDateThreshold ? month : month + 1

  // Date.UTC normalizes an out-of-range month (e.g. 12 for December + 1)
  // into January of the following year, so December correctly rolls over.
  return new Date(Date.UTC(year, targetMonth, 1))
    .toISOString()
    .slice(0, 10)
}
