// lib/data/policies.ts
// Legal and policy pages. Plain text; each section renders as a heading plus
// paragraphs. Keep figures (days, hours) in step with lib/data/faq.ts.

export interface PolicySection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface Policy {
  slug: string
  title: string
  description: string
  updated: string // YYYY-MM-DD
  sections: PolicySection[]
}

const BUSINESS = "PIYUSH BHOLLA LABEL"
const LOCATION = "New Delhi, India"
const EMAIL = "piyushbholla@gmail.com"

export const policies: Policy[] = [
  {
    slug: "shipping-returns",
    title: "Shipping & Returns",
    description: "Dispatch times, delivery, exchanges and alterations for PIYUSH BHOLLA LABEL orders.",
    updated: "2026-10-06",
    sections: [
      {
        heading: "Dispatch",
        paragraphs: [
          "Ready-to-wear pieces are dispatched within 3 to 5 working days of your payment being verified. You will receive an email at each step: when the order is placed, when payment is confirmed, and when the parcel is handed to the courier.",
          "Made-to-measure and bespoke orders have their own lead time, which we agree with you before you confirm. As a guide, allow 6 to 10 weeks for most commissions and longer for heavily embroidered work.",
        ],
      },
      {
        heading: "Delivery",
        paragraphs: [
          "Shipping within India is complimentary. Most parcels arrive within 2 to 7 working days of dispatch depending on the destination. Remote pin codes can take longer.",
          "International shipping is available on request. Write to us with your address and the pieces you are interested in and we will quote shipping and any duties before you order. Duties and taxes levied by the destination country are the customer's responsibility.",
        ],
      },
      {
        heading: "Exchanges",
        paragraphs: [
          "Unworn ready-to-wear pieces with all tags intact can be exchanged for another size or another piece within 7 days of delivery. Email us with your order number to arrange it. Return shipping for an exchange is at the customer's cost unless the piece arrived damaged or incorrect.",
          "Pieces that have been worn, altered, washed or have had tags removed cannot be exchanged. Because of their handmade nature, small variations in embroidery and finish are part of each piece and are not defects.",
        ],
      },
      {
        heading: "Made to measure and bespoke",
        paragraphs: [
          "Garments cut to your measurements or designed for you are not returnable or exchangeable. If the fit is not right, we will alter the piece at no charge within 30 days of delivery; contact us and we will arrange the alteration.",
        ],
      },
      {
        heading: "Damaged or incorrect items",
        paragraphs: [
          `If a piece arrives damaged or is not what you ordered, email ${EMAIL} within 48 hours of delivery with photographs and your order number. We will arrange collection and send a replacement or, if a replacement is not possible, a full refund to the original payment method.`,
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "Where a refund is agreed, it is issued to the original payment method within 7 working days of the piece reaching us. We will email you when it is processed.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    description: "Terms of sale and use of the PIYUSH BHOLLA LABEL website.",
    updated: "2026-10-06",
    sections: [
      {
        heading: "About us",
        paragraphs: [
          `This website is operated by ${BUSINESS}, ${LOCATION} ("we", "us"). By placing an order or using the site you agree to these terms. If you do not agree, please do not use the site.`,
        ],
      },
      {
        heading: "Products and prices",
        paragraphs: [
          "All prices are in Indian Rupees and include applicable taxes. Shipping within India is complimentary. We take care to show colours and details accurately, but screens vary and each piece is finished by hand, so slight variations from the photographs are normal.",
          "We may change prices and withdraw pieces at any time. A price change does not affect an order that has already been confirmed.",
        ],
      },
      {
        heading: "Orders and payment",
        paragraphs: [
          "An order is placed when you complete checkout and is confirmed when we verify your payment. Until then we may decline or cancel an order, for example if payment cannot be verified, a piece is unavailable, or there is an error in the listing. If we cancel after payment, we refund in full.",
          "Payment is currently by UPI. You pay to our UPI ID or QR code and enter the transaction reference at checkout; we confirm receipt by email, normally within one working day. Please do not send payment for an order you have not placed.",
        ],
      },
      {
        heading: "Delivery, exchanges and alterations",
        paragraphs: ["Dispatch times, delivery, exchanges and alterations are set out in our Shipping & Returns policy, which forms part of these terms."],
      },
      {
        heading: "Made to measure and bespoke",
        paragraphs: [
          "For made-to-measure and bespoke orders we agree the design, fabric, measurements, price and lead time with you in writing before work begins. Changes requested after cutting may carry an additional charge or extend the lead time. These garments are made for you and are not returnable; we will alter them to fit as set out in the Shipping & Returns policy.",
        ],
      },
      {
        heading: "Your account",
        paragraphs: [
          "You may sign in with a one-time code sent to your email. You are responsible for keeping access to that email secure. Guest checkout is available without an account.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          `All designs, photographs, text and the PIYUSH BHOLLA name and logo are the property of ${BUSINESS} and may not be copied or used without written permission.`,
        ],
      },
      {
        heading: "Liability",
        paragraphs: [
          "Nothing in these terms limits rights you have under Indian consumer law. Beyond those rights, our liability for any order is limited to the amount paid for it. We are not liable for delays caused by events outside our reasonable control, including courier disruption, strikes or natural events.",
        ],
      },
      {
        heading: "Law and disputes",
        paragraphs: [
          `These terms are governed by the laws of India. Any dispute will be subject to the jurisdiction of the courts of New Delhi. If something has gone wrong, please write to ${EMAIL} first; we aim to resolve every issue directly.`,
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How PIYUSH BHOLLA LABEL collects, uses and protects your personal information.",
    updated: "2026-10-06",
    sections: [
      {
        heading: "Who we are",
        paragraphs: [
          `${BUSINESS}, ${LOCATION}, is the data fiduciary for personal information collected through this website. Questions about this policy can be sent to ${EMAIL}.`,
        ],
      },
      {
        heading: "What we collect",
        paragraphs: ["We collect only what is needed to run the store:"],
        bullets: [
          "When you order: your name, phone number, email address and delivery address, the items ordered, and the UPI transaction reference you provide.",
          "When you create an account: your email address, and optionally your name, phone number and saved addresses. We never store a password; you sign in with a one-time code.",
          "When you use the site: items in your bag and wishlist (stored in your browser, and in your account if you are signed in), and standard server logs such as IP address and browser type.",
          "When you contact us: whatever you include in your message.",
        ],
      },
      {
        heading: "How we use it",
        paragraphs: ["We use your information to:"],
        bullets: [
          "Process and deliver your order and send order updates by email.",
          "Verify payments and prevent fraud.",
          "Provide your account, saved addresses, bag and wishlist.",
          "Answer your enquiries and arrange fittings, alterations or commissions.",
          "Meet legal and tax obligations.",
        ],
      },
      {
        heading: "Marketing",
        paragraphs: [
          "We do not send marketing email unless you ask for it, and we do not sell or rent your information to anyone.",
        ],
      },
      {
        heading: "Who we share it with",
        paragraphs: ["We share information only with services needed to run the store, and only what each needs:"],
        bullets: [
          "Couriers, to deliver your order (name, phone, address).",
          "Our hosting and database providers, who store the site's data on our behalf.",
          "Our email provider, to send order and sign-in emails.",
          "The contact form provider, to deliver messages you send us.",
          "Authorities, where the law requires it.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "We use a small number of strictly necessary cookies: one to keep you signed in to your account, and one for the admin area. We do not use advertising or tracking cookies. Your bag, wishlist and checkout address are kept in your browser's local storage so they survive a page reload.",
        ],
      },
      {
        heading: "How long we keep it",
        paragraphs: [
          "Order records, including name and address, are kept for as long as required for tax and accounting purposes, typically 8 years. Sign-in codes expire after 10 minutes and are deleted within 24 hours. Account sessions expire after 30 days of inactivity. If you ask us to delete your account we remove it, along with saved addresses, bag and wishlist, while retaining order records as required by law.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          `You can ask to see, correct or delete the personal information we hold about you, or withdraw consent where processing is based on consent, by emailing ${EMAIL}. We respond within 30 days. You may also raise a grievance with us at the same address; if it is not resolved, you have the right to complain to the Data Protection Board of India.`,
        ],
      },
      {
        heading: "Security",
        paragraphs: [
          "Data is transmitted over HTTPS and stored with access limited to the people who run the store. Sign-in tokens are stored only as one-way hashes. No system is perfectly secure, so please contact us at once if you suspect your account has been accessed by someone else.",
        ],
      },
      {
        heading: "Children",
        paragraphs: ["The site is not directed at children under 18 and we do not knowingly collect their information."],
      },
      {
        heading: "Changes",
        paragraphs: ["If we change this policy we will update the date at the top of the page. Significant changes will be announced on the site."],
      },
    ],
  },
]

export function getPolicy(slug: string): Policy | undefined {
  return policies.find((p) => p.slug === slug)
}
