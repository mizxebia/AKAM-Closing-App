import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  AlertTriangle,
  Eye,
  Info,
  ReceiptText,
  RefreshCw,
  UserPlus,
  X,
} from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { LoadingSkeleton, StatusBadge } from '../../../components/enterprise'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog'
import {
  ChargesWorkspace as InvoiceWorkspace,
  useInvoices,
} from '../../invoices'
import {
  ChargesWorkspace,
  useCharges,
} from '../../charges'
import { NewOwnerTicketWorkspace } from '../../newOwnerTickets'
import { getClosingTicketById } from '../api/closingTicketsService'
import type { ClosingTicketRecord } from '../types/closingTicket'
import {
  NSC_Generate_InvoiceService,
  NSC_Generate_New_Owner_TicketService,
  NSC_Send_Email_To_ARService,
} from '../../../generated'
import { EditClosingTicketForm } from './CreateClosingTicketForm'
import { InvoiceDocumentViewer } from './InvoiceDocumentViewer'
import { SendToATeamTab } from './SendToATeamTab'
import {
  WorkflowTabs,
  WorkflowTabBar,
  type WorkflowTabKey,
} from './WorkflowTabs'
import { TabBarActionsPortalProvider } from './tabBarActionsPortal'
import { domecileLogoBase64, yardiLogoBase64 } from '../../../assets/logoData'
import { useAutoClear } from '../../../hooks/useAutoClear'
import {
  useDeveloperMode,
  DeveloperModeToggle,
  DeveloperModePasswordPrompt,
  ScreenshotGallery,
} from '../../devScreenshots'
import {
  AppLogsViewer,
  DeleteClosingPanel,
  ManualDocumentUpload,
  StatusOverridePanel,
} from '../../devTools'
import { writeActionLog } from '../../auditLog/api/auditLogService'
import { getClosingTicketStatusDisplay } from '../utils/closingTicketFormatters'
import { getBotStatusLabel } from '../../devTools/utils/statusOptions'
import { formatGeneratedLabel } from '../../invoices/utils/invoiceFormatters'
import { getFailureReason } from '../utils/closingTicketFailureReasons'
import {
  getMissingPartyNamesBannerMessage,
  getMissingPartyNamesInvoiceWarning,
} from '../utils/closingTicketPartyWarnings'

const PROCESSING_TICKET_STATUS = 716070005
const TRANSFERRING_BUILDING_STATUS = 716070002
const COMPLETED_STATUS = 716070008
const SENT_TO_AR_STATUS = 396620001
const OWNER_RECORD_CREATED_BOT_STATUS = 396620003

interface ClosingTicketDetailsPageProps {
  recordId: string
  onBack: () => void
  onSaved: () => Promise<void>
}

