import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  FileCheck2,
  ReceiptText,
  UserPlus,
} from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { LoadingSkeleton, PageHeader } from '../../../components/enterprise'
import {
  ChargesWorkspace,
  useInvoices,
} from '../../invoices'
import { NewOwnerTicketWorkspace } from '../../newOwnerTickets'
import { getClosingTicketById } from '../api/closingTicketsService'
import type { ClosingTicketRecord } from '../types/closingTicket'
import { EditClosingTicketForm } from './CreateClosingTicketForm'
import {
  WorkflowTabs,
  type WorkflowTabKey,
} from './WorkflowTabs'

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
  const [activeTab, setActiveTab] =
    useState<WorkflowTabKey>('details')
  const ticketId = record?.cr7de_ticketid
  const {
    records: invoiceRecords,
    loading: invoicesLoading,
    error: invoicesError,
    refresh: refreshInvoices,
  } = useInvoices(ticketId)

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

  const handleSaved = async () => {
    await onSaved()
    const updatedRecord = await getClosingTicketById(
      recordId
    )
    setRecord(updatedRecord)
    await refreshInvoices()
    setSuccessMessage(
      'Closing record updated successfully.'
    )
  }

  const handleGenerateInvoice = () => {
    console.info('Generate Invoice requested')
  }

  const handleGenerateNewOwnerTicket = () => {
    console.info('Generate New Owner Ticket requested')
  }

  const handleGenerateClosing = () => {
    console.info('Generate Closing requested')
  }

  const renderPageActions = () => (
    <>
      {activeTab !== 'newOwner' && (
        <>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1E3A47] px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F2EC] shadow-sm transition hover:bg-[#152d38]"
            type="button"
            onClick={handleGenerateInvoice}
          >
            <ReceiptText className="size-4" />
            Generate Invoice
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-3 text-sm font-semibold text-[#1E3A47] shadow-sm transition hover:bg-[#F5F2EC]"
            type="button"
            onClick={handleGenerateNewOwnerTicket}
          >
            <UserPlus className="size-4" />
            Generate New Owner Ticket
          </button>
        </>
      )}

      {activeTab === 'newOwner' && (
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1E3A47] px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#F5F2EC] shadow-sm transition hover:bg-[#152d38]"
          type="button"
          onClick={handleGenerateClosing}
        >
          <FileCheck2 className="size-4" />
          Generate Closing
        </button>
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

          {activeTab === 'charges' && (
            <ChargesWorkspace
              ticketId={record.cr7de_ticketid ?? ''}
              records={invoiceRecords}
              loading={invoicesLoading}
              error={invoicesError}
              onRefresh={refreshInvoices}
            />
          )}

          {activeTab === 'newOwner' && (
            <NewOwnerTicketWorkspace
              closingTicket={record}
            />
          )}
        </WorkflowTabs>
      )}
    </main>
  )
}
