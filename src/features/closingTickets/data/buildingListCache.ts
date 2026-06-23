import { BuildingListService } from '../../../generated'
import type { BuildingListRead } from '../../../generated/models/BuildingListModel'

// SharePoint "Building List" field mapping:
//   Title    -> Address
//   field_0  -> Yardi ID (used as NYC Code)
//   field_37 -> Building_Name
//   field_3  -> Alternate_Address
export type BuildingRow = {
  id: number
  address: string
  yardiId: string
  buildingName: string
  altAddress: string
  legalName: string
  // Precomputed lowercase haystack for fast searching.
  searchText: string
}

export function toBuildingRow(
  record: BuildingListRead
): BuildingRow {
  const address = record.Title ?? ''
  const yardiId = record.field_0 ?? ''
  const buildingName = record.field_37 ?? ''
  const altAddress = record.field_3 ?? ''
  const legalName = record.field_6 ?? ''

  return {
    id: record.ID ?? 0,
    address,
    yardiId,
    buildingName,
    altAddress,
    legalName,
    searchText:
      `${address}\u0001${altAddress}\u0001${buildingName}\u0001${yardiId}\u0001${legalName}`.toLowerCase(),
  }
}

// Only building codes (Yardi ID / NYC Code) starting with "NY" are valid.
export function hasNycCode(yardiId: string): boolean {
  return yardiId.trim().toUpperCase().startsWith('NY')
}

// SharePoint returns results one page at a time. Without paging we only
// get the first page (default connector page size), so most buildings
// silently disappear. Loop through every page using the skipToken.
async function fetchAllBuildingRecords(): Promise<
  BuildingListRead[]
> {
  const pageSize = 5000
  const allRecords: BuildingListRead[] = []
  let skipToken: string | undefined

  // Guard against an unexpected infinite loop.
  for (let page = 0; page < 1000; page += 1) {
    const result = await BuildingListService.getAll({
      maxPageSize: pageSize,
      top: pageSize,
      ...(skipToken ? { skipToken } : {}),
    })

    if (!result.success) {
      const errorMsg =
        result.error?.message ??
        'Unable to load the building list. Please check SharePoint connector configuration.'
      console.error(
        '[buildingListCache] Service returned unsuccessful result:',
        result.error
      )
      throw new Error(errorMsg)
    }

    if (result.data?.length) {
      allRecords.push(...result.data)
    }

    if (!result.skipToken) {
      break
    }
    skipToken = result.skipToken
  }

  return allRecords
}

let cachedBuildings: BuildingRow[] | null = null
let inFlight: Promise<BuildingRow[]> | null = null

async function loadBuildings(): Promise<BuildingRow[]> {
  const records = await fetchAllBuildingRecords()

  const buildings = records
    .map(toBuildingRow)
    .filter(
      (b) =>
        hasNycCode(b.yardiId) &&
        (b.address || b.buildingName)
    )

  console.log('[buildingListCache] Loaded buildings:', {
    total: records.length,
    valid: buildings.length,
  })

  return buildings
}

/**
 * Returns the cached building list, fetching it once if needed.
 * Concurrent callers share a single in-flight request.
 */
export async function getBuildings(options?: {
  forceRefresh?: boolean
}): Promise<BuildingRow[]> {
  if (!options?.forceRefresh && cachedBuildings) {
    return cachedBuildings
  }

  if (!options?.forceRefresh && inFlight) {
    return inFlight
  }

  inFlight = loadBuildings()
    .then((buildings) => {
      cachedBuildings = buildings
      return buildings
    })
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

/** True when the full list has already been cached. */
export function hasCachedBuildings(): boolean {
  return cachedBuildings !== null
}

/** Clears the cache so the next getBuildings() refetches. */
export function clearBuildingsCache(): void {
  cachedBuildings = null
}

/**
 * Kicks off the fetch in the background (used at app start). Swallows
 * errors so startup is never blocked; the lookup UI will surface them.
 */
export function prefetchBuildings(): void {
  void getBuildings().catch((error) => {
    console.info(
      '[buildingListCache] Prefetch failed; will retry on demand.',
      error
    )
  })
}
