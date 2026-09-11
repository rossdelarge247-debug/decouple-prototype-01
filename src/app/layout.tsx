import type { Metadata } from 'next'
import './globals.css'
import { APP_NAME, APP_DESCRIPTION } from '@/constants'

export const metadata: Metadata = { title: APP_NAME, description: APP_DESCRIPTION }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  )
}
