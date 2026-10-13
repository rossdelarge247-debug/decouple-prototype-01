import { requireSession, type Session } from '@/lib/session'
import { resolveBank, type BankData } from '@/lib/build/bank'
import { planConfirmation, type ConfirmPlan, type Confirmations } from '@/lib/build/confirm'
import { cookieBuildStore } from '@/lib/build/store'
import type { ProfileAnswers } from '@/lib/build/profile'

// Everything a Build screen needs, read once through the session seam and the store.
export interface BuildState {
  session: Session
  profile: ProfileAnswers | null
  bank: BankData | null
  plan: ConfirmPlan | null
  confirmations: Confirmations
}

export async function loadBuild(): Promise<BuildState> {
  const session = await requireSession()
  const store = cookieBuildStore()
  const [profile, source, confirmations] = await Promise.all([store.readProfile(), store.readBank(), store.readConfirmations()])
  const bank = resolveBank(source)
  const plan = bank ? planConfirmation(bank, profile, session.start) : null
  return { session, profile, bank, plan, confirmations }
}
