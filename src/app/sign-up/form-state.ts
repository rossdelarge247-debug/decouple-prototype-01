export interface FormState {
  errors: Record<string, string>
  reference: string
}

export const INITIAL_STATE: FormState = { errors: {}, reference: '' }
export const MIN_PASSWORD = 12
