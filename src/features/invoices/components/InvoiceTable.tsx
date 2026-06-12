import { useEffect, useMemo, useState } from 'react'
import { invoiceColumns } from '../constants/invoiceColumns'
import type {
  InvoiceChargeFormRow,
  InvoiceGroupKey,
  InvoiceRecord,
} from '../types/invoice'
import {
  formatInvoiceCurrency,
  getInvoiceGroupKey,
} from '../utils/invoiceFormatters'
import { InvoiceRow } from './InvoiceRow'

interface InvoiceTableProps {
  records: InvoiceRecord[]
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void> | void
  onSaveEdit: (
    recordId: string,
    row: InvoiceChargeFormRow
  ) => Promise<boolean>
  onDelete: (recordId: string) => void
  onSaveNotes?: (notes: string) => Promise<void>
  updatingId: string | null
  deletingId: string | null
}

const groupOrder: InvoiceGroupKey[] = [
  'Seller',
  'Buyer',
  'Other',
]

const groupLabels: Record<InvoiceGroupKey, string> = {
  Seller: 'Seller Cheques',
  Buyer: 'Buyer Cheques',
  Other: 'Charges, Fees & Adjustments',
}

function getInvoiceAmount(record: InvoiceRecord) {
  const amount = Number(
    record.cr7de_amount?.replace(/[$,]/g, '') ?? 0
  )

  return Number.isNaN(amount) ? 0 : amount
}

export function InvoiceTable({
  records,
  loading,
  error,
  onRefresh,
  onSaveEdit,
  onDelete,
  onSaveNotes,
  updatingId,
  deletingId,
}: InvoiceTableProps) {
  const [notes, setNotes] = useState('')
  const [originalNotes, setOriginalNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    const currentNotes = records.length > 0 && records[0].cr109_notes ? records[0].cr109_notes : ''
    setNotes(currentNotes)
    setOriginalNotes(currentNotes)
  }, [records])

  const notesChanged = notes !== originalNotes

  const handleSaveNotes = async () => {
    if (!onSaveNotes) return
    setSavingNotes(true)
    try {
      await onSaveNotes(notes)
      setOriginalNotes(notes) // Update original after save
    } finally {
      setSavingNotes(false)
    }
  }

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const firstCreated = a.createdon
        ? new Date(a.createdon).getTime()
        : 0
      const secondCreated = b.createdon
        ? new Date(b.createdon).getTime()
        : 0

      return firstCreated - secondCreated
    })
  }, [records])

  const groupedRecords = useMemo(() => {
    return sortedRecords.reduce<
      Record<InvoiceGroupKey, InvoiceRecord[]>
    >(
      (groups, record) => {
        groups[getInvoiceGroupKey(record)].push(record)
        return groups
      },
      {
        Seller: [],
        Buyer: [],
        Other: [],
      }
    )
  }, [sortedRecords])

  const totals = useMemo(() => {
    return records.reduce((currentTotals, record) => {
      const groupKey = getInvoiceGroupKey(record)
      const amount = getInvoiceAmount(record)

      return {
        ...currentTotals,
        [groupKey]: currentTotals[groupKey] + amount,
        total: currentTotals.total + amount,
      }
    }, {
      Seller: 0,
      Buyer: 0,
      Other: 0,
      total: 0,
    })
  }, [records])

  return (
    <section className="invoice-panel">
      <div className="invoice-header">
        <div>
          <h2>Invoice Details</h2>
          <p>
            {records.length} records ·{' '}
            {formatInvoiceCurrency(String(totals.total))}
          </p>
        </div>
        <button type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div
        className="invoice-total-summary"
        aria-label="Invoice totals by party"
      >
        <div>
          <span>Seller Total</span>
          <strong>
            {formatInvoiceCurrency(String(totals.Seller))}
          </strong>
        </div>
        <div>
          <span>Buyer Total</span>
          <strong>
            {formatInvoiceCurrency(String(totals.Buyer))}
          </strong>
        </div>
      </div>

      {loading && (
        <div className="invoice-state">
          Loading invoice details...
        </div>
      )}

      {error && (
        <div className="invoice-state invoice-state-error">
          {error}
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="invoice-state">
          No invoice detail records were found for this
          closing.
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="invoice-groups">
          {groupOrder.map((groupKey) => {
            const groupRecords = groupedRecords[groupKey]

            if (groupRecords.length === 0) {
              return null
            }

            return (
              <div
                className="invoice-group"
                key={groupKey}
              >
                <div className="invoice-group-title">
                  <h3>{groupLabels[groupKey]}</h3>
                  <span>{groupRecords.length}</span>
                </div>

                <div className="invoice-table-wrap">
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        {invoiceColumns.map((column) => (
                          <th key={column.key}>
                            {column.label}
                          </th>
                        ))}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupRecords.map((record) => (
                        <InvoiceRow
                          key={
                            record.cr7de_invoicedetailsid
                          }
                          record={record}
                          columns={invoiceColumns}
                          onSaveEdit={onSaveEdit}
                          onDelete={onDelete}
                          isUpdating={
                            updatingId ===
                            record.cr7de_invoicedetailsid
                          }
                          isDeleting={
                            deletingId ===
                            record.cr7de_invoicedetailsid
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="invoice-notes-edit-section">
          <label className="invoice-notes-label" htmlFor="invoice-notes">
            Notes
          </label>
          <textarea
            id="invoice-notes"
            className="invoice-notes-textarea"
            rows={3}
            placeholder="Add notes for this invoice..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {notesChanged && (
            <button
              type="button"
              className="primary-action-button"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              style={{ alignSelf: 'flex-start', marginTop: '8px', fontSize: '0.82rem', padding: '6px 14px' }}
            >
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
