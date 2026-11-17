import { getContext } from '@microsoft/power-apps/app'
import { OneDriveforBusinessService } from '../../../generated'
import type { BlobMetadata } from '../../../generated/models/OneDriveforBusinessModel'

// Must stay in sync with power.config.json's environmentId /
// UATenvironmentId / ProductionenvironmentId — used to pick which
// DEV/UAT/PROD screenshot folder segment matches the environment the app
// is currently running in.
const ENVIRONMENT_FOLDER_SEGMENTS: Record<string, string> = {
  'e1cba263-6407-ef71-82d5-197403fb0d06': 'DEV',
  'e0789024-6789-e98a-8dac-0e49d6c13b0b': 'UAT',
  'a23f5944-6534-e1f9-bb68-95cc3ce5dd00': 'PROD',
}

const SCREENSHOT_ROOT_TEMPLATE = '/New Sales RPA/{env}/ScreenshotFolder'

export interface TicketScreenshot {
  id: string
  name: string
  path: string
}

/**
 * Exposed so the UI can show admins exactly which OneDrive folder was
 * read ? if the bot's screenshots are visible in OneDrive but never
 * show up here, the most common cause is that this app's OneDrive for
 * Business connection is authorized under a different account than the
 * one the desktop bot saves screenshots to (that connector always reads
 * the connected account's own drive, with no cross-account access).
 */
export async function resolveScreenshotFolderPath(): Promise<string> {
  const context = await getContext()
  const envSegment =
    ENVIRONMENT_FOLDER_SEGMENTS[context.app.environmentId]

  if (!envSegment) {
    throw new Error(
      `No screenshot folder is configured for Power Apps environment ${context.app.environmentId}.`
    )
  }

  return SCREENSHOT_ROOT_TEMPLATE.replace('{env}', envSegment)
}

const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|gif|bmp|webp)$/i
const LIST_PAGE_SIZE = 100
const MAX_LIST_PAGES_PER_FOLDER = 50
const MAX_FOLDER_DEPTH = 3

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getErrorStatus(error: unknown): number | undefined {
  return error && typeof error === 'object' && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : undefined
}

function getSkipToken(nextLink?: string): string | undefined {
  if (!nextLink) return undefined
  const match = /[?&]\$?skiptoken=([^&]+)/i.exec(nextLink)
  return match ? decodeURIComponent(match[1]) : undefined
}

function buildFolderError(
  folderPath: string,
  error: { message?: string } | undefined,
  status: number | undefined
) {
  const hint =
    status === 403
      ? " This app's OneDrive for Business connection likely isn't authorized under the same account the bot saves screenshots to ? check the connection owner in the Power Platform admin center."
      : status === 404
        ? " The folder may not exist under this connection's account, or this app's OneDrive connection points to a different account than the bot."
        : ''
  const details = error?.message || 'The request failed.'
  return new Error(
    `Unable to read screenshot folder "${folderPath}": ${details}${hint}`
  )
}

async function listAllFolderItems(
  folderId: string,
  folderPath: string
): Promise<BlobMetadata[]> {
  const items: BlobMetadata[] = []
  let skipToken: string | undefined

  for (let page = 0; page < MAX_LIST_PAGES_PER_FOLDER; page += 1) {
    const result = await OneDriveforBusinessService.ListFolderV2(
      folderId,
      skipToken,
      LIST_PAGE_SIZE
    )

    if (!result.success) {
      throw buildFolderError(
        folderPath,
        result.error,
        getErrorStatus(result.error)
      )
    }

    items.push(...(result.data?.value ?? []))
    skipToken = getSkipToken(result.data?.nextLink)
    if (!skipToken) break
  }

  return items
}

/**
 * Finds every screenshot under the environment's ScreenshotFolder (the bot
 * groups them into per-process subfolders such as "Yardi-New-Owner") whose
 * filename contains the ticket ID, e.g. "Seller1_CL-138664361.png".
 *
 * This lists the folders directly rather than using "Find files in folder":
 * that operation goes through the OneDrive search index, so freshly saved
 * screenshots stay invisible until indexing catches up (often hours).
 */
export async function findTicketScreenshots(
  ticketId: string
): Promise<TicketScreenshot[]> {
  const trimmedTicketId = ticketId.trim()
  if (!trimmedTicketId) {
    return []
  }

  const rootPath = await resolveScreenshotFolderPath()
  const rootResult =
    await OneDriveforBusinessService.GetFileMetadataByPath(rootPath)

  if (!rootResult.success || !rootResult.data?.Id) {
    throw buildFolderError(
      rootPath,
      rootResult.error,
      getErrorStatus(rootResult.error) ?? 404
    )
  }

  const ticketIdPattern = new RegExp(escapeRegExp(trimmedTicketId), 'i')
  const matches: TicketScreenshot[] = []
  const pending = [
    { id: rootResult.data.Id, path: rootPath, depth: 0 },
  ]

  while (pending.length > 0) {
    const folder = pending.shift()!
    const items = await listAllFolderItems(folder.id, folder.path)

    for (const item of items) {
      const name = item.Name ?? ''
      const itemPath = item.Path ?? `${folder.path}/${name}`

      if (item.IsFolder) {
        if (item.Id && folder.depth < MAX_FOLDER_DEPTH) {
          pending.push({
            id: item.Id,
            path: itemPath,
            depth: folder.depth + 1,
          })
        }
        continue
      }

      if (
        IMAGE_EXTENSION_PATTERN.test(name) &&
        ticketIdPattern.test(name)
      ) {
        matches.push({
          id: item.Id ?? itemPath,
          name: name || 'Screenshot',
          path: itemPath,
        })
      }
    }
  }

  return matches
}

/**
 * Turns a raw screenshot filename into a friendly label for display —
 * drops the extension and the "_<ticketId>" segment wherever it appears,
 * and splits camelCase words apart (e.g. "BuyerLedger_CL-126974351.png"
 * -> "Buyer Ledger", "Seller1_CL-126974351_Before.png" -> "Seller1 Before").
 */
export function formatScreenshotDisplayName(
  fileName: string,
  ticketId: string
): string {
  const withoutExtension = fileName.replace(/\.[^./]+$/, '')
  const trimmedTicketId = ticketId.trim()

  const withoutTicketId = trimmedTicketId
    ? withoutExtension.replace(
        new RegExp(`_${escapeRegExp(trimmedTicketId)}(?=_|$)`, 'gi'),
        ''
      )
    : withoutExtension

  return withoutTicketId
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
}

/**
 * Fetches a screenshot's binary content and returns it as a data URL
 * suitable for an <img src>.
 */
export async function getScreenshotDataUrl(
  screenshot: TicketScreenshot
): Promise<string> {
  const result =
    await OneDriveforBusinessService.GetFileContentByPath(
      screenshot.path,
      true
    )

  if (!result.success || !result.data) {
    throw new Error(
      result.error?.message ||
        `Failed to load ${screenshot.name}.`
    )
  }

  // GetFileContentByPath (inferContentType: true) returns a data URL
  // already when the host infers an image content type; fall back to a
  // generic base64 PNG wrapper if only raw base64 comes back.
  const content = result.data
  return content.startsWith('data:')
    ? content
    : `data:image/png;base64,${content}`
}
