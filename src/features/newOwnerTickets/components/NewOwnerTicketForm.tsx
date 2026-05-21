import type {
  FormEvent,
  InputHTMLAttributes,
} from 'react'
import type {
  EditableNewOwnerTicketField,
  NewOwnerTicketFormState,
} from '../types/newOwnerTicket'

type FieldKind =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'textarea'
  | 'checkbox'

interface FieldConfig {
  name: EditableNewOwnerTicketField
  label: string
  kind?: FieldKind
  required?: boolean
  readOnly?: boolean
  wide?: boolean
  section:
    | 'Ticket'
    | 'Primary Owner'
    | 'Secondary Owner'
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
    section: 'Primary Owner',
    name: 'cr7de_newprimaryownername',
    label: 'Primary Owner',
    required: true,
  },
  {
    section: 'Primary Owner',
    name: 'cr7de_primaryowneremail',
    label: 'Primary Owner Email',
    kind: 'email',
  },
  {
    section: 'Primary Owner',
    name: 'cr7de_primaryphonenumber',
    label: 'Primary Cell Phone',
    kind: 'tel',
  },
  {
    section: 'Primary Owner',
    name: 'cr109_primaryhomephonenumber',
    label: 'Primary Home Phone',
    kind: 'tel',
  },
  {
    section: 'Primary Owner',
    name: 'cr109_primaryworkphonenumber',
    label: 'Primary Work Phone',
    kind: 'tel',
  },
  {
    section: 'Primary Owner',
    name: 'cr7de_primaryownerssnein',
    label: 'Primary Owner SSN/EIN',
  },
  {
    section: 'Primary Owner',
    name: 'cr109_buyer1address',
    label: 'Buyer 1 Address',
  },
  {
    section: 'Primary Owner',
    name: 'cr109_buyer1city',
    label: 'Buyer 1 City',
  },
  {
    section: 'Primary Owner',
    name: 'cr109_buyer1state',
    label: 'Buyer 1 State',
  },
  {
    section: 'Primary Owner',
    name: 'cr109_buyer1zip',
    label: 'Buyer 1 ZIP',
  },
  {
    section: 'Primary Owner',
    name: 'cr109_purchaser1occupancy',
    label: 'Purchaser 1 Occupancy',
  },
  {
    section: 'Primary Owner',
    name: 'cr109_purchaser1purchasedate',
    label: 'Purchaser 1 Purchase Date',
  },
  {
    section: 'Secondary Owner',
    name: 'cr7de_newsecondaryownername',
    label: 'Secondary Owner',
  },
  {
    section: 'Secondary Owner',
    name: 'cr7de_secondaryowneremail',
    label: 'Secondary Owner Email',
    kind: 'email',
  },
  {
    section: 'Secondary Owner',
    name: 'cr7de_secondaryphonenumber',
    label: 'Secondary Cell Phone',
    kind: 'tel',
  },
  {
    section: 'Secondary Owner',
    name: 'cr109_secondaryownerhomephonenumber',
    label: 'Secondary Home Phone',
    kind: 'tel',
  },
  {
    section: 'Secondary Owner',
    name: 'cr109_secondaryownerworkphonenumber',
    label: 'Secondary Work Phone',
    kind: 'tel',
  },
  {
    section: 'Secondary Owner',
    name: 'cr7de_secondaryownerssnein',
    label: 'Secondary Owner SSN/EIN',
  },
  {
    section: 'Secondary Owner',
    name: 'cr109_buyer2address',
    label: 'Buyer 2 Address',
  },
  {
    section: 'Secondary Owner',
    name: 'cr109_buyer2city',
    label: 'Buyer 2 City',
  },
  {
    section: 'Secondary Owner',
    name: 'cr109_buyer2state',
    label: 'Buyer 2 State',
  },
  {
    section: 'Secondary Owner',
    name: 'cr109_buyer2zip',
    label: 'Buyer 2 ZIP',
  },
  {
    section: 'Secondary Owner',
    name: 'cr109_purchaser2occupancy',
    label: 'Purchaser 2 Occupancy',
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
  'Primary Owner',
  'Secondary Owner',
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
  onFieldChange: <TKey extends keyof NewOwnerTicketFormState>(
    field: TKey,
    value: NewOwnerTicketFormState[TKey]
  ) => void
  onSubmit: () => void
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

  return undefined
}

export function NewOwnerTicketForm({
  formState,
  errors,
  saving,
  onFieldChange,
  onSubmit,
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

      <div className="form-actions new-owner-actions">
        <button
          className="primary-action-button"
          type="submit"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
