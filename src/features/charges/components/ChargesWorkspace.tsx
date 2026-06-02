import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { RotateCw, Save } from 'lucide-react'
import {
  updateScheduledCharge,
  updateUnpaidCharge,
  syncBuyerLedgerWithUnpaidCharge,
} from '../api/chargesService'
import type {
  BuyerLedgerRecord,
  ScheduledChargeRecord,
  ScheduledChargeUpdateInput,
  SellerLedgerRecord,
  UnpaidChargeRecord,
  UnpaidChargeUpdateInput,
} from '../types/charges'

interface ChargesWorkspaceProps {
  unpaidCharges: UnpaidChargeRecord[]
  scheduledCharges: ScheduledChargeRecord[]
  sellerLedgers: SellerLedgerRecord[]
  buyerLedgers: BuyerLedgerRecord[]
  loading: boolean
  refreshing: boolean
  error: string | null
  onRefresh: () => Promise<void> | void
}

type UnpaidChargeDraft = {
  cr109_amount: string
  cr109_chargecode: string
  cr109_date: string
  cr109_move: boolean
  cr109_notes: string
  cr109_partiallypaid: boolean
}

type ScheduledChargeDraft = {
  cr109_chargeamount: string
  cr109_chargecode: string
  cr109_chargefrom: string
  cr109_chargeto: string
  cr109_move: boolean
  cr109_partiallypaid: boolean
}

function getDateInputValue(value?: string) {
  if (!value) {
    return ''
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime())
    ? value.slice(0, 10)
    : parsedDate.toISOString().slice(0, 10)
}

function normalizeText(value: string) {
  const trimmedValue = value.trim()
  return trimmedValue === '' ? undefined : trimmedValue
}

function createUnpaidDraft(
  record: UnpaidChargeRecord
): UnpaidChargeDraft {
  return {
    cr109_amount: record.cr109_amount ?? '',
    cr109_chargecode: record.cr109_chargecode ?? '',
    cr109_date: getDateInputValue(record.cr109_date),
    cr109_move: record.cr109_move ?? false,
    cr109_notes: record.cr109_notes ?? '',
    cr109_partiallypaid:
      record.cr109_partiallypaid ?? false,
  }
}

function createScheduledDraft(
  record: ScheduledChargeRecord
): ScheduledChargeDraft {
  return {
    cr109_chargeamount: record.cr109_chargeamount ?? '',
    cr109_chargecode: record.cr109_chargecode ?? '',
    cr109_chargefrom: getDateInputValue(
      record.cr109_chargefrom
    ),
    cr109_chargeto: getDateInputValue(record.cr109_chargeto),
    cr109_move: record.cr109_move ?? false,
    cr109_partiallypaid:
      record.cr109_partiallypaid ?? false,
  }
}

function buildUnpaidPayload(
  draft: UnpaidChargeDraft
): UnpaidChargeUpdateInput {
  return {
    cr109_amount: normalizeText(draft.cr109_amount),
    cr109_chargecode: normalizeText(draft.cr109_chargecode),
    cr109_date: draft.cr109_date || undefined,
    cr109_move: draft.cr109_move ?? false,
    cr109_notes: normalizeText(draft.cr109_notes),
    cr109_partiallypaid: draft.cr109_partiallypaid ?? false,
  }
}

function buildScheduledPayload(
  draft: ScheduledChargeDraft
): ScheduledChargeUpdateInput {
  return {
    cr109_chargeamount: normalizeText(
      draft.cr109_chargeamount
    ),
    cr109_chargecode: normalizeText(draft.cr109_chargecode),
    cr109_chargefrom: draft.cr109_chargefrom || undefined,
    cr109_chargeto: draft.cr109_chargeto || undefined,
    cr109_move: draft.cr109_move ?? false,
    cr109_partiallypaid: draft.cr109_partiallypaid ?? false,
  }
}

