import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import {
  dismissToast,
  subscribeToasts,
  type ToastMessage,
  type ToastType,
} from './toastStore'

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const CARD_CLASSES: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-[#D5CBB8] bg-white text-[#1E3A47]',
}

const ICON_CLASSES: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-[#C9A96E]',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => subscribeToasts(setToasts), [])

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((item) => {
          const Icon = ICONS[item.type]
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 shadow-lg shadow-black/5 ${CARD_CLASSES[item.type]}`}
            >
              <Icon
                className={`mt-0.5 size-4 shrink-0 ${ICON_CLASSES[item.type]}`}
              />
              <p className="flex-1 text-sm font-medium leading-snug">
                {item.message}
              </p>
              <button
                type="button"
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-0.5 opacity-60 transition hover:opacity-100"
                onClick={() => dismissToast(item.id)}
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
