// Every error a user sees carries a short reference id ("ref: a4b2") so support can
// find it in the logs without the user describing anything sensitive.
export function errorRef(): string {
  return Math.random().toString(36).slice(2, 6)
}
