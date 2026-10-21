import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ScreenshotGallery } from './ScreenshotGallery'

const { findTicketScreenshots, getScreenshotDataUrl } = vi.hoisted(
  () => ({
    findTicketScreenshots: vi.fn(),
    getScreenshotDataUrl: vi.fn(),
  })
)

vi.mock('../api/screenshotService', () => ({
  findTicketScreenshots,
  formatScreenshotDisplayName: (name: string) =>
    name.replace(/\.[^/.]+$/, ''),
  getScreenshotDataUrl,
}))

describe('ScreenshotGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows OneDrive image-load failures instead of leaving a spinner', async () => {
    findTicketScreenshots.mockResolvedValue([
      {
        id: 'screenshot-1',
        name: 'Seller1_CL-123456.png',
        path: '/New Sales RPA/PROD/ScreenshotFolder/Seller1_CL-123456.png',
      },
    ])
    getScreenshotDataUrl.mockRejectedValue(
      new Error('Access denied')
    )

    render(<ScreenshotGallery ticketId="CL-123456" />)

    expect(
      await screen.findByText('Unable to load')
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.getByText(
          'Unable to load Seller1_CL-123456.png: Access denied'
        )
      ).toBeInTheDocument()
    })
  })
})
