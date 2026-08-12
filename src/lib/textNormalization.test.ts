import { describe, expect, it } from 'vitest'
import { trimExtraSpaces, trimStringFields } from './textNormalization'

describe('trimExtraSpaces', () => {
  it('trims leading and trailing whitespace', () => {
    expect(trimExtraSpaces('  John Doe  ')).toBe('John Doe')
  })

  it('collapses runs of spaces/tabs to a single space', () => {
    expect(trimExtraSpaces('John    Doe')).toBe('John Doe')
    expect(trimExtraSpaces('John\t\tDoe')).toBe('John Doe')
  })

  it('preserves line breaks in multi-line values', () => {
    expect(trimExtraSpaces('Line one  \n  Line two')).toBe(
      'Line one\nLine two'
    )
  })

  it('returns an empty string for whitespace-only input', () => {
    expect(trimExtraSpaces('    ')).toBe('')
  })
})

describe('trimStringFields', () => {
  it('trims every string field on a shallow copy, leaving the original untouched', () => {
    const input = {
      name: '  Alex   Buyer  ',
      amount: 100,
      active: true,
      notes: undefined,
    }

    const result = trimStringFields(input)

    expect(result).toEqual({
      name: 'Alex Buyer',
      amount: 100,
      active: true,
      notes: undefined,
    })
    expect(input.name).toBe('  Alex   Buyer  ')
  })

  it('leaves non-string values unchanged', () => {
    const input = { count: 5, flag: false, nested: { a: 1 } }
    expect(trimStringFields(input)).toEqual(input)
  })
})
