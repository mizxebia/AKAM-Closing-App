import { describe, expect, it } from 'vitest'
import {
  GENERATED_CLOSING_DOCUMENTS,
  NEW_OWNER_DOCUMENTS,
  getDefaultDocument,
  getDocumentDefinition,
  getDocumentFileName,
  hasDocument,
} from './dataverseFileUtils'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'

function ticketWith(
  overrides: Partial<ClosingTicketRecord>
): ClosingTicketRecord {
  return {
    cr7de_closingticketdetailsid: 'closing-doc-test',
    ...overrides,
  } as unknown as ClosingTicketRecord
}

describe('hasDocument', () => {
  const purchaseAppForm = getDocumentDefinition(
    'purchaseApplicationForm'
  )!

  it('is true when the file column has content', () => {
    expect(
      hasDocument(
        ticketWith({ cr109_purchaseapplicationform: 'base64...' }),
        purchaseAppForm
      )
    ).toBe(true)
  })

  it('is true when only the file-name column is set', () => {
    expect(
      hasDocument(
        ticketWith({
          cr109_purchaseapplicationform_name: 'form.pdf',
        }),
        purchaseAppForm
      )
    ).toBe(true)
  })

  it('is false when neither column is set on an existing ticket', () => {
    expect(hasDocument(ticketWith({}), purchaseAppForm)).toBe(false)
  })
})

describe('getDefaultDocument', () => {
  it('returns the first uploaded document in priority order', () => {
    const ticket = ticketWith({
      cr109_rpttdocument_name: 'rptt.pdf',
      cr109_newownerticketpdf_name: 'ticket.pdf',
    })
    // NEW_OWNER_DOCUMENTS order is: purchaseApplicationForm, rptt, newOwnerTicketPdf
    expect(getDefaultDocument(ticket)).toBe('rptt')
  })

  it('returns null for an existing ticket with no documents uploaded yet', () => {
    expect(getDefaultDocument(ticketWith({}))).toBeNull()
  })

  it('supports the GENERATED_CLOSING_DOCUMENTS list too', () => {
    const ticket = ticketWith({
      cr109_closingticketdetailspdf_name: 'invoice.pdf',
    })
    expect(
      getDefaultDocument(ticket, GENERATED_CLOSING_DOCUMENTS)
    ).toBe('closingTicketDetailsPdf')
  })
})

describe('getDocumentFileName', () => {
  it('returns the stored file name when present', () => {
    const definition = getDocumentDefinition('rptt')!
    const ticket = ticketWith({ cr109_rpttdocument_name: 'rptt-2026.pdf' })
    expect(getDocumentFileName(ticket, definition)).toBe(
      'rptt-2026.pdf'
    )
  })

  it('falls back to the definition label when no file name is stored', () => {
    const definition = getDocumentDefinition('rptt')!
    expect(getDocumentFileName(ticketWith({}), definition)).toBe(
      'RPTT'
    )
  })
})

describe('getDocumentDefinition', () => {
  it('finds a definition by key across the default document list', () => {
    expect(getDocumentDefinition('newOwnerTicketPdf')).toBe(
      NEW_OWNER_DOCUMENTS.find((d) => d.key === 'newOwnerTicketPdf')
    )
  })

  it('returns null for an unknown key', () => {
    expect(
      getDocumentDefinition(
        'notARealKey' as Parameters<typeof getDocumentDefinition>[0]
      )
    ).toBeNull()
  })
})
