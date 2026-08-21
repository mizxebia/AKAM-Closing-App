import {
  Cr7de_closingticketdetailsescr7de_ticketstatus,
} from '../../../generated/models/Cr7de_closingticketdetailsesModel'
import type {
  ClosingTicketColumnKey,
  ClosingTicketRecord,
  ClosingTicketStatusDisplay,
  ClosingTicketStatusLabel,
  TicketStatusOption,
} from '../types/closingTicket'
import { closingTicketTabs } from '../constants/closingTicketMetadata'

// The Power Apps SDK does not populate `createdbyname` on fetched records.
// The display name is available at runtime via this OData annotation instead.
// Same annotation is used by the "My Tickets" filter logic.
export const CREATED_BY_DISPLAY_ANNOTATION =
  '_createdby_value@OData.Community.Display.V1.FormattedValue'

const statusDisplayByGeneratedLabel: Record<
  string,
  ClosingTicketStatusDisplay
> = {
  Draft: {
    label: 'Draft',
    tone: 'draft',
  },
  Processing: {
    label: 'Processing',
    tone: 'processing',
  },
  ReadyForPostClosing: {
    label: 'Ready for Post Closing',
    tone: 'postClosing',
  },
  PostClosing: {
    label: 'Post Closing',
    tone: 'postClosing',
  },
  Validate: {
    label: 'Validate Closings',
    tone: 'validate',
  },
  ValidateClosings: {
    label: 'Validate Closings',
    tone: 'validate',
  },
  TransferringBuilding: {
    label: 'Transferring Building',
    tone: 'processing',
  },
  Failed: {
    label: 'Failed',
    tone: 'failed',
  },
  SenttoAR: {
    label: 'Sent to AR',
    tone: 'sentToAR',
  },
  Completed: {
    label: 'Completed',
    tone: 'completed',
  },
}

export function formatClosingTicketStatus(
  value: ClosingTicketRecord['cr7de_ticketstatus']
) {
  return getClosingTicketStatusDisplay(value).label
}

export function getClosingTicketStatusDisplay(
  value: ClosingTicketRecord['cr7de_ticketstatus']
): ClosingTicketStatusDisplay {
  if (value === undefined || value === null) {
    return {
      label: '-',
      tone: 'default',
    }
  }

  const generatedLabel =
    Cr7de_closingticketdetailsescr7de_ticketstatus[
      value
    ]

  return (
    statusDisplayByGeneratedLabel[generatedLabel] ?? {
      label: generatedLabel ?? String(value),
      tone: 'default',
    }
  )
}

export function formatClosingTicketDate(value?: string) {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(value)

  return Number.isNaN(parsedDate.getTime())
    ? value
    : parsedDate.toLocaleDateString()
}

export function formatClosingTicketValue(
  record: ClosingTicketRecord,
  key: ClosingTicketColumnKey
) {
  // Handle createdbyname first — record[key] is always empty/undefined
  // for this field because the SDK doesn't populate createdbyname.
  // The value lives in the OData annotation on _createdby_value instead.
  if (key === 'createdbyname') {
    const raw = record as unknown as Record<string, unknown>
    const annotated = raw[CREATED_BY_DISPLAY_ANNOTATION]
    if (typeof annotated === 'string' && annotated.trim()) {
      return annotated.replace(/\s*#\s*$/, '').trim()
    }
    return '-'
  }

  const rawValue = record[key]

  if (
    rawValue === undefined ||
    rawValue === null ||
    rawValue === ''
  ) {
    return '-'
  }

  if (key === 'cr7de_ticketstatus') {
    return formatClosingTicketStatus(
      record.cr7de_ticketstatus
    )
  }

  if (
    key === 'createdon' ||
    key === 'modifiedon'
  ) {
    return formatClosingTicketDate(
      record[key]
    )
  }

  return String(rawValue)
}

export const closingTicketStatusOptions: TicketStatusOption[] =
  closingTicketTabs.map((tab) => ({
    value: tab,
    label: tab,
  }))

export function isClosingTicketStatusLabel(
  value: string
): value is ClosingTicketStatusLabel {
  return (
    value !== 'All' &&
    value !== 'My Tickets' &&
    closingTicketTabs.includes(
      value as (typeof closingTicketTabs)[number]
    )
  )
}
