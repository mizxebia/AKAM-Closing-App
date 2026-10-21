import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getContext, FindFilesByPath } = vi.hoisted(() => ({
  getContext: vi.fn(),
  FindFilesByPath: vi.fn(),
}))

vi.mock('@microsoft/power-apps/app', () => ({ getContext }))
vi.mock('../../../generated', () => ({
  OneDriveforBusinessService: { FindFilesByPath },
}))

import { findTicketScreenshots } from './screenshotService'

describe('findTicketScreenshots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getContext.mockResolvedValue({
      app: { environmentId: 'a23f5944-6534-e1f9-bb68-95cc3ce5dd00' },
    })
    FindFilesByPath.mockResolvedValue({ success: true, data: [] })
  })

  it('searches the production screenshot folder for matching files', async () => {
    await findTicketScreenshots('CL-123456')

    expect(FindFilesByPath).toHaveBeenCalledWith(
      '.*CL-123456.*',
      '/New Sales RPA/PROD/ScreenshotFolder',
      'Pattern',
      100
    )
  })

  it('does not silently search the development folder for an unknown environment', async () => {
    getContext.mockResolvedValue({
      app: { environmentId: 'unknown-environment' },
    })

    await expect(findTicketScreenshots('CL-123456')).rejects.toThrow(
      'No screenshot folder is configured for Power Apps environment unknown-environment.'
    )
    expect(FindFilesByPath).not.toHaveBeenCalled()
  })

  it('surfaces a missing or inaccessible screenshot folder', async () => {
    FindFilesByPath.mockResolvedValue({
      success: false,
      error: { status: 404, message: 'Not found' },
    })

    await expect(findTicketScreenshots('CL-123456')).rejects.toThrow(
      'Unable to search screenshot folder "/New Sales RPA/PROD/ScreenshotFolder": Not found'
    )
  })
})
