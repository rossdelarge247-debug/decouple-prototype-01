'use client'

import { useEffect, useState } from 'react'
import type { RevealItem } from '@/lib/build/reveal'
import { pounds } from '@/lib/build/money'

// The designed moment: items fade in one by one and their values count up, within
// the timing budget (250 ms per item, never over 600 ms). Reduced motion makes it
// instant. Nothing here blocks the Continue button beneath it.
const STEP_MS = 250
const COUNT_MS = 300

function CountUp({ value, active, money }: { value: number; active: boolean; money: boolean }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (!active) return
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = instant ? 1 : Math.min(1, (now - start) / COUNT_MS)
      setShown(Math.round(value * p))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, value])
  return <span className="tabular-nums">{money ? pounds(shown) : shown.toLocaleString('en-GB')}</span>
}

export function Reveal({ items, progressLabel }: { items: RevealItem[]; progressLabel: string }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = setInterval(() => {
      setShown(n => {
        if (n >= items.length) clearInterval(timer)
        return instant ? items.length : Math.min(items.length, n + 1)
      })
    }, instant ? 0 : STEP_MS)
    return () => clearInterval(timer)
  }, [items.length])

  return (
    <div className="flex flex-col gap-4">
      <progress
        className="block h-1 w-full appearance-none overflow-hidden rounded-pill bg-border [&::-webkit-progress-bar]:bg-border [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent"
        value={shown}
        max={items.length}
        aria-label={progressLabel}
      />
      <ol className="divide-y divide-border rounded-card border border-border bg-surface">
        {items.map((item, i) => {
          const visible = i < shown
          return (
            <li key={item.id} aria-hidden={!visible} className={`reveal-item flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-card py-3 ${visible ? 'is-shown' : ''}`}>
              <span>
                <span className="block font-medium text-ink">{item.label}</span>
                <span className="block text-body text-ink-muted">{item.detail}</span>
              </span>
              {item.value !== null && (
                <span className="font-display text-display-sm text-ink">
                  <CountUp value={item.value} active={visible} money={item.id !== 'transactions'} />
                </span>
              )}
            </li>
          )
        })}
      </ol>
      <noscript>
        <ol className="divide-y divide-border rounded-card border border-border bg-surface">
          {items.map(item => (
            <li key={item.id} className="px-card py-3">
              <span className="font-medium text-ink">{item.label}</span> <span className="text-ink-muted">{item.detail}</span>
            </li>
          ))}
        </ol>
      </noscript>
    </div>
  )
}