export function ClosingTicketDetailsPage({
  recordId,
  onBack,
  onSaved,
}: ClosingTicketDetailsPageProps) {
  const [record, setRecord] =
    useState<ClosingTicketRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null)

  // Auto-dismiss success message after 5 seconds
  useAutoClear(successMessage, setSuccessMessage)

  const [generatingInvoice, setGeneratingInvoice] =
    useState(false)
  const [
    generatingNewOwnerTicket,
    setGeneratingNewOwnerTicket,
  ] = useState(false)
  const [activeTab, setActiveTab] =
    useState<WorkflowTabKey>('details')
  const [invoiceViewerOpen, setInvoiceViewerOpen] =
    useState(false)
  const [logsViewerOpen, setLogsViewerOpen] = useState(false)
  const ticketId = record?.cr7de_ticketid
  const developerMode = useDeveloperMode()
  const {
    records: invoiceRecords,
    loading: invoicesLoading,
    error: invoicesError,
    refresh: refreshInvoices,
  } = useInvoices(ticketId)
  const {
    unpaidCharges,
    scheduledCharges,
    sellerLedgers,
    buyerLedgers,
    loading: chargesLoading,
    refreshing: chargesRefreshing,
    error: chargesError,
    refresh: refreshCharges,
  } = useCharges(
    ticketId,
    Number(record?.cr7de_ticketstatus) === COMPLETED_STATUS
  )

  useEffect(() => {
    let isMounted = true

    async function loadRecord() {
      setLoading(true)
      setError(null)

      try {
        const data = await getClosingTicketById(recordId)

        if (isMounted) {
          setRecord(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load closing ticket.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadRecord()

    return () => {
      isMounted = false
    }
  }, [recordId])

  const handleSaved = useCallback(async () => {
    const [updatedRecord] = await Promise.all([
      getClosingTicketById(recordId),
      onSaved(),
      refreshInvoices(),
      refreshCharges(),
    ])
    setRecord(updatedRecord)
    setSuccessMessage(
      'Closing record updated successfully.'
    )
  }, [onSaved, recordId, refreshInvoices, refreshCharges])

  const refreshClosingRecord = useCallback(async () => {
    const updatedRecord = await getClosingTicketById(
      recordId
    )
    setRecord(updatedRecord)
    await onSaved()
  }, [recordId, onSaved])

  const handleClosingDeleted = useCallback(async () => {
    // The record no longer exists — refresh the dashboard's list so the
    // deleted ticket disappears, then navigate away instead of trying to
    // refetch a record that's now gone.
    await onSaved()
    onBack()
  }, [onSaved, onBack])

  const refreshInvoicesAndRecord = useCallback(async () => {
    const [updatedRecord] = await Promise.all([
      getClosingTicketById(recordId),
      refreshInvoices(),
    ])
    setRecord(updatedRecord)
  }, [recordId, refreshInvoices])

  const handleGenerateInvoice = useCallback(async () => {
    const currentTicketId = record?.cr7de_ticketid?.trim()

    if (!currentTicketId) {
      setError(
        'Unable to generate invoice because this ticket does not have a Ticket ID.'
      )
      setSuccessMessage(null)
      return
    }

    setGeneratingInvoice(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const result = await NSC_Generate_InvoiceService.Run({
        text: currentTicketId,
      })

      if (!result.success) {
        throw new Error(
          result.error?.message ||
            ' Invoice Generation failed.'
        )
      }

      const flowStatus = result.data?.status?.trim()

      if (flowStatus?.toLowerCase() === 'failed') {
        throw new Error(
          'Generate Invoice flow returned Failed.'
        )
      }

      setSuccessMessage(
        'Invoice Generated Successfully.'
      )
      writeActionLog({
        ticketId: currentTicketId,
        tableName: 'cr7de_closingticketdetailses',
        action: 'Generate Invoice',
        details: { result: 'success', flowStatus },
      })
      await refreshClosingRecord()
      await refreshInvoices()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to generate invoice.'
      setError(message)
      writeActionLog({
        ticketId: currentTicketId,
        tableName: 'cr7de_closingticketdetailses',
        action: 'Generate Invoice',
        details: { result: 'failed', error: message },
      })
    } finally {
      setGeneratingInvoice(false)
    }
  }, [record?.cr7de_ticketid, refreshClosingRecord, refreshInvoices])

  const handleGenerateNewOwnerTicket = useCallback(async () => {
    const currentTicketId = record?.cr7de_ticketid?.trim()

    if (!currentTicketId) {
      setError(
        'Unable to generate new owner ticket because this ticket does not have a Ticket ID.'
      )
      setSuccessMessage(null)
      return
    }

    setGeneratingNewOwnerTicket(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const result =
        await NSC_Generate_New_Owner_TicketService.Run({
          text: currentTicketId,
        })

      if (!result.success) {
        throw new Error(
          result.error?.message ||
            'New Owner Ticket Generation failed.'
        )
      }

      const flowStatus = result.data?.status?.trim()

      if (flowStatus?.toLowerCase() === 'failed') {
        throw new Error(
          'Generate New Owner Ticket flow returned Failed.'
        )
      }

      setSuccessMessage(
        'New Owner Ticket Generated Successfully.'
      )
      writeActionLog({
        ticketId: currentTicketId,
        tableName: 'cr7de_closingticketdetailses',
        action: 'Generate New Owner Ticket',
        details: { result: 'success', flowStatus },
      })
      await refreshClosingRecord()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to generate new owner ticket.'
      setError(message)
      writeActionLog({
        ticketId: currentTicketId,
        tableName: 'cr7de_closingticketdetailses',
        action: 'Generate New Owner Ticket',
        details: { result: 'failed', error: message },
      })
    } finally {
      setGeneratingNewOwnerTicket(false)
    }
  }, [record?.cr7de_ticketid, refreshClosingRecord])

  const handleSendToAR = useCallback(async () => {
    const currentTicketId = record?.cr7de_ticketid?.trim()
    if (!currentTicketId) {
      setError('This ticket does not have a Ticket ID — cannot send to AR.')
      return
    }

    try {
      // Step 1 — regenerate New Owner Ticket before sending.
      const nowResult = await NSC_Generate_New_Owner_TicketService.Run({
        text: currentTicketId,
      })
      if (!nowResult.success) {
        throw new Error(
          nowResult.error?.message || 'New Owner Ticket regeneration failed.'
        )
      }
      if (nowResult.data?.status?.trim().toLowerCase() === 'failed') {
        throw new Error('New Owner Ticket flow returned Failed.')
      }

      // Step 2 — regenerate Invoice PDF before sending.
      const invoiceResult = await NSC_Generate_InvoiceService.Run({
        text: currentTicketId,
      })
      if (!invoiceResult.success) {
        throw new Error(
          invoiceResult.error?.message || 'Invoice generation failed.'
        )
      }
      if (invoiceResult.data?.status?.trim().toLowerCase() === 'failed') {
        throw new Error('Invoice generation flow returned Failed.')
      }

      // Step 3 — trigger the Send to AR email flow.
      const sendResult = await NSC_Send_Email_To_ARService.Run({
        text: currentTicketId,
      })
      if (!sendResult.success) {
        throw new Error(
          sendResult.error?.message || 'Send to AR flow failed.'
        )
      }
      if (sendResult.data?.status?.trim().toLowerCase() === 'failed') {
        throw new Error('Send to AR flow returned Failed.')
      }

      await refreshClosingRecord()
    } catch (err) {
      throw err
    }
  }, [record?.cr7de_ticketid, refreshClosingRecord])

  const renderPageActions = () => {
    const domecileUrl = record?.cr109_domecilepackageurl
      ? record.cr109_domecilepackageurl
      : 'https://akam.domecile.com/users/login'
    const yardiUrl = 'https://096836akama.yardione.com/Account/Login'

    return (
      <>
        <a
          href={domecileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-32 items-center justify-center rounded-lg border border-[#D5CBB8] bg-white shadow-sm transition hover:bg-[#F5F2EC] hover:border-[#C9A96E]"
          title={record?.cr109_domecilepackageurl ? 'Open Domecile Package' : 'Open Domecile Login'}
          aria-label={record?.cr109_domecilepackageurl ? 'Open Domecile Package' : 'Open Domecile Login'}
        >
          <img 
            src={domecileLogoBase64} 
            alt="Domecile" 
            className="h-7 w-auto max-w-[110px] object-contain"
          />
        </a>

        <a
          href={yardiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-32 items-center justify-center rounded-lg border border-[#D5CBB8] bg-white shadow-sm transition hover:bg-[#F5F2EC] hover:border-[#C9A96E]"
          title="Open Yardi"
          aria-label="Open Yardi"
        >
          <img 
            src={yardiLogoBase64} 
            alt="Yardi" 
            className="h-6 w-auto max-w-full object-contain"
          />
        </a>

        {developerMode.isAllowed && (
          <DeveloperModeToggle
            enabled={developerMode.enabled}
            onToggle={developerMode.toggle}
          />
        )}

        <button
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-sm font-semibold text-[#1E3A47] shadow-sm transition hover:bg-[#F5F2EC]"
          type="button"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </button>
      </>
    )
  }

  const isDraft = Number(record?.cr7de_ticketstatus) === 716070000
  const isReadOnly =
    Number(record?.cr7de_ticketstatus) === TRANSFERRING_BUILDING_STATUS ||
    Number(record?.cr7de_ticketstatus) === COMPLETED_STATUS ||
    Number(record?.cr7de_ticketstatus) === SENT_TO_AR_STATUS
  const isFullyCompleted =
    Number(record?.cr7de_ticketstatus) === COMPLETED_STATUS &&
    Number(record?.cr109_botstatus) === OWNER_RECORD_CREATED_BOT_STATUS
  const isSentToAR =
    Number(record?.cr7de_ticketstatus) === SENT_TO_AR_STATUS

  const workflowTabs = [
    { key: 'details' as const, label: 'Closing Details' },
    { key: 'invoice' as const, label: 'Invoice' },
    ...(!isDraft ? [
      { key: 'charges' as const, label: 'Yardi Charges' },
      { key: 'newOwner' as const, label: 'New Owner Ticket' },
    ] : []),
    ...(isFullyCompleted || isSentToAR ? [
      { key: 'sendToATeam' as const, label: 'Send to AR Team' },
    ] : []),
  ]

  // Tab-specific action buttons, rendered in the (already sticky)
  // WorkflowTabBar itself rather than inside each tab's own content — that
  // keeps them visible while scrolling a tab's form/table without needing
  // a second, independently-positioned sticky element competing with the
  // page's own sticky header for the same screen space.
  const hasInvoicePdf = Boolean(
    record?.cr109_closingticketdetailspdf ||
      record?.cr109_closingticketdetailspdf_name
  )

  // The Send to AR Team tab's buttons live inside that tab's own
  // self-contained component (it owns its own send/draft/regenerate state),
  // so instead of lifting all of that up here it portals its controls into
  // this DOM node once WorkflowTabBar hands it over via its ref callback.
  const [actionsPortalNode, setActionsPortalNode] =
    useState<HTMLDivElement | null>(null)

  // Generate Invoice normally runs straight away — this only intercepts the
  // click to confirm first when the buyer/seller name is missing, since the
  // generated invoice depends on that data being right.
  const [invoiceMissingNamesConfirmOpen, setInvoiceMissingNamesConfirmOpen] =
    useState(false)

  const handleGenerateInvoiceClick = useCallback(() => {
    if (record && getMissingPartyNamesInvoiceWarning(record)) {
      setInvoiceMissingNamesConfirmOpen(true)
      return
    }
    void handleGenerateInvoice()
  }, [record, handleGenerateInvoice])

  const tabActions =
    activeTab === 'invoice' && record ? (
      <>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1E3A47] px-3 text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition hover:bg-[#152d38] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleGenerateInvoiceClick}
          disabled={generatingInvoice || invoiceRecords.length === 0}
        >
          <ReceiptText className="size-3.5" />
          {generatingInvoice
            ? 'Generating…'
            : hasInvoicePdf
              ? 'Regenerate Invoice'
              : 'Generate Invoice'}
        </button>
        {hasInvoicePdf && (
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#C9A96E] bg-[#F5EFE0] px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#1E3A47] transition hover:bg-[#EDE0C5]"
            onClick={() => setInvoiceViewerOpen(true)}
          >
            <Eye className="size-3.5" />
            View Invoice
          </button>
        )}
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#D5CBB8] bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#1E3A47] transition hover:bg-[#F5F2EC]"
          onClick={() => void refreshInvoicesAndRecord()}
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      </>
    ) : activeTab === 'newOwner' && record ? (
      <button
        type="button"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1E3A47] px-3 text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition hover:bg-[#152d38] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => void handleGenerateNewOwnerTicket()}
        disabled={generatingNewOwnerTicket}
      >
        <UserPlus className="size-3.5" />
        {generatingNewOwnerTicket
          ? 'Generating…'
          : 'Generate New Owner Ticket'}
      </button>
    ) : null

  return (
    <TabBarActionsPortalProvider value={actionsPortalNode}>
      <div className="sticky top-[48px] z-20" style={{ background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between px-7 py-3 border-b border-[#e4e2dc]">
          <div>
            <p className="font-semibold uppercase" style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#b89a5a' }}>
              Closing Workspace
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, color: '#1E3A47', letterSpacing: '-0.3px', fontVariantNumeric: 'lining-nums tabular-nums' }}>
                {record?.cr7de_ticketid ?? 'Closing Details'}
              </h1>
              {record && (
                <StatusBadge
                  label={
                    getClosingTicketStatusDisplay(
                      record.cr7de_ticketstatus
                    ).label
                  }
                  tone={
                    getClosingTicketStatusDisplay(
                      record.cr7de_ticketstatus
                    ).tone
                  }
                />
              )}
              {developerMode.enabled &&
                record &&
                record.cr109_botstatus !== undefined &&
                String(record.cr109_botstatus).trim() !== '' && (
                  <StatusBadge
                    label={`Bot: ${formatGeneratedLabel(
                      getBotStatusLabel(Number(record.cr109_botstatus))
                    )}`}
                    tone="default"
                  />
                )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {renderPageActions()}
          </div>
        </div>
        <WorkflowTabBar
          tabs={workflowTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={tabActions}
          actionsContainerRef={setActionsPortalNode}
        />
      </div>

      <main className="mx-auto grid w-full max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:px-8">

      {record && getFailureReason(record) && (
        <div
          className="flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{
            background: '#FFF7ED',
            borderColor: '#FED7AA',
          }}
        >
          <AlertTriangle
            className="mt-0.5 shrink-0"
            style={{ color: '#C2410C', width: '18px', height: '18px' }}
          />
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: '#C2410C', letterSpacing: '0.08em' }}
            >
              Failure Reason
            </p>
            <p className="mt-0.5 text-sm" style={{ color: '#7C2D12' }}>
              {getFailureReason(record)}
            </p>
          </div>
        </div>
      )}

      {record && getMissingPartyNamesBannerMessage(record) && (
        <div
          className="flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{
            background: '#FFFBEB',
            borderColor: '#FDE68A',
          }}
        >
          <Info
            className="mt-0.5 shrink-0"
            style={{ color: '#B45309', width: '18px', height: '18px' }}
          />
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: '#B45309', letterSpacing: '0.08em' }}
            >
              Missing Information
            </p>
            <p className="mt-0.5 text-sm" style={{ color: '#78350F' }}>
              {getMissingPartyNamesBannerMessage(record)}
            </p>
          </div>
        </div>
      )}

      {developerMode.enabled && record && ticketId && (
        <>
          <section className="form-section">
            <div className="flex items-center justify-between">
              <h3>Developer Tools</h3>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#D5CBB8] bg-white px-3 text-xs font-semibold text-[#1E3A47] hover:bg-[#F5F2EC]"
                onClick={() => setLogsViewerOpen(true)}
              >
                View Logs
              </button>
            </div>

            <ManualDocumentUpload
              closingTicketId={record.cr7de_closingticketdetailsid}
              currentInvoicePdfName={
                record.cr109_closingticketdetailspdf_name
              }
              currentNewOwnerPdfName={
                record.cr109_newownerticketpdf_name
              }
              onUploaded={refreshClosingRecord}
            />

            <hr className="my-3 border-[#e2e8f0]" />

            <StatusOverridePanel
              closingTicketId={record.cr7de_closingticketdetailsid}
              ticketId={ticketId}
              currentTicketStatus={
                record.cr7de_ticketstatus !== undefined
                  ? Number(record.cr7de_ticketstatus)
                  : undefined
              }
              currentBotStatus={
                record.cr109_botstatus !== undefined &&
                String(record.cr109_botstatus).trim() !== ''
                  ? Number(record.cr109_botstatus)
                  : undefined
              }
              onUpdated={refreshClosingRecord}
            />

            <hr className="my-3 border-[#e2e8f0]" />

            <DeleteClosingPanel
              closingTicketId={record.cr7de_closingticketdetailsid}
              ticketId={ticketId}
              record={record}
              onDeleted={handleClosingDeleted}
            />
          </section>

          <ScreenshotGallery ticketId={ticketId} />
        </>
      )}

      {loading && (
        <LoadingSkeleton />
      )}

      {error && (
        <StatusBanner
          type="error"
          message={error}
        />
      )}

      {successMessage && (
        <StatusBanner
          type="success"
          message={successMessage}
        />
      )}

      {record && !loading && (
        <WorkflowTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={workflowTabs}
        >
          {activeTab === 'details' && (
            <div className="details-form-shell workflow-form-shell">
              <EditClosingTicketForm
                record={record}
                onCancel={onBack}
                onSaved={handleSaved}
                isCompleted={Number(record.cr7de_ticketstatus) === COMPLETED_STATUS || isSentToAR}
                lockedMessage={
                  isSentToAR
                    ? 'Sent to AR — this ticket is locked.'
                    : 'Completed Successfully — this ticket is locked.'
                }
                readOnly={
                  Number(record.cr7de_ticketstatus) === PROCESSING_TICKET_STATUS ||
                  isReadOnly
                }
              />
            </div>
          )}

          {activeTab === 'invoice' && (
            <InvoiceWorkspace
              ticketId={record.cr7de_ticketid ?? ''}
              closingTicketId={record.cr7de_closingticketdetailsid}
              closingTicketNotes={record.cr7de_notes ?? null}
              records={invoiceRecords}
              loading={invoicesLoading}
              error={invoicesError}
              onRefresh={refreshInvoicesAndRecord}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'charges' && (
            <ChargesWorkspace
              ticketId={record.cr7de_ticketid ?? ''}
              closingTicketId={record.cr7de_closingticketdetailsid}
              botStatus={Number(record.cr109_botstatus)}
              unpaidCharges={unpaidCharges}
              scheduledCharges={scheduledCharges}
              sellerLedgers={sellerLedgers}
              buyerLedgers={buyerLedgers}
              loading={chargesLoading}
              refreshing={chargesRefreshing}
              error={chargesError}
              onRefresh={refreshCharges}
              onClosingTicketRefresh={refreshClosingRecord}
              invoices={invoiceRecords}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'newOwner' && (
            <NewOwnerTicketWorkspace
              closingTicket={record}
              scheduledCharges={scheduledCharges}
              onSaved={handleSaved}
              onGenerateTicket={handleGenerateNewOwnerTicket}
              isCompleted={Number(record.cr7de_ticketstatus) === COMPLETED_STATUS || isSentToAR}
              readOnly={
                Number(record.cr7de_ticketstatus) === PROCESSING_TICKET_STATUS ||
                isReadOnly
              }
            />
          )}

          {activeTab === 'sendToATeam' && (
            <SendToATeamTab
              closingTicket={record}
              onUploaded={refreshClosingRecord}
              isSentToAR={isSentToAR}
              onSendToAR={handleSendToAR}
            />
          )}
        </WorkflowTabs>
      )}
    </main>

      {record && (
        <Sheet
          open={invoiceViewerOpen}
          onOpenChange={setInvoiceViewerOpen}
        >
          <SheetContent className="invoice-viewer-sheet">
            <SheetHeader className="invoice-viewer-sheet-header">
              <div>
                <SheetDescription className="text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
                  Generated Invoice
                </SheetDescription>
                <SheetTitle
                  className="mt-1 text-xl font-semibold text-[#1E3A47]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic' }}
                >
                  {record.cr7de_ticketid ?? 'Closing Ticket'}
                </SheetTitle>
              </div>
              <button
                type="button"
                className="invoice-viewer-close-btn"
                onClick={() => setInvoiceViewerOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </SheetHeader>

            <div className="invoice-viewer-sheet-body">
              <InvoiceDocumentViewer closingTicket={record} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <AlertDialog
        open={invoiceMissingNamesConfirmOpen}
        onOpenChange={setInvoiceMissingNamesConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buyer/seller name missing</AlertDialogTitle>
            <AlertDialogDescription>
              {record && getMissingPartyNamesInvoiceWarning(record)}
              <br />
              <br />
              Generate the invoice anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleGenerateInvoice()}
              className="bg-[#1E3A47] text-white hover:bg-[#152d38]"
            >
              Generate Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {developerMode.isAllowed && (
        <AppLogsViewer
          open={logsViewerOpen}
          onOpenChange={setLogsViewerOpen}
          ticketId={ticketId}
        />
      )}

      {developerMode.isAllowed && (
        <DeveloperModePasswordPrompt
          open={developerMode.promptOpen}
          error={developerMode.passwordError}
          onSubmit={developerMode.submitPassword}
          onCancel={developerMode.cancelPrompt}
        />
      )}
    </TabBarActionsPortalProvider>
  )
}
