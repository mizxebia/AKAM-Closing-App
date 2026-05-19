import { useMemo, useState } from 'react'
import { createInvoiceDetail } from '../api/invoiceService'
import type {
  InvoiceChargeFormRow,
  InvoiceCreateInput,
  InvoiceRecord,
} from '../types/invoice'
import { InvoiceTable } from './InvoiceTable'
import { ChargeEntryRow } from './ChargeEntryRow'

interface ChargesWorkspaceProps {
  ticketId: string
  records: InvoiceRecord[]
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void> | void
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
    cr7de_remarks: '',
  }
}

function normalizeText(value: string) {
  const trimmedValue = value.trim()
  return trimmedValue === '' ? undefined : trimmedValue
}

function toInvoicePayload(
  row: InvoiceChargeFormRow,
  ticketId: string,
  index: number
): InvoiceCreateInput {
  return {
    // Dataverse lookup/link usage: generated schema exposes cr7de_ticketid
    // as the parent relationship value, so each invoice row is created with
    // the current parent closing Ticket ID.
    cr7de_ticketid: ticketId,
    cr109_dueatclosing:
      row.cr109_dueatclosing || undefined,
    cr7de_amount: normalizeText(row.cr7de_amount),
    cr7de_chequenumber: normalizeText(
      row.cr7de_chequenumber
    ),
    cr7de_index: normalizeText(row.cr7de_index) ?? String(index + 1),
    cr7de_notapplicabletoledger:
      row.cr7de_notapplicabletoledger,
    cr7de_paidby: row.cr7de_paidby || undefined,
    cr7de_payableto: row.cr7de_payableto || undefined,
    cr7de_remarks: normalizeText(row.cr7de_remarks),
  }
}

function validateRows(rows: InvoiceChargeFormRow[]) {
  const invalidRows = rows.filter(
    (row) =>
      !row.cr109_dueatclosing ||
      !row.cr7de_paidby ||
      !row.cr7de_amount.trim()
  )

  return invalidRows.length === 0
}

export function ChargesWorkspace({
  ticketId,
  records,
  loading,
  error,
  onRefresh,
}: ChargesWorkspaceProps) {
  const [rows, setRows] = useState<InvoiceChargeFormRow[]>(
    [createChargeRow()]
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(
    null
  )

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

  const saveCharges = async () => {
    setMessage(null)
    setSaveError(null)

    if (!validateRows(rows)) {
      setSaveError(
        'Charge, paid by, and amount are required for every row.'
      )
      return
    }

    setSaving(true)

    try {
      for (const [index, row] of rows.entries()) {
        await createInvoiceDetail(
          toInvoicePayload(row, ticketId, index)
        )
      }

      setRows([createChargeRow()])
      await onRefresh()
      setMessage('Charges saved successfully.')
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Unable to save charges.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="charges-workspace">
      <section className="workflow-card">
        <div className="workflow-card-header">
          <div>
            <h3>Add Charges</h3>
            <p>
              Create invoice detail records linked to this
              closing ticket.
            </p>
          </div>
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
            Add Charge
          </button>
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
                <th>Charge</th>
                <th>Paid By</th>
                <th>Amount</th>
                <th>Payable To</th>
                <th>Cheque #</th>
                <th>Description</th>
                <th>Ledger</th>
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

        <div className="form-actions inline-actions">
          <button
            className="primary-action-button"
            type="button"
            onClick={saveCharges}
            disabled={!canSave || saving}
          >
            {saving ? 'Saving...' : 'Save Charges'}
          </button>
        </div>
      </section>

      <InvoiceTable
        records={records}
        loading={loading}
        error={error}
        onRefresh={onRefresh}
      />
    </div>
  )
}
