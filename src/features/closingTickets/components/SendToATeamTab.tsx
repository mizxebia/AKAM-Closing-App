import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  FileText,
  Info,
  RotateCcw,
  Save,
  Send,
} from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import {
  updateClosingTicket,
  uploadClosingTicketFile,
} from '../api/closingTicketsService'
import type { ClosingTicketRecord } from '../types/closingTicket'
import { formatClosingTicketDate } from '../utils/closingTicketFormatters'
import { formatInvoiceCurrency } from '../../invoices/utils/invoiceFormatters'
import {
  getChangeLogs,
  writeActionLog,
} from '../../auditLog/api/auditLogService'
import { toast } from '../../../components/feedback/toastStore'
import {
  AR_TEAM_DOCUMENTS,
  getDataverseFileUrl,
  getDocumentFileName,
  hasDocument,
  type ClosingTicketDocumentKey,
  type DataverseFilePreview,
  type NewOwnerDocumentDefinition,
} from '../../newOwnerTickets/utils/dataverseFileUtils'
import {
  renderDocumentViewer,
  type ViewerState,
} from '../../newOwnerTickets/components/documentPreviewRenderer'

const SEND_ACTION_LABEL = 'Send to AR Team'
const SAVE_DRAFT_ACTION_LABEL = 'Save AR Draft'
const EMAIL_BODY_WARN_CHARS = 8_000

// Converts plain textarea text → HTML for Dataverse/Power Automate.
function plainToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

// Reverses HTML stored in Dataverse back to plain text for the textarea.
function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function buildSubjectLine(record: ClosingTicketRecord) {
  const parts = [
    record.cr7de_ticketid,
    record.cr7de_buyertcode,
    record.cr7de_unitnumber
      ? `Unit ${record.cr7de_unitnumber}`
      : null,
    record.cr7de_buildingname,
    record.cr7de_buyername,
  ].filter(
    (part): part is string =>
      Boolean(part) && part!.trim().length > 0
  )

  return parts.length > 0
    ? parts.join(' - ')
    : (record.cr7de_ticketid ?? 'Closing Documents')
}

// Default message body offered to the sender the first time this tab is
// opened for a ticket — informative enough that AR can process the buyer's
// ledger without needing to open the attachments first. Once a draft has
// been saved (or the ticket has been sent), that saved text takes over.
function buildPresetMessage(record: ClosingTicketRecord) {
  const buyerNames = [record.cr7de_buyername, record.cr109_buyer2name]
    .filter((name): name is string => Boolean(name && name.trim()))
    .join(' & ')
  const unitLabel = record.cr7de_unitnumber
    ? `, Unit ${record.cr7de_unitnumber}`
    : ''

  return `Hello AR Team,

Please find attached the closing documents for the buyer transaction detailed below. Kindly process the buyer's ledger accordingly.

Buyer: ${buyerNames || '-'}
Buyer T-Code: ${record.cr7de_buyertcode || '-'}
Seller: ${record.cr7de_sellername || '-'}
Building: ${record.cr7de_buildingname || '-'}${unitLabel}
Closing Date: ${formatClosingTicketDate(record.cr7de_closingdate)}
Sale Price: ${formatInvoiceCurrency(record.cr109_saleprice)}
Ticket ID: ${record.cr7de_ticketid || '-'}

The Cheques Document and Batch Document are attached for your reference. Please reach out if any additional information is required.

Thank you,
${record.cr7de_closingagentname || 'AKAM Closing Team'}`
}

interface AttachmentProps {
  document: NewOwnerDocumentDefinition
  closingTicket: ClosingTicketRecord
  isPreviewed: boolean
  onPreview: (key: ClosingTicketDocumentKey) => void
  uploadable: boolean
  onUploaded: () => void | Promise<void>
}

