import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewOwnerTicketTab } from './NewOwnerTicketTab'
import { closingTicketFixtures } from '../../../test/fixtures/closingTickets'
import type { NewOwnerTicketRecord } from '../types/newOwnerTicket'

const { ensureNewOwnerTicketForClosingTicket, saveNewOwnerTicket } =
  vi.hoisted(() => ({
    ensureNewOwnerTicketForClosingTicket: vi.fn(),
    saveNewOwnerTicket: vi.fn(),
  }))
const { updateClosingTicket } = vi.hoisted(() => ({
  updateClosingTicket: vi.fn(),
}))

vi.mock('../api/newOwnerTicketService', () => ({
  ensureNewOwnerTicketForClosingTicket,
  saveNewOwnerTicket,
}))
vi.mock('../../closingTickets/api/closingTicketsService', () => ({
  updateClosingTicket,
}))

// This is an "existing ticket" loaded from Dataverse: it already has a
// primary buyer/seller but no second buyer or second seller on record —
// exactly the shape the N/A-default logic under test needs to handle.
const existingNewOwnerRecord = {
  cr7de_newownerticketdetailsid: 'now-1001',
  cr7de_ticketid: 'CT-1001',
  cr7de_unit: '1A',
  cr7de_newprimaryownername: 'Alex Buyer',
  cr7de_sellername: 'Sam Seller',
  cr7de_newsecondaryownername: '',
  cr7de_secondaryownerssnein: '',
  cr109_buyer2address: '',
  cr109_buyer2city: '',
  cr109_buyer2state: '',
  cr109_buyer2zip: '',
  cr109_purchaser1occupancy: 'Present',
  cr109_purchaser2occupancy: 'Present',
} as unknown as NewOwnerTicketRecord

const closingTicket = closingTicketFixtures[0]

beforeEach(() => {
  vi.clearAllMocks()
  ensureNewOwnerTicketForClosingTicket.mockResolvedValue(
    existingNewOwnerRecord
  )
  saveNewOwnerTicket.mockResolvedValue({
    ...existingNewOwnerRecord,
    cr7de_newsecondaryownername: 'N/A',
  })
  updateClosingTicket.mockResolvedValue(undefined)
})

describe('NewOwnerTicketTab — save flow against an existing ticket', () => {
  it('loads the existing record and saves, defaulting blank buyer 2 fields to N/A', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn().mockResolvedValue(undefined)

    render(
      <NewOwnerTicketTab
        closingTicket={closingTicket}
        onSaved={onSaved}
      />
    )

    await waitFor(() =>
      expect(
        screen.getByDisplayValue('Alex Buyer')
      ).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() =>
      expect(saveNewOwnerTicket).toHaveBeenCalledTimes(1)
    )

    const [, payload] = saveNewOwnerTicket.mock.calls[0]
    expect(payload.cr7de_newsecondaryownername).toBe('N/A')
    expect(payload.cr109_buyer2address).toBe('N/A')
    expect(payload.cr7de_primaryowneremail).toBeUndefined()

    expect(updateClosingTicket).toHaveBeenCalledTimes(1)
    expect(onSaved).toHaveBeenCalledTimes(1)

    expect(
      await screen.findByText('New owner ticket saved successfully.')
    ).toBeInTheDocument()
  })

  it('blocks save and shows an error banner when required fields are missing', async () => {
    ensureNewOwnerTicketForClosingTicket.mockResolvedValue({
      ...existingNewOwnerRecord,
      cr7de_ticketid: '',
    })
    const user = userEvent.setup()

    render(
      <NewOwnerTicketTab
        closingTicket={{ ...closingTicket, cr7de_ticketid: undefined }}
        onSaved={vi.fn()}
      />
    )

    await waitFor(() =>
      expect(
        screen.getByDisplayValue('Alex Buyer')
      ).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(
      await screen.findByText(
        'Resolve the highlighted fields before saving.'
      )
    ).toBeInTheDocument()
    expect(saveNewOwnerTicket).not.toHaveBeenCalled()
  })

  it('renders read-only with no Save button when readOnly is set', async () => {
    render(
      <NewOwnerTicketTab
        closingTicket={closingTicket}
        onSaved={vi.fn()}
        readOnly
      />
    )

    await waitFor(() =>
      expect(
        screen.getByDisplayValue('Alex Buyer')
      ).toBeInTheDocument()
    )

    expect(
      screen.queryByRole('button', { name: /^save$/i })
    ).not.toBeInTheDocument()
  })
})
