import type {
  FormEvent,
  InputHTMLAttributes,
} from 'react'
import { useState } from 'react'
import type {
  EditableNewOwnerTicketField,
  NewOwnerTicketFormState,
} from '../types/newOwnerTicket'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../../components/ui/alert-dialog'

type FieldKind =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'textarea'
  | 'checkbox'
  | 'ssnein'
  | 'occupancy'

interface FieldConfig {
  name: EditableNewOwnerTicketField
  label: string
  kind?: FieldKind
  required?: boolean
  readOnly?: boolean
  wide?: boolean
  section:
    | 'Ticket'
    | 'Buyer 1'
    | 'Buyer 2'
    | 'Seller'
    | 'Financial'
    | 'Occupants'
}

const FIELD_CONFIGS = [
  {
    section: 'Ticket',
    name: 'cr7de_ticketid',
    label: 'Ticket ID',
    required: true,
    readOnly: true,
  },
  {
    section: 'Ticket',
    name: 'cr7de_unit',
    label: 'Unit',
    required: true,
  },
  {
    section: 'Ticket',
    name: 'cr109_nyccode',
    label: 'Building Code',
  },
  {
    section: 'Ticket',
    name: 'cr109_buildingname',
    label: 'Building Name',
  },
  {
    section: 'Ticket',
    name: 'cr7de_closingdate',
    label: 'Closing Date',
    kind: 'date',
  },
  {
    section: 'Ticket',
    name: 'cr7de_address',
    label: 'Property Address',
    kind: 'textarea',
    wide: true,
  },
  {
    section: 'Buyer 1',
    name: 'cr7de_newprimaryownername',
    label: 'Buyer 1 Name',
  },
  {
    section: 'Buyer 1',
    name: 'cr7de_primaryowneremail',
    label: 'Buyer 1 Email',
    kind: 'email',
  },
  {
    section: 'Buyer 1',
    name: 'cr7de_primaryphonenumber',
    label: 'Buyer 1 Cell Phone',
    kind: 'tel',
  },
  {
    section: 'Buyer 1',
    name: 'cr109_primaryhomephonenumber',
    label: 'Buyer 1 Home Phone',
    kind: 'tel',
  },
  {
    section: 'Buyer 1',
    name: 'cr109_primaryworkphonenumber',
    label: 'Buyer 1 Work Phone',
    kind: 'tel',
  },
  {
    section: 'Buyer 1',
    name: 'cr7de_primaryownerssnein',
    label: 'Buyer 1 SSN/EIN',
    kind: 'ssnein',
  },
  {
    section: 'Buyer 1',
    name: 'cr109_primaryownertcode',
    label: 'Buyer 1 T-Code',
  },
  {
    section: 'Buyer 1',
    name: 'cr109_buyer1address',
    label: 'Buyer 1 Address',
  },
  {
    section: 'Buyer 1',
    name: 'cr109_buyer1city',
    label: 'Buyer 1 City',
  },
  {
    section: 'Buyer 1',
    name: 'cr109_buyer1state',
    label: 'Buyer 1 State',
  },
  {
    section: 'Buyer 1',
    name: 'cr109_buyer1zip',
    label: 'Buyer 1 ZIP',
  },
  {
    section: 'Buyer 1',
    name: 'cr109_purchaser1occupancy',
    label: 'Buyer 1 Occupancy',
    kind: 'occupancy',
  },
  {
    section: 'Buyer 1',
    name: 'cr109_purchaser1purchasedate',
    label: 'Buyer 1 Purchase Date',
  },
  {
    section: 'Buyer 2',
    name: 'cr7de_newsecondaryownername',
    label: 'Buyer 2 Name',
  },
  {
    section: 'Buyer 2',
    name: 'cr7de_secondaryowneremail',
    label: 'Buyer 2 Email',
    kind: 'email',
  },
  {
    section: 'Buyer 2',
    name: 'cr7de_secondaryphonenumber',
    label: 'Buyer 2 Cell Phone',
    kind: 'tel',
  },
  {
    section: 'Buyer 2',
    name: 'cr109_secondaryownerhomephonenumber',
    label: 'Buyer 2 Home Phone',
    kind: 'tel',
  },
  {
    section: 'Buyer 2',
    name: 'cr109_secondaryownerworkphonenumber',
    label: 'Buyer 2 Work Phone',
    kind: 'tel',
  },
  {
    section: 'Buyer 2',
    name: 'cr7de_secondaryownerssnein',
    label: 'Buyer 2 SSN/EIN',
    kind: 'ssnein',
  },
  {
    section: 'Buyer 2',
    name: 'cr109_buyer2address',
    label: 'Buyer 2 Address',
  },
  {
    section: 'Buyer 2',
    name: 'cr109_buyer2city',
    label: 'Buyer 2 City',
  },
  {
    section: 'Buyer 2',
    name: 'cr109_buyer2state',
    label: 'Buyer 2 State',
  },
  {
    section: 'Buyer 2',
    name: 'cr109_buyer2zip',
    label: 'Buyer 2 ZIP',
  },
  {
    section: 'Buyer 2',
    name: 'cr109_purchaser2occupancy',
    label: 'Buyer 2 Occupancy',
    kind: 'occupancy',
  },
  {
    section: 'Seller',
    name: 'cr7de_sellername',
    label: 'Seller 1 Name',
  },
  {
    section: 'Seller',
    name: 'cr7de_sellerssnein',
    label: 'Seller 1 SSN/EIN',
  },
  {
    section: 'Seller',
    name: 'cr7de_sellertcode',
    label: 'Seller T-Code',
  },
  {
    section: 'Seller',
    name: 'cr7de_sellercontactemail',
    label: 'Seller Contact Email',
    kind: 'email',
  },
  {
    section: 'Seller',
    name: 'cr7de_sellercontactnumber',
    label: 'Seller Contact Number',
    kind: 'tel',
  },
  {
    section: 'Seller',
    name: 'cr109_seller1address',
    label: 'Seller 1 Address',
  },
  {
    section: 'Seller',
    name: 'cr109_seller1city',
    label: 'Seller 1 City',
  },
  {
    section: 'Seller',
    name: 'cr109_seller1state',
    label: 'Seller 1 State',
  },
  {
    section: 'Seller',
    name: 'cr109_seller1zip',
    label: 'Seller 1 ZIP',
  },
  {
    section: 'Seller',
    name: 'cr109_seller2name',
    label: 'Seller 2 Name',
  },
  {
    section: 'Seller',
    name: 'cr109_seller2ssnein',
    label: 'Seller 2 SSN/EIN',
  },
  {
    section: 'Seller',
    name: 'cr109_seller2address',
    label: 'Seller 2 Address',
  },
  {
    section: 'Seller',
    name: 'cr109_seller2city',
    label: 'Seller 2 City',
  },
  {
    section: 'Seller',
    name: 'cr109_seller2state',
    label: 'Seller 2 State',
  },
  {
    section: 'Seller',
    name: 'cr109_seller2zip',
    label: 'Seller 2 ZIP',
  },
  {
    section: 'Seller',
    name: 'cr7de_forwardingaddressforseller',
    label: 'Forwarding Address For Seller',
    kind: 'textarea',
    wide: true,
  },
  {
    section: 'Seller',
    name: 'cr7de_paymentappliedtoselleraccount',
    label: 'Payment Applied To Seller Account',
  },
  {
    section: 'Seller',
    name: 'cr7de_selleraccountzerobalanceconfirmed',
    label: 'Seller Account Zero Balance Confirmed',
    kind: 'checkbox',
    wide: true,
  },
  {
    section: 'Financial',
    name: 'cr109_purchaseprice',
    label: 'Purchase Price',
  },
  {
    section: 'Financial',
    name: 'cr109_amountfinanced',
    label: 'Amount Financed',
  },
  {
    section: 'Financial',
    name: 'cr109_lendersname',
    label: 'Lender Name',
  },
  {
    section: 'Financial',
    name: 'cr109_shares',
    label: 'Shares',
  },
  {
    section: 'Occupants',
    name: 'cr109_additional_occupants1name',
    label: 'Additional Occupant 1',
  },
  {
    section: 'Occupants',
    name: 'cr109_additionaloccupant2name',
    label: 'Additional Occupant 2',
  },
  {
    section: 'Occupants',
    name: 'cr109_additionaloccupant3name',
    label: 'Additional Occupant 3',
  },
  {
    section: 'Ticket',
    name: 'cr7de_alternatemailingaddress',
    label: 'Alternate Mailing Address',
    kind: 'textarea',
    wide: true,
  },
] satisfies readonly FieldConfig[]

