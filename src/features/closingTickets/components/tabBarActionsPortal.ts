import { createContext, useContext } from 'react'

/**
 * The tab bar's action slot, as a live DOM node — for tabs whose buttons
 * live deep in self-contained child components (with their own local
 * state/handlers not owned by the page) rather than the page itself.
 * Those components portal their controls into this node instead of the
 * page lifting all of their internal state just to pass buttons down as
 * the `actions` prop. Null until the tab bar has mounted.
 */
const TabBarActionsPortalContext =
  createContext<HTMLDivElement | null>(null)

export function useTabBarActionsPortal() {
  return useContext(TabBarActionsPortalContext)
}

export const TabBarActionsPortalProvider =
  TabBarActionsPortalContext.Provider
