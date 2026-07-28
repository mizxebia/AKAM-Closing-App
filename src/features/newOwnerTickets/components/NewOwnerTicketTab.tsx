import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ClipboardList, UserPlus } from 'lucide-react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import { LoadingSkeleton } from '../../../components/enterprise'
import { updateClosingTicket } from '../../closingTickets/api/closingTicketsService'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import {
  getUnconfirmedScheduledCharges,
  type ScheduledChargeRecord,
} from '../../charges'
import {
  ensureNewOwnerTicketForClosingTicket,
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
  hasDocument,
  NEW_OWNER_DOCUMENTS,
  type ClosingTicketDocumentKey,
} from '../utils/dataverseFileUtils'
import { buildClosingPayloadFromNewOwnerTicket } from '../utils/sharedTicketFields'
import { DocumentViewerPanel } from './DocumentViewerPanel'
import { NewOwnerTicketForm } from './NewOwnerTicketForm'
import { ProcessingDots } from '../../../components/feedback/ProcessingDots'

interface NewOwnerTicketTabProps {
  closingTicket: ClosingTicketRecord
  scheduledCharges?: ScheduledChargeRecord[]
  onSaved: () => Promise<void>
  onGenerateTicket?: () => Promise<void>
  generatingTicket?: boolean
  readOnly?: boolean
  isCompleted?: boolean
}

type ValidationErrors = Partial<
  Record<EditableNewOwnerTicketField, string>
>