function formatLedgerDate(value?: string) {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value.slice(0, 10)
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

function formatLedgerValue(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

function parseLedgerNumber(value?: string) {
  if (!value) {
    return 0
  }

  const parsed = Number(value.replace(/,/g, '').trim())
  return Number.isFinite(parsed) ? parsed : 0
}

function formatLedgerNumber(value: number) {
  return value.toFixed(2)
}

function BooleanPill({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      className={
        checked
          ? 'charge-boolean-pill charge-boolean-pill-active'
          : 'charge-boolean-pill'
      }
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

function UnpaidChargesTable({
  records,
  savingId,
  onSaved,
  onSavingChange,
}: {
  records: UnpaidChargeRecord[]
  savingId: string | null
  onSaved: () => Promise<void> | void
  onSavingChange: (id: string | null) => void
}) {
  const initialDrafts = useMemo(
    () =>
      Object.fromEntries(
        records.map((record) => [
          record.crc5c_unpaidchargesid,
          createUnpaidDraft(record),
        ])
      ) as Record<string, UnpaidChargeDraft>,
    [records]
  )
  const [drafts, setDrafts] = useState(initialDrafts)
  const [saveError, setSaveError] = useState<string | null>(
    null
  )

  useEffect(() => {
    setDrafts(initialDrafts)
  }, [initialDrafts])

  const updateDraft = (
    id: string,
    changedFields: Partial<UnpaidChargeDraft>
  ) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [id]: {
        ...currentDrafts[id],
        ...changedFields,
      },
    }))
  }

  const saveAll = async () => {
    const changedIds = Object.keys(drafts).filter(
      (id) =>
        JSON.stringify(drafts[id]) !==
        JSON.stringify(initialDrafts[id])
    )
    if (changedIds.length === 0) {
      return
    }

    onSavingChange('all-unpaid')
    setSaveError(null)
    try {
      const failures: string[] = []

      for (const id of changedIds) {
        const prev = records.find(
          (r) => r.crc5c_unpaidchargesid === id
        )
        try {
          const updated = await updateUnpaidCharge(
            id,
            buildUnpaidPayload(drafts[id])
          )

          // sync buyer ledger: if move was unticked we delete matching buyer ledger records
          try {
            await syncBuyerLedgerWithUnpaidCharge(
              prev as UnpaidChargeRecord,
              updated
            )
          } catch (syncErr) {
            // don't fail the whole batch for ledger sync issues; collect and continue
            failures.push(
              `Ledger sync failed for ${id}: ${
                syncErr instanceof Error
                  ? syncErr.message
                  : String(syncErr)
              }`
            )
          }
        } catch (err) {
          failures.push(
            `Save failed for ${id}: ${
              err instanceof Error ? err.message : String(err)
            }`
          )
        }
      }

      if (failures.length > 0) {
        setSaveError(
          `Completed with ${failures.length} error(s). ${failures[0]}`
        )
      }

      await onSaved()
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Unable to save unpaid charges.'
      )
    } finally {
      onSavingChange(null)
    }
  }

  return (
    <ChargeTableShell
      title="Unpaid Charges"
      subtitle={`${records.length} records`}
      headerActions={
        <button
          className="charge-save-button"
          type="button"
          onClick={saveAll}
          disabled={savingId === 'all-unpaid'}
        >
          <Save className="size-4" />
          {savingId === 'all-unpaid' ? 'Saving' : 'Save All'}
        </button>
      }
    >
      {saveError && (
        <div className="dataverse-charge-save-error">
          {saveError}
        </div>
      )}
      <table className="dataverse-charge-table dataverse-unpaid-charge-table">
        <thead>
          <tr>
            <th>Charge Code</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Partially Paid</th>
            <th>Move</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const draft =
              drafts[record.crc5c_unpaidchargesid] ??
              createUnpaidDraft(record)

            return (
              <tr key={record.crc5c_unpaidchargesid}>
                <td>
                  <input
                    value={draft.cr109_chargecode}
                    onChange={(event) =>
                      updateDraft(
                        record.crc5c_unpaidchargesid,
                        {
                          cr109_chargecode:
                            event.target.value,
                        }
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={draft.cr109_date}
                    onChange={(event) =>
                      updateDraft(
                        record.crc5c_unpaidchargesid,
                        { cr109_date: event.target.value }
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="charge-amount-input"
                    inputMode="decimal"
                    value={draft.cr109_amount}
                    onChange={(event) =>
                      updateDraft(
                        record.crc5c_unpaidchargesid,
                        { cr109_amount: event.target.value }
                      )
                    }
                  />
                </td>
                <td>
                  <BooleanPill
                    checked={Boolean(
                      draft.cr109_partiallypaid
                    )}
                    label="Partial"
                    onChange={(checked) =>
                      updateDraft(
                        record.crc5c_unpaidchargesid,
                        {
                          cr109_partiallypaid: checked,
                        }
                      )
                    }
                  />
                </td>
                <td>
                  <BooleanPill
                    checked={Boolean(draft.cr109_move)}
                    label="Move"
                    onChange={(checked) =>
                      updateDraft(
                        record.crc5c_unpaidchargesid,
                        { cr109_move: checked }
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={draft.cr109_notes}
                    onChange={(event) =>
                      updateDraft(
                        record.crc5c_unpaidchargesid,
                        { cr109_notes: event.target.value }
                      )
                    }
                  />
                </td>
                
              </tr>
            )
          })}
        </tbody>
      </table>
    </ChargeTableShell>
  )
}

function ScheduledChargesTable({
  records,
  savingId,
  onSaved,
  onSavingChange,
}: {
  records: ScheduledChargeRecord[]
  savingId: string | null
  onSaved: () => Promise<void> | void
  onSavingChange: (id: string | null) => void
}) {
  const initialDrafts = useMemo(
    () =>
      Object.fromEntries(
        records.map((record) => [
          record.crc5c_copyscheduledchargesid,
          createScheduledDraft(record),
        ])
      ) as Record<string, ScheduledChargeDraft>,
    [records]
  )
  const [drafts, setDrafts] = useState(initialDrafts)
  const [saveError, setSaveError] = useState<string | null>(
    null
  )

  useEffect(() => {
    setDrafts(initialDrafts)
  }, [initialDrafts])

  const updateDraft = (
    id: string,
    changedFields: Partial<ScheduledChargeDraft>
  ) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [id]: {
        ...currentDrafts[id],
        ...changedFields,
      },
    }))
  }



  return (
    <ChargeTableShell
      title="Scheduled Charges"
      subtitle={`${records.length} records`}
      headerActions={
        <button
          className="charge-save-button"
          type="button"
          onClick={async () => {
            const changedIds = Object.keys(drafts).filter(
              (id) =>
                JSON.stringify(drafts[id]) !==
                JSON.stringify(initialDrafts[id])
            )
            if (changedIds.length === 0) return

            onSavingChange('all-scheduled')
            setSaveError(null)
            try {
              const promises = changedIds.map((id) =>
                updateScheduledCharge(
                  id,
                  buildScheduledPayload(drafts[id])
                )
              )
              const results = await Promise.allSettled(promises)
              const failed = results
                .map((r, idx) => ({ r, id: changedIds[idx] }))
                .filter((x) => x.r.status === 'rejected')

              if (failed.length > 0) {
                setSaveError(
                  `Failed to save ${failed.length} scheduled charge(s).`
                )
              } else {
                await onSaved()
              }
            } catch (err) {
              setSaveError(
                err instanceof Error
                  ? err.message
                  : 'Unable to save scheduled charges.'
              )
            } finally {
              onSavingChange(null)
            }
          }}
          disabled={savingId === 'all-scheduled'}
        >
          <Save className="size-4" />
          {savingId === 'all-scheduled' ? 'Saving' : 'Save All'}
        </button>
      }
    >
      {saveError && (
        <div className="dataverse-charge-save-error">
          {saveError}
        </div>
      )}
      <table className="dataverse-charge-table dataverse-scheduled-charge-table">
        <thead>
          <tr>
            <th>Charge Code</th>
            <th>Charge From</th>
            <th>Charge To</th>
            <th>Amount</th>
            <th>Partially Paid</th>
            <th>Move</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const draft =
              drafts[
                record.crc5c_copyscheduledchargesid
              ] ?? createScheduledDraft(record)

            return (
              <tr
                key={record.crc5c_copyscheduledchargesid}
              >
                <td>
                  <input
                    value={draft.cr109_chargecode}
                    onChange={(event) =>
                      updateDraft(
                        record.crc5c_copyscheduledchargesid,
                        {
                          cr109_chargecode:
                            event.target.value,
                        }
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={draft.cr109_chargefrom}
                    onChange={(event) =>
                      updateDraft(
                        record.crc5c_copyscheduledchargesid,
                        {
                          cr109_chargefrom:
                            event.target.value,
                        }
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={draft.cr109_chargeto}
                    onChange={(event) =>
                      updateDraft(
                        record.crc5c_copyscheduledchargesid,
                        {
                          cr109_chargeto:
                            event.target.value,
                        }
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className="charge-amount-input"
                    inputMode="decimal"
                    value={draft.cr109_chargeamount}
                    onChange={(event) =>
                      updateDraft(
                        record.crc5c_copyscheduledchargesid,
                        {
                          cr109_chargeamount:
                            event.target.value,
                        }
                      )
                    }
                  />
                </td>
                <td>
                  <BooleanPill
                    checked={Boolean(
                      draft.cr109_partiallypaid
                    )}
                    label="Partial"
                    onChange={(checked) =>
                      updateDraft(
                        record.crc5c_copyscheduledchargesid,
                        {
                          cr109_partiallypaid: checked,
                        }
                      )
                    }
                  />
                </td>
                <td>
                  <BooleanPill
                    checked={Boolean(draft.cr109_move)}
                    label="Move"
                    onChange={(checked) =>
                      updateDraft(
                        record.crc5c_copyscheduledchargesid,
                        { cr109_move: checked }
                      )
                    }
                  />
                </td>
                
              </tr>
            )
          })}
        </tbody>
      </table>
    </ChargeTableShell>
  )
}

function ChargeTableShell({
  title,
  subtitle,
  children,
  tableWrapClassName,
  headerActions,
}: {
  title: string
  subtitle: string
  children: ReactNode
  tableWrapClassName?: string
  headerActions?: ReactNode
}) {
  const wrapClassName = tableWrapClassName
    ? `dataverse-charge-table-wrap ${tableWrapClassName}`
    : 'dataverse-charge-table-wrap'

  return (
    <section className="dataverse-charge-card">
      <div className="dataverse-charge-card-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        {headerActions && (
          <div className="dataverse-charge-card-header-actions">
            {headerActions}
          </div>
        )}
      </div>
      <div className={wrapClassName}>
        {children}
      </div>
    </section>
  )
}

