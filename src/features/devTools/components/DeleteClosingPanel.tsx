import { useState } from 'react'
import { AlertCircle, KeyRound, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '../../../components/ui/dialog'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { deleteClosingTicket } from '../../closingTickets/api/closingTicketsService'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import { verifyDeveloperModePassword } from '../../devScreenshots'

interface DeleteClosingPanelProps {
  closingTicketId: string
  ticketId: string
  record: ClosingTicketRecord
  onDeleted: () => void | Promise<void>
}

export function DeleteClosingPanel({
  closingTicketId,
  ticketId,
  record,
  onDeleted,
}: DeleteClosingPanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<
    string | null
  >(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const closeDialog = () => {
    setConfirmOpen(false)
    setPassword('')
    setPasswordError(null)
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!verifyDeveloperModePassword(password)) {
      setPasswordError('Incorrect password.')
      return
    }

    setPasswordError(null)
    setDeleting(true)
    setError(null)

    try {
      await deleteClosingTicket(closingTicketId, record)
      closeDialog()
      await onDeleted()
    } catch (err) {
      setDeleting(false)
      setPasswordError(null)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete this closing.'
      )
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
        <Trash2 className="size-3.5 shrink-0" />
        Permanently deletes this closing ticket and cannot be
        undone. Requires the developer password to confirm.
      </p>

      <div>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-red-600 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={deleting}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-3.5" />
          Delete Closing
        </button>
      </div>

      {error && <StatusBanner type="error" message={error} />}

      <Dialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!next && !deleting) closeDialog()
        }}
      >
        <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-2xl border-[#E2DAD0] p-0 shadow-2xl">
          <div className="h-1.5 w-full bg-red-600" />
          <div className="flex flex-col items-center gap-3 px-6 pb-5 pt-7 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-red-600 ring-4 ring-red-600/15">
              <Trash2 className="size-6 text-white" />
            </div>

            <DialogTitle asChild>
              <h2
                className="text-xl font-semibold text-[#1E3A47]"
                style={{
                  fontFamily:
                    "'Playfair Display', Georgia, serif",
                  fontStyle: 'italic',
                }}
              >
                Delete Closing Ticket
              </h2>
            </DialogTitle>
            <p className="text-xs leading-relaxed text-[#8a8578]">
              This permanently deletes{' '}
              <strong className="text-[#1E3A47]">
                {ticketId || 'this closing'}
              </strong>{' '}
              — {record.cr7de_buyername ?? 'no buyer'} at{' '}
              {record.cr7de_buildingname ?? 'unknown building'}
              . This cannot be undone. Enter the developer
              password to confirm.
            </p>
          </div>

          <form
            className="flex flex-col gap-4 border-t border-[#EDE8E0] bg-[#FAF8F4] px-6 py-5"
            onSubmit={(e) => void handleSubmit(e)}
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5F5E5A]">
                Password
              </span>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#B3AA98]" />
                <input
                  type="password"
                  autoFocus
                  placeholder="••••••••"
                  disabled={deleting}
                  className={`h-11 w-full rounded-lg border bg-white pl-9 pr-3 text-sm text-[#1E3A47] shadow-sm transition focus:outline-none focus:ring-2 disabled:opacity-60 ${
                    passwordError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-[#D5CBB8] focus:border-[#1E3A47] focus:ring-[#1E3A47]/15'
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </label>

            {passwordError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <AlertCircle className="size-4 shrink-0 text-red-500" />
                <p className="text-xs font-medium text-red-700">
                  {passwordError}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={deleting}
                className="inline-flex h-10 items-center rounded-lg border border-[#D5CBB8] bg-white px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#1E3A47] transition hover:bg-[#F5F2EC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={closeDialog}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleting || !password}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-red-600 px-4 text-xs font-semibold uppercase tracking-[0.06em] text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
                {deleting ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
