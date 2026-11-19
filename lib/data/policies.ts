

import { contact } from "./contact"
import { business, sellerAddress } from "./business"

export interface PolicySection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface Policy {
  slug: string
  title: string
  description: string
  updated: string
  sections: PolicySection[]
}

const BUSINESS = `${business.legalName}, trading as ${business.tradeName.toUpperCase()}`
const LOCATION = `${sellerAddress}, India (GSTIN ${business.gstin})`
const EMAIL = contact.email
const GRIEVANCE = business.grievanceOfficer
const GRIEVANCE_TEXT = `Our grievance officer is ${GRIEVANCE.name}, ${GRIEVANCE.designation}. Email ${GRIEVANCE.email} or call ${GRIEVANCE.phone}. We acknowledge every complaint within 48 hours and resolve it within one month of receiving it.`

const CANCELLATION = [
  "You can cancel an order free of charge at any time before it is dispatched. Email us or WhatsApp the studio with your order number and we refund the full amount to the original payment method.",
  "A made-to-measure piece can be cancelled free of charge until we start cutting it, which happens only after you have confirmed your measurements with us. Once cutting has started, a made-to-measure order cannot be cancelled. Bespoke commissions follow the cancellation terms we agree with you in writing.",
  "Once an order has been dispatched it can no longer be cancelled; the exchange terms below apply instead.",
]

