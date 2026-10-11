import type { Metadata } from "next"
import HelpCenterClient from "./HelpCenterClient"

export const metadata: Metadata = {
  title: "Help Center | Admin | Piyush Bholla",
}

export default function AdminHelpPage() {
  return <HelpCenterClient />
}
