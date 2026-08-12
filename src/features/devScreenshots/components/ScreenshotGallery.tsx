import { useEffect, useState } from 'react'
import { ImageOff, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '../../../components/ui/dialog'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import {
  findTicketScreenshots,
  formatScreenshotDisplayName,
  getScreenshotDataUrl,
  type TicketScreenshot,
} from '../api/screenshotService'

interface ScreenshotWithDataUrl extends TicketScreenshot {
  dataUrl: string | null
}

interface ScreenshotGalleryProps {
  ticketId: string
}

export function ScreenshotGallery({
  ticketId,
}: ScreenshotGalleryProps) {
  const [screenshots, setScreenshots] = useState<
    ScreenshotWithDataUrl[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(
    null
  )

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const found = await findTicketScreenshots(ticketId)

        if (!isMounted) return
        setScreenshots(
          found.map((item) => ({ ...item, dataUrl: null }))
        )

        for (const item of found) {
          try {
            const dataUrl = await getScreenshotDataUrl(item)
            if (!isMounted) return
            setScreenshots((current) =>
              current.map((existing) =>
                existing.id === item.id
                  ? { ...existing, dataUrl }
                  : existing
              )
            )
          } catch {
            // Skip screenshots that fail to load individually — the rest
            // of the gallery should still render.
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load screenshots.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [ticketId])

  return (
    <section className="form-section">
      <h3 className="flex items-center gap-2">
        Bot Screenshots
        {loading && (
          <RefreshCw className="size-3.5 animate-spin text-[#94a3b8]" />
        )}
      </h3>

      {error && <StatusBanner type="error" message={error} />}

      {!loading && !error && screenshots.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#e2e8f0] px-4 py-6 text-sm text-[#64748b]">
          <ImageOff className="size-4" />
          No bot screenshots found for this ticket.
        </div>
      )}

      {screenshots.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {screenshots.map((screenshot, index) => (
            <button
              key={screenshot.id || screenshot.name}
              type="button"
              className="group flex flex-col overflow-hidden rounded-lg border border-[#e2e8f0] bg-white text-left shadow-sm transition hover:border-[#C9A96E]"
              onClick={() => setOpenIndex(index)}
              disabled={!screenshot.dataUrl}
            >
              <div className="flex h-32 items-center justify-center bg-[#f8fafc]">
                {screenshot.dataUrl ? (
                  <img
                    src={screenshot.dataUrl}
                    alt={formatScreenshotDisplayName(
                      screenshot.name,
                      ticketId
                    )}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <RefreshCw className="size-4 animate-spin text-[#94a3b8]" />
                )}
              </div>
              <span className="truncate px-2 py-1.5 text-xs text-[#475569]">
                {formatScreenshotDisplayName(
                  screenshot.name,
                  ticketId
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={openIndex !== null}
        onOpenChange={(open) => !open && setOpenIndex(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogTitle>
            {openIndex !== null && screenshots[openIndex]
              ? formatScreenshotDisplayName(
                  screenshots[openIndex].name,
                  ticketId
                )
              : ''}
          </DialogTitle>
          {openIndex !== null &&
            screenshots[openIndex]?.dataUrl && (
              <img
                src={screenshots[openIndex].dataUrl ?? undefined}
                alt={formatScreenshotDisplayName(
                  screenshots[openIndex].name,
                  ticketId
                )}
                className="max-h-[75vh] w-full object-contain"
              />
            )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
