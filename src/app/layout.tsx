import type { Metadata } from 'next'
import { Inter, Source_Serif_4, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { APP_NAME, APP_DESCRIPTION } from '@/constants'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-inter', display: 'swap' })
const sourceSerif = Source_Serif_4({ subsets: ['latin'], weight: ['400', '600', '700'], style: ['normal', 'italic'], variable: '--font-source-serif', display: 'swap' })
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains-mono', display: 'swap' })

export const metadata: Metadata = { title: APP_NAME, description: APP_DESCRIPTION }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${sourceSerif.variable} ${jetBrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
