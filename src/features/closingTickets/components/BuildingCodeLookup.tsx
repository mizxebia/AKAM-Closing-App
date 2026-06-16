import { useEffect, useMemo, useState } from 'react'
import { Search, X, Building2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../components/ui/sheet'
import {
  getBuildings,
  type BuildingRow,
} from '../data/buildingListCache'

interface BuildingCodeLookupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (yardiId: string) => void
}

export function BuildingCodeLookup({
  open,
  onOpenChange,
  onSelect,
}: BuildingCodeLookupProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [buildings, setBuildings] = useState<BuildingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce the search input so we don't filter/re-render on every keystroke.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 150)
    return () => window.clearTimeout(handle)
  }, [search])

  useEffect(() => {
    if (!open) return

    let isActive = true
    setLoading(true)
    setError(null)

    console.log('[BuildingCodeLookup] Requesting cached building list...')

    // Use the shared cache. If it resolves empty (cache never populated),
    // force a refetch once before giving up.
    getBuildings()
      .then(async (cached) => {
        if (cached.length > 0) return cached
        console.warn(
          '[BuildingCodeLookup] Cache empty, forcing refetch...'
        )
        return getBuildings({ forceRefresh: true })
      })
      .then((result) => {
        if (!isActive) return
        console.log('[BuildingCodeLookup] Buildings ready:', {
          count: result.length,
        })
        setBuildings(result)
      })
      .catch((err) => {
        if (!isActive) return

        console.error('[BuildingCodeLookup] Fetch error:', err)

        let errorMessage = 'Unable to load the building list.'

        if (err instanceof Error) {
          errorMessage = err.message
        } else if (typeof err === 'string') {
          errorMessage = err
        }

        // Add helpful hints for common issues
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          errorMessage += ' The Building List data source may not be configured in Power Apps.'
        } else if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
          errorMessage += ' Please check SharePoint connection permissions.'
        } else if (errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
          errorMessage += ' Please check your network connection and SharePoint connector status.'
        }

        setError(errorMessage)
      })
      .finally(() => {
        if (isActive) {
          console.log('[BuildingCodeLookup] Fetch completed')
          setLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [open])

  const filteredBuildings = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase()
    if (!term) return buildings

    return buildings.filter((building) =>
      building.searchText.includes(term)
    )
  }, [buildings, debouncedSearch])

  // Cap how many cards we render at once. Showing thousands of complex
  // nodes is the main cause of lag; users narrow down with search anyway.
  const MAX_VISIBLE_RESULTS = 100
  const visibleBuildings = useMemo(
    () => filteredBuildings.slice(0, MAX_VISIBLE_RESULTS),
    [filteredBuildings]
  )
  const hiddenCount =
    filteredBuildings.length - visibleBuildings.length

  const handleSelect = (yardiId: string) => {
    if (!yardiId) return
    onSelect(yardiId)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="building-lookup-sheet">
        <SheetHeader className="building-lookup-header">
          <div>
            <SheetDescription className="text-xs font-semibold uppercase tracking-wide text-[#4B5563]">
              Find NYC Code
            </SheetDescription>
            <SheetTitle
              className="mt-1 text-xl font-semibold text-[#1E3A47]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic' }}
            >
              Building Lookup
            </SheetTitle>
          </div>
          <button
            type="button"
            className="building-lookup-close-btn"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </SheetHeader>

        <div className="building-lookup-body">
          <p className="building-lookup-hint">
            Search by building address to find its NYC Code (Yardi ID).
          </p>

          <div className="building-lookup-search">
            <Search size={16} className="building-lookup-search-icon" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Enter building address..."
              autoFocus
            />
          </div>

          {loading && (
            <div className="building-lookup-state">
              Loading buildings...
            </div>
          )}

          {error && (
            <div className="building-lookup-state building-lookup-state-error">
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                ⚠️ Error Loading Buildings
              </div>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                {error}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '12px', color: '#6B7280' }}>
                <strong>Troubleshooting tips:</strong>
                <ul style={{ textAlign: 'left', marginTop: '8px', paddingLeft: '20px' }}>
                  <li>Ensure the "Building List" SharePoint connector is configured in Power Apps</li>
                  <li>Check that you have read permissions for the SharePoint list</li>
                  <li>Verify the SharePoint connection is active</li>
                  <li>Check the browser console (F12) for detailed error messages</li>
                </ul>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="building-lookup-results">
              {filteredBuildings.length === 0 ? (
                <div className="building-lookup-state">
                  {search.trim()
                    ? 'No buildings match your search.'
                    : 'No buildings available.'}
                </div>
              ) : (
                <>
                  {visibleBuildings.map((building) => (
                  <button
                    key={building.id}
                    type="button"
                    className="building-lookup-card"
                    onClick={() => handleSelect(building.yardiId)}
                    disabled={!building.yardiId}
                  >
                    <div className="building-lookup-card-icon">
                      <Building2 size={18} />
                    </div>
                    <div className="building-lookup-card-main">
                      <span className="building-lookup-card-address">
                        {building.address || building.buildingName || 'Unnamed building'}
                      </span>
                      {building.buildingName &&
                        building.buildingName !== building.address && (
                          <span className="building-lookup-card-sub">
                            {building.buildingName}
                          </span>
                        )}
                    </div>
                    <div className="building-lookup-card-code">
                      <span className="building-lookup-card-code-label">
                        NYC Code
                      </span>
                      <strong>{building.yardiId || '—'}</strong>
                    </div>
                  </button>
                  ))}
                  {hiddenCount > 0 && (
                    <div className="building-lookup-state">
                      Showing first {visibleBuildings.length} of{' '}
                      {filteredBuildings.length} matches. Keep typing
                      to narrow your search.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
