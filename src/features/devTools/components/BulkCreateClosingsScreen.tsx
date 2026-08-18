import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ClipboardPaste,
  Plus,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { Cr7de_closingticketdetailsescr109_packagetype } from '../../../generated/models/Cr7de_closingticketdetailsesModel'
import {
  generateTicketId,
  COOP_TRANSFER_PACKAGE_TYPE,
} from '../../closingTickets/utils/ticketCreation'
import { createClosingTicket } from '../../closingTickets/api/closingTicketsService'
import type { ClosingTicketCreateInput } from '../../closingTickets/types/closingTicket'
import { syncNewOwnerTicketFromClosingTicket } from '../../newOwnerTickets/api/newOwnerTicketService'
import { getBuildings } from '../../closingTickets/data/buildingListCache'
import { writeActionLog } from '../../auditLog/api/auditLogService'

const DEFAULT_LOCATION =
  '99 Park Avenue, 14th Floor, New York, NY 10014'

function formatChoiceLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

const PACKAGE_TYPE_OPTIONS = Object.entries(
  Cr7de_closingticketdetailsescr109_packagetype
).map(([value, label]) => ({
  value: Number(value),
  label: formatChoiceLabel(label),
}))

function normalizeForMatch(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function resolvePackageType(rawValue: string): number | '' {
  const trimmed = rawValue.trim()
  if (!trimmed) return ''

  const asNumber = Number(trimmed)
  if (
    !Number.isNaN(asNumber) &&
    PACKAGE_TYPE_OPTIONS.some((o) => o.value === asNumber)
  ) {
    return asNumber
  }

  const normalized = normalizeForMatch(trimmed)
  const match = PACKAGE_TYPE_OPTIONS.find(
    (o) => normalizeForMatch(o.label) === normalized
  )
  return match ? match.value : ''
}

type RowStatus = 'pending' | 'creating' | 'success' | 'error'

interface BulkRow {
  id: string
  unitNumber: string
  nycCode: string
  packageType: number | ''
  sellerTCode: string
  buyerTCode: string
  locationOfClosing: string
  buildingLookup: 'idle' | 'checking' | 'found' | 'notfound'
  buildingLabel?: string
  status: RowStatus
  statusMessage?: string
}

type RowErrors = Partial<
  Record<
    | 'unitNumber'
    | 'nycCode'
    | 'packageType'
    | 'sellerTCode'
    | 'buyerTCode',
    string
  >
>

let rowIdCounter = 0
function nextRowId() {
  rowIdCounter += 1
  return `row-${rowIdCounter}`
}

function createEmptyRow(): BulkRow {
  return {
    id: nextRowId(),
    unitNumber: '',
    nycCode: '',
    packageType: '',
    sellerTCode: '',
    buyerTCode: '',
    locationOfClosing: DEFAULT_LOCATION,
    buildingLookup: 'idle',
    status: 'pending',
  }
}

function validateRow(row: BulkRow): RowErrors {
  const errors: RowErrors = {}

  if (!row.unitNumber.trim()) {
    errors.unitNumber = 'Required'
  }
  if (!row.nycCode.trim()) {
    errors.nycCode = 'Required'
  }
  if (row.packageType === '') {
    errors.packageType = 'Required'
  }
  if (!row.sellerTCode.trim()) {
    errors.sellerTCode = 'Required'
  } else if (
    !row.sellerTCode.trim().toLowerCase().startsWith('t')
  ) {
    errors.sellerTCode = "Must start with 'T'"
  }
  if (
    row.packageType === COOP_TRANSFER_PACKAGE_TYPE &&
    !row.buyerTCode.trim()
  ) {
    errors.buyerTCode = 'Required for Coop Transfer'
  }

  return errors
}

// Splits pasted spreadsheet/CSV data (tab or comma separated) into rows.
// Expected column order: Unit Number, NYC Code, Package Type, Seller
// T-Code, Buyer T-Code (optional), Location of Closing (optional).
function parsePastedText(text: string): BulkRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line
        .split(/\t|,/)
        .map((cell) => cell.trim())
      const [
        unitNumber = '',
        nycCode = '',
        packageTypeRaw = '',
        sellerTCode = '',
        buyerTCode = '',
        locationOfClosing = '',
      ] = cells

      return {
        ...createEmptyRow(),
        unitNumber,
        nycCode,
        packageType: resolvePackageType(packageTypeRaw),
        sellerTCode,
        buyerTCode,
        locationOfClosing: locationOfClosing || DEFAULT_LOCATION,
      }
    })
}