export const policies: Policy[] = [
  {
    slug: "shipping-returns",
    title: "Shipping & Returns",
    description: "Dispatch times, delivery, cancellations, exchanges and made-to-measure orders at PIYUSH BHOLLA LABEL.",
    updated: "2026-11-19",
    sections: [
      {
        heading: "Cancellations",
        paragraphs: CANCELLATION,
      },
      {
        heading: "Dispatch",
        paragraphs: [
          "Ready-to-wear pieces in standard sizes are dispatched within 4 weeks of your payment being verified. You will receive an email at each step: when the order is placed, when payment is confirmed, and when the parcel is handed to the courier.",
          "Made-to-measure pieces are dispatched within 4 to 6 weeks of your payment being verified and your measurements being confirmed.",
          "Bespoke commissions have their own lead time, which we agree with you before you confirm. As a guide, allow 6 to 10 weeks for most commissions and longer for heavily embroidered work.",
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
        heading: "Made to measure",
        paragraphs: [
          "Any dress can be made to measure at the same price as a standard size. Save your body measurements under My Account, choose Made to measure on the product page, and pick whose measurements to use. Before cutting, we call or WhatsApp you to confirm the measurements; work starts only after you confirm them.",
          "Made-to-measure and bespoke garments are cut for you, so they cannot be returned or exchanged.",
        ],
      },
      {
        heading: "No alterations",
        paragraphs: [
          "We do not offer alterations on any order: ready-to-wear, made-to-measure or bespoke. Please check the size guide, or your saved measurements, carefully before you order.",
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
          "Where a refund is agreed, it is issued to the original payment method within 7 working days of the piece reaching us, or of your cancellation if the order had not been dispatched. We will email you when it is processed.",
        ],
      },
      {
        heading: "Complaints",
        paragraphs: [GRIEVANCE_TEXT],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    description: "Terms of sale and use of the PIYUSH BHOLLA LABEL website.",
    updated: "2026-11-19",
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
          "All prices are in Indian Rupees and include GST. Shipping within India is complimentary. You receive an order confirmation when you order and a GST tax invoice when your order is dispatched. If you buy for a business, you can add your GSTIN at checkout and it will appear on the tax invoice. We take care to show colours and details accurately, but screens vary and each piece is finished by hand, so slight variations from the photographs are normal.",
          "We may change prices and withdraw pieces at any time. A price change does not affect an order that has already been confirmed.",
        ],
      },
      {
        heading: "Orders and payment",
        paragraphs: [
          "An order is placed when you complete checkout and is confirmed when we verify your payment. Until then we may decline or cancel an order, for example if payment cannot be verified, a piece is unavailable, or there is an error in the listing. If we cancel after payment, we refund in full.",
          "Payment is currently by UPI. You pay to our UPI QR code and can enter the UPI transaction reference (UTR) at checkout, which helps us match your payment quickly; we confirm receipt by email, normally within one working day. Please do not send payment for an order you have not placed.",
        ],
      },
      {
        heading: "Cancellations",
        paragraphs: [...CANCELLATION.slice(0, 2), "Cancellation and refund details are also set out in our Shipping & Returns policy."],
      },
      {
        heading: "Delivery and exchanges",
        paragraphs: ["Dispatch times, delivery and exchanges are set out in our Shipping & Returns policy, which forms part of these terms."],
      },
      {
        heading: "Made to measure and bespoke",
        paragraphs: [
          "Made-to-measure pieces are made from the body measurements you save in your account, at the same price as standard sizes. We confirm the measurements with you by phone or WhatsApp before cutting, and the piece is dispatched within 4 to 6 weeks of that confirmation. You are responsible for the accuracy of the measurements you provide and confirm.",
          "For bespoke orders we agree the design, fabric, measurements, price and lead time with you in writing before work begins. Changes requested after cutting may carry an additional charge or extend the lead time.",
          "Made-to-measure and bespoke garments are made for you and cannot be returned or exchanged.",
        ],
      },
      {
        heading: "No alterations",
        paragraphs: ["We do not offer alterations on any order, whether ready-to-wear, made-to-measure or bespoke."],
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
      {
        heading: "Grievance officer",
        paragraphs: [GRIEVANCE_TEXT],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How PIYUSH BHOLLA LABEL collects, uses and protects your personal information.",
    updated: "2026-11-19",
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
          "When you order: your name, phone number, email address and delivery address, the items ordered, and the UPI transaction reference you provide. If you buy for a business, also the business name and GSTIN you enter for the tax invoice.",
          "When you create an account: your email address, and optionally your name, phone number and saved addresses. We never store a password; you sign in with a one-time code.",
          "When you save measurements: the body measurements and fit notes you enter in your account, for yourself or for family members, including children's measurements entered by a parent or guardian. This is optional and only needed for made-to-measure orders.",
          "When you use the site: items in your bag and wishlist (stored in your browser, and in your account if you are signed in), standard server logs such as IP address and browser type, and a count of the pages you visit. We count page visits with Vercel Web Analytics, which sets no cookies, does not identify you across days or other sites, and receives page addresses without their query strings.",
          "When you contact us: whatever you include in your message.",
          "When you ask to be told that a sold-out piece is back: your email address and the piece you asked about.",
        ],
      },
      {
        heading: "How we use it",
        paragraphs: ["We use your information to:"],
        bullets: [
          "Process and deliver your order and send order updates by email.",
          "Verify payments and prevent fraud.",
          "Provide your account, saved addresses, saved measurements, bag and wishlist.",
          "Cut and make made-to-measure garments, and confirm the measurements with you before cutting.",
          "Answer your enquiries and arrange fittings or commissions.",
          "Send one email when a sold-out piece you asked about is back on sale.",
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
        heading: "Where your data is stored",
        paragraphs: [
          "The website and its database run on cloud servers operated by our hosting and database providers. Some of these servers are outside India, including in Singapore, so your information may be stored and processed there. We use only providers that protect it with encryption and access controls, and we do not transfer personal data to any country that the Government of India has restricted.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "We use a small number of strictly necessary cookies: one to keep you signed in to your account, and one for the admin area. We do not use advertising or tracking cookies. We count page visits with Vercel Web Analytics, which sets no cookies, does not identify you across days or other sites, and receives page addresses without their query strings. Your bag, wishlist and checkout address are kept in your browser's local storage so they survive a page reload.",
        ],
      },
      {
        heading: "How long we keep it",
        paragraphs: [
          "Order records, including name and address, are kept for as long as required for tax and accounting purposes, typically 8 years. Sign-in codes expire after 10 minutes and are deleted within 24 hours. Account sessions expire after 30 days of inactivity. A request to be told when a sold-out piece is back is deleted as soon as we send that email, or earlier if you ask us. Saved measurements stay in your account until you delete them, which you can do at any time under My Account; a made-to-measure order keeps its own copy of the measurements as part of the order record. If you ask us to delete your account we remove it, along with saved addresses, saved measurements, bag and wishlist, while retaining order records as required by law.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          `You can ask to see, correct or delete the personal information we hold about you, or withdraw consent where processing is based on consent, by emailing ${EMAIL}. We respond within 30 days.`,
          `For questions or complaints about your personal data, contact ${GRIEVANCE.name}, ${GRIEVANCE.designation}, at ${GRIEVANCE.email} or ${GRIEVANCE.phone}. If your complaint is not resolved, you have the right to complain to the Data Protection Board of India.`,
        ],
      },
      {
        heading: "Security",
        paragraphs: [
          "Data is transmitted over HTTPS and stored with access limited to the people who run the store. Sign-in tokens are stored only as one-way hashes. No system is perfectly secure, so please contact us at once if you suspect your account has been accessed by someone else. If a breach affects your personal data, we will tell you and the Data Protection Board of India as the law requires.",
        ],
      },
      {
        heading: "Children",
        paragraphs: [
          "The site is not directed at children under 18 and children should not create accounts or place orders. For kidswear, a parent or guardian may save a child's measurements in their own account; they confirm that they are the child's parent or guardian and consent to the measurements being used only to make the child's clothes. They can delete them at any time.",
        ],
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
