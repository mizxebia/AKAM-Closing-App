import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditClosingTicketForm } from './CreateClosingTicketForm'
import { closingTicketFixtures } from '../../../test/fixtures/closingTickets'
import type { ClosingTicketRecord } from '../types/closingTicket'

const { updateClosingTicket, syncNewOwnerTicketFromClosingTicket } =
  vi.hoisted(() => ({
    updateClosingTicket: vi.fn(),
    syncNewOwnerTicketFromClosingTicket: vi.fn(),
  }))

vi.mock('../api/closingTicketsService', () => ({
  createClosingTicket: vi.fn(),
  deleteClosingTicketFile: vi.fn(),
  updateClosingTicket,
  uploadClosingTicketFile: vi.fn(),
  UPLOAD_COLUMN_LABELS: {
    cr109_purchaseapplicationform: 'Purchase Application Form',
    cr109_rpttdocument: 'RPTT Document',
  },
}))

vi.mock('../../newOwnerTickets/api/newOwnerTicketService', () => ({
  syncNewOwnerTicketFromClosingTicket,
}))

vi.mock('../hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ userName: '', userEmail: '' }),
}))

describe('EditClosingTicketForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateClosingTicket.mockResolvedValue({})
    syncNewOwnerTicketFromClosingTicket.mockResolvedValue({})
  })

  it('shows N/A for a cleared party name after save completes', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn().mockResolvedValue(undefined)
    const record = {
      ...closingTicketFixtures[0],
      cr109_packagetype: 396620000,
      cr7de_sellertcode: 'T1001',
      cr109_seller2name: 'Old Seller Two',
    } as ClosingTicketRecord

    render(
      <EditClosingTicketForm
        record={record}
        onCancel={vi.fn()}
        onSaved={onSaved}
      />
    )

    const sellerTwoName = screen.getByLabelText('Seller 2 Name')
    await user.clear(sellerTwoName)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(sellerTwoName).toHaveValue('N/A')
    expect(updateClosingTicket).toHaveBeenCalled()
  })
})
