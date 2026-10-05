import { redirect } from "next/navigation"

/** Legacy route. The bag now lives at /bag. */
export default function CartPage() {
  redirect("/bag")
}
