'use client'

import type { MouseEvent } from 'react'
import { EXIT_URL } from '@/constants'
import { footer } from '@/copy/start'

// The order matters (JOURNEY §Safety): clear storage, replace history, then redirect,
// with the best-effort endpoint fired without waiting. Without JavaScript the form
// posts to the endpoint, which clears the cookies and sends the browser on.
export function ExitThisPage() {
  function onClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {}
    try {
      history.replaceState(null, '', '/')
    } catch {}
    try {
      navigator.sendBeacon('/api/session/exit')
    } catch {}
    location.replace(EXIT_URL)
  }
  return (
    <form method="post" action="/api/session/exit" className="inline">
      <button
        type="submit"
        onClick={onClick}
        title={footer.exitHint}
        className="inline-flex items-center gap-2 rounded-pill border border-danger bg-surface px-4 py-2 font-medium text-danger hover:bg-danger-tint"
      >
        <span aria-hidden="true">×</span>
        {footer.exitCta}
      </button>
    </form>
  )
}
