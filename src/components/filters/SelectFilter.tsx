type SelectFilterOption = {
  value: string
  label: string
}

interface SelectFilterProps {
  id: string
  label: string
  value: string
  options: SelectFilterOption[]
  emptyLabel?: string
  onChange: (value: string) => void
}

export function SelectFilter({
  id,
  label,
  value,
  options,
  emptyLabel = 'All',
  onChange,
}: SelectFilterProps) {
  return (
    <label className="filter-field" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
