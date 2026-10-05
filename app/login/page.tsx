import type { Metadata } from "next"
import { Suspense } from "react"
import LoginClient from "./LoginClient"

export const metadata: Metadata = {
  title: "Sign in | Piyush Bholla",
  description: "Sign in to see your orders and saved addresses.",
  robots: { index: false },
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  )
}
