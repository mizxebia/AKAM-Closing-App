import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProcessCheckpointTracker } from './ProcessCheckpointTracker'

describe('ProcessCheckpointTracker', () => {
  it('renders nothing when there is no Bot Status yet', () => {
    const { container } = render(
      <ProcessCheckpointTracker currentBotStatus={undefined} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders all happy-path checkpoints for an in-progress ticket', () => {
    render(<ProcessCheckpointTracker currentBotStatus={396620001} />)

    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('Form Downloaded')).toBeInTheDocument()
    expect(screen.getByText('Sent To AR')).toBeInTheDocument()
    expect(screen.queryByText(/Failed at this checkpoint/)).toBeNull()
  })

  it('places a Failed Bot Status at the checkpoint it failed, not off the end', () => {
    render(<ProcessCheckpointTracker currentBotStatus={396620005} />)

    expect(
      screen.getByText(/Failed at this checkpoint/)
    ).toBeInTheDocument()
    expect(
      screen.getByText('Failed Seller Info Retrieval', { exact: false })
    ).toBeInTheDocument()
    // Still on the happy-path checkpoint it failed at, not a separate row.
    expect(screen.getByText('Seller Info Retrieved')).toBeInTheDocument()
  })

  it('renders nothing for an unmapped Bot Status value', () => {
    const { container } = render(
      <ProcessCheckpointTracker currentBotStatus={999999} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
