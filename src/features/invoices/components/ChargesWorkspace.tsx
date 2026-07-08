import { useMemo, useState } from 'react'
import {
  createInvoiceDetail,
  deleteInvoiceDetail,
  updateInvoiceDetail,
} from '../api/invoiceService'
import { updateClosingTicket } from '../../closingTickets/api/closingTicketsService'
import type {
  InvoiceChargeFormRow,
  InvoiceCreateInput,
  InvoiceRecord,
  InvoiceUpdateInput,
} from '../types/invoice'
import { InvoiceTable } from './InvoiceTable'
import { ChargeEntryRow } from './ChargeEntryRow'
import { useAutoClear } from '../../../hooks/useAutoClear'

interface ChargesWorkspaceProps {
  ticketId: string
  closingTicketId: string
  closingTicketNotes?: string | null
  records: InvoiceRecord[]
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void> | void
  onGenerateInvoice?: () => Promise<void> | void
  generatingInvoice?: boolean
  hasInvoicePdf?: boolean
  onViewInvoice?: () => void
  readOnly?: boolean
}

function createChargeRow(): InvoiceChargeFormRow {
  return {
    id: crypto.randomUUID(),
    cr109_dueatclosing: '',
    cr7de_amount: '',
    cr7de_chequenumber: '',
    cr7de_index: '',
    cr7de_notapplicabletoledger: false,
    cr7de_paidby: '',
    cr7de_payableto: '',
    cr109_otherpayableto: '',
  }
}

function normalizeText(value: string) {
  const trimmedValue = value.trim()
  return trimmedValue === '' ? undefined : trimmedValue
}

/**
 * Strips any currency formatting ($, commas, spaces) from a user-typed
 * amount string and returns a plain decimal string ready for Dataverse.
 * Returns undefined when the value is empty or not a valid number.
 * Examples: "$1,340.70" → "1340.70", "TBD" → "TBD", "" → undefined
 */
function normalizeAmount(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed === '') return undefined

  // Strip $ and commas, then check if it parses as a finite number
  const stripped = trimmed.replace(/[$,\s]/g, '')
  const parsed = Number(stripped)

  if (Number.isFinite(parsed)) {
    // Always store with exactly 2 decimal places to keep Dataverse values uniform
    return parsed.toFixed(2)
  }

  // Non-numeric values (e.g. "TBD") are kept as-is after trimming
  return trimmed
}

function toInvoicePayload(
  row: InvoiceChargeFormRow,
  ticketId: string,
  index: number,
  notes?: string
): InvoiceCreateInput {
  return {
    // Dataverse lookup/link usage: generated schema exposes cr7de_ticketid
    // as the parent relationship value, so each invoice row is created with
    // the current parent closing Ticket ID.
    cr7de_ticketid: ticketId,
    cr109_dueatclosing:
      row.cr109_dueatclosing || undefined,
    cr109_notes: normalizeText(notes || ''),
    cr7de_amount: normalizeAmount(row.cr7de_amount),
    cr7de_chequenumber: normalizeText(
      row.cr7de_chequenumber
    ),
    cr7de_index: normalizeText(row.cr7de_index) ?? String(index + 1),
    cr7de_notapplicabletoledger:
      row.cr7de_notapplicabletoledger,
    cr7de_paidby: row.cr7de_paidby || undefined,
    cr7de_payableto: row.cr7de_payableto || undefined,
    cr109_otherpayableto: normalizeText(row.cr109_otherpayableto),
  }
}

function toInvoiceUpdatePayload(
  row: InvoiceChargeFormRow,
  index: number
): InvoiceUpdateInput {
  const payload = { ...toInvoicePayload(row, '', index) }

  delete payload.cr7de_ticketid

  return payload
}

function validateRows(rows: InvoiceChargeFormRow[]) {
  const invalidRows = rows.filter(
    (row) =>
      !row.cr109_dueatclosing ||
      !row.cr7de_paidby ||
      !row.cr7de_payableto ||
      !row.cr7de_amount.trim()
  )

  return invalidRows.length === 0
}

