import { test, expect } from '@playwright/experimental-ct-react'
import { ClosingTicketTable } from '../../src/features/closingTickets/components/ClosingTicketTable'
import { closingTicketColumns } from '../../src/features/closingTickets/constants/closingTicketColumns'
import { closingTicketFixtures } from '../../src/test/fixtures/closingTickets'

/**
 * Real-Chromium rendering of the closing ticket table against the same
 * "existing ticket" fixtures used by the Vitest suite — catches real
 * browser/CSS/click issues that jsdom-based component tests can't (actual
 * layout, actual pointer events, actual keyboard focus order).
 */
test('renders every existing-ticket fixture with its status badge', async ({
  mount,
}) => {
  const component = await mount(
    <ClosingTicketTable
      records={closingTicketFixtures}
      columns={closingTicketColumns}
      onRecordSelect={() => {}}
    />
  )

  for (const ticket of closingTicketFixtures) {
    await expect(component.getByText(ticket.cr7de_ticketid!)).toBeVisible()
  }
  await expect(component.getByText('Completed')).toBeVisible()
})

test('clicking a row fires onRecordSelect with that ticket id', async ({
  mount,
}) => {
  const selected: string[] = []

  const component = await mount(
    <ClosingTicketTable
      records={closingTicketFixtures}
      columns={closingTicketColumns}
      onRecordSelect={(id) => selected.push(id)}
    />
  )

  await component.getByText('CT-1002').click()

  expect(selected).toEqual(['closing-validate-1'])
})
