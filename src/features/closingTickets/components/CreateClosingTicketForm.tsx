import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { CalendarDays, Trash2, HelpCircle } from 'lucide-react'
import { Button } from '../../../components/ui/button'
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
import {
  Cr7de_closingticketdetailsescr109_packagetype,
  Cr7de_closingticketdetailsescr109_transactiontypedeal,
  Cr7de_closingticketdetailsescr7de_ticketstatus,
} from '../../../generated/models/Cr7de_closingticketdetailsesModel'
import {
  createClosingTicket,
  deleteClosingTicketFile,
  updateClosingTicket,
  uploadClosingTicketFile,
} from '../api/closingTicketsService'
import { syncNewOwnerTicketFromClosingTicket } from '../../newOwnerTickets/api/newOwnerTicketService'
import { BuildingCodeLookup } from './BuildingCodeLookup'
import type {
  ClosingTicketCreateInput,
  ClosingTicketFormState,
  ClosingTicketRecord,
} from '../types/closingTicket'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { ProcessingDots } from '../../../components/feedback/ProcessingDots'
import { getBuildings } from '../data/buildingListCache'

type FormErrors = Partial<
  Record<keyof ClosingTicketFormState, string>
>

type UploadColumnName =
  | 'cr109_purchaseapplicationform'
  | 'cr109_rpttdocument'

type PendingFiles = Partial<Record<UploadColumnName, File>>
type UploadedFileNames = Partial<Record<UploadColumnName, string>>

const READY_FOR_POST_CLOSING_STATUS = 716070006
const POST_CLOSING_STATUS = 716070004
const PURCHASE_FORM_DATA_EXTRACTED_BOT_STATUS = 396620013
const emptyUploadedFileNames: UploadedFileNames = {}

interface CreateClosingTicketFormProps {
  onCancel: () => void
  onCreated: () => Promise<void>
}

interface EditClosingTicketFormProps {
  record: ClosingTicketRecord
  onCancel: () => void
  onSaved: () => Promise<void>
  readOnly?: boolean
}

const emptyFormState: ClosingTicketFormState = {
  cr109_botstatus: '',
  cr109_buyer2name: '',
  cr109_domecilepackageurl: '',
  cr109_legalname: '',
  cr109_locationofclosing: '99 Park Avenue, 14th Floor, New York, NY 10014',
  cr109_packagetype: '',
  cr109_saleprice: '',
  cr109_seller2name: '',
  cr109_shares: '',
  cr109_transactiontypedeal: '',
  cr7de_buildingaddress: '',
  cr7de_buildingname: '',
  cr7de_buildingnotondomicile: false,
  cr7de_buyerexistsinyardi: false,
  cr7de_buyername: '',
  cr7de_buyertcode: '',
  cr7de_closingagentemail: '',
  cr7de_closingagentname: '',
  cr7de_closingagentphone: '',
  cr7de_closingdate: '',
  cr7de_notes: '',
  cr7de_nyccode: '',
  cr7de_sellername: '',
  cr7de_sellertcode: '',
  cr7de_ticketid: '',
  cr7de_ticketstatus: 716070000,
  cr7de_titlerole: '',
  cr7de_unitnumber: '',
}

function generateTicketId() {
  const randomNumber = Math.floor(
    Math.random() * 1_000_000_000
  )

  return `CL-${String(randomNumber).padStart(9, '0')}`
}

function createInitialFormState(): ClosingTicketFormState {
  return {
    ...emptyFormState,
    cr7de_ticketid: generateTicketId(),
  }
}

function getDateInputValue(value?: string) {
  if (!value) {
    return ''
  }

  const parsedDate = new Date(value)

  return Number.isNaN(parsedDate.getTime())
    ? value.slice(0, 10)
    : parsedDate.toISOString().slice(0, 10)
}

