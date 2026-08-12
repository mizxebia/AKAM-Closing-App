import { Cr7de_appchangelogsService } from '../../../generated'

// Cache the resolved identity as a promise so concurrent calls share the
// same in-flight request rather than firing multiple getContext() round-trips.
let _modifiedByPromise: Promise<string> | null = null

async function resolveModifiedBy(): Promise<string> {
  // Attempt 1: direct named import from the sub-path (same as useCurrentUser hook)
  try {
    const { getContext } = await import('@microsoft/power-apps/app')
    const ctx = await getContext()
    const name =
      ctx.user?.fullName ??
      ctx.user?.userPrincipalName ??
      ctx.user?.objectId ??
      null
    if (name) {
      return name
    }
  } catch (e) {
    console.warn('[auditLog] getContext() from /app failed:', e)
  }

  // Attempt 2: top-level app object (original dynamic import approach)
  try {
    const pkg = '@microsoft/power-apps'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import(/* @vite-ignore */ pkg as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = await (mod.app ?? mod.default?.app)?.getContext?.()
    const name =
      ctx?.user?.fullName ??
      ctx?.user?.userPrincipalName ??
      ctx?.user?.objectId ??
      null
    if (name) {
      return name
    }
  } catch (e) {
    console.warn('[auditLog] app.getContext() dynamic import failed:', e)
  }

  // Attempt 3: Xrm global (available in model-driven / custom pages)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xrm = (window as any).Xrm
    const userSettings = xrm?.Utility?.getGlobalContext?.()?.userSettings
    const name = userSettings?.userName ?? userSettings?.userPrincipalName ?? null
    if (name) {
      return name
    }
  } catch (e) {
    console.warn('[auditLog] Xrm fallback failed:', e)
  }

  console.warn('[auditLog] all modifiedBy resolution attempts failed — using "unknown"')
  return 'unknown'
}

function getModifiedBy(): Promise<string> {
  if (!_modifiedByPromise) {
    _modifiedByPromise = resolveModifiedBy()
  }
  return _modifiedByPromise
}

export type ChangeOperation =
  | 'create'
  | 'update'
  | 'delete'
  | 'action'

export interface ChangeLogEntry {
  /** The closing ticket this change is associated with */
  ticketId: string
  /** Dataverse logical table name, e.g. 'cr7de_invoicedetailses' */
  tableName: string
  operation: ChangeOperation
  /**
   * For updates: the old values of only the fields that changed.
   * For deletes: the full record snapshot.
   * For creates: null (nothing existed before).
   */
  oldData: Record<string, unknown> | null
  /**
   * For creates: the payload sent to Dataverse.
   * For updates: the new values of only the fields that changed.
   * For deletes: null (nothing exists after).
   */
  newData: Record<string, unknown> | null
}

/**
 * Writes a change log entry to the cr7de_appchangelogs table.
 *
 * This is intentionally fire-and-forget: audit failures must never
 * surface as errors to the user or block the primary operation.
 */
export function writeChangeLog(entry: ChangeLogEntry): void {
  // Run async work detached — no await, no throw propagation
  void (async () => {
    try {
      const modifiedBy = await getModifiedBy()

      // ownerid and owneridtype are required by the generated TypeScript type
      // but must NOT be sent in the request payload — Dataverse rejects any
      // primitive value for ownerid because it expects a navigation object.
      // The runtime resolves ownership from the calling user's session context.
      // We cast to `any` here solely to drop those two fields from the payload.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        cr7de_ticketid: entry.ticketId,
        cr7de_tablename: entry.tableName,
        cr7de_olddata:
          entry.oldData !== null
            ? JSON.stringify(entry.oldData)
            : undefined,
        cr7de_newdata:
          entry.newData !== null
            ? JSON.stringify(entry.newData)
            : undefined,
        cr7de_modifiedby: modifiedBy,
        // statecode: 0 = Active (numeric literal key of the generated enum)
        statecode: 0,
      }

      const result = await Cr7de_appchangelogsService.create(payload)

      if (!result.success) {
        console.warn(
          '[auditLog] writeChangeLog failed:',
          result.error?.message,
          result.error
        )
      }
    } catch (err) {
      // Audit log failure is silent — never breaks the primary flow
      console.warn('[auditLog] writeChangeLog threw:', err)
    }
  })()
}

