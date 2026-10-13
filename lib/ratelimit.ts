/* In-memory rate limits (spec §7). Per instance, which is enough while sessions already gate every route. */
export interface Limiter {
  /** true when the hit is allowed */
  hit(key: string, now?: number): boolean
  reset(): void
}

export function createLimiter(limit: number, windowMs: number): Limiter {
  const hits = new Map<string, number[]>()
  return {
    hit(key, now = Date.now()) {
      const from = now - windowMs
      const list = (hits.get(key) || []).filter((t) => t > from)
      if (list.length >= limit) {
        hits.set(key, list)
        return false
      }
      list.push(now)
      hits.set(key, list)
      if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => t > from)) hits.delete(k)
      return true
    },
    reset() {
      hits.clear()
    },
  }
}

/** at most 120 answer batches per hour per session */
export const answersLimiter = createLimiter(120, 60 * 60 * 1000)
/** at most 3 guide emails per sid per day */
export const emailLimiter = createLimiter(3, 24 * 60 * 60 * 1000)
/** a brake on password guessing, per address */
export const loginLimiter = createLimiter(20, 15 * 60 * 1000)
