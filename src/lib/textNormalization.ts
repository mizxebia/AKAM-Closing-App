/**
 * Trims leading/trailing whitespace and collapses runs of repeated spaces
 * or tabs down to a single space (e.g. "  John   Doe  " -> "John Doe").
 * Line breaks are preserved so multi-line textarea values (Notes fields)
 * keep their intended formatting — only horizontal whitespace is collapsed.
 */
export function trimExtraSpaces(value: string): string {
  return value
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim()
}

/**
 * Returns a shallow copy of `payload` with every string-valued field passed
 * through `trimExtraSpaces`. Non-string values (numbers, enums, booleans,
 * null/undefined, nested objects/arrays) are returned unchanged.
 *
 * Intended to run on every payload right before it is sent to a generated
 * Dataverse service's `create`/`update` call, so stray spacing typed into
 * any input box never reaches the database.
 */
export function trimStringFields<T extends object>(payload: T): T {
  const result = { ...payload }

  for (const key of Object.keys(result) as (keyof T)[]) {
    const value = result[key]
    if (typeof value === 'string') {
      result[key] = trimExtraSpaces(value) as T[keyof T]
    }
  }

  return result
}