function LedgerTable({
  title,
  subtitle,
  records,
  paymentsHeader,
  useRunningBalance = false,
}: {
  title: string
  subtitle: string
  records: Array<SellerLedgerRecord | BuyerLedgerRecord>
  paymentsHeader: string
  useRunningBalance?: boolean
}) {
  let runningBalance = 0

  return (
    <ChargeTableShell
      title={title}
      subtitle={subtitle}
      tableWrapClassName="dataverse-charge-table-wrap--no-scroll"
    >
      <table className="dataverse-charge-table dataverse-ledger-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Charges</th>
            <th>{paymentsHeader}</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => {
            const key =
              'crc5c_sellerledgerid' in record
                ? record.crc5c_sellerledgerid
                : record.crc5c_buyerledgerid

            return (
              <tr key={key ?? `${title}-${index}`}>
                <td>
                  {formatLedgerDate(record.cr109_date)}
                </td>
                <td>
                  {formatLedgerValue(
                    record.cr109_description
                  )}
                </td>
                <td className="dataverse-ledger-number-cell">
                  {formatLedgerValue(record.cr109_charges)}
                </td>
                <td className="dataverse-ledger-number-cell">
                  {formatLedgerValue(record.cr109_payments)}
                </td>
                <td className="dataverse-ledger-number-cell">
                  {useRunningBalance
                    ? (() => {
                        runningBalance +=
                          parseLedgerNumber(
                            record.cr109_charges
                          ) -
                          parseLedgerNumber(
                            record.cr109_payments
                          )
                        return formatLedgerNumber(
                          runningBalance
                        )
                      })()
                    : formatLedgerValue(record.cr109_balance)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </ChargeTableShell>
  )
}

export function ChargesWorkspace({
  unpaidCharges,
  scheduledCharges,
  sellerLedgers,
  buyerLedgers,
  loading,
  refreshing,
  error,
  onRefresh,
}: ChargesWorkspaceProps) {
  const [savingId, setSavingId] = useState<string | null>(
    null
  )

  return (
    <div className="dataverse-charges-workspace">
      <div className="dataverse-charges-toolbar">
        <div>
          <h2>Charges</h2>
          <p>
            Review and edit Dataverse charge records for
            this closing.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing || loading}
        >
          <RotateCw className="size-4" />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading && !refreshing && (
        <div className="invoice-state">Loading charges...</div>
      )}
      {error && (
        <div className="invoice-state invoice-state-error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="dataverse-charge-grid">
          {scheduledCharges.length === 0 ? (
            <section className="dataverse-charge-empty">
              No scheduled charge records were found for this
              closing.
            </section>
          ) : (
            <ScheduledChargesTable
              records={scheduledCharges}
              savingId={savingId}
              onSaved={onRefresh}
              onSavingChange={setSavingId}
            />
          )}

          {unpaidCharges.length === 0 ? (
            <section className="dataverse-charge-empty">
              No unpaid charge records were found for this
              closing.
            </section>
          ) : (
            <UnpaidChargesTable
              records={unpaidCharges}
              savingId={savingId}
              onSaved={onRefresh}
              onSavingChange={setSavingId}
            />
          )}

          <div className="dataverse-ledger-grid">
            <LedgerTable
              title="Seller Ledger"
              subtitle={`${sellerLedgers.length} records`}
              records={sellerLedgers}
              paymentsHeader="Payments"
            />

            <LedgerTable
              title="Buyer Ledger"
              subtitle={`${buyerLedgers.length} records`}
              records={buyerLedgers}
              paymentsHeader="Payment"
              useRunningBalance
            />
          </div>
        </div>
      )}
    </div>
  )
}
