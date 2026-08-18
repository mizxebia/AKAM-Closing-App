export const COOP_TRANSFER_PACKAGE_TYPE = 396620002

export function generateTicketId() {
  const randomNumber = Math.floor(Math.random() * 1_000_000_000)

  return `CL-${String(randomNumber).padStart(9, '0')}`
}
