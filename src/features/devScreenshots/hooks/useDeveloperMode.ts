import { useState } from 'react'
import { useCurrentUser } from '../../closingTickets/hooks/useCurrentUser'
import { toast } from '../../../components/feedback/toastStore'

// Service accounts allowed to see the Developer Mode toggle and the
// bot-generated screenshot gallery it unlocks.
const DEVELOPER_MODE_ALLOWED_EMAILS = [
  'akambotleaserenewal@akam.com',
  'akambotnewsalesclosure@akam.com',
  'akambotdev1@akam.com',
  'akambotuat2@akam.com',
]

const DEVELOPER_MODE_PASSWORD = 'xeakam@123'
// Shared across every useDeveloperMode() instance (Home page, Closing
// Details page, ...) via sessionStorage, so unlocking once carries over
// to the rest of the browser tab's session instead of re-prompting on
// every page.
const SESSION_UNLOCK_KEY = 'akam-developer-mode-unlocked'

function isUnlockedThisSession() {
  try {
    return (
      window.sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true'
    )
  } catch {
    // sessionStorage unavailable (e.g. private browsing edge cases) —
    // fall back to re-prompting every time rather than crashing.
    return false
  }
}

function markUnlockedThisSession() {
  try {
    window.sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true')
  } catch {
    // Ignore — worst case the user is prompted again next toggle.
  }
}

export function useDeveloperMode() {
  const { userEmail } = useCurrentUser()
  const [enabled, setEnabled] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const [passwordError, setPasswordError] = useState<
    string | null
  >(null)

  const isAllowed = Boolean(
    userEmail &&
      DEVELOPER_MODE_ALLOWED_EMAILS.includes(
        userEmail.toLowerCase()
      )
  )

  const toggle = () => {
    if (enabled) {
      setEnabled(false)
      return
    }

    if (isUnlockedThisSession()) {
      setEnabled(true)
      return
    }

    setPasswordError(null)
    setPromptOpen(true)
  }

  const submitPassword = (password: string): boolean => {
    if (password === DEVELOPER_MODE_PASSWORD) {
      markUnlockedThisSession()
      setPromptOpen(false)
      setPasswordError(null)
      setEnabled(true)
      toast.success('Developer Mode unlocked.')
      return true
    }

    setPasswordError('Incorrect password.')
    return false
  }

  const cancelPrompt = () => {
    setPromptOpen(false)
    setPasswordError(null)
  }

  return {
    isAllowed,
    enabled: isAllowed && enabled,
    toggle,
    promptOpen,
    passwordError,
    submitPassword,
    cancelPrompt,
  }
}
