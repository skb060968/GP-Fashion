export const UNTRACKED_PATH_PREFIXES = ["/admin", "/admin-login", "/invoice", "/api"]

export function cleanAnalyticsEvent<T extends { url: string }>(event: T): T | null {
  const url = event.url.split(/[?#]/)[0]
  const pathname = new URL(url, "http://localhost").pathname
  if (UNTRACKED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null
  return { ...event, url }
}
