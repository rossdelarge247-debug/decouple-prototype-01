import Link from 'next/link'
import { header } from '@/copy/start'
import { Wordmark } from './Wordmark'

export function PublicHeader({ signIn = true }: { signIn?: boolean }) {
  return (
    <header className="no-print px-gutter py-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Wordmark />
        {signIn && (
          <Link href="/sign-in" className="font-medium text-ink no-underline hover:underline">
            {header.signInCta}
          </Link>
        )}
      </div>
    </header>
  )
}
