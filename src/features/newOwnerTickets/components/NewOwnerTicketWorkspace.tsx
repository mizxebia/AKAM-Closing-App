import { useEffect, useState } from 'react'
import { StatusBanner } from '../../../components/feedback/StatusBanner'
import type { ClosingTicketRecord } from '../../closingTickets/types/closingTicket'
import {
  getNewOwnerTicketByTicketId,
  saveNewOwnerTicket,
} from '../api/newOwnerTicketService'
import type {
  NewOwnerTicketFormState,
  NewOwnerTicketInput,
  NewOwnerTicketRecord,
} from '../types/newOwnerTicket'

interface NewOwnerTicketWorkspaceProps {
  closingTicket: ClosingTicketRecord
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

function getInitialFormState(
  closingTicket: ClosingTicketRecord,
  record?: NewOwnerTicketRecord | null
): NewOwnerTicketFormState {
  return {
    cr7de_ticketid:
      record?.cr7de_ticketid ??
      closingTicket.cr7de_ticketid ??
      '',
    cr7de_unit:
      record?.cr7de_unit ??
      closingTicket.cr7de_unitnumber ??
      '',
    cr7de_closingdate: getDateInputValue(
      record?.cr7de_closingdate ??
        closingTicket.cr7de_closingdate
    ),
    cr7de_newprimaryownername:
      record?.cr7de_newprimaryownername ??
      closingTicket.cr7de_buyername ??
      '',
    cr7de_primaryowneremail:
      record?.cr7de_primaryowneremail ?? '',
    cr7de_primaryphonenumber:
      record?.cr7de_primaryphonenumber ?? '',
    cr7de_newsecondaryownername:
      record?.cr7de_newsecondaryownername ?? '',
    cr7de_secondaryowneremail:
      record?.cr7de_secondaryowneremail ?? '',
    cr7de_secondaryphonenumber:
      record?.cr7de_secondaryphonenumber ?? '',
    cr7de_sellername:
      record?.cr7de_sellername ??
      closingTicket.cr7de_sellername ??
      '',
    cr7de_sellertcode:
      record?.cr7de_sellertcode ??
      closingTicket.cr7de_sellertcode ??
      '',
    cr7de_sellercontactemail:
      record?.cr7de_sellercontactemail ?? '',
    cr7de_sellercontactnumber:
      record?.cr7de_sellercontactnumber ?? '',
    cr7de_selleraccountzerobalanceconfirmed:
      record?.cr7de_selleraccountzerobalanceconfirmed ??
      false,
    cr7de_address:
      record?.cr7de_address ??
      closingTicket.cr7de_buildingaddress ??
      '',
    cr7de_forwardingaddressforseller:
      record?.cr7de_forwardingaddressforseller ?? '',
    cr109_purchaseprice:
      record?.cr109_purchaseprice ?? '',
    cr109_amountfinanced:
      record?.cr109_amountfinanced ?? '',
    cr109_lendersname: record?.cr109_lendersname ?? '',
    cr109_shares: record?.cr109_shares ?? '',
  }
}

function normalizeText(value: string) {
  const trimmedValue = value.trim()
  return trimmedValue === '' ? undefined : trimmedValue
}

function toPayload(
  formState: NewOwnerTicketFormState
): NewOwnerTicketInput {
  return {
    cr7de_ticketid: normalizeText(formState.cr7de_ticketid),
    cr7de_unit: normalizeText(formState.cr7de_unit),
    cr7de_closingdate:
      formState.cr7de_closingdate || undefined,
    cr7de_newprimaryownername: normalizeText(
      formState.cr7de_newprimaryownername
    ),
    cr7de_primaryowneremail: normalizeText(
      formState.cr7de_primaryowneremail
    ),
    cr7de_primaryphonenumber: normalizeText(
      formState.cr7de_primaryphonenumber
    ),
    cr7de_newsecondaryownername: normalizeText(
      formState.cr7de_newsecondaryownername
    ),
    cr7de_secondaryowneremail: normalizeText(
      formState.cr7de_secondaryowneremail
    ),
    cr7de_secondaryphonenumber: normalizeText(
      formState.cr7de_secondaryphonenumber
    ),
    cr7de_sellername: normalizeText(
      formState.cr7de_sellername
    ),
    cr7de_sellertcode: normalizeText(
      formState.cr7de_sellertcode
    ),
    cr7de_sellercontactemail: normalizeText(
      formState.cr7de_sellercontactemail
    ),
    cr7de_sellercontactnumber: normalizeText(
      formState.cr7de_sellercontactnumber
    ),
    cr7de_selleraccountzerobalanceconfirmed:
      formState.cr7de_selleraccountzerobalanceconfirmed,
    cr7de_address: normalizeText(formState.cr7de_address),
    cr7de_forwardingaddressforseller: normalizeText(
      formState.cr7de_forwardingaddressforseller
    ),
    cr109_purchaseprice: normalizeText(
      formState.cr109_purchaseprice
    ),
    cr109_amountfinanced: normalizeText(
      formState.cr109_amountfinanced
    ),
    cr109_lendersname: normalizeText(
      formState.cr109_lendersname
    ),
    cr109_shares: normalizeText(formState.cr109_shares),
  }
}

export function NewOwnerTicketWorkspace({
  closingTicket,
}: NewOwnerTicketWorkspaceProps) {
  const [record, setRecord] =
    useState<NewOwnerTicketRecord | null>(null)
  const [formState, setFormState] =
    useState<NewOwnerTicketFormState>(() =>
      getInitialFormState(closingTicket)
    )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadNewOwnerTicket() {
      setLoading(true)
      setError(null)

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

  const updateField = <
    TKey extends keyof NewOwnerTicketFormState,
  >(
    field: TKey,
    value: NewOwnerTicketFormState[TKey]
  ) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }))
  }

  const saveRecord = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const savedRecord = await saveNewOwnerTicket(
        record?.cr7de_newownerticketdetailsid ?? null,
        toPayload(formState)
      )
      setRecord(savedRecord)
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
  }

  return (
    <section className="workflow-card">
      <div className="workflow-card-header">
        <div>
          <h3>New Owner Ticket</h3>
          <p>
            Editable new-owner workflow details linked by
            Ticket ID.
          </p>
        </div>
        <button
          className="primary-action-button"
          type="button"
          onClick={saveRecord}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {loading && (
        <StatusBanner
          type="loading"
          message="Loading new owner ticket details..."
        />
      )}
      {error && <StatusBanner type="error" message={error} />}
      {message && (
        <StatusBanner type="success" message={message} />
      )}

      {!loading && (
        <div className="form-grid new-owner-grid">
          <label className="form-field">
            <span>Ticket ID</span>
            <input value={formState.cr7de_ticketid} readOnly />
          </label>
          <label className="form-field">
            <span>Unit</span>
            <input
              value={formState.cr7de_unit}
              onChange={(event) =>
                updateField('cr7de_unit', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>Closing Date</span>
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
          </label>
          <label className="form-field">
            <span>Primary Owner</span>
            <input
              value={formState.cr7de_newprimaryownername}
              onChange={(event) =>
                updateField(
                  'cr7de_newprimaryownername',
                  event.target.value
                )
              }
            />
          </label>
          <label className="form-field">
            <span>Primary Owner Email</span>
            <input
              type="email"
              value={formState.cr7de_primaryowneremail}
              onChange={(event) =>
                updateField(
                  'cr7de_primaryowneremail',
                  event.target.value
                )
              }
            />
          </label>
          <label className="form-field">
            <span>Primary Phone</span>
            <input
              value={formState.cr7de_primaryphonenumber}
              onChange={(event) =>
                updateField(
                  'cr7de_primaryphonenumber',
                  event.target.value
                )
              }
            />
          </label>
          <label className="form-field">
            <span>Secondary Owner</span>
            <input
              value={formState.cr7de_newsecondaryownername}
              onChange={(event) =>
                updateField(
                  'cr7de_newsecondaryownername',
                  event.target.value
                )
              }
            />
          </label>
          <label className="form-field">
            <span>Seller Name</span>
            <input
              value={formState.cr7de_sellername}
              onChange={(event) =>
                updateField(
                  'cr7de_sellername',
                  event.target.value
                )
              }
            />
          </label>
          <label className="form-field">
            <span>Purchase Price</span>
            <input
              type="number"
              value={formState.cr109_purchaseprice}
              onChange={(event) =>
                updateField(
                  'cr109_purchaseprice',
                  event.target.value
                )
              }
            />
          </label>
          <label className="form-field">
            <span>Amount Financed</span>
            <input
              type="number"
              value={formState.cr109_amountfinanced}
              onChange={(event) =>
                updateField(
                  'cr109_amountfinanced',
                  event.target.value
                )
              }
            />
          </label>
          <label className="form-field">
            <span>Lender</span>
            <input
              value={formState.cr109_lendersname}
              onChange={(event) =>
                updateField(
                  'cr109_lendersname',
                  event.target.value
                )
              }
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={
                formState.cr7de_selleraccountzerobalanceconfirmed
              }
              onChange={(event) =>
                updateField(
                  'cr7de_selleraccountzerobalanceconfirmed',
                  event.target.checked
                )
              }
            />
            <span>Seller account zero balance confirmed</span>
          </label>
          <label className="form-field form-grid-wide">
            <span>Property Address</span>
            <input
              value={formState.cr7de_address}
              onChange={(event) =>
                updateField(
                  'cr7de_address',
                  event.target.value
                )
              }
            />
          </label>
          <label className="form-field form-grid-wide">
            <span>Forwarding Address For Seller</span>
            <input
              value={
                formState.cr7de_forwardingaddressforseller
              }
              onChange={(event) =>
                updateField(
                  'cr7de_forwardingaddressforseller',
                  event.target.value
                )
              }
            />
          </label>
        </div>
      )}
    </section>
  )
}
