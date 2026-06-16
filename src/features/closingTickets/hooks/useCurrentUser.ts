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
      const hostUser = getWindowCurrentUser()

      if (
        isMounted &&
        (hostUser.userName || hostUser.userEmail)
      ) {
        setUserName(hostUser.userName ?? null)
        setUserEmail(hostUser.userEmail ?? null)
        return
      }

      try {
        const context = await getContext()
        const currentUserName =
          context.user.fullName ??
          context.user.userPrincipalName
        const currentUserEmail =
          context.user.userPrincipalName
        const currentUserId =
          (context.user as { userId?: string }).userId ?? null

        if (isMounted && currentUserName) {
          setUserName(currentUserName)
        }
        if (isMounted && currentUserEmail) {
          setUserEmail(currentUserEmail)
        }
        if (isMounted && currentUserId) {
          setUserId(currentUserId)
        }
      } catch (error) {
        console.info(
          'Power Apps user context is unavailable',
          error
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
