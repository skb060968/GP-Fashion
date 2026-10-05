import { Suspense } from "react"
import CouponListClient from "./CouponListClient"

export default function CouponsPage() {
  return (
    <Suspense fallback={null}>
      <CouponListClient />
    </Suspense>
  )
}
