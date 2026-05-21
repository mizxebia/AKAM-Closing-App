import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ClipboardList } from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { LoadingSkeleton } from '../../../components/enterprise'
import { updateClosingTicket } from '../../closingTickets/api/closingTicketsService'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import {
  getNewOwnerTicketByTicketId,
  saveNewOwnerTicket,
} from '../api/newOwnerTicketService'
import type {
  EditableNewOwnerTicketField,
  NewOwnerTicketFormState,
  NewOwnerTicketInput,
  NewOwnerTicketRecord,
} from '../types/newOwnerTicket'
import {
  getDefaultDocument,
  type NewOwnerDocumentKey,
} from '../utils/dataverseFileUtils'
import { DocumentViewerPanel } from './DocumentViewerPanel'
import { NewOwnerTicketForm } from './NewOwnerTicketForm'

interface NewOwnerTicketTabProps {
  closingTicket: ClosingTicketRecord
  onSaved: () => Promise<void>
}

type ValidationErrors = Partial<
  Record<EditableNewOwnerTicketField, string>
>

const VALIDATED_TICKET_STATUS = 716070001
const TRANSFERRING_BUILDING_STATUS = 716070002
const INFORMATION_VALIDATED_BOT_STATUS = 396620007

function getDateInputValue(value?: string) {
  if (!value) {
    return ''
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime())
    ? value.slice(0, 10)
    : parsedDate.toISOString().slice(0, 10)
}

function valueOrEmpty(value?: string) {
  return value ?? ''
}