interface BulkCreateClosingsScreenProps {
  onBack: () => void
  onApplied: () => Promise<void>
}

export function BulkCreateClosingsScreen({
  onBack,
  onApplied,
}: BulkCreateClosingsScreenProps) {
  const [rows, setRows] = useState<BulkRow[]>(() => [
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ])
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [errorsByRow, setErrorsByRow] = useState<
    Record<string, RowErrors>
  >({})
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState<{
    succeeded: number
    failed: number
  } | null>(null)

  const updateRow = <K extends keyof BulkRow>(
    id: string,
    key: K,
    value: BulkRow[K]
  ) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, [key]: value } : row
      )
    )
    setErrorsByRow((current) => {
      if (!current[id]) return current
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const lookupBuilding = async (id: string, code: string) => {
    const trimmed = code.trim()
    if (!trimmed) {
      updateRow(id, 'buildingLookup', 'idle')
      return
    }

    updateRow(id, 'buildingLookup', 'checking')

    try {
      const buildings = await getBuildings()
      const match = buildings.find(
        (b) => b.yardiId.toLowerCase() === trimmed.toLowerCase()
      )

      setRows((current) =>
        current.map((row) =>
          row.id === id
            ? {
                ...row,
                buildingLookup: match ? 'found' : 'notfound',
                buildingLabel: match?.legalName || match?.buildingName,
              }
            : row
        )
      )
    } catch {
      setRows((current) =>
        current.map((row) =>
          row.id === id
            ? { ...row, buildingLookup: 'idle' }
            : row
        )
      )
    }
  }

  const addRow = () => {
    setRows((current) => [...current, createEmptyRow()])
  }

  const removeRow = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id))
    setErrorsByRow((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const addPastedRows = () => {
    const parsed = parsePastedText(pasteText)
    if (parsed.length === 0) return

    setRows((current) => [...current, ...parsed])
    for (const row of parsed) {
      if (row.nycCode) {
        void lookupBuilding(row.id, row.nycCode)
      }
    }
    setPasteText('')
    setPasteOpen(false)
  }

  const createAll = async () => {
    const nextErrors: Record<string, RowErrors> = {}
    let hasErrors = false

    for (const row of rows) {
      const rowErrors = validateRow(row)
      if (Object.keys(rowErrors).length > 0) {
        nextErrors[row.id] = rowErrors
        hasErrors = true
      }
    }

    setErrorsByRow(nextErrors)
    if (hasErrors) {
      return
    }

    setSubmitting(true)
    setSummary(null)

    let succeeded = 0
    let failed = 0

    for (const row of rows) {
      setRows((current) =>
        current.map((r) =>
          r.id === row.id ? { ...r, status: 'creating' } : r
        )
      )

      try {
        const isCoopTransfer =
          row.packageType === COOP_TRANSFER_PACKAGE_TYPE
        const payload: ClosingTicketCreateInput = {
          cr7de_ticketid: generateTicketId(),
          cr7de_ticketstatus: 716070000,
          cr7de_unitnumber: row.unitNumber.trim(),
          cr7de_nyccode: row.nycCode.trim(),
          cr109_packagetype: (row.packageType || undefined) as
            | ClosingTicketCreateInput['cr109_packagetype']
            | undefined,
          cr7de_sellertcode: row.sellerTCode.trim(),
          cr7de_buyertcode: isCoopTransfer
            ? row.buyerTCode.trim()
            : undefined,
          cr7de_buyerexistsinyardi: isCoopTransfer,
          cr109_locationofclosing:
            row.locationOfClosing.trim() || DEFAULT_LOCATION,
          cr109_legalname: row.buildingLabel,
        }

        const created = await createClosingTicket(payload)
        await syncNewOwnerTicketFromClosingTicket(created)

        writeActionLog({
          ticketId: created.cr7de_ticketid ?? payload.cr7de_ticketid ?? '',
          tableName: 'cr7de_closingticketdetailses',
          action: 'Bulk Create Closing',
          details: {
            unitNumber: row.unitNumber,
            nycCode: row.nycCode,
          },
        })

        succeeded += 1
        setRows((current) =>
          current.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  status: 'success',
                  statusMessage: created.cr7de_ticketid,
                }
              : r
          )
        )
      } catch (err) {
        failed += 1
        setRows((current) =>
          current.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  status: 'error',
                  statusMessage:
                    err instanceof Error
                      ? err.message
                      : 'Failed to create.',
                }
              : r
          )
        )
      }
    }

    setSubmitting(false)
    setSummary({ succeeded, failed })
    if (succeeded > 0) {
      await onApplied()
    }
  }

  return (
    <motion.main
      className="mx-auto grid w-full max-w-[1500px] gap-3 px-4 py-5 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className="font-semibold uppercase"
            style={{
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: '#b89a5a',
            }}
          >
            Developer Mode
          </p>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '22px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#1E3A47',
            }}
          >
            Bulk Create Closings
          </h1>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-sm font-semibold text-[#1E3A47] shadow-sm hover:bg-[#F5F2EC]"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
        <ShieldAlert className="size-3.5 shrink-0" />
        Creates standard Draft tickets in one batch (same rules
        as the regular form — Seller T-Code must start with
        "T", Buyer T-Code is required for Coop Transfer).
        Tickets that need a manual Purchase Application Form
        upload should still be created individually. Each
        creation is recorded in the app logs.
      </p>

      {summary && (
        <StatusBanner
          type={summary.failed > 0 ? 'warning' : 'success'}
          message={
            summary.failed > 0
              ? `${summary.succeeded} created, ${summary.failed} failed. See the Status column below for details.`
              : `${summary.succeeded} closing ticket${summary.succeeded === 1 ? '' : 's'} created successfully.`
          }
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D5CBB8] bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#D5CBB8] bg-white px-3 text-xs font-semibold text-[#1E3A47] hover:bg-[#F5F2EC]"
            onClick={addRow}
          >
            <Plus className="size-3.5" />
            Add Row
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#D5CBB8] bg-white px-3 text-xs font-semibold text-[#1E3A47] hover:bg-[#F5F2EC]"
            onClick={() => setPasteOpen((open) => !open)}
          >
            <ClipboardPaste className="size-3.5" />
            Paste Rows
          </button>
          <span className="text-xs text-[#94a3b8]">
            {rows.length} row{rows.length === 1 ? '' : 's'}
          </span>
        </div>

        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#1E3A47] bg-[#1E3A47] px-4 text-xs font-semibold text-[#F5F2EC] hover:bg-[#152d38] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={submitting || rows.length === 0}
          onClick={() => void createAll()}
        >
          {submitting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : null}
          {submitting
            ? 'Creating…'
            : `Create All (${rows.length})`}
        </button>
      </div>

      {pasteOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-[#D5CBB8] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#475569]">
            Paste rows from a spreadsheet — one ticket per line,
            columns in order: Unit Number, NYC Code, Package
            Type, Seller T-Code, Buyer T-Code, Location of
            Closing (last two optional).
          </p>
          <textarea
            className="h-28 w-full rounded-md border border-[#e2e8f0] px-2 py-1.5 font-mono text-xs"
            placeholder={
              '9E\tNYC10010\tCondo Sale\tT12345\n' +
              '4B\tNYC10022\tCoop Transfer\tT54321\tT99999'
            }
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md border border-[#D5CBB8] bg-white px-3 text-xs font-semibold text-[#1E3A47] hover:bg-[#F5F2EC]"
              onClick={() => {
                setPasteText('')
                setPasteOpen(false)
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md border border-[#1E3A47] bg-[#1E3A47] px-3 text-xs font-semibold text-[#F5F2EC] hover:bg-[#152d38] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!pasteText.trim()}
              onClick={addPastedRows}
            >
              Add Pasted Rows
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#D5CBB8] bg-white shadow-sm">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead className="bg-[#EDE8E0]">
            <tr>
              {[
                'Unit Number',
                'NYC Code',
                'Building',
                'Package Type',
                'Seller T-Code',
                'Buyer T-Code',
                'Location of Closing',
                'Status',
                '',
              ].map((label) => (
                <th
                  key={label}
                  className="border-b border-[#D5CBB8] px-3 py-2 text-left font-semibold uppercase text-[#5F5E5A]"
                  style={{ fontSize: '10px', letterSpacing: '0.08em' }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowErrors = errorsByRow[row.id] ?? {}
              const showBuyerTCode =
                row.packageType === COOP_TRANSFER_PACKAGE_TYPE

              return (
                <tr
                  key={row.id}
                  className="odd:bg-white even:bg-[#faf8f4]"
                >
                  <td className="border-b border-[#EDE8E0] px-2 py-1.5">
                    <input
                      className={`h-8 w-24 rounded-md border px-2 text-xs ${rowErrors.unitNumber ? 'border-red-400' : 'border-[#e2e8f0]'}`}
                      value={row.unitNumber}
                      disabled={row.status !== 'pending' && row.status !== 'error'}
                      onChange={(e) =>
                        updateRow(row.id, 'unitNumber', e.target.value)
                      }
                      placeholder="9E"
                    />
                  </td>
                  <td className="border-b border-[#EDE8E0] px-2 py-1.5">
                    <input
                      className={`h-8 w-28 rounded-md border px-2 text-xs ${rowErrors.nycCode ? 'border-red-400' : 'border-[#e2e8f0]'}`}
                      value={row.nycCode}
                      disabled={row.status !== 'pending' && row.status !== 'error'}
                      onChange={(e) =>
                        updateRow(row.id, 'nycCode', e.target.value)
                      }
                      onBlur={(e) =>
                        void lookupBuilding(row.id, e.target.value)
                      }
                      placeholder="NYC10010"
                    />
                  </td>
                  <td className="border-b border-[#EDE8E0] px-2 py-1.5 text-xs">
                    {row.buildingLookup === 'checking' && (
                      <Loader2 className="size-3.5 animate-spin text-[#94a3b8]" />
                    )}
                    {row.buildingLookup === 'found' && (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span className="max-w-[140px] truncate">
                          {row.buildingLabel || 'Found'}
                        </span>
                      </span>
                    )}
                    {row.buildingLookup === 'notfound' && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <XCircle className="size-3.5 shrink-0" />
                        Not found
                      </span>
                    )}
                  </td>
                  <td className="border-b border-[#EDE8E0] px-2 py-1.5">
                    <select
                      className={`h-8 w-32 rounded-md border px-1 text-xs ${rowErrors.packageType ? 'border-red-400' : 'border-[#e2e8f0]'}`}
                      value={row.packageType}
                      disabled={row.status !== 'pending' && row.status !== 'error'}
                      onChange={(e) =>
                        updateRow(
                          row.id,
                          'packageType',
                          e.target.value === ''
                            ? ''
                            : Number(e.target.value)
                        )
                      }
                    >
                      <option value="">Select...</option>
                      {PACKAGE_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-b border-[#EDE8E0] px-2 py-1.5">
                    <input
                      className={`h-8 w-24 rounded-md border px-2 text-xs ${rowErrors.sellerTCode ? 'border-red-400' : 'border-[#e2e8f0]'}`}
                      value={row.sellerTCode}
                      disabled={row.status !== 'pending' && row.status !== 'error'}
                      onChange={(e) =>
                        updateRow(row.id, 'sellerTCode', e.target.value)
                      }
                      placeholder="T12345"
                    />
                  </td>
                  <td className="border-b border-[#EDE8E0] px-2 py-1.5">
                    <input
                      className={`h-8 w-24 rounded-md border px-2 text-xs ${rowErrors.buyerTCode ? 'border-red-400' : 'border-[#e2e8f0]'} ${showBuyerTCode ? '' : 'opacity-40'}`}
                      value={row.buyerTCode}
                      disabled={
                        !showBuyerTCode ||
                        (row.status !== 'pending' && row.status !== 'error')
                      }
                      onChange={(e) =>
                        updateRow(row.id, 'buyerTCode', e.target.value)
                      }
                      placeholder={showBuyerTCode ? 'T54321' : '—'}
                    />
                  </td>
                  <td className="border-b border-[#EDE8E0] px-2 py-1.5">
                    <input
                      className="h-8 w-40 rounded-md border border-[#e2e8f0] px-2 text-xs"
                      value={row.locationOfClosing}
                      disabled={row.status !== 'pending' && row.status !== 'error'}
                      onChange={(e) =>
                        updateRow(
                          row.id,
                          'locationOfClosing',
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td className="border-b border-[#EDE8E0] px-2 py-1.5 text-xs">
                    {row.status === 'pending' && (
                      <span className="text-[#94a3b8]">—</span>
                    )}
                    {row.status === 'creating' && (
                      <span className="flex items-center gap-1 text-[#1E3A47]">
                        <Loader2 className="size-3.5 animate-spin" />
                        Creating
                      </span>
                    )}
                    {row.status === 'success' && (
                      <span
                        className="flex items-center gap-1 text-emerald-700"
                        title={row.statusMessage}
                      >
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        {row.statusMessage}
                      </span>
                    )}
                    {row.status === 'error' && (
                      <span
                        className="flex items-center gap-1 text-red-600"
                        title={row.statusMessage}
                      >
                        <XCircle className="size-3.5 shrink-0" />
                        <span className="max-w-[140px] truncate">
                          {row.statusMessage}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="border-b border-[#EDE8E0] px-2 py-1.5">
                    <button
                      type="button"
                      aria-label="Remove row"
                      className="rounded-md p-1.5 text-[#94a3b8] hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={submitting}
                      onClick={() => removeRow(row.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.main>
  )
}
