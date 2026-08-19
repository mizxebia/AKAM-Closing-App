import { useEffect, useState } from 'react'
import { CheckCircle2, Send, UploadCloud } from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import {
  uploadClosingTicketFile,
  type ClosingTicketUploadColumnName,
} from '../api/closingTicketsService'
import {
  getChangeLogs,
  writeActionLog,
} from '../../auditLog/api/auditLogService'
import { toast } from '../../../components/feedback/toastStore'

const SEND_ACTION_LABEL = 'Send to AR Team'

interface UploadRowProps {
  label: string
  columnName: ClosingTicketUploadColumnName
  closingTicketId: string
  currentFileName?: string | null
  onUploaded: () => void | Promise<void>
}

function UploadRow({
  label,
  columnName,
  closingTicketId,
  currentFileName,
  onUploaded,
}: UploadRowProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      await uploadClosingTicketFile(
        closingTicketId,
        columnName,
        file
      )
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
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#D5CBB8] bg-white px-3 py-2.5">
        {currentFileName ? (
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
        ) : (
          <UploadCloud className="size-4 shrink-0 text-[#94a3b8]" />
        )}
        <span className="flex-1 truncate text-xs text-[#64748b]">
          {currentFileName ?? 'No document on file'}
        </span>
        <label className="inline-flex h-8 shrink-0 cursor-pointer items-center rounded-md border border-[#1E3A47] px-3 text-xs font-semibold text-[#1E3A47] hover:bg-[#F5F2EC]">
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={(e) => void handleFileChange(e)}
          />
        </label>
      </div>
      {error && <StatusBanner type="error" message={error} />}
    </div>
  )
}

interface SendToATeamTabProps {
  closingTicketId: string
  ticketId: string
  currentChequesDocumentName?: string | null
  currentBatchDocumentName?: string | null
  onUploaded: () => void | Promise<void>
}

export function SendToATeamTab({
  closingTicketId,
  ticketId,
  currentChequesDocumentName,
  currentBatchDocumentName,
  onUploaded,
}: SendToATeamTabProps) {
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(
    null
  )
  const [lastSent, setLastSent] = useState<{
    modifiedBy: string
    createdOn: string
  } | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)

  const bothDocumentsPresent = Boolean(
    currentChequesDocumentName && currentBatchDocumentName
  )

  useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      setLoadingHistory(true)
      try {
        const logs = await getChangeLogs({
          ticketId,
          tableName: 'cr7de_closingticketdetailses',
          operation: 'action',
        })
        const lastSendEntry = logs.find(
          (entry) => entry.newData?.action === SEND_ACTION_LABEL
        )
        if (isMounted && lastSendEntry) {
          setLastSent({
            modifiedBy: lastSendEntry.modifiedBy,
            createdOn: lastSendEntry.createdOn,
          })
        }
      } catch {
        // Non-critical — the tab still works without send history.
      } finally {
        if (isMounted) setLoadingHistory(false)
      }
    }

    void loadHistory()

    return () => {
      isMounted = false
    }
  }, [ticketId])

  const handleSend = async () => {
    setSending(true)
    setSendError(null)

    try {
      writeActionLog({
        ticketId,
        tableName: 'cr7de_closingticketdetailses',
        action: SEND_ACTION_LABEL,
        details: {
          chequesDocument: currentChequesDocumentName,
          batchDocument: currentBatchDocumentName,
        },
      })
      setLastSent({
        modifiedBy: 'you',
        createdOn: new Date().toISOString(),
      })
      toast.success('Sent to AR Team.')
    } catch (err) {
      setSendError(
        err instanceof Error
          ? err.message
          : 'Unable to send to AR Team.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <h3 className="text-lg font-semibold text-slate-950">
          Send to AR Team
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Upload the Cheques Document and Batch Document for
          this completed closing, then send them to the AR
          Team.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <UploadRow
            label="Cheques Document"
            columnName="cr109_chequesdocument"
            closingTicketId={closingTicketId}
            currentFileName={currentChequesDocumentName}
            onUploaded={onUploaded}
          />
          <UploadRow
            label="Batch Document"
            columnName="cr109_batchdocument"
            closingTicketId={closingTicketId}
            currentFileName={currentBatchDocumentName}
            onUploaded={onUploaded}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1E3A47] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152d38] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!bothDocumentsPresent || sending}
            title={
              bothDocumentsPresent
                ? undefined
                : 'Upload both documents before sending.'
            }
            onClick={() => void handleSend()}
          >
            <Send className="size-4" />
            {sending ? 'Sending…' : 'Send to AR Team'}
          </button>

          {!loadingHistory && lastSent && (
            <span className="text-xs text-[#64748b]">
              Last sent by {lastSent.modifiedBy} on{' '}
              {new Date(lastSent.createdOn).toLocaleString()}
            </span>
          )}
        </div>

        {sendError && (
          <StatusBanner type="error" message={sendError} />
        )}
      </div>
    </section>
  )
}
