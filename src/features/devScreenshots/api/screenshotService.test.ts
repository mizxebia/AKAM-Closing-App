import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getContext, GetFileMetadataByPath, ListFolderV2 } = vi.hoisted(
  () => ({
    getContext: vi.fn(),
    GetFileMetadataByPath: vi.fn(),
    ListFolderV2: vi.fn(),
  })
)

vi.mock('@microsoft/power-apps/app', () => ({ getContext }))
vi.mock('../../../generated', () => ({
  OneDriveforBusinessService: { GetFileMetadataByPath, ListFolderV2 },
}))

import {
  findTicketScreenshots,
  formatScreenshotDisplayName,
} from './screenshotService'

const ROOT = '/New Sales RPA/PROD/ScreenshotFolder'

describe('findTicketScreenshots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getContext.mockResolvedValue({
      app: { environmentId: 'a23f5944-6534-e1f9-bb68-95cc3ce5dd00' },
    })
    GetFileMetadataByPath.mockResolvedValue({
      success: true,
      data: { Id: 'root-id', IsFolder: true },
    })
  })

  it('lists process subfolders directly and pages through them to find new screenshots', async () => {
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
              },
              { Id: 'c', Name: 'notes_CL-123456.txt' },
            ],
          },
        }
      }
    )

    const result = await findTicketScreenshots('CL-123456')

    expect(GetFileMetadataByPath).toHaveBeenCalledWith(ROOT)
    expect(ListFolderV2).toHaveBeenCalledWith('owner-folder', 'page2', 100)
    expect(result).toEqual([
      {
        id: 'b',
        name: 'UnpaidCharges_CL-123456.png',
        path: `${ROOT}/Yardi-New-Owner/UnpaidCharges_CL-123456.png`,
      },
    ])
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
