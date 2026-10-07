

export const ORDER_STATUSES = [
  "UNDER_VERIFICATION",
  "VERIFIED",
  "REJECTED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURN_RECEIVED",
  "EXCHANGE_DISPATCHED",
  "EXCHANGE_COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const

export type OrderStatusValue = (typeof ORDER_STATUSES)[number]

export type Transition = {
  to: OrderStatusValue

  label: string

  intent: "primary" | "secondary" | "danger"

  description: string

  noteRequired?: boolean
  notePlaceholder?: string
}

const T = (
  to: OrderStatusValue,
  label: string,
  intent: Transition["intent"],
  description: string,
  options: Pick<Transition, "noteRequired" | "notePlaceholder"> = {}
): Transition => ({ to, label, intent, description, ...options })

export const TRANSITIONS: Record<OrderStatusValue, Transition[]> = {
  UNDER_VERIFICATION: [
    T("VERIFIED", "Verify payment", "primary", "Confirms the UPI payment was received. The order moves to the atelier.", {
      notePlaceholder: "e.g. UTR 4123…, matched in Paytm",
    }),
    T("REJECTED", "Reject payment", "danger", "No matching payment found. The customer is asked to get in touch.", {
      notePlaceholder: "Why the payment could not be verified",
    }),
    T("CANCELLED", "Cancel order", "danger", "Cancels the order before any payment is confirmed.", {
      notePlaceholder: "Reason for cancellation",
    }),
  ],
  VERIFIED: [
    T("PROCESSING", "Start processing", "primary", "The pieces are being prepared."),
    T("CANCELLED", "Cancel order", "danger", "Cancels a paid order. Follow up with a refund.", {
      notePlaceholder: "Reason for cancellation",
    }),
  ],
  REJECTED: [
    T("UNDER_VERIFICATION", "Re-check payment", "secondary", "Moves the order back for another look, e.g. after the customer sends proof."),
    T("CANCELLED", "Cancel order", "danger", "Closes the order.", { notePlaceholder: "Reason for cancellation" }),
  ],
  PROCESSING: [
    T("SHIPPED", "Mark shipped", "primary", "The order has been handed to the courier.", {
      notePlaceholder: "Courier and tracking number (recommended)",
    }),
    T("CANCELLED", "Cancel order", "danger", "Cancels an order already in production. Follow up with a refund.", {
      notePlaceholder: "Reason for cancellation",
    }),
  ],
  SHIPPED: [
    T("DELIVERED", "Mark delivered", "primary", "The customer has received the order."),
  ],
  DELIVERED: [
    T("RETURN_REQUESTED", "Open return", "secondary", "Records that the customer requested a return or exchange.", {
      noteRequired: true,
      notePlaceholder: "Return reason, pieces involved, and requested resolution",
    }),
  ],
  RETURN_REQUESTED: [
    T("RETURN_RECEIVED", "Mark return received", "primary", "The returned pieces have arrived and are ready for inspection and resolution.", {
      notePlaceholder: "Condition received and inspection notes",
    }),
    T("DELIVERED", "Close return request", "secondary", "Closes a withdrawn or declined return and leaves the original order delivered.", {
      noteRequired: true,
      notePlaceholder: "Why the return was withdrawn or declined",
    }),
  ],
  RETURN_RECEIVED: [
    T("REFUNDED", "Mark refunded", "danger", "The returned order has been refunded.", {
      noteRequired: true,
      notePlaceholder: "Refund amount, reference, method, and date",
    }),
    T("EXCHANGE_DISPATCHED", "Dispatch replacement", "primary", "The replacement has been handed to the courier.", {
      noteRequired: true,
      notePlaceholder: "Replacement pieces, courier, and tracking number",
    }),
  ],
  EXCHANGE_DISPATCHED: [
    T("EXCHANGE_COMPLETED", "Complete exchange", "primary", "The replacement was delivered and the exchange is complete."),
  ],
  EXCHANGE_COMPLETED: [],
  CANCELLED: [
    T("REFUNDED", "Mark refunded", "secondary", "The customer's payment has been returned.", {
      noteRequired: true,
      notePlaceholder: "Refund amount, reference, method, and date",
    }),
  ],
  REFUNDED: [],
}

export function allowedTransitions(from: string): Transition[] {
  return TRANSITIONS[from as OrderStatusValue] ?? []
}

export function transitionFor(from: string, to: string): Transition | undefined {
  return allowedTransitions(from).find((t) => t.to === to)
}

export function canTransition(from: string, to: string): boolean {
  return Boolean(transitionFor(from, to))
}

export const ACTION_REQUIRED_STATUSES: OrderStatusValue[] = [
  "UNDER_VERIFICATION",
  "VERIFIED",
  "PROCESSING",
  "SHIPPED",
  "RETURN_REQUESTED",
  "RETURN_RECEIVED",
  "EXCHANGE_DISPATCHED",
]

export const FINAL_STATUSES: OrderStatusValue[] = ["EXCHANGE_COMPLETED", "REFUNDED"]
