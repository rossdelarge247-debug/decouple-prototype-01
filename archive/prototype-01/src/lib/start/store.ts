import { cookies } from 'next/headers'
import { decode, encode } from '@/lib/codec'
import { cookieOptions } from '@/lib/cookies'
import { isStartAnswers, type StartAnswers } from './answers'

// The pre-sign-up answers sit behind this interface. write and clear are called only
// from server actions and route handlers, where cookies can be set.
export interface StartStore {
  read(): Promise<StartAnswers | null>
  write(answers: StartAnswers): Promise<void>
  clear(): Promise<void>
}

export const START_COOKIE = 'decouple_start'

export function cookieStartStore(): StartStore {
  return {
    async read() {
      const jar = await cookies()
      return decode(jar.get(START_COOKIE)?.value, isStartAnswers)
    },
    async write(answers) {
      const jar = await cookies()
      jar.set(START_COOKIE, encode(answers), cookieOptions)
    },
    async clear() {
      const jar = await cookies()
      jar.delete(START_COOKIE)
    },
  }
}