function Attachment({
  document,
  closingTicket,
  isPreviewed,
  onPreview,
  uploadable,
  onUploaded,
}: AttachmentProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const present = hasDocument(closingTicket, document)
  const fileName = present
    ? getDocumentFileName(closingTicket, document)
    : null

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
        closingTicket.cr7de_closingticketdetailsid,
        document.columnName,
        file
      )
      await onUploaded()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to upload ${document.label}.`
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition ${
        isPreviewed
          ? 'border-[#1E3A47] bg-[#F5F2EC]'
          : 'border-[#E2DAD0] bg-white'
      }`}
    >
      {present ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
      ) : (
        <FileText className="size-4 shrink-0 text-[#94a3b8]" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-[#1E3A47]">
          {document.label}
        </p>
        <p className="truncate text-[11px] text-[#94a3b8]">
          {fileName ?? 'Not yet available'}
        </p>
      </div>

      {present && (
        <button
          type="button"
          aria-label={`Preview ${document.label}`}
          title={`Preview ${document.label}`}
          className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full border transition ${
            isPreviewed
              ? 'border-[#1E3A47] bg-[#1E3A47] text-white'
              : 'border-[#D5CBB8] text-[#1E3A47] hover:bg-[#F5F2EC]'
          }`}
          onClick={() => onPreview(document.key)}
        >
          <Info className="size-3.5" />
        </button>
      )}

      {uploadable && (
        <label
          className="inline-flex h-7 shrink-0 cursor-pointer items-center rounded-md border border-[#1E3A47] px-2 text-[11px] font-semibold text-[#1E3A47] hover:bg-[#F5F2EC]"
          title={`Upload ${document.label}`}
        >
          {uploading ? '…' : present ? 'Replace' : 'Upload'}
          <input
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={(e) => void handleFileChange(e)}
          />
        </label>
      )}

      {error && (
        <div className="basis-full">
          <StatusBanner type="error" message={error} />
        </div>
      )}
    </div>
  )
}

interface SendToATeamTabProps {
  closingTicket: ClosingTicketRecord
  onUploaded: () => void | Promise<void>
  isSentToAR?: boolean
  onSendToAR: () => Promise<void>
}

export function SendToATeamTab({
  closingTicket,
  onUploaded,
  isSentToAR = false,
  onSendToAR,
}: SendToATeamTabProps) {
  const closingTicketId =
    closingTicket.cr7de_closingticketdetailsid
  const ticketId = closingTicket.cr7de_ticketid ?? ''

  const [subject, setSubject] = useState(() =>
    closingTicket.cr109_emailsubject?.trim()
      ? closingTicket.cr109_emailsubject
      : buildSubjectLine(closingTicket)
  )
  const [message, setMessage] = useState(() =>
    closingTicket.cr109_emailbody?.trim()
      ? htmlToPlain(closingTicket.cr109_emailbody)
      : buildPresetMessage(closingTicket)
  )
  const [sending, setSending] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [sendError, setSendError] = useState<string | null>(
    null
  )
  const [lastSent, setLastSent] = useState<{
    modifiedBy: string
    createdOn: string
  } | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)

  const [previewedKey, setPreviewedKey] =
    useState<ClosingTicketDocumentKey | null>('newOwnerTicketPdf')
  const [viewerState, setViewerState] =
    useState<ViewerState>('empty')
  const [filePreview, setFilePreview] =
    useState<DataverseFilePreview | null>(null)
  const [previewError, setPreviewError] = useState<
    string | null
  >(null)

  const bothArDocumentsPresent = Boolean(
    closingTicket.cr109_chequesdocument_name &&
      closingTicket.cr109_batchdocument_name
  )

  const previewedDocument = useMemo(
    () =>
      AR_TEAM_DOCUMENTS.find((d) => d.key === previewedKey) ??
      null,
    [previewedKey]
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

  // Fetches whichever attachment is currently being previewed. Keyed on
  // the document's filename (not the whole closingTicket object) so an
  // unrelated save elsewhere doesn't re-trigger a redundant re-fetch.
  const previewedFileName = previewedDocument
    ? closingTicket[previewedDocument.fileNameColumn]
    : null

  useEffect(() => {
    let isActive = true

    async function loadPreview() {
      if (!previewedDocument) {
        setViewerState('empty')
        setFilePreview(null)
        return
      }

      setViewerState('loading')
      setPreviewError(null)

      try {
        const preview = await getDataverseFileUrl(
          closingTicket,
          previewedDocument
        )
        if (!isActive) return
        setFilePreview(preview)
        setViewerState(
          preview.previewType === 'unsupported'
            ? 'unsupported'
            : 'ready'
        )
      } catch (err) {
        if (!isActive) return
        setFilePreview(null)
        setPreviewError(
          err instanceof Error
            ? err.message
            : 'Unable to preview file.'
        )
        setViewerState('error')
      }
    }

    void loadPreview()

    return () => {
      isActive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewedDocument?.key, previewedFileName])

  const handleSaveDraft = async () => {
    setSavingDraft(true)
    setSendError(null)

    try {
      await updateClosingTicket(closingTicketId, {
        cr109_emailsubject: subject,
        cr109_emailbody: plainToHtml(message),
      })

      writeActionLog({
        ticketId,
        tableName: 'cr7de_closingticketdetailses',
        action: SAVE_DRAFT_ACTION_LABEL,
        details: { subject, message },
      })

      toast.success('Draft Saved')
      await onUploaded()
    } catch (err) {
      setSendError(
        err instanceof Error
          ? err.message
          : 'Unable to save draft.'
      )
    } finally {
      setSavingDraft(false)
    }
  }

  const handleSend = async () => {
    const currentTicketId = closingTicket.cr7de_ticketid?.trim()
    if (!currentTicketId) {
      setSendError('This ticket does not have a Ticket ID — cannot send.')
      return
    }

    setSending(true)
    setSendError(null)

    try {
      // Persist latest subject + body before triggering flows.
      await updateClosingTicket(closingTicketId, {
        cr109_emailsubject: subject,
        cr109_emailbody: plainToHtml(message),
      })

      await onSendToAR()

      writeActionLog({
        ticketId,
        tableName: 'cr7de_closingticketdetailses',
        action: SEND_ACTION_LABEL,
        details: {
          subject,
          message,
          chequesDocument:
            closingTicket.cr109_chequesdocument_name,
          batchDocument: closingTicket.cr109_batchdocument_name,
          invoice:
            closingTicket.cr109_closingticketdetailspdf_name,
          newOwnerTicket:
            closingTicket.cr109_newownerticketpdf_name,
        },
      })

      setLastSent({
        modifiedBy: 'you',
        createdOn: new Date().toISOString(),
      })
      toast.success('Sent to AR Team.')
      await onUploaded()
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
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        {isSentToAR && (
          <div className="flex items-center gap-2 rounded-t-xl border-b border-emerald-100 bg-emerald-50 px-5 py-3">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-700">
              This ticket has already been sent to the AR Team. You can update the email and send again below.
            </p>
          </div>
        )}
        {/* Outlook-style compose header */}
        <div className="border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2 border-b border-slate-100 py-2">
            <span className="w-14 shrink-0 text-xs font-medium text-slate-400">
              To
            </span>
            <span className="inline-flex items-center rounded-full bg-[#F5F2EC] px-2.5 py-1 text-xs font-semibold text-[#1E3A47]">
              AR Team
            </span>
          </div>
          <div className="flex items-center gap-2 py-2">
            <span className="w-14 shrink-0 text-xs font-medium text-slate-400">
              Subject
            </span>
            <input
              className="h-8 flex-1 rounded-md border border-transparent px-1 text-sm font-medium text-slate-900 outline-none transition hover:border-slate-200 focus:border-[#1E3A47] focus:bg-white"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Attachments
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {AR_TEAM_DOCUMENTS.map((document) => (
              <Attachment
                key={document.key}
                document={document}
                closingTicket={closingTicket}
                isPreviewed={previewedKey === document.key}
                onPreview={setPreviewedKey}
                uploadable={
                  document.key === 'chequesDocument' ||
                  document.key === 'batchDocument'
                }
                onUploaded={onUploaded}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col border-t border-slate-100 px-5 py-3">
          <textarea
            className="flex-1 w-full resize-none rounded-md border border-transparent px-1 py-1 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-200 focus:border-[#1E3A47] focus:bg-white"
            placeholder="Write a message for the AR Team (optional)…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="mt-1 flex items-center justify-end gap-2">
            {message.length > EMAIL_BODY_WARN_CHARS && (
              <span className="text-[11px] font-medium text-amber-600">
                Email is long — consider shortening it before sending.
              </span>
            )}
            <span className={`text-[11px] ${message.length > EMAIL_BODY_WARN_CHARS ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
              {message.length.toLocaleString()} chars
            </span>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1E3A47] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152d38] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!bothArDocumentsPresent || sending}
            title={
              bothArDocumentsPresent
                ? undefined
                : 'Upload both the Cheques Document and Batch Document before sending.'
            }
            onClick={() => void handleSend()}
          >
            {isSentToAR ? <RotateCcw className="size-4" /> : <Send className="size-4" />}
            {sending ? 'Sending…' : isSentToAR ? 'Send Again to AR' : 'Send to AR Team'}
          </button>

          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#1E3A47] px-4 text-sm font-semibold text-[#1E3A47] shadow-sm transition hover:bg-[#F5F2EC] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={savingDraft || sending}
            onClick={() => void handleSaveDraft()}
          >
            <Save className="size-4" />
            {savingDraft ? 'Saving…' : 'Save Draft'}
          </button>

          {!loadingHistory && lastSent && (
            <span className="text-xs text-[#64748b]">
              Last sent by {lastSent.modifiedBy} on{' '}
              {new Date(lastSent.createdOn).toLocaleString()}
            </span>
          )}
        </div>

        {sendError && (
          <div className="px-5 pb-3">
            <StatusBanner type="error" message={sendError} />
          </div>
        )}
      </div>

      {/* Right-side preview pane — populated by clicking an attachment's
          info icon, like the New Owner Ticket document panel. */}
      <aside className="document-panel ar-document-panel">
        <div className="document-panel-inner">
          <div className="document-panel-header">
            <div>
              <p>Preview</p>
              <h3>
                {previewedDocument?.label ??
                  'Click an attachment to preview'}
              </h3>
            </div>
          </div>
          <div
            className="document-preview-shell"
            aria-live="polite"
          >
            {renderDocumentViewer(
              viewerState,
              filePreview,
              previewedDocument?.label ?? '',
              previewError
            )}
          </div>
        </div>
      </aside>
    </section>
  )
}
