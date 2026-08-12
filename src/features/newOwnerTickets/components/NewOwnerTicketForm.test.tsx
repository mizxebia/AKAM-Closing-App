import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewOwnerTicketForm } from './NewOwnerTicketForm'
import { baseFormState } from '../../../test/fixtures/newOwnerTicketFormStates'
import type { NewOwnerTicketFormState } from '../types/newOwnerTicket'

function renderForm(
  overrides: Partial<
    Parameters<typeof NewOwnerTicketForm>[0]
  > = {}
) {
  const onFieldChange = vi.fn()
  const onSubmit = vi.fn()
  const onValidate = vi.fn()

  const utils = render(
    <NewOwnerTicketForm
      formState={baseFormState()}
      errors={{}}
      saving={false}
      validating={false}
      showValidateButton={false}
      onFieldChange={onFieldChange}
      onSubmit={onSubmit}
      onValidate={onValidate}
      {...overrides}
    />
  )

  return { onFieldChange, onSubmit, onValidate, ...utils }
}

describe('NewOwnerTicketForm', () => {
  it('renders every section and pre-fills values from an existing ticket', () => {
    renderForm({
      formState: baseFormState({
        cr7de_newprimaryownername: 'Alex Buyer',
        cr7de_sellername: 'Sam Seller',
      }),
    })

    expect(screen.getByText('Buyer 1')).toBeInTheDocument()
    expect(screen.getByText('Buyer 2')).toBeInTheDocument()
    expect(screen.getByText('Seller')).toBeInTheDocument()
    expect(
      screen.getByDisplayValue('Alex Buyer')
    ).toBeInTheDocument()
    expect(
      screen.getByDisplayValue('Sam Seller')
    ).toBeInTheDocument()
  })

  it('calls onFieldChange when a text field is edited', async () => {
    const user = userEvent.setup()
    const { onFieldChange } = renderForm()

    const input = screen.getByLabelText(/Buyer 2 Name/i)
    await user.type(input, 'J')

    expect(onFieldChange).toHaveBeenCalledWith(
      'cr7de_newsecondaryownername',
      'J'
    )
  })

  it('renders inline validation errors next to the offending field', () => {
    renderForm({
      errors: {
        cr109_buyer1address:
          'Required when Buyer 1 Occupancy is Absent.',
      },
    })

    expect(
      screen.getByText('Required when Buyer 1 Occupancy is Absent.')
    ).toBeInTheDocument()
  })

  it('restricts the SSN/EIN input to digits and warns on letters', async () => {
    const user = userEvent.setup()
    const { onFieldChange } = renderForm()

    const ssnInput = screen.getByLabelText(/Buyer 1 SSN\/EIN/i)
    // The field is prop-controlled and this test's onFieldChange mock never
    // feeds a new value back in, so the input stays at '' between
    // keystrokes — type only letters here so every keystroke re-triggers
    // the same "contains a letter" branch instead of a later digit
    // keystroke clearing the warning that a prior letter keystroke set.
    await user.type(ssnInput, 'abc')

    expect(
      screen.getByText('Only numbers are allowed.')
    ).toBeInTheDocument()
    // Letters are stripped before reaching the parent handler.
    for (const [, value] of onFieldChange.mock.calls) {
      expect(value).toBe('')
    }
  })

  it('disables all fields and hides action buttons in readOnly mode', () => {
    renderForm({ readOnly: true, showValidateButton: true })

    const fieldset = screen
      .getByLabelText(/Buyer 1 Name/i)
      .closest('fieldset')
    expect(fieldset).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: /save/i })
    ).not.toBeInTheDocument()
  })

  it('calls onSubmit when Save is clicked with a valid form', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('shows the Validate button only when eligible, and confirms before validating', async () => {
    const user = userEvent.setup()
    const { onValidate } = renderForm({ showValidateButton: true })

    await user.click(
      screen.getByRole('button', { name: /^validate$/i })
    )
    expect(onValidate).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: /yes, validate and lock/i })
    )
    expect(onValidate).toHaveBeenCalledTimes(1)
  })

  it('hides the Validate button when not eligible', () => {
    renderForm({ showValidateButton: false })
    expect(
      screen.queryByRole('button', { name: /^validate$/i })
    ).not.toBeInTheDocument()
  })

  it('marks buyer 1/2 address fields required once the matching occupancy is Absent', () => {
    const { container } = renderForm({
      formState: baseFormState({
        cr109_purchaser1occupancy: 'Absent',
      }) as NewOwnerTicketFormState,
    })

    // The "*" lives in a nested <strong>, so match on the label span's full
    // textContent directly rather than via getByText (which only matches
    // text owned by a single node, not text split across child elements).
    const requiredLabel = Array.from(
      container.querySelectorAll('label.form-field > span')
    ).find((span) => span.textContent === 'Buyer 1 Address *')
    expect(requiredLabel).toBeTruthy()

    // Buyer 1 City/State/ZIP (Present occupancy) must NOT be marked required.
    const cityLabel = Array.from(
      container.querySelectorAll('label.form-field > span')
    ).find((span) => span.textContent?.startsWith('Buyer 2 Address'))
    expect(cityLabel?.textContent).toBe('Buyer 2 Address')
  })
})