function getRecordFormState(
  record: ClosingTicketRecord
): ClosingTicketFormState {
  return {
    cr109_botstatus: record.cr109_botstatus ?? '',
    cr109_buyer2name: record.cr109_buyer2name ?? '',
    cr109_domecilepackageurl:
      record.cr109_domecilepackageurl ?? '',
    cr109_legalname: record.cr109_legalname ?? '',
    cr109_locationofclosing:
      record.cr109_locationofclosing ??
      '99 Park Avenue, 14th Floor, New York, NY 10014',
    cr109_packagetype: record.cr109_packagetype ?? '',
    cr109_saleprice: record.cr109_saleprice ?? '',
    cr109_seller2name: record.cr109_seller2name ?? '',
    cr109_shares: record.cr109_shares ?? '',
    cr109_transactiontypedeal:
      record.cr109_transactiontypedeal ?? '',
    cr7de_buildingaddress:
      record.cr7de_buildingaddress ?? '',
    cr7de_buildingname: record.cr7de_buildingname ?? '',
    cr7de_buildingnotondomicile:
      record.cr7de_buildingnotondomicile ?? false,
    cr7de_buyerexistsinyardi:
      record.cr7de_buyerexistsinyardi ?? false,
    cr7de_buyername: record.cr7de_buyername ?? '',
    cr7de_buyertcode: record.cr7de_buyertcode ?? '',
    cr7de_closingagentemail:
      record.cr7de_closingagentemail ?? '',
    cr7de_closingagentname:
      record.cr7de_closingagentname ?? '',
    cr7de_closingagentphone:
      record.cr7de_closingagentphone ?? '',
    cr7de_closingdate: getDateInputValue(
      record.cr7de_closingdate
    ),
    cr7de_notes: record.cr7de_notes ?? '',
    cr7de_nyccode: record.cr7de_nyccode ?? '',
    cr7de_sellername: record.cr7de_sellername ?? '',
    cr7de_sellertcode: record.cr7de_sellertcode ?? '',
    cr7de_ticketid: record.cr7de_ticketid ?? '',
    cr7de_ticketstatus:
      record.cr7de_ticketstatus ?? 716070000,
    cr7de_titlerole: record.cr7de_titlerole ?? '',
    cr7de_unitnumber: record.cr7de_unitnumber ?? '',
  }
}

function toChoiceOptions<T extends Record<number, string>>(
  choices: T
) {
  return Object.entries(choices).map(
    ([value, label]) => ({
      value,
      label,
    })
  )
}

function getDateFromInputValue(value: string) {
  const [year, month, day] = value
    .split('-')
    .map(Number)

  if (!year || !month || !day) {
    return undefined
  }

  return new Date(year, month - 1, day)
}

function getInputValueFromDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(
    2,
    '0'
  )
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDisplayDate(value: string) {
  const date = getDateFromInputValue(value)

  if (!date) {
    return ''
  }

  return date.toLocaleDateString(undefined, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const weekdayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getCalendarDates(viewDate: Date) {
  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1
  )
  const firstVisibleDate = new Date(firstDayOfMonth)
  firstVisibleDate.setDate(
    firstVisibleDate.getDate() - firstDayOfMonth.getDay()
  )

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDate)
    date.setDate(firstVisibleDate.getDate() + index)
    return date
  })
}

function isSameCalendarDate(
  firstDate?: Date,
  secondDate?: Date
) {
  return (
    firstDate?.getFullYear() === secondDate?.getFullYear() &&
    firstDate?.getMonth() === secondDate?.getMonth() &&
    firstDate?.getDate() === secondDate?.getDate()
  )
}

function formatChoiceLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    )
}

function normalizeText(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue === ''
    ? undefined
    : trimmedValue
}

function buildPayload(
  formState: ClosingTicketFormState
): ClosingTicketCreateInput {
  return {
    cr109_botstatus:
      formState.cr109_botstatus || undefined,
    cr109_buyer2name: normalizeText(
      formState.cr109_buyer2name
    ),
    cr109_domecilepackageurl: normalizeText(
      formState.cr109_domecilepackageurl
    ),
    cr109_legalname: normalizeText(
      formState.cr109_legalname
    ),
    cr109_locationofclosing: normalizeText(
      formState.cr109_locationofclosing
    ),
    cr109_packagetype:
      formState.cr109_packagetype || undefined,
    cr109_saleprice: normalizeText(
      formState.cr109_saleprice
    ),
    cr109_seller2name: normalizeText(
      formState.cr109_seller2name
    ),
    cr109_shares: normalizeText(formState.cr109_shares),
    cr109_transactiontypedeal:
      formState.cr109_transactiontypedeal ||
      undefined,
    cr7de_buildingaddress: normalizeText(
      formState.cr7de_buildingaddress
    ),
    cr7de_buildingname: normalizeText(
      formState.cr7de_buildingname
    ),
    cr7de_buildingnotondomicile:
      formState.cr7de_buildingnotondomicile,
    cr7de_buyerexistsinyardi:
      formState.cr7de_buyerexistsinyardi,
    cr7de_buyername: normalizeText(
      formState.cr7de_buyername
    ),
    cr7de_buyertcode: normalizeText(
      formState.cr7de_buyertcode
    ),
    cr7de_closingagentemail: normalizeText(
      formState.cr7de_closingagentemail
    ),
    cr7de_closingagentname: normalizeText(
      formState.cr7de_closingagentname
    ),
    cr7de_closingagentphone: normalizeText(
      formState.cr7de_closingagentphone
    ),
    cr7de_closingdate:
      formState.cr7de_closingdate || undefined,
    cr7de_notes: normalizeText(formState.cr7de_notes),
    cr7de_nyccode: normalizeText(
      formState.cr7de_nyccode
    ),
    cr7de_sellername: normalizeText(
      formState.cr7de_sellername
    ),
    cr7de_sellertcode: normalizeText(
      formState.cr7de_sellertcode
    ),
    cr7de_ticketid: normalizeText(
      formState.cr7de_ticketid
    ),
    cr7de_ticketstatus:
      formState.cr7de_ticketstatus || undefined,
    cr7de_titlerole: normalizeText(
      formState.cr7de_titlerole
    ),
    cr7de_unitnumber: normalizeText(
      formState.cr7de_unitnumber
    ),
  }
}

