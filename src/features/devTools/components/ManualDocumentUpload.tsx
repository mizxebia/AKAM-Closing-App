import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import {
  uploadClosingTicketFile,
  type ClosingTicketUploadColumnName,
} from '../../closingTickets/api/closingTicketsService'

interface ManualUploadRowProps {
  label: string
  columnName: ClosingTicketUploadColumnName
  closingTicketId: string
  currentFileName?: string | null
  onUploaded: () => void | Promise<void>
}

function ManualUploadRow({
  label,
  columnName,
  closingTicketId,
  currentFileName,
  onUploaded,
}: ManualUploadRowProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      await uploadClosingTicketFile(
        closingTicketId,
        columnName,
        file
      )
      setSuccess(true)
      await onUploaded()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to upload ${label}.`
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[#475569]">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#D5CBB8] bg-white px-3 py-2">
        <UploadCloud className="size-4 shrink-0 text-[#94a3b8]" />
        <span className="flex-1 truncate text-xs text-[#64748b]">
          {currentFileName ?? 'No document on file'}
        </span>
        <label className="inline-flex h-8 shrink-0 cursor-pointer items-center rounded-md border border-[#1E3A47] px-3 text-xs font-semibold text-[#1E3A47] hover:bg-[#F5F2EC]">
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => void handleFileChange(e)}
          />
        </label>
      </div>
      {error && <StatusBanner type="error" message={error} />}
      {success && (
        <StatusBanner
          type="success"
          message={`${label} uploaded successfully.`}
          autoDismissMs={4000}
        />
      )}
    </div>
  )
}

interface ManualDocumentUploadProps {
  closingTicketId: string
  currentInvoicePdfName?: string | null
  currentNewOwnerPdfName?: string | null
  onUploaded: () => void | Promise<void>
}

export function ManualDocumentUpload({
  closingTicketId,
  currentInvoicePdfName,
  currentNewOwnerPdfName,
  onUploaded,
}: ManualDocumentUploadProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[#94a3b8]">
        For when the automated flow fails — attach the document
        directly instead of regenerating it.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ManualUploadRow
          label="Invoice PDF"
          columnName="cr109_closingticketdetailspdf"
          closingTicketId={closingTicketId}
          currentFileName={currentInvoicePdfName}
          onUploaded={onUploaded}
        />
        <ManualUploadRow
          label="New Owner Ticket PDF"
          columnName="cr109_newownerticketpdf"
          closingTicketId={closingTicketId}
          currentFileName={currentNewOwnerPdfName}
          onUploaded={onUploaded}
        />
      </div>
    </div>
  )
}