export function ChargesWorkspace({
  ticketId,
  closingTicketId,
  closingTicketNotes,
  records,
  loading,
  error,
  onRefresh,
  onGenerateInvoice,
  generatingInvoice,
  hasInvoicePdf,
  onViewInvoice,
  readOnly = false,
}: ChargesWorkspaceProps) {
  const [rows, setRows] = useState<InvoiceChargeFormRow[]>(
    [createChargeRow()]
  )
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(
    null
  )
  const [deletingId, setDeletingId] = useState<string | null>(
    null
  )
  const [message, setMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(
    null
  )

  // Auto-clear success message after 5s, errors after 8s
  useAutoClear(message, setMessage)
  useAutoClear(saveError, setSaveError, 8000)

  // Don't load existing notes into the Add Charges form
  // They will be shown in the Invoice Details section instead
  const canSave = useMemo(
    () => ticketId.trim() !== '' && rows.length > 0,
    [rows.length, ticketId]
  )

  const updateRow = (
    rowId: string,
    changedFields: Partial<InvoiceChargeFormRow>
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              ...changedFields,
            }
          : row
      )
    )
  }

  const removeRow = (rowId: string) => {
    setRows((currentRows) =>
      currentRows.filter((row) => row.id !== rowId)
    )
  }

  const resetForm = () => {
    setRows([createChargeRow()])
  }

  const saveCharges = async () => {
    setMessage(null)
    setSaveError(null)

    if (!validateRows(rows)) {
      setSaveError(
        'Payment, paid by, amount, and payable to are required for every row.'
      )
      return
    }

    setSaving(true)

    try {
      for (const [index, row] of rows.entries()) {
        await createInvoiceDetail(
          toInvoicePayload(row, ticketId, index, notes)
        )
      }

      resetForm()
      setNotes('') // Clear notes after successful save
      await onRefresh()
      setMessage('Payments saved successfully.')
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Unable to save payments.'
      )
    } finally {
      setSaving(false)
    }
  }

  const updateSavedCharge = async (
    recordId: string,
    row: InvoiceChargeFormRow,
    oldRecord: InvoiceRecord
  ) => {
    setMessage(null)
    setSaveError(null)

    if (!validateRows([row])) {
      setSaveError(
        'Payment, paid by, amount, and payable to are required for this row.'
      )
      return false
    }

    setUpdatingId(recordId)

    try {
      await updateInvoiceDetail(
        recordId,
        toInvoiceUpdatePayload(row, 0),
        { ticketId, oldRecord }
      )
      await onRefresh()
      setMessage('Payment updated successfully.')
      return true
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Unable to update payment.'
      )
      return false
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteCharge = async (recordId: string, oldRecord: InvoiceRecord) => {
    setMessage(null)
    setSaveError(null)
    setDeletingId(recordId)

    try {
      await deleteInvoiceDetail(recordId, { ticketId, oldRecord })
      await onRefresh()
      setMessage('Payment deleted successfully.')
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Unable to delete payment.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaveNotes = async (updatedNotes: string) => {
    setMessage(null)
    setSaveError(null)

    try {
      // Notes are stored on the Closing Ticket Details record (cr7de_notes),
      // not on individual invoice rows.
      await updateClosingTicket(closingTicketId, {
        cr7de_notes: updatedNotes,
      })
      await onRefresh()
      setMessage('Notes saved successfully.')
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Unable to save notes.'
      )
    }
  }

  // Notes come from the closing ticket record, not from invoice rows
  const hasExistingNotes = !!closingTicketNotes

  return (
    <div className="charges-workspace">
      {!readOnly && (
      <section className="workflow-card">
        <div className="workflow-card-header">
          <div>
            <h3>Add Payments</h3>
            <p>
              Create invoice detail records linked to this
              closing ticket.
            </p>
          </div>
          <div className="charge-form-toolbar">
            <button
              className="secondary-action-button"
              type="button"
              onClick={() =>
                setRows((currentRows) => [
                  ...currentRows,
                  createChargeRow(),
                ])
              }
            >
              Add Payment
            </button>
          </div>
        </div>

        {saveError && (
          <div className="form-alert form-alert-error">
            {saveError}
          </div>
        )}

        {message && (
          <div className="form-alert form-alert-success">
            {message}
          </div>
        )}

        <div className="charge-entry-table-wrap">
          <table className="charge-entry-table">
            <thead>
              <tr>
                <th>Payment</th>
                <th>Paid By</th>
                <th>Amount</th>
                <th>Payable To</th>
                <th>Cheque #</th>
                <th>Applicable to Ledger</th>
                <th></th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ChargeEntryRow
                  key={row.id}
                  row={row}
                  onChange={updateRow}
                  onRemove={removeRow}
                  canRemove={rows.length > 1}
                />
              ))}
            </tbody>
          </table>
        </div>

        {!hasExistingNotes && (
          <div className="invoice-notes-section">
            <label className="invoice-notes-label" htmlFor="charge-notes">
              Notes
            </label>
            <textarea
              id="charge-notes"
              className="invoice-notes-textarea"
              rows={3}
              placeholder="Add notes for this invoice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}

        <div className="form-actions inline-actions">
          <button
            className="primary-action-button"
            type="button"
            onClick={saveCharges}
            disabled={!canSave || saving}
          >
            {saving
              ? 'Saving...'
              : 'Save Payments'}
          </button>
        </div>
      </section>
      )}

      <InvoiceTable
        records={records}
        loading={loading}
        error={error}
        closingTicketNotes={closingTicketNotes}
        onRefresh={onRefresh}
        onSaveEdit={updateSavedCharge}
        onDelete={deleteCharge}
        onSaveNotes={handleSaveNotes}
        onGenerateInvoice={onGenerateInvoice}
        generatingInvoice={generatingInvoice}
        hasInvoicePdf={hasInvoicePdf}
        onViewInvoice={onViewInvoice}
        updatingId={updatingId}
        deletingId={deletingId}
        readOnly={readOnly}
      />
    </div>
  )
}
