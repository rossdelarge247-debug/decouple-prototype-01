import { cookies } from 'next/headers'
import { decode, encode } from '@/lib/codec'
import { cookieOptions } from '@/lib/cookies'
import { isBankSource, type BankSource } from './bank'
import { isConfirmations, type Confirmations } from './confirm'
import { pack, unpack } from './pack'
import { isProfileAnswers, type ProfileAnswers } from './profile'

// Everything Build persists sits behind this interface. The cookie implementation is
// the stub until server-side storage exists; writes happen only in server actions and
// route handlers, where cookies can be set.
export interface BuildStore {
  readProfile(): Promise<ProfileAnswers | null>
  writeProfile(p: ProfileAnswers): Promise<void>
  readBank(): Promise<BankSource | null>
  writeBank(s: BankSource): Promise<void>
  clearBank(): Promise<void>
  readConfirmations(): Promise<Confirmations>
  writeConfirmations(c: Confirmations): Promise<void>
}

export const PROFILE_COOKIE = 'decouple_profile'
export const BANK_COOKIE = 'decouple_bank'
export const CONFIRM_COOKIE = 'decouple_confirm'

export function bankCookieName(i: number): string {
  return `${BANK_COOKIE}.${i}`
}

/** For a route handler that sets cookies on its own response rather than the jar. */
export function bankCookieEntries(source: BankSource): Array<[string, string]> {
  return pack(source).map((chunk, i) => [bankCookieName(i), chunk])
}

export function cookieBuildStore(): BuildStore {
  return {
    async readProfile() {
      const jar = await cookies()
      return decode(jar.get(PROFILE_COOKIE)?.value, isProfileAnswers)
    },
    async writeProfile(p) {
      const jar = await cookies()
      jar.set(PROFILE_COOKIE, encode(p), cookieOptions)
    },
    async readBank() {
      const jar = await cookies()
      const chunks: string[] = []
      for (let i = 0; ; i++) {
        const c = jar.get(bankCookieName(i))?.value
        if (!c) break
        chunks.push(c)
      }
      return unpack(chunks, isBankSource)
    },
    async writeBank(s) {
      const jar = await cookies()
      const chunks = pack(s)
      chunks.forEach((chunk, i) => jar.set(bankCookieName(i), chunk, cookieOptions))
      for (let i = chunks.length; jar.get(bankCookieName(i)); i++) jar.delete(bankCookieName(i))
    },
    async clearBank() {
      const jar = await cookies()
      for (let i = 0; jar.get(bankCookieName(i)); i++) jar.delete(bankCookieName(i))
      jar.delete(CONFIRM_COOKIE)
    },
    async readConfirmations() {
      const jar = await cookies()
      return decode(jar.get(CONFIRM_COOKIE)?.value, isConfirmations) ?? {}
    },
    async writeConfirmations(c) {
      const jar = await cookies()
      jar.set(CONFIRM_COOKIE, encode(c), cookieOptions)
    },
  }
}