function getInitialFormState(
  closingTicket: ClosingTicketRecord,
  record?: NewOwnerTicketRecord | null
): NewOwnerTicketFormState {
  return {
    cr109_additional_occupants1name: valueOrEmpty(
      record?.cr109_additional_occupants1name
    ),
    cr109_additionaloccupant2name: valueOrEmpty(
      record?.cr109_additionaloccupant2name
    ),
    cr109_additionaloccupant3name: valueOrEmpty(
      record?.cr109_additionaloccupant3name
    ),
    cr109_amountfinanced: valueOrEmpty(
      record?.cr109_amountfinanced
    ),
    cr109_buyer1address: valueOrEmpty(
      record?.cr109_buyer1address
    ),
    cr109_buyer1city: valueOrEmpty(
      record?.cr109_buyer1city
    ),
    cr109_buyer1state: valueOrEmpty(
      record?.cr109_buyer1state
    ),
    cr109_buyer1zip: valueOrEmpty(
      record?.cr109_buyer1zip
    ),
    cr109_buyer2address: valueOrEmpty(
      record?.cr109_buyer2address
    ),
    cr109_buyer2city: valueOrEmpty(
      record?.cr109_buyer2city
    ),
    cr109_buyer2state: valueOrEmpty(
      record?.cr109_buyer2state
    ),
    cr109_buyer2zip: valueOrEmpty(
      record?.cr109_buyer2zip
    ),
    cr109_lendersname: valueOrEmpty(
      record?.cr109_lendersname
    ),
    cr109_primaryhomephonenumber: valueOrEmpty(
      record?.cr109_primaryhomephonenumber
    ),
    cr109_primaryworkphonenumber: valueOrEmpty(
      record?.cr109_primaryworkphonenumber
    ),
    cr109_purchaseprice: valueOrEmpty(
      record?.cr109_purchaseprice ??
        closingTicket.cr109_saleprice
    ),
    cr109_purchaser1occupancy: valueOrEmpty(
      record?.cr109_purchaser1occupancy
    ),
    cr109_purchaser1purchasedate: valueOrEmpty(
      record?.cr109_purchaser1purchasedate
    ),
    cr109_purchaser2occupancy: valueOrEmpty(
      record?.cr109_purchaser2occupancy
    ),
    cr109_secondaryownerhomephonenumber: valueOrEmpty(
      record?.cr109_secondaryownerhomephonenumber
    ),
    cr109_secondaryownerworkphonenumber: valueOrEmpty(
      record?.cr109_secondaryownerworkphonenumber
    ),
    cr109_seller1address: valueOrEmpty(
      record?.cr109_seller1address
    ),
    cr109_seller1city: valueOrEmpty(
      record?.cr109_seller1city
    ),
    cr109_seller1state: valueOrEmpty(
      record?.cr109_seller1state
    ),
    cr109_seller1zip: valueOrEmpty(
      record?.cr109_seller1zip
    ),
    cr109_seller2address: valueOrEmpty(
      record?.cr109_seller2address
    ),
    cr109_seller2city: valueOrEmpty(
      record?.cr109_seller2city
    ),
    cr109_seller2name: valueOrEmpty(
      record?.cr109_seller2name ??
        closingTicket.cr109_seller2name
    ),
    cr109_seller2ssnein: valueOrEmpty(
      record?.cr109_seller2ssnein
    ),
    cr109_seller2state: valueOrEmpty(
      record?.cr109_seller2state
    ),
    cr109_seller2zip: valueOrEmpty(
      record?.cr109_seller2zip
    ),
    cr109_shares: valueOrEmpty(
      record?.cr109_shares ?? closingTicket.cr109_shares
    ),
    cr7de_address: valueOrEmpty(
      record?.cr7de_address ??
        closingTicket.cr7de_buildingaddress
    ),
    cr7de_alternatemailingaddress: valueOrEmpty(
      record?.cr7de_alternatemailingaddress
    ),
    cr7de_closingdate: getDateInputValue(
      record?.cr7de_closingdate ??
        closingTicket.cr7de_closingdate
    ),
    cr7de_forwardingaddressforseller: valueOrEmpty(
      record?.cr7de_forwardingaddressforseller
    ),
    cr7de_newprimaryownername: valueOrEmpty(
      record?.cr7de_newprimaryownername ??
        closingTicket.cr7de_buyername
    ),
    cr7de_newsecondaryownername: valueOrEmpty(
      record?.cr7de_newsecondaryownername ??
        closingTicket.cr109_buyer2name
    ),
    cr7de_paymentappliedtoselleraccount: valueOrEmpty(
      record?.cr7de_paymentappliedtoselleraccount
    ),
    cr7de_primaryowneremail: valueOrEmpty(
      record?.cr7de_primaryowneremail
    ),
    cr7de_primaryownerssnein: valueOrEmpty(
      record?.cr7de_primaryownerssnein
    ),
    cr7de_primaryphonenumber: valueOrEmpty(
      record?.cr7de_primaryphonenumber
    ),
    cr7de_secondaryowneremail: valueOrEmpty(
      record?.cr7de_secondaryowneremail
    ),
    cr7de_secondaryownerssnein: valueOrEmpty(
      record?.cr7de_secondaryownerssnein
    ),
    cr7de_secondaryphonenumber: valueOrEmpty(
      record?.cr7de_secondaryphonenumber
    ),
    cr7de_selleraccountzerobalanceconfirmed:
      record?.cr7de_selleraccountzerobalanceconfirmed ?? false,
    cr7de_sellercontactemail: valueOrEmpty(
      record?.cr7de_sellercontactemail
    ),
    cr7de_sellercontactnumber: valueOrEmpty(
      record?.cr7de_sellercontactnumber
    ),
    cr7de_sellername: valueOrEmpty(
      record?.cr7de_sellername ??
        closingTicket.cr7de_sellername
    ),
    cr7de_sellerssnein: valueOrEmpty(
      record?.cr7de_sellerssnein
    ),
    cr7de_sellertcode: valueOrEmpty(
      record?.cr7de_sellertcode ??
        closingTicket.cr7de_sellertcode
    ),
    cr7de_ticketid: valueOrEmpty(
      record?.cr7de_ticketid ?? closingTicket.cr7de_ticketid
    ),
    cr7de_unit: valueOrEmpty(
      record?.cr7de_unit ?? closingTicket.cr7de_unitnumber
    ),
    statecode: record?.statecode ?? '',
    statuscode: record?.statuscode ?? '',
  }
}

