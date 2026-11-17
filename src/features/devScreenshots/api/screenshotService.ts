import { getContext } from '@microsoft/power-apps/app'
import { OneDriveforBusinessService } from '../../../generated'
import type { BlobMetadata } from '../../../generated/models/OneDriveforBusinessModel'
import {
  readStoredImage,
  writeStoredImage,
} from './screenshotImageCache'

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
  lastModified?: string
}

/**
 * Exposed so the UI can show admins exactly which OneDrive folder was
 * read — if the bot's screenshots are visible in OneDrive but never
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

// The folder index is reused for every ticket. Within INDEX_FRESH_MS it is
// served without any network call; older (up to INDEX_MAX_AGE_MS) it is
// still shown instantly while a fresh listing runs in the background.
const INDEX_FRESH_MS = 2 * 60 * 1000
const INDEX_MAX_AGE_MS = 24 * 60 * 60 * 1000
const INDEX_STORAGE_KEY = 'akam-bot-screenshot-index-v1'

const MEMORY_IMAGE_CACHE_LIMIT = 60

interface ScreenshotIndex {
  rootPath: string
  fetchedAt: number
  files: TicketScreenshot[]
}

let memoryIndex: ScreenshotIndex | null = null
let inflightIndex: Promise<ScreenshotIndex> | null = null
const memoryImageCache = new Map<string, Promise<string>>()

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
      ? " This app's OneDrive for Business connection likely isn't authorized under the same account the bot saves screenshots to — check the connection owner in the Power Platform admin center."
      : status === 404
        ? " The folder may not exist under this connection's account, or this app's OneDrive connection points to a different account than the bot."
        : ''
  const details = error?.message || 'The request failed.'
  return new Error(
    `Unable to read screenshot folder "${folderPath}": ${details}${hint}`
  )
}

function readStoredIndex(): ScreenshotIndex | null {
  try {
    const raw = window.localStorage.getItem(INDEX_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ScreenshotIndex
    return Array.isArray(parsed.files) ? parsed : null
  } catch {
    return null
  }
}

function writeStoredIndex(index: ScreenshotIndex) {
  try {
    window.localStorage.setItem(INDEX_STORAGE_KEY, JSON.stringify(index))
  } catch {
    // Storage full or unavailable — the in-memory copy still works.
  }
}

function getUsableIndex(rootPath?: string): ScreenshotIndex | null {
  const candidate = memoryIndex ?? readStoredIndex()
  if (!candidate) return null
  if (rootPath && candidate.rootPath !== rootPath) return null
  if (Date.now() - candidate.fetchedAt > INDEX_MAX_AGE_MS) return null
  if (!memoryIndex) memoryIndex = candidate
  return candidate
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
 * Lists every image under ScreenshotFolder (the bot groups them into
 * per-process subfolders such as "Yardi-New-Owner"). Folders at the same
 * depth are listed in parallel.
 *
 * This lists the folders directly rather than using "Find files in folder":
 * that operation goes through the OneDrive search index, so freshly saved
 * screenshots stay invisible until indexing catches up (often hours).
 */
async function buildScreenshotIndex(
  rootPath: string
): Promise<ScreenshotIndex> {
  const rootResult =
    await OneDriveforBusinessService.GetFileMetadataByPath(rootPath)

  if (!rootResult.success || !rootResult.data?.Id) {
    throw buildFolderError(
      rootPath,
      rootResult.error,
      getErrorStatus(rootResult.error) ?? 404
    )
  }

  const files: TicketScreenshot[] = []
  let level = [{ id: rootResult.data.Id, path: rootPath }]

  for (let depth = 0; depth <= MAX_FOLDER_DEPTH && level.length > 0; depth += 1) {
    const listings = await Promise.all(
      level.map(async (folder) => ({
        folder,
        items: await listAllFolderItems(folder.id, folder.path),
      }))
    )

    const nextLevel: typeof level = []
    for (const { folder, items } of listings) {
      for (const item of items) {
        const name = item.Name ?? ''
        const itemPath = item.Path ?? `${folder.path}/${name}`

        if (item.IsFolder) {
          if (item.Id) nextLevel.push({ id: item.Id, path: itemPath })
        } else if (IMAGE_EXTENSION_PATTERN.test(name)) {
          files.push({
            id: item.Id ?? itemPath,
            name,
            path: itemPath,
            lastModified: item.LastModified,
          })
        }
      }
    }
    level = nextLevel
  }

  return { rootPath, fetchedAt: Date.now(), files }
}

