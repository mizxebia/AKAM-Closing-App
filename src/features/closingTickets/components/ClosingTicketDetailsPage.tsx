import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  AlertTriangle,
  X,
} from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { LoadingSkeleton } from '../../../components/enterprise'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../components/ui/sheet'
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
} from '../../../generated'
import { EditClosingTicketForm } from './CreateClosingTicketForm'
import { InvoiceDocumentViewer } from './InvoiceDocumentViewer'
import {
  WorkflowTabs,
  WorkflowTabBar,
  type WorkflowTabKey,
} from './WorkflowTabs'
import { domecileLogoBase64, yardiLogoBase64 } from '../../../assets/logoData'
import { useAutoClear } from '../../../hooks/useAutoClear'
import {
  useDeveloperMode,
  DeveloperModeToggle,
  ScreenshotGallery,
} from '../../devScreenshots'
import {
  AppLogsViewer,
  ManualDocumentUpload,
} from '../../devTools'
import { writeActionLog } from '../../auditLog/api/auditLogService'

const FAILED_TICKET_STATUS = 716070007
const PROCESSING_TICKET_STATUS = 716070005
const TRANSFERRING_BUILDING_STATUS = 716070002
const COMPLETED_STATUS = 716070008

const BOT_STATUS_FAILURE_REASONS: Record<number, string> = {
  396620005: 'Seller information could not be retrieved from the source system.',
  396620008: 'The purchase application form failed to download.',
  396620009: 'The Domicile dump could not be retrieved.',
  396620012: 'YARDI charges could not be fetched.',
  396620014: 'Purchase form data extraction failed.',
  396620016: 'Purchase form could not be uploaded to OneDrive.',
  396620017: 'Seller details update failed.',
  396620018: 'New owner record could not be created.',
  396620019: 'RPTT document extraction failed.',
}

function getFailureReason(record: ClosingTicketRecord): string | null {
  if (Number(record.cr7de_ticketstatus) !== FAILED_TICKET_STATUS) return null
  const botStatus = Number(record.cr109_botstatus)
  return BOT_STATUS_FAILURE_REASONS[botStatus] ?? 'An unexpected error occurred during processing.'
}

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
    Number(record?.cr7de_ticketstatus) === COMPLETED_STATUS

  const workflowTabs = [
    { key: 'details' as const, label: 'Closing Details' },
    { key: 'invoice' as const, label: 'Invoice' },
    ...(!isDraft ? [
      { key: 'charges' as const, label: 'Yardi Charges' },
      { key: 'newOwner' as const, label: 'New Owner Ticket' },
    ] : []),
  ]

  return (
    <>
      <div className="sticky top-[48px] z-20" style={{ background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between px-7 py-3 border-b border-[#e4e2dc]">
          <div>
            <p className="font-semibold uppercase" style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#b89a5a' }}>
              Closing Workspace
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, fontStyle: 'italic', color: '#1E3A47', letterSpacing: '-0.3px' }}>
              {record?.cr7de_ticketid ?? 'Closing Details'}
            </h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {renderPageActions()}
          </div>
        </div>
        <WorkflowTabBar
          tabs={workflowTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
                isCompleted={Number(record.cr7de_ticketstatus) === COMPLETED_STATUS}
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
              onRefresh={refreshInvoices}
              onGenerateInvoice={handleGenerateInvoice}
              generatingInvoice={generatingInvoice}
              hasInvoicePdf={Boolean(
                record.cr109_closingticketdetailspdf ||
                  record.cr109_closingticketdetailspdf_name
              )}
              onViewInvoice={() => setInvoiceViewerOpen(true)}
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
              isCompleted={Number(record.cr7de_ticketstatus) === COMPLETED_STATUS}
            />
          )}

          {activeTab === 'newOwner' && (
            <NewOwnerTicketWorkspace
              closingTicket={record}
              scheduledCharges={scheduledCharges}
              onSaved={handleSaved}
              onGenerateTicket={handleGenerateNewOwnerTicket}
              generatingTicket={generatingNewOwnerTicket}
              isCompleted={Number(record.cr7de_ticketstatus) === COMPLETED_STATUS}
              readOnly={
                Number(record.cr7de_ticketstatus) === PROCESSING_TICKET_STATUS ||
                isReadOnly
              }
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

      {developerMode.isAllowed && (
        <AppLogsViewer
          open={logsViewerOpen}
          onOpenChange={setLogsViewerOpen}
          ticketId={ticketId}
        />
      )}
    </>
  )
}
