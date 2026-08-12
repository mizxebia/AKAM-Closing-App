import { useState } from 'react'
import { useCurrentUser } from '../../closingTickets/hooks/useCurrentUser'

// Service accounts allowed to see the Developer Mode toggle and the
// bot-generated screenshot gallery it unlocks.
const DEVELOPER_MODE_ALLOWED_EMAILS = [
  'akambotleaserenewal@akam.com',
  'akamnewsalesclosure@akam.com',
  'akambotdev1@akam.com',
  'akambotuat2@akam.com',
]

export function useDeveloperMode() {
  const { userEmail } = useCurrentUser()
  const [enabled, setEnabled] = useState(false)

  const isAllowed = Boolean(
    userEmail &&
      DEVELOPER_MODE_ALLOWED_EMAILS.includes(
        userEmail.toLowerCase()
      )
  )

  return {
    isAllowed,
    enabled: isAllowed && enabled,
    toggle: () => setEnabled((current) => !current),
  }
}
