import {
  Cr7de_closingticketdetailsescr7de_ticketstatus,
  Cr7de_closingticketdetailsescr109_botstatus,
} from '../../../generated/models/Cr7de_closingticketdetailsesModel'

function toChoiceOptions<T extends Record<number, string>>(
  choices: T
) {
  return Object.entries(choices).map(([value, label]) => ({
    value: Number(value),
    label,
  }))
}

export const TICKET_STATUS_OPTIONS = toChoiceOptions(
  Cr7de_closingticketdetailsescr7de_ticketstatus
)
export const BOT_STATUS_OPTIONS = toChoiceOptions(
  Cr7de_closingticketdetailsescr109_botstatus
)

export function getTicketStatusLabel(value: number) {
  return (
    Cr7de_closingticketdetailsescr7de_ticketstatus[
      value as keyof typeof Cr7de_closingticketdetailsescr7de_ticketstatus
    ] ?? String(value)
  )
}

export function getBotStatusLabel(value: number) {
  return (
    Cr7de_closingticketdetailsescr109_botstatus[
      value as keyof typeof Cr7de_closingticketdetailsescr109_botstatus
    ] ?? String(value)
  )
}
