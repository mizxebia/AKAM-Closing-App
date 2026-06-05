import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  AlertTriangle,
  ReceiptText,
  UserPlus,
} from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { LoadingSkeleton, PageHeader } from '../../../components/enterprise'
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
import { GeneratedDocumentsWorkspace } from './GeneratedDocumentsWorkspace'
import {
  WorkflowTabs,
  type WorkflowTabKey,
} from './WorkflowTabs'

const FAILED_TICKET_STATUS = 716070007

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
  const [generatingInvoice, setGeneratingInvoice] =
    useState(false)
  const [
    generatingNewOwnerTicket,
    setGeneratingNewOwnerTicket,
  ] = useState(false)
  const [activeTab, setActiveTab] =
    useState<WorkflowTabKey>('details')
  const ticketId = record?.cr7de_ticketid
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
  } = useCharges(ticketId)

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

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 5000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const handleSaved = useCallback(async () => {
    await onSaved()
    const updatedRecord = await getClosingTicketById(
      recordId
    )
    setRecord(updatedRecord)
    await refreshInvoices()
    await refreshCharges()
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
      await refreshClosingRecord()
      await refreshInvoices()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate invoice.'
      )
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
      await refreshClosingRecord()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate new owner ticket.'
      )
    } finally {
      setGeneratingNewOwnerTicket(false)
    }
  }, [record?.cr7de_ticketid, refreshClosingRecord])

  const renderPageActions = () => (
    <>
      {activeTab !== 'newOwner' && (
        <>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1E3A47] px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F2EC] shadow-sm transition hover:bg-[#152d38]"
            type="button"
            onClick={handleGenerateInvoice}
            disabled={generatingInvoice}
          >
            <ReceiptText className="size-4" />
            {generatingInvoice
              ? 'Generating...'
              : 'Generate Invoice'}
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-sm font-semibold text-[#1E3A47] shadow-sm transition hover:bg-[#F5F2EC]"
            type="button"
            onClick={handleGenerateNewOwnerTicket}
            disabled={generatingNewOwnerTicket}
          >
            <UserPlus className="size-4" />
            {generatingNewOwnerTicket
              ? 'Generating...'
              : 'Generate New Owner Ticket'}
          </button>
        </>
      )}

      {activeTab === 'newOwner' && (
        <>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-sm font-semibold text-[#1E3A47] shadow-sm transition hover:bg-[#F5F2EC]"
            type="button"
            onClick={handleGenerateNewOwnerTicket}
            disabled={generatingNewOwnerTicket}
          >
            <UserPlus className="size-4" />
            {generatingNewOwnerTicket
              ? 'Generating...'
              : 'Generate New Owner Ticket'}
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1E3A47] px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F2EC] shadow-sm transition hover:bg-[#152d38]"
            type="button"
            onClick={handleGenerateInvoice}
            disabled={generatingInvoice}
          >
            <ReceiptText className="size-4" />
            {generatingInvoice
              ? 'Generating...'
              : 'Generate Invoice'}
          </button>
        </>
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

  return (
    <main className="mx-auto grid w-full max-w-[1500px] gap-5">
      <PageHeader
        eyebrow="Closing Workspace"
        title={record?.cr7de_ticketid ?? 'Closing Details'}
        description="Review the closing record, manage charges, and complete the new-owner workflow in one workspace."
        actions={renderPageActions()}
      />

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
          tabs={[
            {
              key: 'details',
              label: 'Closing Details',
            },
            {
              key: 'invoice',
              label: 'Invoice',
            },
            {
              key: 'documents',
              label: 'Documents',
            },
            {
              key: 'charges',
              label: 'Charges',
            },
            {
              key: 'newOwner',
              label: 'New Owner Ticket',
            },
          ]}
        >
          {activeTab === 'details' && (
            <div className="details-form-shell workflow-form-shell">
              <EditClosingTicketForm
                record={record}
                onCancel={onBack}
                onSaved={handleSaved}
                onSubmitted={async () => {
                  await onSaved()
                  onBack()
                }}
              />
            </div>
          )}

          {activeTab === 'invoice' && (
            <InvoiceWorkspace
              ticketId={record.cr7de_ticketid ?? ''}
              records={invoiceRecords}
              loading={invoicesLoading}
              error={invoicesError}
              onRefresh={refreshInvoices}
            />
          )}

          {activeTab === 'charges' && (
            <ChargesWorkspace
              ticketId={record.cr7de_ticketid ?? ''}
              unpaidCharges={unpaidCharges}
              scheduledCharges={scheduledCharges}
              sellerLedgers={sellerLedgers}
              buyerLedgers={buyerLedgers}
              loading={chargesLoading}
              refreshing={chargesRefreshing}
              error={chargesError}
              onRefresh={refreshCharges}
              invoices={invoiceRecords}
            />
          )}

          {activeTab === 'documents' && (
            <GeneratedDocumentsWorkspace
              closingTicket={record}
            />
          )}

          {activeTab === 'newOwner' && (
            <NewOwnerTicketWorkspace
              closingTicket={record}
              onSaved={handleSaved}
            />
          )}
        </WorkflowTabs>
      )}
    </main>
  )
}
