import { getContext } from '@microsoft/power-apps/app'
import { OneDriveforBusinessService } from '../../../generated'

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

async function resolveScreenshotFolderPath(): Promise<string> {
  const context = await getContext()
  const envSegment =
    ENVIRONMENT_FOLDER_SEGMENTS[context.app.environmentId] ?? 'DEV'

  return SCREENSHOT_ROOT_TEMPLATE.replace('{env}', envSegment)
}

const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|gif|bmp|webp)$/i

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Recursively searches the current environment's ScreenshotFolder tree for
 * screenshots whose filename contains the given ticket ID (e.g.
 * "Seller1_CL-138664361.png" for "CL-138664361"). Uses the path-based
 * "Find files" operation so no OneDrive item ID needs to be resolved first.
 */
export async function findTicketScreenshots(
  ticketId: string
): Promise<TicketScreenshot[]> {
  const trimmedTicketId = ticketId.trim()
  if (!trimmedTicketId) {
    return []
  }

  const folderPath = await resolveScreenshotFolderPath()

  // 'Pattern' find mode is a regex match, not a glob — build a
  // "contains the ticket ID" regex rather than a shell-style wildcard.
  const result = await OneDriveforBusinessService.FindFilesByPath(
    `.*${escapeRegExp(trimmedTicketId)}.*`,
    folderPath,
    'Pattern',
    100
  )

  if (!result.success) {
    throw new Error(
      result.error?.message ||
        'Failed to search the screenshot folder.'
    )
  }

  const items = result.data ?? []

  return items
    .filter(
      (item) =>
        !item.IsFolder &&
        IMAGE_EXTENSION_PATTERN.test(item.Name ?? '')
    )
    .map((item) => ({
      id: item.Id ?? item.Path ?? item.Name ?? '',
      name: item.Name ?? 'Screenshot',
      path: item.Path ?? '',
    }))
}

/**
 * Turns a raw screenshot filename into a friendly label for display —
 * drops the extension and the trailing "_<ticketId>", and splits
 * camelCase words apart (e.g. "BuyerLedger_CL-126974351.png" with ticket
 * "CL-126974351" -> "Buyer Ledger").
 */
export function formatScreenshotDisplayName(
  fileName: string,
  ticketId: string
): string {
  const withoutExtension = fileName.replace(/\.[^./]+$/, '')
  const trimmedTicketId = ticketId.trim()

  const withoutTicketId = trimmedTicketId
    ? withoutExtension.replace(
        new RegExp(`_${escapeRegExp(trimmedTicketId)}$`, 'i'),
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