async function loadScreenshotIndex(
  forceRefresh = false
): Promise<ScreenshotIndex> {
  const rootPath = await resolveScreenshotFolderPath()
  const cached = getUsableIndex(rootPath)

  if (
    !forceRefresh &&
    cached &&
    Date.now() - cached.fetchedAt < INDEX_FRESH_MS
  ) {
    return cached
  }

  if (!inflightIndex) {
    inflightIndex = buildScreenshotIndex(rootPath)
      .then((index) => {
        memoryIndex = index
        writeStoredIndex(index)
        return index
      })
      .finally(() => {
        inflightIndex = null
      })
  }

  return inflightIndex
}

function filterByTicket(
  index: ScreenshotIndex,
  ticketId: string
): TicketScreenshot[] {
  const ticketIdPattern = new RegExp(escapeRegExp(ticketId), 'i')
  return index.files.filter((file) => ticketIdPattern.test(file.name))
}

/** Warms the folder index (e.g. when Admin Mode is switched on). */
export function prefetchScreenshotIndex(): void {
  void loadScreenshotIndex().catch(() => {
    // Best-effort — the gallery surfaces real errors when it loads.
  })
}

/**
 * Returns screenshots from the last folder listing without any network
 * call, so the gallery can render instantly while it revalidates.
 */
export function getCachedTicketScreenshots(
  ticketId: string
): TicketScreenshot[] | null {
  const trimmedTicketId = ticketId.trim()
  const index = trimmedTicketId ? getUsableIndex() : null
  return index ? filterByTicket(index, trimmedTicketId) : null
}

/**
 * Finds every screenshot whose filename contains the ticket ID, e.g.
 * "Seller1_CL-138664361.png", across all of ScreenshotFolder.
 */
export async function findTicketScreenshots(
  ticketId: string,
  options: { forceRefresh?: boolean } = {}
): Promise<TicketScreenshot[]> {
  const trimmedTicketId = ticketId.trim()
  if (!trimmedTicketId) {
    return []
  }

  const index = await loadScreenshotIndex(options.forceRefresh)
  return filterByTicket(index, trimmedTicketId)
}

/** Clears every screenshot cache — used by tests. */
export function clearScreenshotCaches() {
  memoryIndex = null
  inflightIndex = null
  memoryImageCache.clear()
  try {
    window.localStorage.removeItem(INDEX_STORAGE_KEY)
  } catch {
    // Ignore.
  }
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

async function downloadScreenshotDataUrl(
  screenshot: TicketScreenshot,
  cacheKey: string
): Promise<string> {
  const stored = await readStoredImage(cacheKey)
  if (stored) return stored

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
  const dataUrl = content.startsWith('data:')
    ? content
    : `data:image/png;base64,${content}`

  void writeStoredImage(cacheKey, dataUrl)
  return dataUrl
}

/**
 * Fetches a screenshot's binary content as a data URL suitable for an
 * <img src>. Results are cached in memory and IndexedDB, keyed by path and
 * last-modified time so a re-saved screenshot is fetched again.
 */
export function getScreenshotDataUrl(
  screenshot: TicketScreenshot
): Promise<string> {
  const cacheKey = `${screenshot.path}|${screenshot.lastModified ?? ''}`
  const cached = memoryImageCache.get(cacheKey)

  if (cached) {
    // Re-insert to keep the most recently used entries at the end.
    memoryImageCache.delete(cacheKey)
    memoryImageCache.set(cacheKey, cached)
    return cached
  }

  const pending = downloadScreenshotDataUrl(screenshot, cacheKey).catch(
    (error: unknown) => {
      memoryImageCache.delete(cacheKey)
      throw error
    }
  )
  memoryImageCache.set(cacheKey, pending)

  while (memoryImageCache.size > MEMORY_IMAGE_CACHE_LIMIT) {
    const oldestKey = memoryImageCache.keys().next().value
    if (oldestKey === undefined) break
    memoryImageCache.delete(oldestKey)
  }

  return pending
}