const VALIDATED_TICKET_STATUS = 716070001
const TRANSFERRING_BUILDING_STATUS = 716070002
const INFORMATION_VALIDATED_BOT_STATUS = 396620007
const BOT_STATUS_YARDI_CHARGES_FETCHED = 396620011
const BOT_STATUS_YARDI_CHARGES_UPDATED = 396620021

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
    cr109_buildingname: valueOrEmpty(
      record?.cr109_buildingname ??
        closingTicket.cr7de_buildingname
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
    cr109_nyccode: valueOrEmpty(
      record?.cr109_nyccode ?? closingTicket.cr7de_nyccode
    ),
    cr109_primaryhomephonenumber: valueOrEmpty(
      record?.cr109_primaryhomephonenumber
    ),
    cr109_primaryownertcode: valueOrEmpty(
      record?.cr109_primaryownertcode ??
        closingTicket.cr7de_buyertcode
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
    ) || 'Present',
    cr109_purchaser1purchasedate: valueOrEmpty(
      record?.cr109_purchaser1purchasedate
    ),
    cr109_purchaser2occupancy: valueOrEmpty(
      record?.cr109_purchaser2occupancy
    ) || 'Present',
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
    ) ?? 'N/A',
    cr109_additionaloccupant2name: normalizeText(
      formState.cr109_additionaloccupant2name
    ) ?? 'N/A',
    cr109_additionaloccupant3name: normalizeText(
      formState.cr109_additionaloccupant3name
    ) ?? 'N/A',
    cr109_amountfinanced: normalizeText(
      formState.cr109_amountfinanced
    ),
    cr109_buildingname: normalizeText(
      formState.cr109_buildingname
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
    cr109_nyccode: normalizeText(formState.cr109_nyccode),
    cr109_primaryhomephonenumber: normalizeText(
      formState.cr109_primaryhomephonenumber
    ),
    cr109_primaryownertcode: normalizeText(
      formState.cr109_primaryownertcode
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
  // Only enforce email format when the user typed something that looks like
  // an email (contains '@'). Values like 'N/A', placeholders, or phone
  // numbers are accepted as-is — Dataverse has no email-type constraint here.
  if (!value || !value.includes('@')) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
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
  scheduledCharges = [],
  onSaved,
  onGenerateTicket,
  generatingTicket,
  readOnly = false,
  isCompleted = false,
}: NewOwnerTicketTabProps) {
  const [record, setRecord] =
    useState<NewOwnerTicketRecord | null>(null)
  const [formState, setFormState] =
    useState<NewOwnerTicketFormState>(() =>
      getInitialFormState(closingTicket)
    )
  const [selectedDocument, setSelectedDocument] =
    useState<ClosingTicketDocumentKey | null>(() =>
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

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 5000)
    return () => clearTimeout(timer)
  }, [message])

  useEffect(() => {
    let isMounted = true

    async function loadNewOwnerTicket() {
      setLoading(true)
      setError(null)
      setMessage(null)

      try {
        const existingRecord =
          await ensureNewOwnerTicketForClosingTicket(
            closingTicket
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
      const payload = toPayload(formState, Boolean(record))
      const savedRecord = await saveNewOwnerTicket(
        record?.cr7de_newownerticketdetailsid ?? null,
        payload,
        record ?? undefined
      )

      // Write stitched fields back to the closing ticket
      await updateClosingTicket(
        closingTicket.cr7de_closingticketdetailsid,
        buildClosingPayloadFromNewOwnerTicket(payload)
      )
      await onSaved()

      // savedRecord is now always non-null (service re-fetches on 204).
      // Use it as the source of truth so form state reflects what is
      // actually in Dataverse and the record ID is preserved for future saves.
      if (savedRecord) {
        setRecord(savedRecord)
        setFormState(getInitialFormState(closingTicket, savedRecord))
      }

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
  }, [closingTicket, formState, onSaved, record])

  const hasUnconfirmedScheduledCharges =
    getUnconfirmedScheduledCharges(scheduledCharges).length > 0

  const missingDocuments = NEW_OWNER_DOCUMENTS.filter(
    (doc) => !hasDocument(closingTicket, doc)
  )

  const meetsStatusAndBotStatus =
    closingTicket.cr7de_ticketstatus === VALIDATED_TICKET_STATUS &&
    (Number(closingTicket.cr109_botstatus) === BOT_STATUS_YARDI_CHARGES_FETCHED ||
      Number(closingTicket.cr109_botstatus) === BOT_STATUS_YARDI_CHARGES_UPDATED)

  const showValidateButton =
    meetsStatusAndBotStatus &&
    missingDocuments.length === 0 &&
    !hasUnconfirmedScheduledCharges

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

      // Regenerate the New Owner Ticket PDF immediately after validation
      // so the latest data is reflected in the generated document.
      if (onGenerateTicket) {
        await onGenerateTicket()
      }

      setMessage('Closing ticket validated. New Owner Ticket is being regenerated.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to validate closing ticket.'
      )
    } finally {
      setValidating(false)
    }
  }, [closingTicket.cr7de_closingticketdetailsid, onSaved, onGenerateTicket])

  return (
    <section className="grid gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <div className="flex items-start justify-between gap-3">
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

          {onGenerateTicket && (
            <button
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#1E3A47] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152d38] disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={onGenerateTicket}
              disabled={generatingTicket}
            >
              <UserPlus className="size-4" />
              {generatingTicket
                ? 'Generating...'
                : 'Generate New Owner Ticket'}
            </button>
          )}
        </div>
      </div>

      {loading && (
        <LoadingSkeleton />
      )}

      {error && <StatusBanner type="error" message={error} />}
      {readOnly && (
        <div className="form-alert form-alert-readonly">
          {isCompleted ? (
            <span className="readonly-completed-indicator" role="status" aria-label="Completed">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}>
                <circle cx="10" cy="10" r="9" fill="#0F6E56" opacity="0.15"/>
                <path d="M6 10.5l3 3 5-6" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Completed Successfully — this ticket is locked.
            </span>
          ) : (
            <ProcessingDots />
          )}
        </div>
      )}
      {message && (
        <StatusBanner type="success" message={message} />
      )}
      {meetsStatusAndBotStatus && missingDocuments.length > 0 && (
        <div className="form-alert form-alert-warning">
          Missing document{missingDocuments.length !== 1 ? 's' : ''} required
          to validate: {missingDocuments.map((doc) => doc.label).join(', ')}.
          {missingDocuments.some(
            (doc) => doc.key === 'newOwnerTicketPdf'
          ) && ' Click "Generate New Owner Ticket" to create the missing PDF.'}
        </div>
      )}
      {meetsStatusAndBotStatus &&
        missingDocuments.length === 0 &&
        hasUnconfirmedScheduledCharges && (
          <div className="form-alert form-alert-warning">
            Validation is blocked — one or more Scheduled Charges in the
            Yardi Charges tab have an unconfirmed "TBD" amount. Update them
            with the actual charge amount before this ticket can be
            validated.
          </div>
        )}

      {!loading && (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_minmax(0,1fr)] xl:grid-cols-2">
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
              readOnly={readOnly}
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
