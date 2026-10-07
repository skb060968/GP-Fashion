

export class AdminApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function adminFetch<T = unknown>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, credentials: "same-origin" })

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      const next = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `/admin-login?next=${next}&expired=1`
    }
    throw new AdminApiError(401, "Session expired")
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new AdminApiError(res.status, data?.error || `Request failed (${res.status})`)
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
