import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProcessCheckpointTracker } from './ProcessCheckpointTracker'

describe('ProcessCheckpointTracker', () => {
  it('renders every checkpoint as unchecked when none are set', () => {
    render(<ProcessCheckpointTracker processCheckpoints={undefined} />)

    expect(screen.getByText('Buyer 1 Added')).toBeInTheDocument()
    expect(screen.getByText('Buyer Ledger Added')).toBeInTheDocument()
  })

  it('marks only the checkpoints present on the ticket as done', () => {
    render(
      <ProcessCheckpointTracker
        processCheckpoints={[396620000, 396620008]}
      />
    )

    const buyer1Row = screen.getByText('Buyer 1 Added').closest('div')
    const buyer2Row = screen.getByText('Buyer 2 Added').closest('div')
    const sellerLedgerRow = screen
      .getByText('Seller Ledger Added')
      .closest('div')

    // Done rows use the dark "completed" text color; unset rows use the
    // muted one — see the isDone branch in ProcessCheckpointTracker.
    expect(buyer1Row?.className).toContain('text-[#1E3A47]')
    expect(sellerLedgerRow?.className).toContain('text-[#1E3A47]')
    expect(buyer2Row?.className).toContain('text-[#94a3b8]')
  })
})