function validateForm(
  formState: ClosingTicketFormState
): FormErrors {
  const errors: FormErrors = {}

  if (!formState.cr7de_ticketid.trim()) {
    errors.cr7de_ticketid = 'Ticket ID is required.'
  }

  if (!formState.cr7de_ticketstatus) {
    errors.cr7de_ticketstatus =
      'Ticket status is required.'
  }

  if (!formState.cr7de_unitnumber.trim()) {
    errors.cr7de_unitnumber =
      'Unit number is required.'
  }

  if (!formState.cr7de_nyccode.trim()) {
    errors.cr7de_nyccode = 'NYC code is required.'
  }

  if (!formState.cr109_packagetype) {
    errors.cr109_packagetype = 'Package type is required.'
  }

  if (
    formState.cr7de_closingagentemail.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      formState.cr7de_closingagentemail
    )
  ) {
    errors.cr7de_closingagentemail =
      'Enter a valid email address.'
  }

  return errors
}

async function uploadPendingFiles(
  recordId: string,
  pendingFiles: PendingFiles
) {
  const uploads = Object.entries(pendingFiles).filter(
    (entry): entry is [UploadColumnName, File] =>
      entry[1] instanceof File
  )

  for (const [columnName, file] of uploads) {
    await uploadClosingTicketFile(recordId, columnName, file)
  }
}

export function CreateClosingTicketForm({
  onCancel,
  onCreated,
}: CreateClosingTicketFormProps) {
  return (
    <ClosingTicketEditorForm
      mode="create"
      initialFormState={createInitialFormState()}
      submitLabel="Save"
      savingLabel="Saving..."
      onCancel={onCancel}
      onSubmit={async (formState, pendingFiles) => {
        const record = await createClosingTicket(
          buildPayload(formState)
        )
        await syncNewOwnerTicketFromClosingTicket(record)
        await uploadPendingFiles(
          record.cr7de_closingticketdetailsid,
          pendingFiles
        )
      }}
      onSuccess={onCreated}
    />
  )
}

export function EditClosingTicketForm({
  record,
  onCancel,
  onSaved,
  readOnly = false,
}: EditClosingTicketFormProps) {
  return (
    <ClosingTicketEditorForm
      mode="edit"
      readOnly={readOnly}
      initialFormState={getRecordFormState(record)}
      initialFileNames={{
        cr109_purchaseapplicationform:
          record.cr109_purchaseapplicationform_name,
        cr109_rpttdocument:
          record.cr109_rpttdocument_name,
      }}
      recordId={record.cr7de_closingticketdetailsid}
      submitLabel="Save"
      savingLabel="Saving..."
      onCancel={onCancel}
      onSubmit={async (formState, pendingFiles) => {
        const updatedRecord = await updateClosingTicket(
          record.cr7de_closingticketdetailsid,
          buildPayload(formState)
        )
        await syncNewOwnerTicketFromClosingTicket(updatedRecord)
        await uploadPendingFiles(
          record.cr7de_closingticketdetailsid,
          pendingFiles
        )
      }}
      onSuccess={onSaved}
    />
  )
}

