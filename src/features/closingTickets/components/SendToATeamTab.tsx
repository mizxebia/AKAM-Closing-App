import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  FileText,
  Info,
  RefreshCw,
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
  Cr7de_closingticketdetailsescr109_packagetype,
  Cr7de_closingticketdetailsescr109_transactiontypedeal,
} from '../../../generated/models/Cr7de_closingticketdetailsesModel'
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
import { getNewOwnerTicketByTicketId } from '../../newOwnerTickets/api/newOwnerTicketService'
import type { NewOwnerTicketRecord } from '../../newOwnerTickets/types/newOwnerTicket'

const SEND_ACTION_LABEL = 'Send to AR Team'
const SAVE_DRAFT_ACTION_LABEL = 'Save AR Draft'
const REGENERATE_ACTION_LABEL = 'Regenerate AR Email'
const EMAIL_BODY_WARN_CHARS = 8_000

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Rough visible-text length of a stored HTML body — used only to flag an
// unusually long email, since message.length would otherwise count markup.
function estimatePlainTextLength(html: string): number {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length
}

function buildSubjectLine(record: ClosingTicketRecord) {
  const parts = [
    record.cr7de_ticketid,
    record.cr7de_nyccode,
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

const PACKAGE_TYPE_LABELS: Record<string, string> = {
  condo_sale: 'Condo Sale',
  coop_sale: 'Co-op Sale',
  coop_transfer: 'Co-op Transfer',
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  AllCash: 'All Cash',
  Financing: 'Financing',
  Transfer: 'Transfer',
  TrustTransfer: 'Trust Transfer',
}

function formatPackageType(
  value: ClosingTicketRecord['cr109_packagetype']
): string | null {
  if (value === undefined || value === null) return null
  const raw = Cr7de_closingticketdetailsescr109_packagetype[value]
  return raw ? (PACKAGE_TYPE_LABELS[raw] ?? raw) : null
}

function formatTransactionType(
  value: ClosingTicketRecord['cr109_transactiontypedeal']
): string | null {
  if (value === undefined || value === null) return null
  const raw = Cr7de_closingticketdetailsescr109_transactiontypedeal[value]
  return raw ? (TRANSACTION_TYPE_LABELS[raw] ?? raw) : null
}

type FieldRow = { label: string; value: string }

// A label/value pair, omitted entirely when every candidate source is
// empty — keeps each table limited to whatever is actually on record.
function row(
  label: string,
  ...candidates: Array<string | null | undefined>
): FieldRow | null {
  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return { label, value: candidate.trim() }
    }
  }
  return null
}

