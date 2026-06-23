import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Plus, RotateCw, Save } from 'lucide-react'
import { useAutoClear } from '../../../hooks/useAutoClear'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../../components/ui/alert-dialog'
import {
  updateScheduledCharge,
  updateUnpaidCharge,
  syncBuyerLedgerWithUnpaidCharge,
  createManualCharge,
  deleteScheduledCharge,
} from '../api/chargesService'
import type {
  BuyerLedgerRecord,
  ManualChargeCreateInput,
  ScheduledChargeRecord,
  ScheduledChargeUpdateInput,
  SellerLedgerRecord,
  UnpaidChargeRecord,
  UnpaidChargeUpdateInput,
} from '../types/charges'
import type { InvoiceRecord } from '../../invoices/types/invoice'

interface ChargesWorkspaceProps {
  ticketId?: string
  unpaidCharges: UnpaidChargeRecord[]
  scheduledCharges: ScheduledChargeRecord[]
  sellerLedgers: SellerLedgerRecord[]
  buyerLedgers: BuyerLedgerRecord[]
  loading: boolean
  refreshing: boolean
  error: string | null
  onRefresh: () => Promise<void> | void
  invoices?: InvoiceRecord[]
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
  useAutoClear(saveError, setSaveError, 8000)

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
      <div className="cg-table dataverse-unpaid-cg">
        <div className="cg-header-row">
          <div className="cg-cell">Charge Code</div>
          <div className="cg-cell">Date</div>
          <div className="cg-cell cg-cell--right">Amount</div>
          <div className="cg-cell cg-cell--center">Partially Paid</div>
          <div className="cg-cell cg-cell--center">Move</div>
          <div className="cg-cell">Notes</div>
        </div>
        {records.map((record) => {
          const draft = drafts[record.crc5c_unpaidchargesid] ?? createUnpaidDraft(record)
          return (
            <div className="cg-data-row" key={record.crc5c_unpaidchargesid}>
              <div className="cg-cell">
                <input className="cg-input" value={draft.cr109_chargecode} onChange={(e) => updateDraft(record.crc5c_unpaidchargesid, { cr109_chargecode: e.target.value })} />
              </div>
              <div className="cg-cell">
                <input className="cg-input cg-input--date" type="date" value={draft.cr109_date} onChange={(e) => updateDraft(record.crc5c_unpaidchargesid, { cr109_date: e.target.value })} />
              </div>
              <div className="cg-cell cg-cell--right">
                <input className="cg-input cg-input--amount" inputMode="decimal" value={draft.cr109_amount} onChange={(e) => updateDraft(record.crc5c_unpaidchargesid, { cr109_amount: e.target.value })} />
              </div>
              <div className="cg-cell cg-cell--center">
                <BooleanPill checked={Boolean(draft.cr109_partiallypaid)} label="Partial" onChange={(checked) => updateDraft(record.crc5c_unpaidchargesid, { cr109_partiallypaid: checked })} />
              </div>
              <div className="cg-cell cg-cell--center">
                <BooleanPill checked={Boolean(draft.cr109_move)} label="Move" onChange={(checked) => updateDraft(record.crc5c_unpaidchargesid, { cr109_move: checked })} />
              </div>
              <div className="cg-cell cg-cell--notes">
                <input className="cg-input" value={draft.cr109_notes} onChange={(e) => updateDraft(record.crc5c_unpaidchargesid, { cr109_notes: e.target.value })} />
              </div>
            </div>
          )
        })}
      </div>
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
  useAutoClear(saveError, setSaveError, 8000)

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
      <div className="cg-table dataverse-scheduled-cg">
        <div className="cg-header-row">
          <div className="cg-cell">Charge Code</div>
          <div className="cg-cell">Charge From</div>
          <div className="cg-cell">Charge To</div>
          <div className="cg-cell cg-cell--right">Amount</div>
          <div className="cg-cell cg-cell--center">Move</div>
          <div className="cg-cell cg-cell--center">Manual</div>
          <div className="cg-cell cg-cell--center" />
        </div>
        {records.map((record) => {
          const draft = drafts[record.crc5c_copyscheduledchargesid] ?? createScheduledDraft(record)
          return (
            <div className="cg-data-row" key={record.crc5c_copyscheduledchargesid}>
              <div className="cg-cell">
                <input className="cg-input" value={draft.cr109_chargecode} onChange={(e) => updateDraft(record.crc5c_copyscheduledchargesid, { cr109_chargecode: e.target.value })} />
              </div>
              <div className="cg-cell cg-cell--date">
                <input className="cg-input cg-input--date" type="date" value={draft.cr109_chargefrom} onChange={(e) => updateDraft(record.crc5c_copyscheduledchargesid, { cr109_chargefrom: e.target.value })} />
              </div>
              <div className="cg-cell cg-cell--date">
                <input className="cg-input cg-input--date" type="date" value={draft.cr109_chargeto} onChange={(e) => updateDraft(record.crc5c_copyscheduledchargesid, { cr109_chargeto: e.target.value })} />
              </div>
              <div className="cg-cell cg-cell--right">
                <input className="cg-input cg-input--amount" inputMode="decimal" value={draft.cr109_chargeamount} onChange={(e) => updateDraft(record.crc5c_copyscheduledchargesid, { cr109_chargeamount: e.target.value })} />
              </div>
              <div className="cg-cell cg-cell--center">
                <BooleanPill checked={Boolean(draft.cr109_move)} label="Move" onChange={(checked) => updateDraft(record.crc5c_copyscheduledchargesid, { cr109_move: checked })} />
              </div>
              <div className="cg-cell cg-cell--center">
                <span className={`charge-manual-badge ${record.cr109_manual ? 'charge-manual-badge--yes' : 'charge-manual-badge--no'}`}>
                  {record.cr109_manual ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="cg-cell cg-cell--right">
                {record.cr109_manual && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button type="button" className="invoice-row-action-button invoice-row-delete-button" disabled={savingId === 'deleting-' + record.crc5c_copyscheduledchargesid}>
                        {savingId === 'deleting-' + record.crc5c_copyscheduledchargesid ? 'Deleting…' : 'Delete'}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Scheduled Charge</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove this manual charge record. This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="invoice-confirm-delete-button" onClick={async () => { onSavingChange('deleting-' + record.crc5c_copyscheduledchargesid); try { await deleteScheduledCharge(record.crc5c_copyscheduledchargesid); await onSaved() } catch {} finally { onSavingChange(null) } }}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </ChargeTableShell>
  )
}

// --- Manual charge code display names (from mapping) ---
const MANUAL_CHARGE_CODE_OPTIONS: Array<{ value: number; code: string; label: string }> = [
  { value: 396620000, code: 'specasmt',  label: 'Assessment 1' },
  { value: 396620001, code: 'bike',      label: 'Bike Storage' },
  { value: 396620002, code: 'capasmnt',  label: 'Capital Assessment' },
  { value: 396620003, code: 'capasmt1',  label: 'Capital Assessment 1' },
  { value: 396620004, code: 'capasmt2',  label: 'Capital Assessment 2' },
  { value: 396620005, code: 'capcont',   label: 'Capital Contribution' },
  { value: 396620006, code: 'comg',      label: 'Common Charges Garage' },
  { value: 396620007, code: 'comst',     label: 'Common Charges Storage' },
  { value: 396620008, code: 'electr',    label: 'Electric Income/Refund' },
  { value: 396620009, code: 'gym',       label: 'Exercise Room Fees' },
  { value: 396620010, code: 'garage',    label: 'Garage' },
  { value: 396620011, code: 'locker',    label: 'Locker 1' },
  { value: 396620012, code: 'assesmt',   label: 'Operating Assessment' },
  { value: 396620013, code: 'parking',   label: 'Parking' },
  { value: 396620014, code: 'secdepca',  label: 'Security Deposit' },
  { value: 396620015, code: 'specasny',  label: 'Special Assessment' },
  { value: 396620016, code: 'storage',   label: 'Storage Fee' },
  { value: 396620017, code: 'sublet',    label: 'Sublet Fees' },
  { value: 396620018, code: 'meter',     label: 'Utilities' },
]

type ManualChargeDraft = {
  cr109_chargecode: string
  cr109_amount: string
  cr109_datefrom: string
  cr109_dateto: string
  cr109_type: string
  cr109_epaytype: string
  cr109_ratesqft: string
  cr109_maxpostings: string
  cr109_hold: boolean
  cr109_notes: string
}

function emptyManualChargeDraft(): ManualChargeDraft {
  return {
    cr109_chargecode: '',
    cr109_amount: '',
    cr109_datefrom: '',
    cr109_dateto: '',
    cr109_type: '396620000',
    cr109_epaytype: '',
    cr109_ratesqft: '',
    cr109_maxpostings: '',
    cr109_hold: false,
    cr109_notes: '',
  }
}

function AddScheduledChargeForm({
  ticketId,
  scheduledCharges,
  onSaved,
}: {
  ticketId: string
  scheduledCharges: ScheduledChargeRecord[]
  onSaved: () => Promise<void> | void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ManualChargeDraft>(emptyManualChargeDraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (fields: Partial<ManualChargeDraft>) =>
    setDraft((d) => ({ ...d, ...fields }))

  const reset = () => {
    setDraft(emptyManualChargeDraft())
    setError(null)
  }

  const handleSubmit = async () => {
    if (!draft.cr109_chargecode) {
      setError('Charge code is required.')
      return
    }
    if (!draft.cr109_amount.trim()) {
      setError('Amount is required.')
      return
    }

    // Check for duplicate charge code
    const selectedOption = MANUAL_CHARGE_CODE_OPTIONS.find(
      (opt) => String(opt.value) === draft.cr109_chargecode
    )
    if (selectedOption) {
      const duplicate = scheduledCharges.find(
        (record) => record.cr109_chargecode?.trim().toLowerCase() === selectedOption.code.toLowerCase()
      )
      if (duplicate) {
        setError(`A scheduled charge with code "${selectedOption.label}" already exists for this ticket.`)
        return
      }
    }

    setSaving(true)
    setError(null)

    try {
      const payload: ManualChargeCreateInput = {
        crc5c_ticketid: ticketId,
        cr109_chargecode: Number(draft.cr109_chargecode) as ManualChargeCreateInput['cr109_chargecode'],
        cr109_amount: draft.cr109_amount.trim() || undefined,
        cr109_datefrom: draft.cr109_datefrom || undefined,
        cr109_dateto: draft.cr109_dateto || undefined,
        cr109_type: draft.cr109_type
          ? (Number(draft.cr109_type) as ManualChargeCreateInput['cr109_type'])
          : undefined,
        cr109_epaytype: draft.cr109_epaytype
          ? (Number(draft.cr109_epaytype) as ManualChargeCreateInput['cr109_epaytype'])
          : undefined,
        cr109_ratesqft: draft.cr109_ratesqft.trim() || undefined,
        cr109_maxpostings: draft.cr109_maxpostings.trim() || undefined,
        cr109_hold: draft.cr109_hold,
        cr109_notes: draft.cr109_notes.trim() || undefined,
      }

      await createManualCharge(payload)
      reset()
      setOpen(false)
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save charge.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="secondary-action-button"
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '5px', minHeight: '32px', padding: '0 12px', fontSize: '0.78rem' }}
        onClick={() => setOpen(true)}
      >
        <Plus style={{ width: '14px', height: '14px' }} />
        Add Scheduled Charge
      </button>
    )
  }

  return (
    <section className="workflow-card">
      <div className="workflow-card-header">
        <div>
          <h3>Add Scheduled Charge</h3>
          <p>Create a new manual charge linked to this closing ticket.</p>
        </div>
        <button
          type="button"
          className="secondary-action-button"
          style={{ minHeight: '32px', padding: '0 12px', fontSize: '0.78rem' }}
          onClick={() => { reset(); setOpen(false) }}
          disabled={saving}
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="form-alert form-alert-error">{error}</div>
      )}

      <div className="manual-charge-fields">
        <label className="form-field">
          <span>Charge <strong>*</strong></span>
          <select
            value={draft.cr109_chargecode}
            onChange={(e) => update({ cr109_chargecode: e.target.value })}
          >
            <option value="">Select charge code</option>
            {MANUAL_CHARGE_CODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Amount <strong>*</strong></span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={draft.cr109_amount}
            onChange={(e) => update({ cr109_amount: e.target.value })}
          />
        </label>

        <label className="form-field">
          <span>Date From</span>
          <input
            type="date"
            value={draft.cr109_datefrom}
            onChange={(e) => update({ cr109_datefrom: e.target.value })}
          />
        </label>

        <label className="form-field">
          <span>Date To</span>
          <input
            type="date"
            value={draft.cr109_dateto}
            onChange={(e) => update({ cr109_dateto: e.target.value })}
          />
        </label>

        <label className="form-field">
          <span>Type</span>
          <select
            value={draft.cr109_type}
            onChange={(e) => update({ cr109_type: e.target.value })}
          >
            <option value="">Select type</option>
            <option value="396620000">Detail</option>
            <option value="396620001">No Charge</option>
          </select>
        </label>

        <label className="form-field">
          <span>E-Pay Type</span>
          <select
            value={draft.cr109_epaytype}
            onChange={(e) => update({ cr109_epaytype: e.target.value })}
          >
            <option value="">Select e-pay type</option>
            <option value="396620000">EFT</option>
            <option value="396620001">Credit Card</option>
          </select>
        </label>

        <label className="form-field">
          <span>Rate/Sqft</span>
          <input
            placeholder="0"
            value={draft.cr109_ratesqft}
            onChange={(e) => update({ cr109_ratesqft: e.target.value })}
          />
        </label>

        <label className="form-field">
          <span>Max Postings</span>
          <input
            placeholder="0"
            value={draft.cr109_maxpostings}
            onChange={(e) => update({ cr109_maxpostings: e.target.value })}
          />
        </label>

        <label className="form-field manual-charge-notes">
          <span>Notes</span>
          <textarea
            rows={2}
            placeholder="Add notes..."
            value={draft.cr109_notes}
            onChange={(e) => update({ cr109_notes: e.target.value })}
          />
        </label>

        <div className="form-field manual-charge-hold">
          <label className="invoice-edit-checkbox">
            <input
              type="checkbox"
              checked={draft.cr109_hold}
              onChange={(e) => update({ cr109_hold: e.target.checked })}
            />
            Hold
          </label>
        </div>
      </div>

      <div className="form-actions inline-actions">
        <button
          type="button"
          className="primary-action-button"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Charge'}
        </button>
      </div>
    </section>
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

// --- Invoice reconciliation maps ---
const INVOICE_GL_CODE_MAP: Record<number, string> = {
  396620000: 'adjour',
  396620001: 'procfe',
  396620002: 'acfee',
  396620003: 'akam',
  396620004: 'applian',
  396620005: 'procfe',
  396620006: 'arrears',
  396620007: 'capasmnt',
  396620008: 'misc',
  396620009: 'procfe',
  396620010: 'misc',
  396620011: 'cable',
  396620012: 'capasmnt',
  396620013: 'secdep',
  396620014: 'procfe',
  396620015: 'procfe',
  396620016: 'workcap',
  396620017: 'workcap',
  396620018: 'procfe',
  396620019: 'procfe',
  396620020: 'procfe',
  396620021: 'camelec',
  396620022: 'elevser',
  396620023: 'energy',
  396620024: 'escrow',
  396620025: 'procfe',
  396620026: 'procfe',
  396620027: 'flipta',
  396620028: 'guaran',
  396620029: 'procfe',
  396620030: 'legal',
  396620031: 'lostst',
  396620032: 'mainten',
  396620033: 'altinc',
  396620034: 'procfe',
  396620035: 'meter',
  396620036: 'procfe',
  396620037: 'movedep',
  396620038: 'mimoinc',
  396620039: 'other',
  396620040: 'overtime',
  396620041: 'parking',
  396620042: 'poa',
  396620043: 'procfe',
  396620044: 'misc',
  396620045: 'tax',
  396620046: 'procfe',
  396620047: 'repair',
  396620048: 'contrib',
  396620049: 'secdep',
  396620050: 'procfe',
  396620051: 'procfe',
  396620052: 'storage',
  396620053: 'secdep',
  396620054: 'sublet',
  396620055: 'misc',
  396620056: 'util',
  396620057: 'procfe',
  396620058: 'workcap',
}

const INVOICE_TITLE_MAP: Record<number, string> = {
  396620000: 'Adjournment Fee',
  396620001: 'Admin Fee',
  396620002: 'Air Conditioning Fee',
  396620003: 'AKAM Processing Fee',
  396620004: 'Appliance Fee',
  396620005: 'Application Fee',
  396620006: 'Arrears',
  396620007: 'Assessment',
  396620008: 'Assignment of Share',
  396620009: 'Background Check',
  396620010: 'Building Admin Fee',
  396620011: 'Cable Charges',
  396620012: 'Capital Assessment Fee',
  396620013: 'Carpet Deposit',
  396620014: 'Change of Occupancy',
  396620015: 'Closing Fee (Non-Refundable)',
  396620016: 'Contribution Fee (Non-Refundable)',
  396620017: 'Contribution Reserves',
  396620018: 'COOP Prospectus',
  396620019: 'COOP Questionnaire',
  396620020: 'Credit Report / Check',
  396620021: 'Electric Fee',
  396620022: 'Elevator Fee',
  396620023: 'Energy Charge',
  396620024: 'Escrow Maintenance',
  396620025: 'Estate Review Fee',
  396620026: 'Expediting Fee',
  396620027: 'Flip Tax',
  396620028: 'Guarantee Fee',
  396620029: 'Inspection',
  396620030: 'Legal Fee',
  396620031: 'Lost Stock & Lease',
  396620032: 'Maintenance Fees',
  396620033: 'Major/Minor Alteration Fee',
  396620034: 'Messenger',
  396620035: 'Meter Fee',
  396620036: 'Mortgage Questionnaire',
  396620037: 'Move In/Out Deposit',
  396620038: 'Move In/Out Fee',
  396620039: 'Other',
  396620040: 'Over-Time Fee',
  396620041: 'Parking',
  396620042: 'POA Fee',
  396620043: 'Processing Fee',
  396620044: 'Purchaser Fee (Transfer Fee)',
  396620045: 'Real Estate Tax',
  396620046: 'Recognition Agreement',
  396620047: 'Repair Charge',
  396620048: 'Resident Manager Contribution',
  396620049: 'Security Deposit',
  396620050: 'Service Fee',
  396620051: 'Stock Transfer Fee',
  396620052: 'Storage Unit',
  396620053: 'Sublet Deposit',
  396620054: 'Sublet Fee',
  396620055: 'Transfer Fee',
  396620056: 'Utilities',
  396620057: 'Waiver Fee',
  396620058: 'Working Capital',
}

function extractLedgerChargeCode(description?: string) {
  if (!description) return ''
  const [beforeDash] = description.split('-')
  return beforeDash.trim().toLowerCase()
}

type LedgerDisplayRow = {
  id: string
  cr109_date?: string
  cr109_description?: string
  cr109_charges?: string
  cr109_payments?: string
  cr109_balance?: string
  isInvoiceRow: boolean
}

function LedgerTable({
  title,
  subtitle,
  records,
  paymentsHeader,
  useRunningBalance = false,
  invoices = [],
  isSellerLedger,
}: {
  title: string
  subtitle: string
  records: Array<SellerLedgerRecord | BuyerLedgerRecord>
  paymentsHeader: string
  useRunningBalance?: boolean
  invoices?: InvoiceRecord[]
  isSellerLedger: boolean
}) {
  const [checkWithInvoice, setCheckWithInvoice] =
    useState(false)

  const displayedRows = useMemo((): LedgerDisplayRow[] => {
    // -- Normal mode: just show Dataverse records with running balance --
    if (!checkWithInvoice) {
      let runningBalance = 0
      return records.map((record): LedgerDisplayRow => {
        const id =
          'crc5c_sellerledgerid' in record
            ? record.crc5c_sellerledgerid
            : record.crc5c_buyerledgerid

        if (useRunningBalance) {
          runningBalance +=
            parseLedgerNumber(record.cr109_charges) -
            parseLedgerNumber(record.cr109_payments)
          return {
            id,
            cr109_date: record.cr109_date,
            cr109_description: record.cr109_description,
            cr109_charges: record.cr109_charges,
            cr109_payments: record.cr109_payments,
            cr109_balance: formatLedgerNumber(runningBalance),
            isInvoiceRow: false,
          }
        }

        return {
          id,
          cr109_date: record.cr109_date,
          cr109_description: record.cr109_description,
          cr109_charges: record.cr109_charges,
          cr109_payments: record.cr109_payments,
          cr109_balance: record.cr109_balance,
          isInvoiceRow: false,
        }
      })
    }

    // -- Check with Invoice mode --
    // Seller = paidby 716070000, Buyer = paidby 716070001
    // Payable To: Building = 716070000 (only show Building invoices)
    const targetPaidBy = isSellerLedger ? 716070000 : 716070001
    const filteredInvoices = invoices.filter(
      (inv) =>
        Number(inv.cr7de_paidby) === targetPaidBy &&
        !inv.cr7de_notapplicabletoledger &&
        Number(inv.cr7de_payableto) === 716070000
    )

    const rows: LedgerDisplayRow[] = []
    const usedIds = new Set<string>()

    // Build rows: for each ledger record, append then inject matching invoices
    records.forEach((record) => {
      const id =
        'crc5c_sellerledgerid' in record
          ? record.crc5c_sellerledgerid
          : record.crc5c_buyerledgerid

      rows.push({
        id,
        cr109_date: record.cr109_date,
        cr109_description: record.cr109_description,
        cr109_charges: record.cr109_charges,
        cr109_payments: record.cr109_payments,
        cr109_balance: record.cr109_balance,
        isInvoiceRow: false,
      })

      const chargeCode = extractLedgerChargeCode(
        record.cr109_description
      )
      if (chargeCode) {
        filteredInvoices.forEach((inv) => {
          if (usedIds.has(inv.cr7de_invoicedetailsid)) return
          const glCode =
            INVOICE_GL_CODE_MAP[
              Number(inv.cr109_dueatclosing)
            ]
          if (glCode === chargeCode) {
            rows.push({
              id: inv.cr7de_invoicedetailsid,
              cr109_date: inv.createdon,
              cr109_description:
                INVOICE_TITLE_MAP[
                  Number(inv.cr109_dueatclosing)
                ] ??
                inv.cr109_dueatclosingname ??
                'Invoice Payment',
              cr109_charges: '',
              cr109_payments: inv.cr7de_amount,
              isInvoiceRow: true,
            })
            usedIds.add(inv.cr7de_invoicedetailsid)
          }
        })
      }
    })

    // Append any unmatched invoices at the bottom
    filteredInvoices.forEach((inv) => {
      if (usedIds.has(inv.cr7de_invoicedetailsid)) return
      rows.push({
        id: inv.cr7de_invoicedetailsid,
        cr109_date: inv.createdon,
        cr109_description:
          INVOICE_TITLE_MAP[Number(inv.cr109_dueatclosing)] ??
          inv.cr109_dueatclosingname ??
          'Invoice Payment',
        cr109_charges: '',
        cr109_payments: inv.cr7de_amount,
        isInvoiceRow: true,
      })
      usedIds.add(inv.cr7de_invoicedetailsid)
    })

    // Recalculate running balance for all combined rows
    let runningBalance = 0
    rows.forEach((row) => {
      runningBalance +=
        parseLedgerNumber(row.cr109_charges) -
        parseLedgerNumber(row.cr109_payments)
      row.cr109_balance = formatLedgerNumber(runningBalance)
    })

    return rows
  }, [
    checkWithInvoice,
    records,
    invoices,
    isSellerLedger,
    useRunningBalance,
  ])

  return (
    <ChargeTableShell
      title={title}
      subtitle={subtitle}
      tableWrapClassName="dataverse-charge-table-wrap--no-scroll"
      headerActions={
        <button
          type="button"
          onClick={() =>
            setCheckWithInvoice((prev) => !prev)
          }
          style={{
            display: 'inline-flex',
            minHeight: '28px',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            borderRadius: '6px',
            border: '1.5px solid #1E3A47',
            background: checkWithInvoice
              ? '#1E3A47'
              : '#ffffff',
            color: checkWithInvoice ? '#ffffff' : '#1E3A47',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            padding: '5px 10px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            transition:
              'background 160ms ease, color 160ms ease',
          }}
        >
          {checkWithInvoice
            ? 'Hide Invoice Check'
            : 'Check with Invoice'}
        </button>
      }
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
          {displayedRows.map((row, index) => (
            <tr
              key={row.id ?? `${title}-${index}`}
              style={
                row.isInvoiceRow
                  ? {
                      backgroundColor: '#F0FDF4',
                      fontStyle: 'italic',
                    }
                  : undefined
              }
            >
              <td>
                {formatLedgerDate(row.cr109_date)}
              </td>
              <td>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <span style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    color: row.isInvoiceRow ? '#166534' : undefined,
                  }}>
                    {formatLedgerValue(
                      row.cr109_description
                    )}
                  </span>
                  {row.isInvoiceRow && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        fontSize: '8px',
                        fontWeight: 800,
                        backgroundColor: '#D1FAE5',
                        color: '#065F46',
                        fontStyle: 'normal',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: '1.5px solid #A7F3D0',
                        flexShrink: 0,
                      }}
                    >
                      Invoice
                    </span>
                  )}
                </div>
              </td>
              <td className="dataverse-ledger-number-cell">
                {formatLedgerValue(row.cr109_charges)}
              </td>
              <td
                className="dataverse-ledger-number-cell"
                style={{
                  color: row.isInvoiceRow
                    ? '#166534'
                    : undefined,
                  fontWeight: row.isInvoiceRow ? 700 : undefined,
                }}
              >
                {formatLedgerValue(row.cr109_payments)}
              </td>
              <td className="dataverse-ledger-number-cell">
                {formatLedgerValue(row.cr109_balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChargeTableShell>
  )
}

export function ChargesWorkspace({
  ticketId,
  unpaidCharges,
  scheduledCharges,
  sellerLedgers,
  buyerLedgers,
  loading,
  refreshing,
  error,
  onRefresh,
  invoices = [],
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
          {ticketId && (
            <AddScheduledChargeForm
              ticketId={ticketId}
              scheduledCharges={scheduledCharges}
              onSaved={onRefresh}
            />
          )}

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
              invoices={invoices}
              isSellerLedger={true}
            />

            <LedgerTable
              title="Buyer Ledger"
              subtitle={`${buyerLedgers.length} records`}
              records={buyerLedgers}
              paymentsHeader="Payment"
              useRunningBalance
              invoices={invoices}
              isSellerLedger={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}
