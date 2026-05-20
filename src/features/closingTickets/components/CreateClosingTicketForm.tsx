import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
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
  Cr7de_closingticketdetailsescr109_transactiontypedeal,
  Cr7de_closingticketdetailsescr7de_ticketstatus,
} from '../../../generated/models/Cr7de_closingticketdetailsesModel'
import {
  createClosingTicket,
  deleteClosingTicketFile,
  updateClosingTicket,
  uploadClosingTicketFile,
} from '../api/closingTicketsService'
import type {
  ClosingTicketCreateInput,
  ClosingTicketFormState,
  ClosingTicketRecord,
} from '../types/closingTicket'
import { useCurrentUser } from '../hooks/useCurrentUser'

type FormErrors = Partial<
  Record<keyof ClosingTicketFormState, string>
>

type UploadColumnName =
  | 'cr109_purchaseapplicationform'
  | 'cr109_rpttdocument'

type PendingFiles = Partial<Record<UploadColumnName, File>>
type UploadedFileNames = Partial<Record<UploadColumnName, string>>

const POST_CLOSING_STATUS = 716070004
const VALIDATED_STATUS = 716070001
const emptyUploadedFileNames: UploadedFileNames = {}

interface CreateClosingTicketFormProps {
  onCancel: () => void
  onCreated: () => Promise<void>
}

interface EditClosingTicketFormProps {
  record: ClosingTicketRecord
  onCancel: () => void
  onSaved: () => Promise<void>
  onSubmitted: () => Promise<void>
}

const emptyFormState: ClosingTicketFormState = {
  cr109_botstatus: '',
  cr109_buyer2name: '',
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
      submitLabel="Submit"
      savingLabel="Saving..."
      onCancel={onCancel}
      onSubmit={async (formState, pendingFiles) => {
        const record = await createClosingTicket(
          buildPayload(formState)
        )
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
  onSubmitted,
}: EditClosingTicketFormProps) {
  return (
    <ClosingTicketEditorForm
      mode="edit"
      initialFormState={getRecordFormState(record)}
      initialFileNames={{
        cr109_purchaseapplicationform:
          record.cr109_purchaseapplicationform_name,
        cr109_rpttdocument:
          record.cr109_rpttdocument_name,
      }}
      recordId={record.cr7de_closingticketdetailsid}
      submitLabel="Save"
      submitAndCloseLabel="Submit"
      savingLabel="Saving..."
      onCancel={onCancel}
      onSubmit={async (formState, pendingFiles) => {
        await updateClosingTicket(
          record.cr7de_closingticketdetailsid,
          buildPayload(formState)
        )
        await uploadPendingFiles(
          record.cr7de_closingticketdetailsid,
          pendingFiles
        )
      }}
      onSuccess={onSaved}
      onSubmitAndClose={onSubmitted}
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
  const showValidate =
    ticketStatusLabel === 'PostClosing'

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

  const updateTicketStatus = async (
    nextStatus: typeof POST_CLOSING_STATUS | typeof VALIDATED_STATUS
  ) => {
    if (!recordId) {
      return
    }

    const nextFormState = {
      ...formState,
      cr7de_ticketstatus: nextStatus,
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
    await updateTicketStatus(POST_CLOSING_STATUS)
  }

  const handleValidate = async () => {
    await updateTicketStatus(VALIDATED_STATUS)
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
      {saveError && (
        <div className="form-alert form-alert-error">
          {saveError}
        </div>
      )}

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

          <FormField label="Closing Date">
            <input
              type="date"
              value={formState.cr7de_closingdate}
              onChange={(event) =>
                updateField(
                  'cr7de_closingdate',
                  event.target.value
                )
              }
            />
          </FormField>

          <div className="form-grid-wide">
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
          </div>
        </div>
      </section>

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

      <section className="form-section">
        <h3>Closing Agent</h3>
        <div className="form-grid">
          <FormField label="Agent Name">
            <input
              value={formState.cr7de_closingagentname}
              disabled
              aria-readonly="true"
            />
          </FormField>

          <FormField
            label="Agent Email"
            error={errors.cr7de_closingagentemail}
          >
            <input
              type="email"
              value={formState.cr7de_closingagentemail}
              disabled
              aria-readonly="true"
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
            disabled={saving}
          >
            Move to Post Closing
          </button>
        )}
        {showValidate && (
          <button
            className="primary-action-button"
            type="button"
            onClick={handleValidate}
            disabled={saving}
          >
            Validate
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
    </form>
  )
}

function FormField({
  label,
  required = false,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <label className="form-field">
      <span>
        {required && (
          <strong aria-hidden="true">* </strong>
        )}
        {label}
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