function ClosingTicketEditorForm({
  mode,
  initialFormState,
  initialFileNames = emptyUploadedFileNames,
  recordId,
  submitLabel,
  submitAndCloseLabel,
  savingLabel,
  onCancel,
  onSubmit,
  onSuccess,
  onSubmitAndClose,
  readOnly = false,
}: {
  mode: 'create' | 'edit'
  initialFormState: ClosingTicketFormState
  initialFileNames?: Partial<
    Record<UploadColumnName, string>
  >
  recordId?: string
  submitLabel: string
  submitAndCloseLabel?: string
  savingLabel: string
  onCancel: () => void
  onSubmit: (
    formState: ClosingTicketFormState,
    pendingFiles: PendingFiles
  ) => Promise<void>
  onSuccess: () => Promise<void>
  onSubmitAndClose?: () => Promise<void>
  readOnly?: boolean
}) {
  const [formState, setFormState] =
    useState<ClosingTicketFormState>(initialFormState)
  const [pendingFiles, setPendingFiles] =
    useState<PendingFiles>({})
  const [uploadedFileNames, setUploadedFileNames] =
    useState<UploadedFileNames>(initialFileNames)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saveError, setSaveError] = useState<
    string | null
  >(null)
  const [saving, setSaving] = useState(false)
  const [buildingLookupOpen, setBuildingLookupOpen] =
    useState(false)
  const submitIntentRef = useRef<'save' | 'submit'>(
    'save'
  )
  const { userName, userEmail } = useCurrentUser()

  useEffect(() => {
    setUploadedFileNames(initialFileNames)
  }, [
    initialFileNames.cr109_purchaseapplicationform,
    initialFileNames.cr109_rpttdocument,
  ])

  const ticketStatusOptions = useMemo(
    () =>
      toChoiceOptions(
        Cr7de_closingticketdetailsescr7de_ticketstatus
      ),
    []
  )

  const transactionTypeOptions = useMemo(
    () =>
      toChoiceOptions(
        Cr7de_closingticketdetailsescr109_transactiontypedeal
      ),
    []
  )

  const packageTypeOptions = useMemo(
    () =>
      toChoiceOptions(
        Cr7de_closingticketdetailsescr109_packagetype
      ),
    []
  )

  const ticketStatusLabel = useMemo(() => {
    if (!formState.cr7de_ticketstatus) {
      return ''
    }

    return (
      Cr7de_closingticketdetailsescr7de_ticketstatus[
        formState.cr7de_ticketstatus
      ] ?? String(formState.cr7de_ticketstatus)
    )
  }, [formState.cr7de_ticketstatus])

  const showMoveToPostClosing =
    ticketStatusLabel === 'ReadyForPostClosing'
  const hasUploadedRealPropertyDocument = Boolean(
    uploadedFileNames.cr109_rpttdocument
  )
  const isCreateMode = mode === 'create'
  const showDocumentsSection =
    !isCreateMode || formState.cr7de_buildingnotondomicile

  useEffect(() => {
    if (!userName && !userEmail) {
      return
    }

    setFormState((currentState) => ({
      ...currentState,
      cr7de_closingagentname:
        currentState.cr7de_closingagentname ||
        userName ||
        '',
      cr7de_closingagentemail:
        currentState.cr7de_closingagentemail ||
        userEmail ||
        '',
    }))
  }, [userEmail, userName])

  useEffect(() => {
    if (
      !isCreateMode ||
      formState.cr7de_buildingnotondomicile
    ) {
      return
    }

    setPendingFiles({})
  }, [formState.cr7de_buildingnotondomicile, isCreateMode])

  // When the NYC Code is typed manually, look it up in the cached building
  // list and auto-populate the Legal Name if a match is found.
  useEffect(() => {
    const code = formState.cr7de_nyccode.trim()
    if (!code) return

    void getBuildings().then((buildings) => {
      const match = buildings.find(
        (b) => b.yardiId.toLowerCase() === code.toLowerCase()
      )
      if (match && match.legalName) {
        setFormState((prev) => ({
          ...prev,
          cr109_legalname: match.legalName,
        }))
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.cr7de_nyccode])

  const updateTicketStatus = async (
    nextStatus: number,
    nextBotStatus?: number
  ) => {
    if (!recordId) {
      return
    }

    const nextFormState = {
      ...formState,
      cr7de_ticketstatus: nextStatus as ClosingTicketFormState['cr7de_ticketstatus'],
      ...(nextBotStatus !== undefined
        ? { cr109_botstatus: nextBotStatus as ClosingTicketFormState['cr109_botstatus'] }
        : {}),
    }

    setSaving(true)
    setSaveError(null)

    try {
      await updateClosingTicket(
        recordId,
        buildPayload(nextFormState)
      )
      setFormState(nextFormState)
      await onSuccess()
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Unable to update ticket status.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleMoveToPostClosing = async () => {
    if (!hasUploadedRealPropertyDocument) {
      return
    }

    await updateTicketStatus(POST_CLOSING_STATUS)
  }

  const handleDeleteDocument = async (
    columnName: UploadColumnName
  ) => {
    setPendingFiles((currentFiles) => {
      const nextFiles = { ...currentFiles }
      delete nextFiles[columnName]
      return nextFiles
    })

    if (!recordId || !uploadedFileNames[columnName]) {
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      await deleteClosingTicketFile(recordId, columnName)
      const shouldResetToReadyForPostClosing =
        columnName === 'cr109_rpttdocument' &&
        (ticketStatusLabel === 'PostClosing' ||
          ticketStatusLabel === 'ValidateClosings')

      if (shouldResetToReadyForPostClosing) {
        const isFromValidate = ticketStatusLabel === 'ValidateClosings'
        const nextFormState: ClosingTicketFormState = {
          ...formState,
          cr7de_ticketstatus: READY_FOR_POST_CLOSING_STATUS,
          ...(isFromValidate
            ? { cr109_botstatus: PURCHASE_FORM_DATA_EXTRACTED_BOT_STATUS }
            : {}),
        }

        await updateClosingTicket(
          recordId,
          buildPayload(nextFormState)
        )
        setFormState(nextFormState)
      }

      setUploadedFileNames((currentNames) => {
        const nextNames = { ...currentNames }
        delete nextNames[columnName]
        return nextNames
      })
      await onSuccess()
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Unable to delete uploaded document.'
      )
    } finally {
      setSaving(false)
    }
  }

  const updateField = <
    TKey extends keyof ClosingTicketFormState,
  >(
    field: TKey,
    value: ClosingTicketFormState[TKey]
  ) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }))
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }))
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    const validationErrors = validateForm(formState)
    setErrors(validationErrors)
    setSaveError(null)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSaving(true)

    try {
      await onSubmit(formState, pendingFiles)
      if (mode === 'create') {
        setFormState(createInitialFormState())
        setPendingFiles({})
      }
      if (
        submitIntentRef.current === 'submit' &&
        onSubmitAndClose
      ) {
        await onSubmitAndClose()
      } else {
        await onSuccess()
      }
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Unable to save closing ticket.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="create-closing-form"
      onSubmit={handleSubmit}
    >
      {readOnly && (
        <div className="form-alert form-alert-readonly">
          <ProcessingDots />
        </div>
      )}
      {saveError && (
        <div className="form-alert form-alert-error">
          {saveError}
        </div>
      )}

      <fieldset disabled={readOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
      <div className="create-closing-form-scroll">
        <section className="form-section">
          <h3>Closing Details</h3>
          <div className="form-grid">
          <FormField
            label="Ticket ID"
            error={errors.cr7de_ticketid}
            required
          >
            <input
              value={formState.cr7de_ticketid}
              readOnly
              aria-readonly="true"
              onChange={(event) =>
                updateField(
                  'cr7de_ticketid',
                  event.target.value
                )
              }
              placeholder="CL-XXXXXXXXX"
            />
          </FormField>

          <FormField
            label="Ticket Status"
            error={errors.cr7de_ticketstatus}
            required
          >
            <select
              value={formState.cr7de_ticketstatus}
              disabled
              aria-readonly="true"
            >
              {ticketStatusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Unit Number"
            error={errors.cr7de_unitnumber}
            required
          >
            <input
              value={formState.cr7de_unitnumber}
              onChange={(event) =>
                updateField(
                  'cr7de_unitnumber',
                  event.target.value
                )
              }
              placeholder="e.g. 9E"
            />
          </FormField>

          <FormField
            label="NYC Code"
            error={errors.cr7de_nyccode}
            required
            labelAction={
              <button
                type="button"
                className="nyc-code-guide-btn"
                onClick={() => setBuildingLookupOpen(true)}
                title="Find NYC Code by building address"
              >
                <HelpCircle size={14} />
                <span>Find by address</span>
              </button>
            }
          >
            <input
              value={formState.cr7de_nyccode}
              onChange={(event) =>
                updateField(
                  'cr7de_nyccode',
                  event.target.value
                )
              }
              placeholder="e.g. NYC10010"
            />
          </FormField>

          <FormField label="Package Type" required error={errors.cr109_packagetype}>
            <select
              value={formState.cr109_packagetype}
              onChange={(event) =>
                updateField(
                  'cr109_packagetype',
                  (event.target.value === ''
                    ? ''
                    : Number(
                        event.target.value
                      )) as ClosingTicketFormState['cr109_packagetype']
                )
              }
            >
              <option value="">Select package</option>
              {packageTypeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {formatChoiceLabel(option.label)}
                </option>
              ))}
            </select>
          </FormField>

          {!isCreateMode && (
            <FormField label="Building Name">
              <input
                value={formState.cr7de_buildingname}
                onChange={(event) =>
                  updateField(
                    'cr7de_buildingname',
                    event.target.value
                  )
                }
                placeholder="Building name"
              />
            </FormField>
          )}

          {isCreateMode ? (
            <FormField label="Legal Name">
              <input
                value={formState.cr109_legalname}
                onChange={(event) =>
                  updateField(
                    'cr109_legalname',
                    event.target.value
                  )
                }
                placeholder="Auto-filled from NYC Code lookup"
              />
            </FormField>
          ) : (
            <FormField label="Closing Date">
              <DatePickerField
                value={formState.cr7de_closingdate}
                onChange={(value) =>
                  updateField(
                    'cr7de_closingdate',
                    value
                  )
                }
              />
            </FormField>
          )}

          {!isCreateMode && (
            <FormField label="Legal Name">
              <input
                value={formState.cr109_legalname}
                onChange={(event) =>
                  updateField(
                    'cr109_legalname',
                    event.target.value
                  )
                }
                placeholder="Auto-filled from NYC Code lookup"
              />
            </FormField>
          )}

          {/* Location of Closing — shown in both modes */}
          {isCreateMode && (
            <div className="form-grid-wide">
              <FormField label="Location of Closing">
                <input
                  value={formState.cr109_locationofclosing}
                  onChange={(event) =>
                    updateField(
                      'cr109_locationofclosing',
                      event.target.value
                    )
                  }
                  placeholder="99 Park Avenue, 14th Floor, New York, NY 10014"
                />
              </FormField>
            </div>
          )}

          {!isCreateMode && (
            <FormField label="Building Address">
              <input
                value={formState.cr7de_buildingaddress}
                onChange={(event) =>
                  updateField(
                    'cr7de_buildingaddress',
                    event.target.value
                  )
                }
                placeholder="e.g. 10 Park Avenue"
              />
            </FormField>
          )}

          {!isCreateMode && (
            <FormField label="Location of Closing">
              <input
                value={formState.cr109_locationofclosing}
                onChange={(event) =>
                  updateField(
                    'cr109_locationofclosing',
                    event.target.value
                  )
                }
                placeholder="99 Park Avenue, 14th Floor, New York, NY 10014"
              />
            </FormField>
          )}

          {!isCreateMode && (
            <div className="form-grid-wide">
              <FormField label="Domecile Package Url">
                <input
                  value={formState.cr109_domecilepackageurl}
                  readOnly
                  aria-readonly="true"
                />
              </FormField>
            </div>
          )}
          </div>
        </section>

        {!isCreateMode && (
          <section className="form-section">
            <h3>Parties</h3>
            <div className="form-grid">
            <FormField label="Buyer Name">
              <input
                value={formState.cr7de_buyername}
                onChange={(event) =>
                  updateField(
                    'cr7de_buyername',
                    event.target.value
                  )
                }
                placeholder="Buyer's full name"
              />
            </FormField>

            <FormField label="Seller Name">
              <input
                value={formState.cr7de_sellername}
                onChange={(event) =>
                  updateField(
                    'cr7de_sellername',
                    event.target.value
                  )
                }
                placeholder="Seller's full name"
              />
            </FormField>

            <FormField label="Buyer T-Code">
              <input
                value={formState.cr7de_buyertcode}
                onChange={(event) =>
                  updateField(
                    'cr7de_buyertcode',
                    event.target.value
                  )
                }
              />
            </FormField>

            <FormField label="Seller T-Code">
              <input
                value={formState.cr7de_sellertcode}
                onChange={(event) =>
                  updateField(
                    'cr7de_sellertcode',
                    event.target.value
                  )
                }
              />
            </FormField>

            <FormField label="Buyer 2 Name">
              <input
                value={formState.cr109_buyer2name}
                onChange={(event) =>
                  updateField(
                    'cr109_buyer2name',
                    event.target.value
                  )
                }
              />
            </FormField>

            <FormField label="Seller 2 Name">
              <input
                value={formState.cr109_seller2name}
                onChange={(event) =>
                  updateField(
                    'cr109_seller2name',
                    event.target.value
                  )
                }
              />
            </FormField>
            </div>
          </section>
        )}

        {!isCreateMode && (
          <section className="form-section">
            <h3>Transaction</h3>
            <div className="form-grid">
            <FormField label="Transaction Type">
              <select
                value={formState.cr109_transactiontypedeal}
                onChange={(event) =>
                  updateField(
                    'cr109_transactiontypedeal',
                    (event.target.value === ''
                      ? ''
                      : Number(
                          event.target.value
                        )) as ClosingTicketFormState['cr109_transactiontypedeal']
                  )
                }
              >
                <option value="">Select type</option>
                {transactionTypeOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Sale Price">
              <input
                type="number"
                inputMode="decimal"
                value={formState.cr109_saleprice}
                onChange={(event) =>
                  updateField(
                    'cr109_saleprice',
                    event.target.value
                  )
                }
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Shares">
              <input
                type="number"
                inputMode="decimal"
                value={formState.cr109_shares}
                onChange={(event) =>
                  updateField(
                    'cr109_shares',
                    event.target.value
                  )
                }
              />
            </FormField>
            </div>
          </section>
        )}

        <section className="form-section">
          <h3>Closing Agent</h3>
          <div className="form-grid">
          <FormField label="Agent Name">
            <input
              value={formState.cr7de_closingagentname}
              onChange={(event) =>
                updateField(
                  'cr7de_closingagentname',
                  event.target.value
                )
              }
            />
          </FormField>

          <FormField
            label="Agent Email"
            error={errors.cr7de_closingagentemail}
          >
            <input
              type="email"
              value={formState.cr7de_closingagentemail}
              onChange={(event) =>
                updateField(
                  'cr7de_closingagentemail',
                  event.target.value
                )
              }
            />
          </FormField>

          <FormField label="Title Role">
            <input
              value={formState.cr7de_titlerole}
              onChange={(event) =>
                updateField(
                  'cr7de_titlerole',
                  event.target.value
                )
              }
            />
          </FormField>

          <FormField label="Agent Phone">
            <input
              type="tel"
              value={formState.cr7de_closingagentphone}
              onChange={(event) =>
                updateField(
                  'cr7de_closingagentphone',
                  event.target.value
                )
              }
            />
          </FormField>
          </div>
        </section>

        <section className="form-section">
          <h3>Flags & Notes</h3>
          <div className="form-grid">
          <CheckboxField
            label="Building not on domicile"
            checked={
              formState.cr7de_buildingnotondomicile
            }
            onChange={(checked) =>
              updateField(
                'cr7de_buildingnotondomicile',
                checked
              )
            }
          />
          <CheckboxField
            label="Buyer exists in Yardi"
            checked={formState.cr7de_buyerexistsinyardi}
            onChange={(checked) =>
              updateField(
                'cr7de_buyerexistsinyardi',
                checked
              )
            }
          />
          <div className="form-grid-wide">
            <FormField label="Notes">
              <textarea
                rows={4}
                value={formState.cr7de_notes}
                onChange={(event) =>
                  updateField(
                    'cr7de_notes',
                    event.target.value
                  )
                }
                placeholder="Add notes about this closing..."
              />
            </FormField>
          </div>
          </div>
        </section>

        {showDocumentsSection && (
          <section className="form-section">
            <h3>Documents</h3>
            <div className="form-grid">
            <FileUploadField
              label="Purchase Application Form"
              currentFileName={
                pendingFiles.cr109_purchaseapplicationform
                  ?.name ??
                uploadedFileNames.cr109_purchaseapplicationform
              }
              onFileChange={(file) =>
                setPendingFiles((currentFiles) => ({
                  ...currentFiles,
                  cr109_purchaseapplicationform: file,
                }))
              }
              onDelete={() =>
                handleDeleteDocument(
                  'cr109_purchaseapplicationform'
                )
              }
            />
            <FileUploadField
              label="RPTT Document"
              currentFileName={
                pendingFiles.cr109_rpttdocument?.name ??
                uploadedFileNames.cr109_rpttdocument
              }
              onFileChange={(file) =>
                setPendingFiles((currentFiles) => ({
                  ...currentFiles,
                  cr109_rpttdocument: file,
                }))
              }
              onDelete={() =>
                handleDeleteDocument('cr109_rpttdocument')
              }
            />
            </div>
          </section>
        )}
      </div>
      </fieldset>

      {!readOnly && (
      <div className="form-actions">
        <button
          className="secondary-action-button"
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        {showMoveToPostClosing && (
          <button
            className="primary-action-button"
            type="button"
            onClick={handleMoveToPostClosing}
            disabled={
              saving || !hasUploadedRealPropertyDocument
            }
            title={
              hasUploadedRealPropertyDocument
                ? undefined
                : 'Upload a Real Property document before moving to Post Closing.'
            }
          >
            Move to Post Closing
          </button>
        )}
        <button
          className="primary-action-button"
          type="submit"
          onClick={() => {
            submitIntentRef.current = 'save'
          }}
          disabled={saving}
        >
          {saving ? savingLabel : submitLabel}
        </button>
        {submitAndCloseLabel && (
          <button
            className="primary-action-button"
            type="submit"
            onClick={() => {
              submitIntentRef.current = 'submit'
            }}
            disabled={saving}
          >
            {saving ? savingLabel : submitAndCloseLabel}
          </button>
        )}
      </div>
      )}

      <BuildingCodeLookup
        open={buildingLookupOpen}
        onOpenChange={setBuildingLookupOpen}
        onSelect={(yardiId, legalName) => {
          updateField('cr7de_nyccode', yardiId)
          updateField('cr109_legalname', legalName)
        }}
      />
    </form>
  )
}

