import { WORDMARK } from '@/constants'

// Start begins here. The landing page is built later in this session.
export default function Home() {
  return (
    <main className="mx-auto max-w-md px-gutter py-section">
      <h1 className="text-display-md">{WORDMARK}</h1>
      <p className="text-ink-muted">The complete picture.</p>
    </main>
  )
}
