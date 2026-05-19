import { useEffect, useState } from 'react'
import { getContext } from '@microsoft/power-apps/app'

type PowerAppsWindowContext = {
  userSettings?: {
    userName?: string
  }
}

function getWindowUserName() {
  const context = (
    window as Window & {
      __power_apps_context__?: PowerAppsWindowContext
      Xrm?: {
        Utility?: {
          getGlobalContext?: () => {
            userSettings?: {
              userName?: string
            }
          }
        }
      }
    }
  )

  return (
    context.__power_apps_context__?.userSettings
      ?.userName ??
    context.Xrm?.Utility?.getGlobalContext?.()
      .userSettings?.userName
  )
}

export function useCurrentUser() {
  const [userName, setUserName] =
    useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadCurrentUser() {
      const hostUserName = getWindowUserName()

      if (hostUserName && isMounted) {
        setUserName(hostUserName)
        return
      }

      try {
        const context = await getContext()
        const currentUserName =
          context.user.fullName ??
          context.user.userPrincipalName

        if (isMounted && currentUserName) {
          setUserName(currentUserName)
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
  }
}
