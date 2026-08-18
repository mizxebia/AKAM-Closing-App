import { useState } from 'react'
import { AlertCircle, KeyRound, Lock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '../../../components/ui/dialog'

interface DeveloperModePasswordPromptProps {
  open: boolean
  error: string | null
  onSubmit: (password: string) => boolean
  onCancel: () => void
}

export function DeveloperModePasswordPrompt({
  open,
  error,
  onSubmit,
  onCancel,
}: DeveloperModePasswordPromptProps) {
  const [password, setPassword] = useState('')

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    const succeeded = onSubmit(password)
    if (succeeded) {
      setPassword('')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPassword('')
          onCancel()
        }
      }}
    >
      <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-2xl border-[#E2DAD0] p-0 shadow-2xl">
        <div
          className="h-1.5 w-full"
          style={{
            background:
              'linear-gradient(90deg, #1E3A47 0%, #C9A96E 50%, #1E3A47 100%)',
          }}
        />
        <div className="flex flex-col items-center gap-3 px-6 pb-5 pt-7 text-center">
          <div
            className="grid size-14 place-items-center rounded-full ring-4 ring-[#C9A96E]/15"
            style={{
              background:
                'linear-gradient(135deg, #1E3A47 0%, #2d5468 100%)',
              boxShadow: '0 8px 20px rgba(30,58,71,0.35)',
            }}
          >
            <Lock className="size-6 text-[#C9A96E]" />
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
              Developer Mode
            </h2>
          </DialogTitle>
          <p className="text-xs leading-relaxed text-[#8a8578]">
            This area is restricted to service accounts. Enter
            the password to unlock developer tools for this
            session.
          </p>
        </div>

        <form
          className="flex flex-col gap-4 border-t border-[#EDE8E0] bg-[#FAF8F4] px-6 py-5"
          onSubmit={handleSubmit}
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
                className={`h-11 w-full rounded-lg border bg-white pl-9 pr-3 text-sm text-[#1E3A47] shadow-sm transition focus:outline-none focus:ring-2 ${
                  error
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-[#D5CBB8] focus:border-[#1E3A47] focus:ring-[#1E3A47]/15'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </label>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <AlertCircle className="size-4 shrink-0 text-red-500" />
              <p className="text-xs font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-lg border border-[#D5CBB8] bg-white px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#1E3A47] transition hover:bg-[#F5F2EC] active:scale-[0.98]"
              onClick={() => {
                setPassword('')
                onCancel()
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#1E3A47] px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#F5F2EC] shadow-sm transition hover:bg-[#152d38] active:scale-[0.98]"
            >
              <Lock className="size-3.5" />
              Unlock
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
