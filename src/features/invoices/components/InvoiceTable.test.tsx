import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvoiceTable } from './InvoiceTable'
import { invoiceFixtures } from '../../../test/fixtures/invoices'

function renderTable(
  overrides: Partial<Parameters<typeof InvoiceTable>[0]> = {}
) {
  return render(
    <InvoiceTable
      records={invoiceFixtures}
      loading={false}
      error={null}
      onRefresh={vi.fn()}
      onSaveEdit={vi.fn().mockResolvedValue(true)}
      onDelete={vi.fn()}
      updatingId={null}
      deletingId={null}
      {...overrides}
    />
  )
}

describe('InvoiceTable — existing invoice fixtures', () => {
  it('groups fixtures into Seller/Buyer/Other sections', () => {
    renderTable()

    expect(screen.getByText('Seller Cheques')).toBeInTheDocument()
    expect(screen.getByText('Buyer Cheques')).toBeInTheDocument()
    expect(
      screen.getByText('Payments, Fees & Adjustments')
    ).toBeInTheDocument()
  })

  it('shows the loading skeleton and hides groups while loading', () => {
    renderTable({ loading: true })
    expect(screen.queryByText('Seller Cheques')).not.toBeInTheDocument()
  })

  it('shows the error state instead of records when an error is set', () => {
    renderTable({ error: 'Failed to load invoices.' })
    expect(
      screen.getByText('Failed to load invoices.')
    ).toBeInTheDocument()
    expect(screen.queryByText('Seller Cheques')).not.toBeInTheDocument()
  })

  it('shows an empty state when there are no invoice records', () => {
    renderTable({ records: [] })
    expect(
      screen.getByText(
        'No invoice detail records were found for this closing.'
      )
    ).toBeInTheDocument()
  })

  it('hides the Actions column and disables notes editing when readOnly', () => {
    renderTable({ readOnly: true, closingTicketNotes: 'Existing notes' })
    expect(
      screen.queryByRole('columnheader', { name: 'Actions' })
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Notes')).toBeDisabled()
  })

  it('only shows the Save Notes button once notes actually change', async () => {
    const user = userEvent.setup()
    const onSaveNotes = vi.fn().mockResolvedValue(undefined)
    renderTable({ closingTicketNotes: 'Original notes', onSaveNotes })

    expect(
      screen.queryByRole('button', { name: /save notes/i })
    ).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Notes'), ' more')

    const saveButton = screen.getByRole('button', {
      name: /save notes/i,
    })
    await user.click(saveButton)

    expect(onSaveNotes).toHaveBeenCalledWith('Original notes more')
  })
})
