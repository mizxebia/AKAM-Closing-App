import { test, expect } from '@playwright/experimental-ct-react'
import { NewOwnerTicketForm } from '../../src/features/newOwnerTickets/components/NewOwnerTicketForm'
import { baseFormState } from '../../src/test/fixtures/newOwnerTicketFormStates'

test('typing into Buyer 2 Name reaches onFieldChange in a real browser', async ({
  mount,
}) => {
  const changes: unknown[][] = []

  const component = await mount(
    <NewOwnerTicketForm
      formState={baseFormState()}
      errors={{}}
      saving={false}
      validating={false}
      showValidateButton={false}
      onFieldChange={(field, value) => changes.push([field, value])}
      onSubmit={() => {}}
      onValidate={() => {}}
    />
  )

  await component.getByLabel('Buyer 2 Name').fill('Jamie Buyer')

  expect(changes.at(-1)).toEqual([
    'cr7de_newsecondaryownername',
    'Jamie Buyer',
  ])
})

test('the Validate confirmation dialog requires an explicit click before firing', async ({
  mount,
  page,
}) => {
  let validated = false

  const component = await mount(
    <NewOwnerTicketForm
      formState={baseFormState()}
      errors={{}}
      saving={false}
      validating={false}
      showValidateButton
      onFieldChange={() => {}}
      onSubmit={() => {}}
      onValidate={() => {
        validated = true
      }}
    />
  )

  await component.getByRole('button', { name: 'Validate' }).click()
  expect(validated).toBe(false)

  // Radix's AlertDialogContent renders through a Portal straight into
  // document.body, not inside the mounted #root — so it has to be located
  // via the page, not the `component` handle (which is scoped to #root).
  await page
    .getByRole('button', { name: 'Yes, validate and lock' })
    .click()
  expect(validated).toBe(true)
})