function DatePickerField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const selectedDate = getDateFromInputValue(value)
  const today = new Date()
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(
    selectedDate ?? today
  )
  const calendarDates = getCalendarDates(viewDate)
  const yearOptions = Array.from(
    { length: 21 },
    (_, index) => viewDate.getFullYear() - 10 + index
  )

  const moveMonth = (offset: number) => {
    setViewDate(
      (currentDate) =>
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + offset,
          1
        )
    )
  }

  return (
    <div className="date-picker-field">
      <button
        className="date-picker-trigger"
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((isOpen) => !isOpen)
          setViewDate(selectedDate ?? today)
        }}
      >
        <span>
          {value ? formatDisplayDate(value) : 'Select date'}
        </span>
        <CalendarDays className="size-4" />
      </button>

      {open && (
        <div className="closing-date-popover">
          <div className="date-picker-header">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => moveMonth(-1)}
            >
              &lt;
            </button>
            <div className="date-picker-caption">
              <select
                value={viewDate.getMonth()}
                onChange={(event) =>
                  setViewDate(
                    new Date(
                      viewDate.getFullYear(),
                      Number(event.target.value),
                      1
                    )
                  )
                }
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={viewDate.getFullYear()}
                onChange={(event) =>
                  setViewDate(
                    new Date(
                      Number(event.target.value),
                      viewDate.getMonth(),
                      1
                    )
                  )
                }
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => moveMonth(1)}
            >
              &gt;
            </button>
          </div>

          <div className="date-picker-grid">
            {weekdayNames.map((weekday) => (
              <span
                key={weekday}
                className="date-picker-weekday"
              >
                {weekday}
              </span>
            ))}
            {calendarDates.map((date) => {
              const inCurrentMonth =
                date.getMonth() === viewDate.getMonth()
              const isSelected = isSameCalendarDate(
                date,
                selectedDate
              )
              const isToday = isSameCalendarDate(date, today)

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  className={
                    isSelected
                      ? 'date-picker-day date-picker-day-selected'
                      : isToday
                        ? 'date-picker-day date-picker-day-today'
                        : 'date-picker-day'
                  }
                  data-muted={!inCurrentMonth}
                  onClick={() => {
                    onChange(getInputValueFromDate(date))
                    setOpen(false)
                  }}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({
  label,
  required = false,
  error,
  labelAction,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  labelAction?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="form-field">
      <span className="form-field-label-row">
        <span>
          {required && (
            <strong aria-hidden="true">* </strong>
          )}
          {label}
        </span>
        {labelAction}
      </span>
      {children}
      {error && (
        <small className="form-error">{error}</small>
      )}
    </label>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="checkbox-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
      />
      <span>{label}</span>
    </label>
  )
}

function FileUploadField({
  label,
  currentFileName,
  onFileChange,
  onDelete,
}: {
  label: string
  currentFileName?: string
  onFileChange: (file: File) => void
  onDelete: () => void
}) {
  return (
    <div className="file-upload-field">
      <span>{label}</span>
      <div className="file-upload-box">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <p className="min-w-0 truncate">
            {currentFileName ?? 'There is no file.'}
          </p>
          {currentFileName && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label={`Delete ${label}`}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete Document
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <label>
          Upload file
          <input
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0]

              if (file) {
                onFileChange(file)
              }
            }}
          />
        </label>
      </div>
    </div>
  )
}
