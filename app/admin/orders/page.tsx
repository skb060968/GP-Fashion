import { Suspense } from "react"
import OrdersListClient from "./OrdersListClient"

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersListClient />
    </Suspense>
  )
}
