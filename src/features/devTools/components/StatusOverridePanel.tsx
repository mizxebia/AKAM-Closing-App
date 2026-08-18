import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
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
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { updateClosingTicket } from '../../closingTickets/api/closingTicketsService'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import { writeActionLog } from '../../auditLog/api/auditLogService'
import {
  TICKET_STATUS_OPTIONS,
  BOT_STATUS_OPTIONS,
  getTicketStatusLabel,
  getBotStatusLabel,
} from '../utils/statusOptions'

interface StatusOverridePanelProps {
  closingTicketId: string
  ticketId: string
  currentTicketStatus?: number
  currentBotStatus?: number
  onUpdated: () => void | Promise<void>
}

export function StatusOverridePanel({
  closingTicketId,
  ticketId,
  currentTicketStatus,
  currentBotStatus,
  onUpdated,
}: StatusOverridePanelProps) {
  const [ticketStatus, setTicketStatus] = useState(
    currentTicketStatus ?? TICKET_STATUS_OPTIONS[0].value
  )
  const [botStatus, setBotStatus] = useState(
    currentBotStatus ?? BOT_STATUS_OPTIONS[0].value
  )
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const hasChanges =
    ticketStatus !== currentTicketStatus ||
    botStatus !== currentBotStatus

  const applyOverride = async () => {
    setConfirmOpen(false)
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await updateClosingTicket(closingTicketId, {
        cr7de_ticketstatus:
          ticketStatus as ClosingTicketRecord['cr7de_ticketstatus'],
        cr109_botstatus:
          botStatus as ClosingTicketRecord['cr109_botstatus'],
      })

      writeActionLog({
        ticketId,
        tableName: 'cr7de_closingticketdetailses',
        action: 'Developer Status Override',
        details: {
          from: {
            ticketStatus:
              currentTicketStatus !== undefined
                ? getTicketStatusLabel(currentTicketStatus)
                : undefined,
            botStatus:
              currentBotStatus !== undefined
                ? getBotStatusLabel(currentBotStatus)
                : undefined,
          },
          to: {
            ticketStatus: getTicketStatusLabel(ticketStatus),
            botStatus: getBotStatusLabel(botStatus),
          },
        },
      })

      setSuccess(true)
      await onUpdated()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update status.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
        <ShieldAlert className="size-3.5 shrink-0" />
        Bypasses the normal workflow — use to unstick a ticket
        that's failed or stuck mid-automation. This is recorded
        in the app logs.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-[#475569]">
          Ticket Status
          <select
            className="h-9 rounded-md border border-[#e2e8f0] px-2 text-sm"
            value={ticketStatus}
            onChange={(e) =>
              setTicketStatus(Number(e.target.value))
            }
          >
            {TICKET_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-[#475569]">
          Bot Status
          <select
            className="h-9 rounded-md border border-[#e2e8f0] px-2 text-sm"
            value={botStatus}
            onChange={(e) =>
              setBotStatus(Number(e.target.value))
            }
          >
            {BOT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[#1E3A47] bg-[#1E3A47] px-3 text-xs font-semibold text-[#F5F2EC] hover:bg-[#152d38] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasChanges || saving}
          onClick={() => setConfirmOpen(true)}
        >
          {saving ? 'Applying…' : 'Apply Status Override'}
        </button>
      </div>

      {error && <StatusBanner type="error" message={error} />}
      {success && (
        <StatusBanner
          type="success"
          message="Status updated."
          autoDismissMs={4000}
        />
      )}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Override ticket status?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This directly sets the Ticket Status and Bot
              Status, bypassing all normal workflow rules and
              validations. Only do this to unstick a ticket you
              understand the state of.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-[#1E3A47] border border-[#1E3A47] hover:bg-[#1E3A47]/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#1E3A47] text-[#F5F2EC] hover:bg-[#152d38]"
              onClick={() => void applyOverride()}
            >
              Apply Override
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
