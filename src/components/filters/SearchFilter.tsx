import { SearchIcon } from '../icons/DashboardIcons'

interface SearchFilterProps {
  id: string
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export function SearchFilter({
  id,
  label,
  placeholder,
  value,
  onChange,
}: SearchFilterProps) {
  return (
    <label className="filter-search" htmlFor={id}>
      <span className="sr-only">{label}</span>
      <SearchIcon className="filter-search-icon" />
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    </label>
  )
}
