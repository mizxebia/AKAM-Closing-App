import { useEffect, useMemo, useState } from 'react'
import { ReceiptText, Eye } from 'lucide-react'
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
  closingTicketNotes?: string | null
  onRefresh: () => Promise<void> | void
  onSaveEdit: (
    recordId: string,
    row: InvoiceChargeFormRow,
    oldRecord: InvoiceRecord
  ) => Promise<boolean>
  onDelete: (recordId: string, oldRecord: InvoiceRecord) => void
  onSaveNotes?: (notes: string) => Promise<void>
  onGenerateInvoice?: () => Promise<void> | void
  generatingInvoice?: boolean
  hasInvoicePdf?: boolean
  onViewInvoice?: () => void
  updatingId: string | null
  deletingId: string | null
  readOnly?: boolean
}

const groupOrder: InvoiceGroupKey[] = [
  'Seller',
  'Buyer',
  'Other',
]

const groupLabels: Record<InvoiceGroupKey, string> = {
  Seller: 'Seller Cheques',
  Buyer: 'Buyer Cheques',
  Other: 'Payments, Fees & Adjustments',
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
  closingTicketNotes,
  onRefresh,
  onSaveEdit,
  onDelete,
  onSaveNotes,
  onGenerateInvoice,
  generatingInvoice,
  hasInvoicePdf,
  onViewInvoice,
  updatingId,
  deletingId,
  readOnly = false,
}: InvoiceTableProps) {
  const [notes, setNotes] = useState('')
  const [originalNotes, setOriginalNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    // Notes are stored on the closing ticket (cr7de_notes), not on invoice rows
    const currentNotes = closingTicketNotes ?? ''
    setNotes(currentNotes)
    setOriginalNotes(currentNotes)
  }, [closingTicketNotes])

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
    const result = {
      Seller: 0,
      SellerCredits: 0,
      Buyer: 0,
      BuyerCredits: 0,
      Other: 0,
      total: 0,
    }

    for (const record of records) {
      const groupKey = getInvoiceGroupKey(record)
      const amount = getInvoiceAmount(record)

      result.total += amount

      if (groupKey === 'Seller') {
        if (amount < 0) {
          result.SellerCredits += amount
        } else {
          result.Seller += amount
        }
      } else if (groupKey === 'Buyer') {
        if (amount < 0) {
          result.BuyerCredits += amount
        } else {
          result.Buyer += amount
        }
      } else {
        result.Other += amount
      }
    }

    return result
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
        <div className="invoice-header-actions">
          {onGenerateInvoice && (
            <button
              type="button"
              className="invoice-generate-button"
              onClick={onGenerateInvoice}
              disabled={generatingInvoice}
            >
              <ReceiptText size={15} />
              {generatingInvoice
                ? 'Generating...'
                : hasInvoicePdf
                  ? 'Regenerate Invoice'
                  : 'Generate Invoice'}
            </button>
          )}
          {hasInvoicePdf && onViewInvoice && (
            <button
              type="button"
              className="invoice-view-button"
              onClick={onViewInvoice}
            >
              <Eye size={15} />
              View Invoice
            </button>
          )}
          <button type="button" onClick={onRefresh}>
            Refresh
          </button>
        </div>
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
        {totals.SellerCredits < 0 && (
          <div className="invoice-total-credit">
            <span>Seller Credits</span>
            <strong>
              {formatInvoiceCurrency(String(totals.SellerCredits))}
            </strong>
          </div>
        )}
        <div>
          <span>Buyer Total</span>
          <strong>
            {formatInvoiceCurrency(String(totals.Buyer))}
          </strong>
        </div>
        {totals.BuyerCredits < 0 && (
          <div className="invoice-total-credit">
            <span>Buyer Credits</span>
            <strong>
              {formatInvoiceCurrency(String(totals.BuyerCredits))}
            </strong>
          </div>
        )}
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
                        {!readOnly && <th>Actions</th>}
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
                          readOnly={readOnly}
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
            disabled={readOnly}
          />
          {notesChanged && !readOnly && (
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