/**
 * Records a significant lifecycle event that isn't a plain Dataverse
 * create/update/delete — e.g. "Generate Invoice was triggered" or
 * "Closing was validated" — so it shows up distinctly in the App Logs
 * viewer instead of blending into routine field edits.
 *
 * `details` is stored as-is under `newData` (with an `action` label
 * merged in) so any relevant data — flow status, a snapshot of the
 * record being validated, etc. — is captured alongside the event.
 */
export function writeActionLog(entry: {
  ticketId: string
  tableName: string
  action: string
  details?: Record<string, unknown>
}): void {
  writeChangeLog({
    ticketId: entry.ticketId,
    tableName: entry.tableName,
    operation: 'create',
    oldData: null,
    newData: { action: entry.action, ...entry.details },
  })
}

export interface ChangeLogRecord {
  id: string
  ticketId: string
  tableName: string
  operation: ChangeOperation
  modifiedBy: string
  createdOn: string
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
}

export interface ChangeLogFilters {
  ticketId?: string
  tableName?: string
  operation?: ChangeOperation
  limit?: number
}

function escapeODataString(value: string) {
  return value.replace(/'/g, "''")
}

function parseJsonField(
  value: string | undefined
): Record<string, unknown> | null {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    // Fall back to a readable wrapper rather than dropping the data —
    // logs should still be inspectable even if a field didn't round-trip.
    return { raw: value }
  }
}

function inferOperation(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null
): ChangeOperation {
  // writeActionLog tags lifecycle events (Generate Invoice, Validate,
  // etc.) with an "action" label inside newData — there's no dedicated
  // Dataverse column for operation, so this is the only signal available
  // to tell those apart from a plain record create.
  if (newData && typeof newData.action === 'string') {
    return 'action'
  }
  if (!oldData) {
    return 'create'
  }
  if (!newData) {
    return 'delete'
  }
  return 'update'
}

/**
 * Reads change log entries, most recent first. Pass `ticketId` to scope
 * the log viewer to a single closing (e.g. when opened from the Closing
 * Details page); omit it to browse everything (e.g. from the dashboard).
 */
export async function getChangeLogs(
  filters: ChangeLogFilters = {}
): Promise<ChangeLogRecord[]> {
  const filterClauses: string[] = []

  if (filters.ticketId?.trim()) {
    filterClauses.push(
      `cr7de_ticketid eq '${escapeODataString(filters.ticketId.trim())}'`
    )
  }
  if (filters.tableName?.trim()) {
    filterClauses.push(
      `cr7de_tablename eq '${escapeODataString(filters.tableName.trim())}'`
    )
  }

  const response = await Cr7de_appchangelogsService.getAll({
    filter: filterClauses.length
      ? filterClauses.join(' and ')
      : undefined,
    orderBy: ['createdon desc'],
    top: filters.limit ?? 200,
  })

  if (!response.success) {
    throw new Error(
      response.error?.message || 'Failed to load change logs.'
    )
  }

  const records = (response.data ?? []).map(
    (record): ChangeLogRecord => {
      const oldData = parseJsonField(record.cr7de_olddata)
      const newData = parseJsonField(record.cr7de_newdata)

      return {
        id: record.cr7de_appchangelogid,
        ticketId: record.cr7de_ticketid ?? '',
        tableName: record.cr7de_tablename ?? '',
        operation: inferOperation(oldData, newData),
        modifiedBy: record.cr7de_modifiedby ?? 'unknown',
        createdOn: record.createdon ?? '',
        oldData,
        newData,
      }
    }
  )

  return filters.operation
    ? records.filter((r) => r.operation === filters.operation)
    : records
}

/**
 * Extracts only the old values for the keys present in `changedFields`
 * from a full record snapshot. This keeps old/new symmetric and readable
 * as a proper diff without storing redundant unchanged fields.
 */
export function extractOldValues<T extends object>(
  oldRecord: T,
  changedFields: Partial<T>
): Record<string, unknown> {
  const record = oldRecord as Record<string, unknown>
  return Object.fromEntries(
    Object.keys(changedFields).map((key) => [key, record[key]])
  )
}