function normalizeText(value: string) {
  const trimmedValue = value.trim()
  return trimmedValue === '' ? undefined : trimmedValue
}

function toPayload(
  formState: NewOwnerTicketFormState,
  includeStateFields: boolean
): NewOwnerTicketInput {
  const payload: NewOwnerTicketInput = {
    cr109_additional_occupants1name: normalizeText(
      formState.cr109_additional_occupants1name
    ),
    cr109_additionaloccupant2name: normalizeText(
      formState.cr109_additionaloccupant2name
    ),
    cr109_additionaloccupant3name: normalizeText(
      formState.cr109_additionaloccupant3name
    ),
    cr109_amountfinanced: normalizeText(
      formState.cr109_amountfinanced
    ),
    cr109_buyer1address: normalizeText(
      formState.cr109_buyer1address
    ),
    cr109_buyer1city: normalizeText(
      formState.cr109_buyer1city
    ),
    cr109_buyer1state: normalizeText(
      formState.cr109_buyer1state
    ),
    cr109_buyer1zip: normalizeText(
      formState.cr109_buyer1zip
    ),
    cr109_buyer2address: normalizeText(
      formState.cr109_buyer2address
    ),
    cr109_buyer2city: normalizeText(
      formState.cr109_buyer2city
    ),
    cr109_buyer2state: normalizeText(
      formState.cr109_buyer2state
    ),
    cr109_buyer2zip: normalizeText(
      formState.cr109_buyer2zip
    ),
    cr109_lendersname: normalizeText(
      formState.cr109_lendersname
    ),
    cr109_primaryhomephonenumber: normalizeText(
      formState.cr109_primaryhomephonenumber
    ),
    cr109_primaryworkphonenumber: normalizeText(
      formState.cr109_primaryworkphonenumber
    ),
    cr109_purchaseprice: normalizeText(
      formState.cr109_purchaseprice
    ),
    cr109_purchaser1occupancy: normalizeText(
      formState.cr109_purchaser1occupancy
    ),
    cr109_purchaser1purchasedate: normalizeText(
      formState.cr109_purchaser1purchasedate
    ),
    cr109_purchaser2occupancy: normalizeText(
      formState.cr109_purchaser2occupancy
    ),
    cr109_secondaryownerhomephonenumber: normalizeText(
      formState.cr109_secondaryownerhomephonenumber
    ),
    cr109_secondaryownerworkphonenumber: normalizeText(
      formState.cr109_secondaryownerworkphonenumber
    ),
    cr109_seller1address: normalizeText(
      formState.cr109_seller1address
    ),
    cr109_seller1city: normalizeText(
      formState.cr109_seller1city
    ),
    cr109_seller1state: normalizeText(
      formState.cr109_seller1state
    ),
    cr109_seller1zip: normalizeText(
      formState.cr109_seller1zip
    ),
    cr109_seller2address: normalizeText(
      formState.cr109_seller2address
    ),
    cr109_seller2city: normalizeText(
      formState.cr109_seller2city
    ),
    cr109_seller2name: normalizeText(
      formState.cr109_seller2name
    ),
    cr109_seller2ssnein: normalizeText(
      formState.cr109_seller2ssnein
    ),
    cr109_seller2state: normalizeText(
      formState.cr109_seller2state
    ),
    cr109_seller2zip: normalizeText(
      formState.cr109_seller2zip
    ),
    cr109_shares: normalizeText(formState.cr109_shares),
    cr7de_address: normalizeText(formState.cr7de_address),
    cr7de_alternatemailingaddress: normalizeText(
      formState.cr7de_alternatemailingaddress
    ),
    cr7de_closingdate:
      formState.cr7de_closingdate || undefined,
    cr7de_forwardingaddressforseller: normalizeText(
      formState.cr7de_forwardingaddressforseller
    ),
    cr7de_newprimaryownername: normalizeText(
      formState.cr7de_newprimaryownername
    ),
    cr7de_newsecondaryownername: normalizeText(
      formState.cr7de_newsecondaryownername
    ),
    cr7de_paymentappliedtoselleraccount: normalizeText(
      formState.cr7de_paymentappliedtoselleraccount
    ),
    cr7de_primaryowneremail: normalizeText(
      formState.cr7de_primaryowneremail
    ),
    cr7de_primaryownerssnein: normalizeText(
      formState.cr7de_primaryownerssnein
    ),
    cr7de_primaryphonenumber: normalizeText(
      formState.cr7de_primaryphonenumber
    ),
    cr7de_secondaryowneremail: normalizeText(
      formState.cr7de_secondaryowneremail
    ),
    cr7de_secondaryownerssnein: normalizeText(
      formState.cr7de_secondaryownerssnein
    ),
    cr7de_secondaryphonenumber: normalizeText(
      formState.cr7de_secondaryphonenumber
    ),
    cr7de_selleraccountzerobalanceconfirmed:
      formState.cr7de_selleraccountzerobalanceconfirmed,
    cr7de_sellercontactemail: normalizeText(
      formState.cr7de_sellercontactemail
    ),
    cr7de_sellercontactnumber: normalizeText(
      formState.cr7de_sellercontactnumber
    ),
    cr7de_sellername: normalizeText(
      formState.cr7de_sellername
    ),
    cr7de_sellerssnein: normalizeText(
      formState.cr7de_sellerssnein
    ),
    cr7de_sellertcode: normalizeText(
      formState.cr7de_sellertcode
    ),
    cr7de_ticketid: normalizeText(formState.cr7de_ticketid),
    cr7de_unit: normalizeText(formState.cr7de_unit),
  }

  if (includeStateFields) {
    payload.statecode =
      formState.statecode === ''
        ? undefined
        : formState.statecode
    payload.statuscode =
      formState.statuscode === ''
        ? undefined
        : formState.statuscode
  }

  return payload
}

