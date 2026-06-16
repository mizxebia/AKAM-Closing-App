import { useEffect, useMemo, useState } from 'react'
import { Search, X, Building2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../components/ui/sheet'
import { BuildingListService } from '../../../generated'
import type { BuildingListRead } from '../../../generated/models/BuildingListModel'

interface BuildingCodeLookupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (yardiId: string) => void
}

// SharePoint "Building List" field mapping:
//   Title    -> Address
//   field_0  -> Yardi ID (used as NYC Code)
//   field_37 -> Building_Name
//   field_3  -> Alternate_Address
type BuildingRow = {
  id: number
  address: string
  yardiId: string
  buildingName: string
  altAddress: string
}

function toBuildingRow(record: BuildingListRead): BuildingRow {
  return {
    id: record.ID ?? 0,
    address: record.Title ?? '',
    yardiId: record.field_0 ?? '',
    buildingName: record.field_37 ?? '',
    altAddress: record.field_3 ?? '',
  }
}

export function BuildingCodeLookup({
  open,
  onOpenChange,
  onSelect,
}: BuildingCodeLookupProps) {
  const [search, setSearch] = useState('')
  const [buildings, setBuildings] = useState<BuildingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    let isActive = true
    setLoading(true)
    setError(null)

    console.log('[BuildingCodeLookup] Starting fetch from BuildingListService...')

    BuildingListService.getAll()
      .then((result) => {
        if (!isActive) return
        
        console.log('[BuildingCodeLookup] Service response:', {
          success: result.success,
          hasData: !!result.data,
          dataCount: result.data?.length,
          hasError: !!result.error
        })
        
        // Enhanced error handling with detailed messages
        if (!result.success) {
          const errorMsg = result.error?.message ?? 'Unable to load the building list. Please check SharePoint connector configuration.'
          console.error('[BuildingCodeLookup] Service returned unsuccessful result:', result.error)
          throw new Error(errorMsg)
        }
        
        if (!result.data) {
          console.error('[BuildingCodeLookup] No data in successful result')
          throw new Error('No data received from building list.')
        }

        // Convert and filter out invalid entries
        const validBuildings = result.data
          .map(toBuildingRow)
          .filter(b => b.address || b.yardiId || b.buildingName)
        
        console.log('[BuildingCodeLookup] Processed buildings:', {
          total: result.data.length,
          valid: validBuildings.length,
          sample: validBuildings.slice(0, 3).map(b => ({ address: b.address, yardiId: b.yardiId }))
        })
        
        setBuildings(validBuildings)
      })
      .catch((err) => {
        if (!isActive) return
        
        // Enhanced error reporting
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
    const term = search.trim().toLowerCase()
    if (!term) return buildings

    return buildings.filter((building) => {
      return (
        building.address.toLowerCase().includes(term) ||
        building.altAddress.toLowerCase().includes(term) ||
        building.buildingName.toLowerCase().includes(term) ||
        building.yardiId.toLowerCase().includes(term)
      )
    })
  }, [buildings, search])

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
                filteredBuildings.map((building) => (
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
                ))
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
