import Link from 'next/link'
import { APP_NAME } from '@/constants'
import { header } from '@/copy/start'

export function Wordmark() {
  return (
    <Link href="/" aria-label={header.homeLabel} className="font-display text-display-sm font-semibold tracking-tight text-ink no-underline">
      {APP_NAME}
      <span className="text-accent">.</span>
    </Link>
  )
}
