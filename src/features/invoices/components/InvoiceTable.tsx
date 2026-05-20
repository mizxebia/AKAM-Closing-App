import { useMemo } from 'react'
import { invoiceColumns } from '../constants/invoiceColumns'
import type {
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
  onRefresh: () => void
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

export function InvoiceTable({
  records,
  loading,
  error,
  onRefresh,
}: InvoiceTableProps) {
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

  const totalAmount = useMemo(() => {
    return records.reduce((total, record) => {
      const amount = Number(
        record.cr7de_amount?.replace(/[$,]/g, '') ?? 0
      )

      return Number.isNaN(amount)
        ? total
        : total + amount
    }, 0)
  }, [records])

  return (
    <section className="invoice-panel">
      <div className="invoice-header">
        <div>
          <h2>Invoice Details</h2>
          <p>
            {records.length} records ·{' '}
            {formatInvoiceCurrency(String(totalAmount))}
          </p>
        </div>
        <button type="button" onClick={onRefresh}>
          Refresh
        </button>
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
    </section>
  )
}
