import type { Metadata } from 'next'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/source-serif-4/wght.css'
import '@fontsource-variable/source-serif-4/wght-italic.css'
import './globals.css'
import { APP_NAME, APP_DESCRIPTION } from '@/constants'

// The title stays non-descript on every page (JOURNEY §Safety): no page sets its own.
export const metadata: Metadata = { title: APP_NAME, description: APP_DESCRIPTION }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  )
}
