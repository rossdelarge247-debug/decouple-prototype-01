import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

type Variant = 'primary' | 'secondary' | 'quiet'

const STYLES: Record<Variant, string> = {
  primary: 'bg-ink text-surface hover:bg-accent-strong',
  secondary: 'bg-surface text-ink border border-border hover:border-ink',
  quiet: 'bg-transparent text-ink underline decoration-border underline-offset-4 hover:decoration-ink',
}

const BASE = 'inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3 font-medium leading-none no-underline motion-swap transition-colors'

interface Props {
  children: ReactNode
  href?: string
  type?: 'submit' | 'button'
  variant?: Variant
  arrow?: boolean
  back?: boolean
  className?: string
  name?: string
  value?: string
}

export function Button({ children, href, type = 'submit', variant = 'primary', arrow, back, className = '', name, value }: Props) {
  const cls = `${BASE} ${STYLES[variant]} ${className}`
  const inner = (
    <>
      {back && <Icon name="back" />}
      {children}
      {arrow && <Icon name="arrow" />}
    </>
  )
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    )
  }
  return (
    <button type={type} className={cls} name={name} value={value}>
      {inner}
    </button>
  )
}
