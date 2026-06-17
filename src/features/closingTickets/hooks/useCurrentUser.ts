import { useEffect, useState } from 'react'
import { getContext } from '@microsoft/power-apps/app'

type PowerAppsWindowContext = {
  userSettings?: {
    userName?: string
    userEmail?: string
    userPrincipalName?: string
  }
}

function getWindowCurrentUser() {
  const context = (
    window as Window & {
      __power_apps_context__?: PowerAppsWindowContext
      Xrm?: {
        Utility?: {
          getGlobalContext?: () => {
            userSettings?: {
              userName?: string
              userEmail?: string
              userPrincipalName?: string
            }
          }
        }
      }
    }
  )

  const windowUserSettings =
    context.__power_apps_context__?.userSettings
  const xrmUserSettings =
    context.Xrm?.Utility?.getGlobalContext?.()
      .userSettings

  return {
    userName:
      windowUserSettings?.userName ??
      xrmUserSettings?.userName,
    userEmail:
      windowUserSettings?.userEmail ??
      windowUserSettings?.userPrincipalName ??
      xrmUserSettings?.userEmail ??
      xrmUserSettings?.userPrincipalName,
  }
}

export function useCurrentUser() {
  const [userName, setUserName] =
    useState<string | null>(null)
  const [userEmail, setUserEmail] =
    useState<string | null>(null)
  const [userId, setUserId] =
    useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadCurrentUser() {
      // Always call getContext() so we get objectId (the reliable ID
      // that matches _createdby_value in Dataverse). The window context
      // only provides name/email, not the GUID.
      try {
        const context = await getContext()

        // fullName matches the "Created By" display name in Dataverse
        // (createdbyname). Prefer it over userPrincipalName.
        const currentUserName =
          context.user.fullName ??
          context.user.userPrincipalName ??
          null

        const currentUserEmail =
          context.user.userPrincipalName ?? null

        // objectId is the AAD user GUID — matches _createdby_value
        const currentUserId =
          context.user.objectId ?? null

        if (isMounted) {
          if (currentUserName) setUserName(currentUserName)
          if (currentUserEmail) setUserEmail(currentUserEmail)
          if (currentUserId) setUserId(currentUserId)
        }
      } catch {
        // getContext() unavailable (e.g. dev mode) — fall back to
        // the window context for name/email only.
        const hostUser = getWindowCurrentUser()
        if (isMounted) {
          if (hostUser.userName) setUserName(hostUser.userName)
          if (hostUser.userEmail) setUserEmail(hostUser.userEmail)
        }
        console.warn(
          '[useCurrentUser] getContext() failed — fell back to window context.',
          '\nuserName from window:', hostUser.userName,
          '\nuserEmail from window:', hostUser.userEmail
        )
      }
    }

    void loadCurrentUser()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    userName,
    userEmail,
    userId,
  }
}
