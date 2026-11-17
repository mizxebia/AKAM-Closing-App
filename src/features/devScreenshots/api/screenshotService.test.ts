import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getContext,
  GetFileMetadataByPath,
  ListFolderV2,
  GetFileContentByPath,
} = vi.hoisted(() => ({
  getContext: vi.fn(),
  GetFileMetadataByPath: vi.fn(),
  ListFolderV2: vi.fn(),
  GetFileContentByPath: vi.fn(),
}))

vi.mock('@microsoft/power-apps/app', () => ({ getContext }))
vi.mock('../../../generated', () => ({
  OneDriveforBusinessService: {
    GetFileMetadataByPath,
    ListFolderV2,
    GetFileContentByPath,
  },
}))

import {
  clearScreenshotCaches,
  findTicketScreenshots,
  formatScreenshotDisplayName,
  getCachedTicketScreenshots,
  getScreenshotDataUrl,
} from './screenshotService'

const ROOT = '/New Sales RPA/PROD/ScreenshotFolder'

function mockFolderTree() {
  ListFolderV2.mockImplementation(
    async (id: string, skipToken?: string) => {
      if (id === 'root-id') {
        return {
          success: true,
          data: {
            value: [
              {
                Id: 'owner-folder',
                Name: 'Yardi-New-Owner',
                Path: `${ROOT}/Yardi-New-Owner`,
                IsFolder: true,
              },
            ],
          },
        }
      }
      if (!skipToken) {
        return {
          success: true,
          data: {
            value: [
              {
                Id: 'a',
                Name: 'Owner_CL-999.png',
                Path: `${ROOT}/Yardi-New-Owner/Owner_CL-999.png`,
              },
            ],
            nextLink: 'https://x/foldersV2/owner-folder?skipToken=page2',
          },
        }
      }
      return {
        success: true,
        data: {
          value: [
            {
              Id: 'b',
              Name: 'UnpaidCharges_CL-123456.png',
              Path: `${ROOT}/Yardi-New-Owner/UnpaidCharges_CL-123456.png`,
              LastModified: '2026-11-17T10:00:00Z',
            },
            { Id: 'c', Name: 'notes_CL-123456.txt' },
          ],
        },
      }
    }
  )
}

describe('findTicketScreenshots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearScreenshotCaches()
    getContext.mockResolvedValue({
      app: { environmentId: 'a23f5944-6534-e1f9-bb68-95cc3ce5dd00' },
    })
    GetFileMetadataByPath.mockResolvedValue({
      success: true,
      data: { Id: 'root-id', IsFolder: true },
    })
    mockFolderTree()
  })

  it('lists process subfolders directly and pages through them to find new screenshots', async () => {
    const result = await findTicketScreenshots('CL-123456')

    expect(GetFileMetadataByPath).toHaveBeenCalledWith(ROOT)
    expect(ListFolderV2).toHaveBeenCalledWith('owner-folder', 'page2', 100)
    expect(result).toEqual([
      {
        id: 'b',
        name: 'UnpaidCharges_CL-123456.png',
        path: `${ROOT}/Yardi-New-Owner/UnpaidCharges_CL-123456.png`,
        lastModified: '2026-11-17T10:00:00Z',
      },
    ])
  })

  it('reuses one folder listing across tickets until a refresh is forced', async () => {
    await findTicketScreenshots('CL-123456')
    const callsAfterFirstLoad = ListFolderV2.mock.calls.length

    expect(await findTicketScreenshots('CL-999')).toHaveLength(1)
    expect(getCachedTicketScreenshots('CL-123456')).toHaveLength(1)
    expect(ListFolderV2).toHaveBeenCalledTimes(callsAfterFirstLoad)

    await findTicketScreenshots('CL-123456', { forceRefresh: true })
    expect(ListFolderV2.mock.calls.length).toBeGreaterThan(
      callsAfterFirstLoad
    )
  })

  it('does not silently search the development folder for an unknown environment', async () => {
    getContext.mockResolvedValue({
      app: { environmentId: 'unknown-environment' },
    })

    await expect(findTicketScreenshots('CL-123456')).rejects.toThrow(
      'No screenshot folder is configured for Power Apps environment unknown-environment.'
    )
    expect(GetFileMetadataByPath).not.toHaveBeenCalled()
  })

  it('surfaces a missing or inaccessible screenshot folder', async () => {
    GetFileMetadataByPath.mockResolvedValue({
      success: false,
      error: { status: 404, message: 'Not found' },
    })

    await expect(findTicketScreenshots('CL-123456')).rejects.toThrow(
      `Unable to read screenshot folder "${ROOT}": Not found`
    )
  })
})

describe('getScreenshotDataUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearScreenshotCaches()
  })

  it('downloads each screenshot only once', async () => {
    GetFileContentByPath.mockResolvedValue({
      success: true,
      data: 'data:image/png;base64,AAAA',
    })
    const screenshot = {
      id: 'b',
      name: 'Seller1_CL-1.png',
      path: `${ROOT}/Yardi-Seller-Update/Seller1_CL-1.png`,
      lastModified: '2026-11-17T10:00:00Z',
    }

    await getScreenshotDataUrl(screenshot)
    await getScreenshotDataUrl(screenshot)

    expect(GetFileContentByPath).toHaveBeenCalledTimes(1)
  })
})

describe('formatScreenshotDisplayName', () => {
  it('drops the ticket ID even when a suffix follows it', () => {
    expect(
      formatScreenshotDisplayName('Seller1_CL-574841352_Before.png', 'CL-574841352')
    ).toBe('Seller1 Before')
    expect(
      formatScreenshotDisplayName('BuyerLedger_CL-574841352.png', 'CL-574841352')
    ).toBe('Buyer Ledger')
  })
})
