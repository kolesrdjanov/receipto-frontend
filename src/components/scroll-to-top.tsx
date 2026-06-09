import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets scroll to the top of the page on every route (pathname) change.
 *
 * The app scrolls at the document level — the sidebar layout's <main>
 * (SidebarInset) has no own scroll container — so we scroll the window.
 *
 * Keyed on `pathname` only (not search/hash) on purpose: changing query
 * params (receipt filters, `?action=`, `?groupId=`) or jumping between
 * in-page sections (the Settings scroll-spy) must NOT yank the user back
 * to the top. useLayoutEffect runs before paint so there's no visible flash
 * of the previous scroll position.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
