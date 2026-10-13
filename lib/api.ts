/* Shared by the functions in api/: who is asking, and the two gates most routes need. */
import { whoami, type Who } from './auth.ts'
import { clientIp, json } from './http.ts'

/** the functions read settings at most 5 s old, so test mode and the code switch bite quickly */
export const FUNCTION_SETTINGS_TTL_MS = 5_000

export async function who(request: Request): Promise<Who> {
  return whoami(request, clientIp(request), Date.now(), { settingsTtlMs: FUNCTION_SETTINGS_TTL_MS })
}

export const unauthorised = (): Response => json({ ok: false, error: 'Sign in first.' }, 401)

/* owner or tester; or a person who passed Turnstile, when codes are not required */
export function mayAnswer(w: Who): boolean {
  return w.owner || w.tester || (w.human && !w.settings.requireCode)
}
