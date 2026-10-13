import type { ReactNode } from 'react'
import { devMode as devCopy, header as copy } from '@/copy/start'
import { devMode } from '@/lib/dev-mode'
import { Footer } from './Footer'

// Every screen: skip link, a header, one main, the footer with Exit this page.
export function Page({ header, children, width = 'md' }: { header: ReactNode; children: ReactNode; width?: 'md' | 'lg' | 'xl' }) {
  const max = width === 'xl' ? 'max-w-6xl' : width === 'lg' ? 'max-w-4xl' : 'max-w-2xl'
  return (
    <div className="ground flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-pill focus:bg-surface focus:px-4 focus:py-2">
        {copy.skipToContent}
      </a>
      {devMode() && (
        <p className="no-print bg-attention-tint px-gutter py-2 text-center text-body text-ink">
          <span className="font-semibold text-attention">{devCopy.label}. </span>
          {devCopy.body}
        </p>
      )}
      {header}
      <main id="main" className={`mx-auto w-full ${max} flex-1 px-gutter pb-section pt-8`}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