const SECTION_ORDER: FieldConfig['section'][] = [
  'Ticket',
  'Buyer 1',
  'Buyer 2',
  'Seller',
  'Financial',
  'Occupants',
]

interface NewOwnerTicketFormProps {
  formState: NewOwnerTicketFormState
  errors: Partial<
    Record<EditableNewOwnerTicketField, string>
  >
  saving: boolean
  validating: boolean
  showValidateButton: boolean
  onFieldChange: <TKey extends keyof NewOwnerTicketFormState>(
    field: TKey,
    value: NewOwnerTicketFormState[TKey]
  ) => void
  onSubmit: () => void
  onValidate: () => void
  readOnly?: boolean
}

/** Standalone input for SSN/EIN — accepts digits only, max 9 characters.
 *  Shows an inline warning if the user attempts to type a letter. */
function SsnEinInput({
  label,
  value,
  required,
  readOnly,
  wide,
  onChange,
}: {
  label: string
  value: string
  required?: boolean
  readOnly?: boolean
  wide?: boolean
  onChange: (value: string) => void
}) {
  const [warning, setWarning] = useState<string | null>(null)

  const handleChange = (raw: string) => {
    if (/[a-zA-Z]/.test(raw)) {
      setWarning('Only numbers are allowed.')
      // Strip letters, keep only digits up to 9
      onChange(raw.replace(/\D/g, '').slice(0, 9))
      return
    }
    setWarning(null)
    // Digits only, max 9
    onChange(raw.replace(/\D/g, '').slice(0, 9))
  }

  return (
    <label className={wide ? 'form-field new-owner-form-wide' : 'form-field'}>
      <span>
        {label}
        {required && <strong> *</strong>}
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        readOnly={readOnly}
        maxLength={9}
        placeholder="123456789"
        onChange={(e) => handleChange(e.target.value)}
      />
      {warning && (
        <span className="form-error" role="alert">{warning}</span>
      )}
    </label>
  )
}