function isValidEmail(value: string) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validateForm(
  formState: NewOwnerTicketFormState
): ValidationErrors {
  const errors: ValidationErrors = {}

  if (!formState.cr7de_ticketid.trim()) {
    errors.cr7de_ticketid = 'Ticket ID is required.'
  }

  if (!formState.cr7de_unit.trim()) {
    errors.cr7de_unit = 'Unit is required.'
  }

  if (!formState.cr7de_newprimaryownername.trim()) {
    errors.cr7de_newprimaryownername =
      'Primary owner is required.'
  }

  if (!isValidEmail(formState.cr7de_primaryowneremail)) {
    errors.cr7de_primaryowneremail =
      'Enter a valid email address.'
  }

  if (!isValidEmail(formState.cr7de_secondaryowneremail)) {
    errors.cr7de_secondaryowneremail =
      'Enter a valid email address.'
  }

  if (!isValidEmail(formState.cr7de_sellercontactemail)) {
    errors.cr7de_sellercontactemail =
      'Enter a valid email address.'
  }

  return errors
}

export function NewOwnerTicketTab({
  closingTicket,
  onSaved,
}: NewOwnerTicketTabProps) {
  const [record, setRecord] =
    useState<NewOwnerTicketRecord | null>(null)
  const [formState, setFormState] =
    useState<NewOwnerTicketFormState>(() =>
      getInitialFormState(closingTicket)
    )
  const [selectedDocument, setSelectedDocument] =
    useState<NewOwnerDocumentKey | null>(() =>
      getDefaultDocument(closingTicket)
    )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] =
    useState<ValidationErrors>({})

  const defaultDocument = useMemo(
    () => getDefaultDocument(closingTicket),
    [closingTicket]
  )

  useEffect(() => {
    setSelectedDocument(defaultDocument)
  }, [defaultDocument])

  useEffect(() => {
    let isMounted = true

    async function loadNewOwnerTicket() {
      setLoading(true)
      setError(null)
      setMessage(null)

      try {
        const existingRecord =
          await getNewOwnerTicketByTicketId(
            closingTicket.cr7de_ticketid ?? ''
          )

        if (isMounted) {
          setRecord(existingRecord)
          setFormState(
            getInitialFormState(
              closingTicket,
              existingRecord
            )
          )
          setValidationErrors({})
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load new owner ticket.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadNewOwnerTicket()

    return () => {
      isMounted = false
    }
  }, [closingTicket])

  const updateField = useCallback(
    <TKey extends keyof NewOwnerTicketFormState>(
      field: TKey,
      value: NewOwnerTicketFormState[TKey]
    ) => {
      setFormState((currentState) => ({
        ...currentState,
        [field]: value,
      }))
      setValidationErrors((currentErrors) => {
        if (!currentErrors[field as EditableNewOwnerTicketField]) {
          return currentErrors
        }

        const nextErrors = { ...currentErrors }
        delete nextErrors[field as EditableNewOwnerTicketField]
        return nextErrors
      })
    },
    []
  )

  const saveRecord = useCallback(async () => {
    const nextValidationErrors = validateForm(formState)
    setValidationErrors(nextValidationErrors)

    if (Object.keys(nextValidationErrors).length > 0) {
      setError('Resolve the highlighted fields before saving.')
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const savedRecord = await saveNewOwnerTicket(
        record?.cr7de_newownerticketdetailsid ?? null,
        toPayload(formState, Boolean(record))
      )
      setRecord(savedRecord)
      setFormState(
        getInitialFormState(closingTicket, savedRecord)
      )
      setMessage('New owner ticket saved successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save new owner ticket.'
      )
    } finally {
      setSaving(false)
    }
  }, [closingTicket, formState, record])

  const showValidateButton =
    closingTicket.cr7de_ticketstatus === VALIDATED_TICKET_STATUS

  const validateClosingTicket = useCallback(async () => {
    const recordId = closingTicket.cr7de_closingticketdetailsid

    if (!recordId) {
      setError('Unable to validate: closing ticket ID is missing.')
      return
    }

    setValidating(true)
    setError(null)
    setMessage(null)

    try {
      await updateClosingTicket(recordId, {
        cr7de_ticketstatus: TRANSFERRING_BUILDING_STATUS,
        cr109_botstatus: INFORMATION_VALIDATED_BOT_STATUS,
      })
      await onSaved()
      setMessage('Closing ticket validation submitted successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to validate closing ticket.'
      )
    } finally {
      setValidating(false)
    }
  }, [closingTicket.cr7de_closingticketdetailsid, onSaved])

  return (
    <section className="grid gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Workflow Form
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">
              New Owner Ticket
            </h3>
            <span className="mt-1 block text-sm text-slate-500">
              Linked to Closing Ticket{' '}
              {closingTicket.cr7de_ticketid ?? 'current session'}
            </span>
          </div>
        </div>
      </div>

      {loading && (
        <LoadingSkeleton />
      )}

      {error && <StatusBanner type="error" message={error} />}
      {message && (
        <StatusBanner type="success" message={message} />
      )}

      {!loading && (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_440px] 2xl:grid-cols-[minmax(0,1fr)_520px]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
            <NewOwnerTicketForm
              formState={formState}
              errors={validationErrors}
              saving={saving}
              validating={validating}
              showValidateButton={showValidateButton}
              onFieldChange={updateField}
              onSubmit={saveRecord}
              onValidate={validateClosingTicket}
            />
          </div>

          <DocumentViewerPanel
            closingTicket={closingTicket}
            selectedDocument={selectedDocument}
            onSelectDocument={setSelectedDocument}
          />
        </div>
      )}
    </section>
  )
}