// Renders one bordered, inline-styled section table matching the layout of
// the source closing-request ticket (a title bar over label/value rows).
// Inline styles are required, not just cosmetic — this HTML is stored
// verbatim as the email body and sent through Outlook/Power Automate,
// neither of which honor an external stylesheet.
function renderSectionTable(title: string, rows: FieldRow[]): string {
  if (!rows.length) return ''

  const bodyRows = rows
    .map(
      ({ label, value }) => `<tr>
        <td style="width:36%;padding:7px 10px;border:1px solid #D5CBB8;background:#F8F5EF;font-size:11px;font-weight:700;color:#4B5563;text-transform:uppercase;letter-spacing:0.04em;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:7px 10px;border:1px solid #D5CBB8;font-size:13px;color:#1E3A47;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join('')

  return `<table style="width:100%;border-collapse:collapse;margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td colspan="2" style="padding:8px 10px;border:1px solid #1E3A47;background:#1E3A47;color:#F5F2EC;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(title)}</td>
    </tr>
    ${bodyRows}
  </table>`
}

// Default message body offered the first time this tab is opened for a
// ticket (and whenever "Regenerate" is used). Property/closing fields come
// from the closing ticket; seller & buyer contact details come from the
// linked New Owner Ticket, since that's the record that actually stores
// them. SSNs are never read here, so they can never end up in an email.
function buildPresetMessageHtml(
  closingTicket: ClosingTicketRecord,
  newOwnerTicket: NewOwnerTicketRecord | null
): string {
  const propertyLine = [
    closingTicket.cr7de_nyccode,
    closingTicket.cr7de_buildingaddress ||
      closingTicket.cr7de_buildingname,
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' - ')

  const closingRows = [
    row('Ticket ID', closingTicket.cr7de_ticketid),
    row('Property Number/Address', propertyLine),
    row(
      'Address (If Property has Multiple Addresses)',
      newOwnerTicket?.cr7de_address
    ),
    row(
      'Unit Number',
      closingTicket.cr7de_unitnumber,
      newOwnerTicket?.cr7de_unit
    ),
    row(
      'Closing Date',
      closingTicket.cr7de_closingdate
        ? formatClosingTicketDate(closingTicket.cr7de_closingdate)
        : null,
      newOwnerTicket?.cr7de_closingdate
        ? formatClosingTicketDate(newOwnerTicket.cr7de_closingdate)
        : null
    ),
    row(
      'Sales Price',
      closingTicket.cr109_saleprice
        ? formatInvoiceCurrency(closingTicket.cr109_saleprice)
        : null,
      newOwnerTicket?.cr109_purchaseprice
        ? formatInvoiceCurrency(newOwnerTicket.cr109_purchaseprice)
        : null
    ),
    row('Location of Closing', closingTicket.cr109_locationofclosing),
    row('Legal Name', closingTicket.cr109_legalname),
    row('Package Type', formatPackageType(closingTicket.cr109_packagetype)),
    row(
      'Transaction Type',
      formatTransactionType(closingTicket.cr109_transactiontypedeal)
    ),
    row(
      'Shares/% Ownership',
      closingTicket.cr109_shares,
      newOwnerTicket?.cr109_shares
    ),
  ].filter((r): r is FieldRow => Boolean(r))

  const sellerRows = [
    row(
      "Seller's Name",
      closingTicket.cr7de_sellername,
      newOwnerTicket?.cr7de_sellername
    ),
    row(
      "Seller's T-Code",
      closingTicket.cr7de_sellertcode,
      newOwnerTicket?.cr7de_sellertcode
    ),
    row("Seller's Contact Number", newOwnerTicket?.cr7de_sellercontactnumber),
    row("Seller's Contact Email", newOwnerTicket?.cr7de_sellercontactemail),
    row(
      'Forwarding Address for Seller',
      newOwnerTicket?.cr7de_forwardingaddressforseller
    ),
    row('Seller 2 Name', closingTicket.cr109_seller2name),
  ].filter((r): r is FieldRow => Boolean(r))

  const buyerRows = [
    row(
      'New Primary Owner Name',
      closingTicket.cr7de_buyername,
      newOwnerTicket?.cr7de_newprimaryownername
    ),
    row('Primary Contact Number', newOwnerTicket?.cr7de_primaryphonenumber),
    row('Primary Owner Email', newOwnerTicket?.cr7de_primaryowneremail),
    row(
      'New Secondary Owner Name',
      closingTicket.cr109_buyer2name,
      newOwnerTicket?.cr7de_newsecondaryownername
    ),
    row('Secondary Phone #', newOwnerTicket?.cr7de_secondaryphonenumber),
    row('Secondary Owner Email', newOwnerTicket?.cr7de_secondaryowneremail),
    row('Buyer T-Code', closingTicket.cr7de_buyertcode),
  ].filter((r): r is FieldRow => Boolean(r))

  const notes = closingTicket.cr7de_notes?.trim()

  return `<p>Hello AR Team,</p>
<p>Please find attached the closing documents for the transaction below. Kindly process the buyer's ledger accordingly.</p>
${renderSectionTable('Closing Details', closingRows)}
${renderSectionTable('Seller', sellerRows)}
${renderSectionTable('Buyer', buyerRows)}
${notes ? `<p><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ''}
<p>The Cheques Document and Batch Document are attached for your reference. Please reach out if any additional information is required.</p>
<p>Thank you,<br>${escapeHtml(closingTicket.cr7de_closingagentname || 'AKAM Closing Team')}</p>`
}

interface ArEmailBodyEditorProps {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
}

// Controlled contentEditable div — the email body needs real <table>
// markup (see renderSectionTable above), which a plain <textarea> can't
// display. Follows the same ref + "did this change come from us" guard as
// RichNotesEditor so external updates (loading a draft, Regenerate) don't
// fight the caret while someone is mid-edit.
function ArEmailBodyEditor({
  value,
  onChange,
  disabled = false,
}: ArEmailBodyEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const internalUpdate = useRef(false)

  useEffect(() => {
    if (internalUpdate.current) {
      internalUpdate.current = false
      return
    }
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value
    }
  }, [value])

  const handleInput = useCallback(() => {
    if (!ref.current) return
    internalUpdate.current = true
    onChange(ref.current.innerHTML)
  }, [onChange])

  return (
    <div
      ref={ref}
      className="ar-email-body-editor"
      contentEditable={!disabled}
      role="textbox"
      aria-multiline="true"
      aria-label="Email body for the AR Team"
      data-placeholder="Write a message for the AR Team (optional)…"
      onInput={handleInput}
      suppressContentEditableWarning
    />
  )
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
      ? closingTicket.cr109_emailbody
      : buildPresetMessageHtml(closingTicket, null)
  )
  // Tracks whether the preset should keep refreshing itself once the New
  // Owner Ticket record (seller/buyer contact details) finishes loading.
  // A saved draft, or any edit the sender makes, opts out of that refresh.
  const messageIsUserOwned = useRef(
    Boolean(closingTicket.cr109_emailbody?.trim())
  )
  const [sending, setSending] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [sendError, setSendError] = useState<string | null>(
    null
  )
  const [lastSent, setLastSent] = useState<{
    modifiedBy: string
    createdOn: string
  } | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)

  const [newOwnerTicket, setNewOwnerTicket] =
    useState<NewOwnerTicketRecord | null>(null)
  const [newOwnerTicketLoaded, setNewOwnerTicketLoaded] =
    useState(false)

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

  // Seller/buyer contact fields (phone, email, forwarding address) live on
  // the linked New Owner Ticket record, not the closing ticket itself.
  useEffect(() => {
    let isMounted = true

    async function loadNewOwnerTicket() {
      setNewOwnerTicketLoaded(false)
      try {
        const record = await getNewOwnerTicketByTicketId(ticketId)
        if (isMounted) setNewOwnerTicket(record)
      } catch {
        // Non-critical — the preset still works with closing-ticket fields.
      } finally {
        if (isMounted) setNewOwnerTicketLoaded(true)
      }
    }

    void loadNewOwnerTicket()

    return () => {
      isMounted = false
    }
  }, [ticketId])

  // Once the New Owner Ticket record arrives, refresh the preset so it
  // picks up seller/buyer contact details — but only while nobody has
  // saved a draft or started typing yet.
  useEffect(() => {
    if (!newOwnerTicketLoaded || messageIsUserOwned.current) return
    setMessage(buildPresetMessageHtml(closingTicket, newOwnerTicket))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newOwnerTicketLoaded, newOwnerTicket])

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

  const handleMessageChange = useCallback((html: string) => {
    messageIsUserOwned.current = true
    setMessage(html)
  }, [])

  const handleRegenerate = async () => {
    setRegenerating(true)
    setSendError(null)

    try {
      const newSubject = buildSubjectLine(closingTicket)
      const newBody = buildPresetMessageHtml(closingTicket, newOwnerTicket)

      messageIsUserOwned.current = true
      setSubject(newSubject)
      setMessage(newBody)

      await updateClosingTicket(closingTicketId, {
        cr109_emailsubject: newSubject,
        cr109_emailbody: newBody,
      })

      writeActionLog({
        ticketId,
        tableName: 'cr7de_closingticketdetailses',
        action: REGENERATE_ACTION_LABEL,
        details: { subject: newSubject },
      })

      toast.success('Email regenerated and saved.')
      await onUploaded()
    } catch (err) {
      setSendError(
        err instanceof Error
          ? err.message
          : 'Unable to regenerate the email.'
      )
    } finally {
      setRegenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    setSavingDraft(true)
    setSendError(null)

    try {
      await updateClosingTicket(closingTicketId, {
        cr109_emailsubject: subject,
        cr109_emailbody: message,
      })

      writeActionLog({
        ticketId,
        tableName: 'cr7de_closingticketdetailses',
        action: SAVE_DRAFT_ACTION_LABEL,
        details: { subject },
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
        cr109_emailbody: message,
      })

      await onSendToAR()

      writeActionLog({
        ticketId,
        tableName: 'cr7de_closingticketdetailses',
        action: SEND_ACTION_LABEL,
        details: {
          subject,
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

  const busy = sending || savingDraft || regenerating

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
          <ArEmailBodyEditor
            value={message}
            onChange={handleMessageChange}
            disabled={busy}
          />
          <div className="mt-1 flex items-center justify-end gap-2">
            {estimatePlainTextLength(message) > EMAIL_BODY_WARN_CHARS && (
              <span className="text-[11px] font-medium text-amber-600">
                Email is long — consider shortening it before sending.
              </span>
            )}
            <span
              className={`text-[11px] ${
                estimatePlainTextLength(message) > EMAIL_BODY_WARN_CHARS
                  ? 'text-amber-600 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {estimatePlainTextLength(message).toLocaleString()} chars
            </span>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1E3A47] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152d38] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!bothArDocumentsPresent || busy}
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
            disabled={busy}
            onClick={() => void handleSaveDraft()}
          >
            <Save className="size-4" />
            {savingDraft ? 'Saving…' : 'Save Draft'}
          </button>

          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5CBB8] px-4 text-sm font-semibold text-[#4B5563] shadow-sm transition hover:bg-[#F5F2EC] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy}
            title="Rebuild the subject and email body from the latest closing ticket details and save them."
            onClick={() => void handleRegenerate()}
          >
            <RefreshCw className="size-4" />
            {regenerating ? 'Regenerating…' : 'Regenerate & Save'}
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