function getInputMode(
  field: FieldConfig
): InputHTMLAttributes<HTMLInputElement>['inputMode'] {
  if (field.kind === 'email') {
    return 'email'
  }

  if (field.kind === 'tel') {
    return 'tel'
  }

  if (field.kind === 'ssnein') {
    return 'numeric'
  }

  return undefined
}

export function NewOwnerTicketForm({
  formState,
  errors,
  saving,
  validating,
  showValidateButton,
  onFieldChange,
  onSubmit,
  onValidate,
  readOnly = false,
}: NewOwnerTicketFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  const renderField = (field: FieldConfig) => {
    const value = formState[field.name]
    const error = errors[field.name]

    if (field.kind === 'checkbox') {
      return (
        <label
          key={field.name}
          className={
            field.wide
              ? 'checkbox-field new-owner-form-wide'
              : 'checkbox-field'
          }
        >
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) =>
              onFieldChange(
                field.name,
                event.target
                  .checked as NewOwnerTicketFormState[typeof field.name]
              )
            }
          />
          <span>{field.label}</span>
        </label>
      )
    }

    const commonClassName = field.wide
      ? 'form-field new-owner-form-wide'
      : 'form-field'

    if (field.kind === 'textarea') {
      return (
        <label key={field.name} className={commonClassName}>
          <span>
            {field.label}
            {field.required && <strong> *</strong>}
          </span>
          <textarea
            value={String(value)}
            readOnly={field.readOnly}
            onChange={(event) =>
              onFieldChange(
                field.name,
                event.target
                  .value as NewOwnerTicketFormState[typeof field.name]
              )
            }
          />
          {error && <span className="form-error">{error}</span>}
        </label>
      )
    }

    if (field.kind === 'occupancy') {
      return (
        <label key={field.name} className={commonClassName}>
          <span>
            {field.label}
            {field.required && <strong> *</strong>}
          </span>
          <select
            value={String(value)}
            disabled={field.readOnly}
            onChange={(event) =>
              onFieldChange(
                field.name,
                event.target.value as NewOwnerTicketFormState[typeof field.name]
              )
            }
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
          {error && <span className="form-error">{error}</span>}
        </label>
      )
    }

    if (field.kind === 'ssnein') {
      return (
        <SsnEinInput
          key={field.name}
          label={field.label}
          value={String(value)}
          required={field.required}
          readOnly={field.readOnly}
          wide={field.wide}
          onChange={(formatted) =>
            onFieldChange(
              field.name,
              formatted as NewOwnerTicketFormState[typeof field.name]
            )
          }
        />
      )
    }

    return (
      <label key={field.name} className={commonClassName}>
        <span>
          {field.label}
          {field.required && <strong> *</strong>}
        </span>
        <input
          type={field.kind === 'date' ? 'date' : 'text'}
          inputMode={getInputMode(field)}
          value={String(value)}
          readOnly={field.readOnly}
          onChange={(event) =>
            onFieldChange(
              field.name,
              event.target
                .value as NewOwnerTicketFormState[typeof field.name]
            )
          }
        />
        {error && <span className="form-error">{error}</span>}
      </label>
    )
  }

  return (
    <form className="new-owner-form" onSubmit={handleSubmit}>
      <fieldset disabled={readOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
      {SECTION_ORDER.map((section) => {
        const sectionFields = FIELD_CONFIGS.filter(
          (field) => field.section === section
        )

        return (
          <section
            className="new-owner-form-section"
            key={section}
          >
            <div className="new-owner-section-header">
              <h4>{section}</h4>
            </div>
            <div className="new-owner-field-grid">
              {sectionFields.map(renderField)}
            </div>
          </section>
        )
      })}
      </fieldset>

      {!readOnly && (
      <div className="form-actions new-owner-actions">
        {showValidateButton && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="primary-action-button"
                type="button"
                disabled={saving || validating}
              >
                {validating ? 'Validating...' : 'Validate'}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Validate this closing?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action <strong>cannot be undone</strong>. Once validated, the ticket will be permanently locked — no fields, documents, or charges can be edited. The new owner ticket PDF will be regenerated automatically.
                  <br /><br />
                  Please confirm you have reviewed all details before proceeding.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onValidate}
                  className="bg-[#1E3A47] text-white hover:bg-[#152d38]"
                >
                  Yes, validate and lock
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <button
          className="primary-action-button"
          type="submit"
          disabled={saving || validating}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      )}
    </form>
  )
}
