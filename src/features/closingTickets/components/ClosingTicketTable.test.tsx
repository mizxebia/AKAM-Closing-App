import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClosingTicketTable } from './ClosingTicketTable'
import { closingTicketColumns } from '../constants/closingTicketColumns'
import { closingTicketFixtures } from '../../../test/fixtures/closingTickets'

describe('ClosingTicketTable — existing ticket fixtures', () => {
  it('renders one row per ticket with its formatted status', () => {
    render(
      <ClosingTicketTable
        records={closingTicketFixtures}
        columns={closingTicketColumns}
        onRecordSelect={vi.fn()}
      />
    )

    for (const ticket of closingTicketFixtures) {
      expect(screen.getByText(ticket.cr7de_ticketid!)).toBeInTheDocument()
    }
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('calls onRecordSelect with the clicked ticket id', async () => {
    const onRecordSelect = vi.fn()
    const user = userEvent.setup()

    render(
      <ClosingTicketTable
        records={closingTicketFixtures}
        columns={closingTicketColumns}
        onRecordSelect={onRecordSelect}
      />
    )

    await user.click(screen.getByText('CT-1001'))

    expect(onRecordSelect).toHaveBeenCalledWith('closing-draft-1')
  })

  it('supports keyboard activation (Enter) for accessibility', async () => {
    const onRecordSelect = vi.fn()
    const user = userEvent.setup()

    render(
      <ClosingTicketTable
        records={closingTicketFixtures}
        columns={closingTicketColumns}
        onRecordSelect={onRecordSelect}
      />
    )

    const row = screen.getByText('CT-1001').closest('tr')!
    row.focus()
    await user.keyboard('{Enter}')

    expect(onRecordSelect).toHaveBeenCalledWith('closing-draft-1')
  })

  it('renders an empty table without crashing when there are no tickets', () => {
    render(
      <ClosingTicketTable
        records={[]}
        columns={closingTicketColumns}
        onRecordSelect={vi.fn()}
      />
    )
    expect(screen.getByText(/0 records/)).toBeInTheDocument()
  })
})
