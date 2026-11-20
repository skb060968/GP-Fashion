import { Suspense } from "react"
import RecordsClient from "./RecordsClient"

export default function RecordsPage() {
  return (
    <Suspense fallback={null}>
      <RecordsClient />
    </Suspense>
  )
}
