import { categoryMeta, sizeOptionsByCategory, CATEGORY_SLUGS } from "./categories"
import { classifications } from "./shop"

export type HelpTone = "info" | "warning" | "danger"

export type HelpBlock =
  | { type: "text"; text: string }
  | { type: "steps"; items: string[] }
  | { type: "list"; items: string[] }
  | { type: "code"; label?: string; code: string }
  | { type: "note"; tone: HelpTone; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }

export type HelpSection = {
  title?: string
  blocks: HelpBlock[]
}

export type HelpTopic = {
  id: string
  title: string
  summary: string
  keywords: string[]
  sections: HelpSection[]
}

const categoryRows = CATEGORY_SLUGS.map((category) => [
  categoryMeta[category].title,
  category,
  sizeOptionsByCategory[category].join(", "),
])

const classificationRows = classifications.map((classification) => [classification.title, classification.slug])

export const adminHelpTopics: HelpTopic[] = [
  {
    id: "start-here",
    title: "Start here",
    summary: "The quickest path to common website operations and the rules that prevent accidental damage.",
    keywords: ["overview", "quick start", "commands", "rules", "safety"],
    sections: [
      {
        blocks: [
          { type: "text", text: "The storefront catalogue is file-based, while orders, customers, coupons, sessions, and login challenges live in Neon PostgreSQL. Vercel builds the application from the repository, but it does not run the catalogue generator or Prisma migrations automatically." },
          { type: "note", tone: "warning", text: "Never edit lib/data/shop.ts or lib/data/collections.ts by hand. They are regenerated from catalogue/. Never use npm run reset-db against a live or production database." },
          { type: "table", headers: ["Goal", "Where to work", "Then run"], rows: [
            ["Add or change products", "catalogue/<product-slug>/", "npm run catalogue -- --force"],
            ["Add or change a collection", "catalogue/_collections/<collection-slug>/", "npm run catalogue -- --force"],
            ["Add a classification", "catalogue/taxonomy.json", "npm run catalogue -- --force"],
            ["Change public copy", "lib/data/ and relevant app page", "npm run build"],
            ["Change database structure", "prisma/schema.prisma plus a new migration", "npx prisma migrate deploy"],
          ] },
          { type: "code", label: "Routine validation", code: "npm run catalogue -- --force\nnpm test\nnpm run build\nnpm run comments:remove\nnpm run comments:check" },
        ],
      },
    ],
  },
  {
    id: "catalogue-concepts",
    title: "Catalogue concepts",
    summary: "Understand categories, classifications, collections, products, slugs, visibility, and display order.",
    keywords: ["catalogue", "category", "classification", "collection", "product", "slug", "order", "visibility"],
    sections: [
      {
        title: "How the hierarchy works",
        blocks: [
          { type: "list", items: [
            "Category is the top-level department: menswear, womenswear, kidswear, or accessories.",
            "Classification is a product type such as outerwear, partywear, dresses and gowns, or bags.",
            "Collection is a release such as Spring 2027. One collection can contain products from several categories.",
            "Product is the individual sellable piece. Its folder name becomes the URL slug; its meta.json name is what customers see.",
          ] },
          { type: "text", text: "Categories and classifications are visibility-driven. A category appears in the menu, homepage, Shop filters, footer, SEO metadata, and sitemap only when at least one generated product belongs to it. A classification appears under a category only when at least one product in that category uses it." },
          { type: "note", tone: "info", text: "Deleting the only Womenswear product and regenerating the catalogue automatically hides Womenswear everywhere. Adding a product back activates it again." },
        ],
      },
      {
        title: "Slug and order",
        blocks: [
          { type: "text", text: "Use lowercase letters, numbers, and hyphens for folder names and taxonomy slugs. The folder catalogue/silk-gown creates /shop/silk-gown, while the name field can remain Silk Gown." },
          { type: "text", text: "The order field is display priority, not a customer order. Lower numbers appear first. Use 10, 20, 30 so a later item can be inserted at 15. Products sort by category, order, then name. Collections sort by order, then newest release date." },
        ],
      },
    ],
  },
  {
    id: "add-product",
    title: "Add a product",
    summary: "Create product metadata and images, generate the catalogue, and verify the product routes.",
    keywords: ["add dress", "add product", "meta json", "images", "price", "sizes", "silk gown"],
    sections: [
      {
        title: "Source folder",
        blocks: [
          { type: "steps", items: [
            "Create catalogue/<product-slug>/ using lowercase letters, numbers, and hyphens.",
            "Create meta.json directly inside that folder.",
            "Add cover.jpg, cover.png, or cover.webp as the main photograph.",
            "Add optional gallery photographs as 01.jpg, 02.jpg, 03.jpg, and so on.",
            "Confirm the classification slug exists in catalogue/taxonomy.json.",
            "Confirm a referenced collection has a matching folder under catalogue/_collections/.",
            "Run npm run catalogue -- --force and review every ok, warning, and rm line.",
          ] },
          { type: "code", label: "Example catalogue/silk-gown/meta.json", code: "{\n  \"name\": \"Silk Gown\",\n  \"category\": \"womenswear\",\n  \"classification\": \"partywear\",\n  \"collection\": \"spring-2027\",\n  \"priceInr\": 19990,\n  \"sizes\": [\"S\", \"M\", \"L\", \"XL\", \"XXL\", \"XXXL\"],\n  \"description\": \"A fluid silk gown from the Spring 2027 collection.\",\n  \"bestseller\": false,\n  \"order\": 10\n}" },
          { type: "note", tone: "info", text: "priceInr is entered as whole rupees. The generator converts it to paise internally. If the product belongs to a collection, it inherits that collection's releaseDate unless the product supplies its own." },
        ],
      },
      {
        title: "Required and optional fields",
        blocks: [
          { type: "table", headers: ["Field", "Requirement", "Meaning"], rows: [
            ["name", "Required", "Customer-facing product name; must be unique"],
            ["category", "Required", "menswear, womenswear, kidswear, or accessories"],
            ["classification", "Required", "Exact slug from taxonomy.json"],
            ["collection", "Optional", "Collection folder slug or null"],
            ["releaseDate", "Conditional", "YYYY-MM-DD when not inheriting from a collection"],
            ["priceInr", "Required", "Positive whole rupees"],
            ["sizes", "Required", "One or more sizes valid for the category"],
            ["description", "Optional", "Product-page copy"],
            ["bestseller", "Optional", "true or false; defaults to false"],
            ["order", "Optional", "Lower display priority; defaults to 1000"],
          ] },
        ],
      },
      {
        title: "After generation",
        blocks: [
          { type: "list", items: [
            "Check /shop and search for the product name.",
            "Check /shop/<product-slug> for image order, crop, price, sizes, description, breadcrumb, and collection link.",
            "Check /<category> and /<category>/<classification>.",
            "Check /<category>/new-arrivals and Bestsellers when applicable.",
            "Check /collections/<collection-slug> when the product belongs to a collection.",
          ] },
        ],
      },
    ],
  },
  {
    id: "colour-variants",
    title: "Product colour variants",
    summary: "Offer one product in several colours, each with its own images and a default colour.",
    keywords: ["colour", "color", "variant", "swatch", "default colour", "multiple colours", "shades"],
    sections: [
      {
        title: "How colour variants work",
        blocks: [
          { type: "text", text: "A product can be offered in several colours. Each colour keeps its own set of photographs in its own subfolder, and one colour is marked as the default. The product page shows a row of colour swatches; choosing a swatch swaps the gallery to that colour's images. The default colour is pre-selected and is what appears on shop cards, the bag, wishlist, invoices, and order emails when no specific colour is chosen." },
          { type: "note", tone: "info", text: "Colour variants are optional. A product with no colors field behaves exactly as before: its images sit directly in the product folder and no swatches are shown. Existing products need no changes." },
        ],
      },
      {
        title: "Folder layout",
        blocks: [
          { type: "steps", items: [
            "Inside catalogue/<product-slug>/, create one subfolder per colour, for example black/ and ivory/.",
            "Put each colour's photographs inside its own subfolder: cover.* plus optional 01.*, 02.*, and so on.",
            "Do not leave loose product images in the product root when using colours; images are read from the colour subfolders.",
            "Add a colors array and a defaultColor to meta.json.",
            "Run npm run catalogue -- --force and confirm the ok line reports the colour count.",
          ] },
          { type: "code", label: "Example catalogue/silk-gown/meta.json with colours", code: "{\n  \"name\": \"Silk Gown\",\n  \"category\": \"womenswear\",\n  \"classification\": \"partywear\",\n  \"collection\": \"spring-2027\",\n  \"priceInr\": 19990,\n  \"sizes\": [\"S\", \"M\", \"L\", \"XL\"],\n  \"description\": \"A fluid silk gown from the Spring 2027 collection.\",\n  \"order\": 10,\n  \"colors\": [\n    { \"slug\": \"black\", \"name\": \"Noir Black\", \"hex\": \"#1a1a1a\" },\n    { \"slug\": \"ivory\", \"name\": \"Ivory\", \"hex\": \"#f5f1e6\" }\n  ],\n  \"defaultColor\": \"black\"\n}" },
          { type: "note", tone: "info", text: "By default each colour reads from a subfolder named after its slug. Add a folder value to a colour if the subfolder name differs from the slug." },
        ],
      },
      {
        title: "Colour fields",
        blocks: [
          { type: "table", headers: ["Field", "Requirement", "Meaning"], rows: [
            ["colors", "Optional", "Array of colour options; omit entirely for a single-colour product"],
            ["colors[].slug", "Required", "Lowercase letters, numbers, hyphens; unique within the product"],
            ["colors[].name", "Required", "Customer-facing colour name shown on the swatch, bag, and orders"],
            ["colors[].hex", "Required", "Six-digit hex such as #1a1a1a used to paint the swatch dot"],
            ["colors[].folder", "Optional", "Image subfolder name; defaults to the colour slug"],
            ["defaultColor", "Optional", "Slug of the pre-selected colour; defaults to the first colour listed"],
          ] },
          { type: "note", tone: "warning", text: "Every colour needs its own image subfolder with at least a cover image, or generation stops with an error. Sizes are shared across all colours of a product." },
        ],
      },
      {
        title: "After generation",
        blocks: [
          { type: "list", items: [
            "Open /shop/<product-slug> and confirm the swatch row appears with the default colour pre-selected.",
            "Click each swatch and confirm the gallery switches to that colour's photographs.",
            "Add two different colours of the same product to the bag and confirm they appear as separate lines.",
            "Confirm the bag, order summary, invoice, and order emails show the chosen colour next to the size.",
          ] },
        ],
      },
    ],
  },
  {
    id: "collections",
    title: "Collections",
    summary: "Create, edit, release, reorder, and remove collection pages safely.",
    keywords: ["collection", "release", "spring 2027", "cover", "delete collection"],
    sections: [
      {
        title: "Create a collection",
        blocks: [
          { type: "steps", items: [
            "Create catalogue/_collections/<collection-slug>/.",
            "Add meta.json and one landscape cover image named cover.*.",
            "Assign products to it using the exact collection folder slug.",
            "Run npm run catalogue -- --force.",
            "Review /collections and /collections/<collection-slug>.",
          ] },
          { type: "code", label: "Example catalogue/_collections/spring-2027/meta.json", code: "{\n  \"name\": \"Spring 2027\",\n  \"season\": \"Spring 2027\",\n  \"releaseDate\": \"2027-03-20\",\n  \"description\": \"A study in fluid silhouettes and luminous surfaces.\",\n  \"order\": 10\n}" },
          { type: "note", tone: "warning", text: "A future releaseDate does not schedule or hide a collection. It becomes visible as soon as generated files are deployed. Control publication by deployment timing." },
        ],
      },
      {
        title: "Remove a collection",
        blocks: [
          { type: "steps", items: [
            "Remove or reassign every product that references the collection slug.",
            "Delete the entire catalogue/_collections/<slug>/ folder.",
            "Run npm run catalogue -- --force.",
            "Confirm the generator prints rm for the old generated cover and no old slug remains in lib/data/collections.ts.",
          ] },
          { type: "note", tone: "danger", text: "If a retained product still references a deleted collection folder, catalogue generation stops with a missing collection error." },
        ],
      },
    ],
  },
  {
    id: "edit-delete-catalogue",
    title: "Edit or delete catalogue items",
    summary: "Understand regeneration, orphan cleanup, and which generated files must be deployed.",
    keywords: ["edit product", "delete dress", "remove product", "orphan", "generated files"],
    sections: [
      {
        blocks: [
          { type: "text", text: "To edit a product, change its catalogue/<slug>/meta.json or source images and regenerate. To delete it, delete the entire source folder and regenerate. Leaving meta.json without an image causes the generator to fail rather than publishing an image-less page." },
          { type: "steps", items: [
            "Make changes only under catalogue/.",
            "Run npm run catalogue -- --force.",
            "Review generated lib/data/shop.ts and lib/data/collections.ts without hand-editing them.",
            "Confirm removed product/collection assets disappear from public/images/shop/.",
            "Include generated TypeScript, generated WebP additions, and generated WebP deletions in the pushed change.",
          ] },
          { type: "note", tone: "warning", text: "Catalogue source photographs are ignored by Git, and the whole catalogue/ and scripts/ folders are excluded from Vercel uploads. Production depends on the generated lib/data files and public/images/shop assets created locally." },
        ],
      },
    ],
  },
  {
    id: "categories-classifications-sizes",
    title: "Categories, classifications, and sizes",
    summary: "See the live allowed values and how unused categories or classifications stay hidden.",
    keywords: ["taxonomy", "classification", "sizes", "xxl", "kids", "accessories", "one size"],
    sections: [
      {
        title: "Registered categories and allowed sizes",
        blocks: [
          { type: "table", headers: ["Category", "meta.json value", "Allowed sizes"], rows: categoryRows },
          { type: "note", tone: "info", text: "Accessories with ONE SIZE are automatically selected on the product page. Kidswear uses age ranges. The kidswear measurement guide remains hidden until approved measurement rows are added." },
        ],
      },
      {
        title: "Current classification registry",
        blocks: [
          { type: "table", headers: ["Customer-facing title", "meta.json slug"], rows: classificationRows },
          { type: "text", text: "Edit catalogue/taxonomy.json to add or remove a classification, then regenerate. A classification can exist in taxonomy without appearing on the website. It appears only under categories whose products use it." },
          { type: "note", tone: "warning", text: "Do not remove or rename a classification slug while any product meta.json still references it. new-arrivals and bestsellers are reserved slugs." },
          { type: "code", label: "Taxonomy entry", code: "{ \"slug\": \"bags\", \"title\": \"Bags\" }" },
        ],
      },
    ],
  },
  {
    id: "images",
    title: "Image preparation",
    summary: "Choose file names, dimensions, aspect ratios, and crops that survive automatic WebP generation.",
    keywords: ["photos", "images", "cover", "webp", "dimensions", "crop", "gallery"],
    sections: [
      {
        blocks: [
          { type: "table", headers: ["Use", "Ideal output", "Aspect", "Quality"], rows: [
            ["Product image", "1200 × 1600", "3:4 portrait", "WebP 82"],
            ["Product thumbnail", "300 × 400", "3:4 portrait", "WebP 80"],
            ["Collection cover", "1600 × 900", "16:9 landscape", "WebP 82"],
          ] },
          { type: "list", items: [
            "Accepted source formats are JPG, JPEG, PNG, and WebP.",
            "Name the main image cover.*. If no cover exists, the first naturally sorted image is used with a warning.",
            "Name gallery images 01.*, 02.*, 03.* to make their order obvious.",
            "Keep faces and important details away from edges because resizing uses attention-based cover cropping.",
            "EXIF rotation is handled automatically. Smaller sources are not upscaled; the script reports the reduced output dimensions.",
            "Place images directly inside the product or collection folder. Nested image folders are not scanned.",
          ] },
        ],
      },
    ],
  },
  {
    id: "orders",
    title: "Orders and UPI verification",
    summary: "Review new orders, verify manual UPI payments, process fulfilment, and communicate safely.",
    keywords: ["orders", "upi", "payment", "verification", "processing", "shipping", "invoice"],
    sections: [
      {
        title: "New-order procedure",
        blocks: [
          { type: "steps", items: [
            "Open Admin → Orders or select an Awaiting verification card from the dashboard.",
            "Open the order and compare amount, customer, approximate time, and any transaction information with the actual UPI credit.",
            "Select Verify payment only after finding a matching credit. Add the UTR or reconciliation note when available.",
            "If no payment can be matched, select Reject payment and explain the reason. The customer can later send proof and the order can return to verification.",
            "Move verified work to Processing when preparation begins, then Shipped and Delivered as fulfilment progresses.",
          ] },
          { type: "note", tone: "danger", text: "The website records order status but does not automatically confirm UPI credits. Always check the actual payment account before verifying." },
          { type: "text", text: "The server rechecks product existence, selected size, current price, and subtotal before creating an order. Every new order begins in UNDER_VERIFICATION. Order codes use the current two-digit year followed by a three-digit sequence." },
        ],
      },
      {
        title: "Searching and exporting",
        blocks: [
          { type: "list", items: [
            "Search by order number, customer name, phone, or email.",
            "Filter by status, payment method, and date range.",
            "Use Export CSV to download the current filtered result set.",
            "Private order notes and status-history notes are internal only and are not included in customer emails. Send customer instructions separately.",
          ] },
        ],
      },
    ],
  },
  {
    id: "returns-exchanges",
    title: "Returns, exchanges, and refunds",
    summary: "Follow the allowed status path and record external refund or replacement details.",
    keywords: ["return", "exchange", "refund", "status", "replacement", "courier"],
    sections: [
      {
        blocks: [
          { type: "steps", items: [
            "From Delivered, select Open return and record the reason, pieces involved, and requested resolution.",
            "When the parcel arrives, select Mark return received and record its condition.",
            "For a full-order refund, complete the payment externally, then select Mark refunded and record the full order amount, reference, method, and date.",
            "For an exchange, ship the replacement externally, then select Dispatch replacement and record replacement pieces, courier, and tracking number.",
            "After replacement delivery, select Complete exchange.",
            "If the request is withdrawn or declined, close it back to Delivered with a required reason.",
          ] },
          { type: "note", tone: "warning", text: "The current return workflow and automatic refund email are whole-order only. Marking Refunded tells the customer that the full order amount was refunded. Do not use this status for a partial refund without a separate customer communication and workflow change. The application does not initiate bank refunds, courier pickups, or replacement shipments; perform those externally and record the reference internally." },
          { type: "table", headers: ["From", "Allowed next states"], rows: [
            ["Under verification", "Verified, Rejected, Cancelled"],
            ["Verified", "Processing, Cancelled"],
            ["Rejected", "Under verification, Cancelled"],
            ["Processing", "Shipped, Cancelled"],
            ["Shipped", "Delivered"],
            ["Delivered", "Return requested"],
            ["Return requested", "Return received, Delivered"],
            ["Return received", "Refunded, Exchange dispatched"],
            ["Exchange dispatched", "Exchange completed"],
            ["Cancelled", "Refunded"],
          ] },
        ],
      },
    ],
  },
  {
    id: "coupons",
    title: "Coupons",
    summary: "Create percentage or fixed discounts, limits, expiry dates, and safe usage rules.",
    keywords: ["coupon", "discount", "percentage", "fixed", "usage", "expiry"],
    sections: [
      {
        blocks: [
          { type: "list", items: [
            "Coupon codes use uppercase letters, numbers, and hyphens and must be unique.",
            "Percentage discounts must be whole numbers from 1 through 100.",
            "Fixed discounts and minimum-order values are entered in rupees in the admin UI and stored as paise.",
            "Maximum uses and expiry are optional. Coupons can be paused without deleting them.",
            "States shown in admin are Active, Paused, Expired, and Used up.",
          ] },
          { type: "note", tone: "warning", text: "Current backend limitation: a fixed discount is not automatically capped at the subtotal and can create a negative stored order amount if configured incorrectly. Set a minimum order at least as large as the fixed discount. Maximum-use validation and increment are also non-atomic, so concurrent checkouts can exceed the limit; treat maxUses as best-effort until this backend behavior is hardened." },
        ],
      },
    ],
  },
  {
    id: "customer-accounts",
    title: "Customer accounts and tracking",
    summary: "Understand passwordless login, account ownership, guest checkout, tracking, bag, and wishlist sync.",
    keywords: ["customer", "account", "login code", "guest", "tracking", "wishlist", "bag", "address"],
    sections: [
      {
        blocks: [
          { type: "text", text: "Customers sign in without passwords. A six-digit code is emailed, remains valid for 10 minutes, and allows five failed attempts. Successful login creates a 30-day secure session." },
          { type: "list", items: [
            "Guest checkout remains available.",
            "A signed-in customer sees orders linked to the account or placed with the same verified email.",
            "Saved addresses, bag, and wishlist synchronize with the account.",
            "Guest tracking requires the order code and exact 10-digit checkout phone number.",
            "Invoice/order links use ORDER_ACCESS_SECRET. Rotating it invalidates previously issued guest links.",
          ] },
          { type: "note", tone: "info", text: "If a customer does not receive a code after several requests, the per-email issuance limit may have been reached. Ask them to wait 15 minutes and check Spam before retrying." },
        ],
      },
    ],
  },
  {
    id: "admin-access",
    title: "Admin login and security",
    summary: "Use password plus email verification, understand magic-link fallback, and protect credentials.",
    keywords: ["admin", "change admin email", "admin email", "password", "otp", "magic link", "verification", "security", "session"],
    sections: [
      {
        title: "Sign-in flow",
        blocks: [
          { type: "steps", items: [
            "Enter the project-specific ADMIN_EMAIL and ADMIN_PASSWORD.",
            "A six-digit code and Verify and sign in link are emailed to ADMIN_EMAIL. Both expire after five minutes.",
            "In the same browser context, the email link verifies automatically and opens the dashboard.",
            "If the link opens in another browser, device, or isolated in-app browser, automatic verification falls back to the six-digit form. Enter the code on that screen or any screen holding the same challenge link.",
            "After five wrong codes or expiry, wait for the active challenge to expire and start again.",
          ] },
          { type: "text", text: "The link credential, OTP, and browser context are separately HMAC-protected. Only hashes are stored. OTP and link compete to consume one challenge, so replay cannot create another session. Admin sessions have an absolute eight-hour lifetime." },
          { type: "note", tone: "danger", text: "Never share ADMIN_PASSWORD, ADMIN_OTP_SECRET, ORDER_ACCESS_SECRET, SMTP_PASS, DATABASE_URL, admin codes, magic links, or session cookies. Store each project’s values separately in Vercel and a trusted password manager." },
        ],
      },
      {
        title: "Change the admin email",
        blocks: [
          { type: "text", text: "ADMIN_EMAIL has three roles in each project: it is the admin login identity, the destination for admin verification codes and magic links, and the recipient of new-order admin notifications." },
          { type: "steps", items: [
            "Decide which project is changing. The existing GP Fashion and Piyush Bholla Label projects have independent admin addresses.",
            "In the local gitignored .env, update ADMIN_EMAIL for GP Fashion development or MAIN_ADMIN_EMAIL for Piyush Bholla Label main. MAIN_ is only a local naming convention.",
            "Open that Vercel project, then go to Settings → Environment Variables.",
            "Update the unprefixed ADMIN_EMAIL value in Production and any Preview scope that should use the new administrator.",
            "Confirm the new mailbox is accessible and can receive mail from the project's configured SMTP sender. SMTP_USER and SMTP_FROM do not need to change unless the sending account or visible sender should also change.",
            "Save the variable and redeploy that Vercel project. An environment change does not affect an already-built deployment until it is redeployed.",
            "Test /admin-login with the new address and confirm the OTP and Verify and sign in link arrive there. Place only a controlled test order if you also need to confirm admin order notifications.",
          ] },
          { type: "note", tone: "warning", text: "Changing ADMIN_EMAIL requires no code edit or Prisma migration. It does not change the public Contact/Footer address, SMTP sender, customer support mailbox, or Web3Forms destination." },
          { type: "note", tone: "danger", text: "A verification challenge created before the change may remain usable for up to five minutes, and an existing admin session can remain valid for up to eight hours. If the previous administrator must lose access immediately, have a developer revoke AdminLoginChallenge and AdminSession records on the verified target database after updating Vercel." },
        ],
      },
      {
        title: "Common login errors",
        blocks: [
          { type: "table", headers: ["Message", "Action"], rows: [
            ["Unable to sign in with those credentials", "Check the project-specific admin email/password and Vercel environment scope"],
            ["A verification code was already sent", "Use that email or wait five minutes"],
            ["Unable to send the verification code", "Check SMTP settings, ADMIN_OTP_SECRET, migration state, and Vercel logs"],
            ["Unable to verify the code", "Code may be wrong, expired, consumed, or attempt-locked"],
            ["Verification link could not be used", "Use the six-digit code; the link may be in a different browser context"],
          ] },
        ],
      },
    ],
  },
  {
    id: "content-editing",
    title: "Website content and contact details",
    summary: "Find the source for public copy, policies, services, footer, contact information, and SEO text.",
    keywords: ["content", "copy", "contact", "email", "phone", "policy", "services", "about", "footer", "seo"],
    sections: [
      {
        blocks: [
          { type: "table", headers: ["Content", "Primary source"], rows: [
            ["Contact details and public email", "lib/data/contact.ts"],
            ["About and founder", "lib/data/aboutUs.ts"],
            ["Service cards", "lib/data/services.ts"],
            ["Service-page copy", "lib/data/servicesPage.ts"],
            ["FAQ", "lib/data/faq.ts"],
            ["Footer links", "lib/data/footer.ts"],
            ["Policies", "lib/data/policies.ts"],
            ["Category descriptions/images", "lib/data/categories.ts"],
            ["Size guides", "lib/data/sizeGuide.ts"],
            ["Transactional email layout", "lib/emails/"],
            ["Route-specific SEO", "app pages and lib/seo/metadata.ts"],
          ] },
          { type: "note", tone: "info", text: "The public contact email is centralized through lib/data/contact.ts for Contact, Footer, policies, invoices, PDFs, and transactional email footers. ADMIN_EMAIL and SMTP_FROM are separate environment settings." },
          { type: "text", text: "The Contact form sends through Web3Forms. Changing the displayed email does not change the Web3Forms account destination associated with its access key." },
        ],
      },
    ],
  },
  {
    id: "deployment",
    title: "Deploy both Vercel projects",
    summary: "Keep development and production isolated while sharing one repository and generated catalogue.",
    keywords: ["deploy", "vercel", "production", "development", "main", "push", "environment"],
    sections: [
      {
        blocks: [
          { type: "text", text: "The same repository deploys to two Vercel projects. The existing GP Fashion project uses the Neon development branch; the Piyush Bholla Label project uses Neon main. A repository push can trigger both projects, so code and catalogue are shared while environment-backed data remains separate." },
          { type: "steps", items: [
            "For catalogue changes, run npm run catalogue -- --force locally first.",
            "Run npm test and npm run build. After the build, run npm run comments:remove and npm run comments:check.",
            "Review generated data/assets and source deletions in VS Code Source Control.",
            "Ensure required unprefixed variables exist in each Vercel project and in the correct Production/Preview scope.",
            "Apply any new Prisma migration separately to each Neon branch before deploying code that requires it.",
            "Push the repository and watch both Vercel deployments.",
            "Run the post-deployment checks for each domain independently.",
          ] },
          { type: "note", tone: "warning", text: "Local MAIN_* names are only a convenient way to distinguish the second project in the local .env. Application code and Vercel require ordinary unprefixed names such as DATABASE_URL and ADMIN_EMAIL." },
        ],
      },
      {
        title: "Environment variable names",
        blocks: [
          { type: "code", code: "DATABASE_URL\nSITE_URL\nADMIN_EMAIL\nADMIN_PASSWORD\nADMIN_OTP_SECRET\nORDER_ACCESS_SECRET\nSMTP_HOST\nSMTP_PORT\nSMTP_USER\nSMTP_PASS\nSMTP_FROM" },
          { type: "note", tone: "danger", text: "Never commit .env files or paste secret values into issues, screenshots, logs, Help content, or source files." },
        ],
      },
    ],
  },
  {
    id: "database-migrations",
    title: "Neon and Prisma migrations",
    summary: "Apply additive schema changes to the correct branch without resetting or copying business data.",
    keywords: ["neon", "prisma", "database", "migration", "schema", "main", "dev"],
    sections: [
      {
        blocks: [
          { type: "text", text: "Prisma migrations change database structure; catalogue changes do not. The normal build runs prisma generate but does not apply migrations. This repository excludes prisma/migrations from Vercel uploads, so production migrations must be applied from a trusted full checkout." },
          { type: "code", label: "Safe migration commands after selecting the intended DATABASE_URL", code: "npx prisma migrate status\nnpx prisma migrate deploy\nnpx prisma migrate status" },
          { type: "steps", items: [
            "Update prisma/schema.prisma.",
            "Create a new migration with npx prisma migrate dev --name <short-name> only against an isolated development database, or have a developer author the migration SQL in a new timestamped prisma/migrations folder.",
            "Review the generated migration.sql before applying it anywhere shared. Never rename or edit an already-applied migration.",
            "Confirm the target hostname/branch before writing anything.",
            "Run migrate status and stop if history is failed or divergent.",
            "Run migrate deploy against development, verify, then repeat against main.",
            "Run a read-only schema check and smoke-test database-backed flows.",
          ] },
          { type: "note", tone: "danger", text: "npm run reset-db is destructive. It drops and recreates the selected database. Never use it as a production repair command." },
          { type: "text", text: "There are currently 10 migrations, ending with the admin magic-token challenge migration. Never rename or edit a migration that has already been applied; add a new migration instead." },
        ],
      },
    ],
  },
  {
    id: "security-operations",
    title: "Security operations",
    summary: "Protect secrets, rotate credentials carefully, interpret sessions, and respond to suspected compromise.",
    keywords: ["security", "secret", "rotate", "breach", "session", "password", "headers"],
    sections: [
      {
        blocks: [
          { type: "list", items: [
            "Use different ADMIN_PASSWORD, ADMIN_OTP_SECRET, ORDER_ACCESS_SECRET, DATABASE_URL, and SMTP credentials for each environment.",
            "Use long random admin passwords stored in a password manager. Email OTP is an additional factor, not a reason to use a weak password.",
            "Changing ADMIN_OTP_SECRET invalidates active five-minute admin challenges.",
            "Changing ORDER_ACCESS_SECRET invalidates existing guest order/invoice links.",
            "Changing DATABASE_URL switches the entire customer/order/coupon/session database and can also invalidate order links if ORDER_ACCESS_SECRET is absent.",
            "If admin compromise is suspected, rotate ADMIN_PASSWORD and ADMIN_OTP_SECRET, delete AdminSession and AdminLoginChallenge rows, review status history, and inspect Vercel/Neon access logs.",
          ] },
          { type: "text", text: "Admin mutations require a database-backed session, same-origin request, and JSON content type. Security headers block framing, MIME sniffing, referrer leakage, and unnecessary camera/microphone/location access." },
          { type: "note", tone: "warning", text: "Application rate limits are currently process-memory controls and are not globally coordinated across all Vercel instances. Use Vercel firewall/rate limiting or a shared store before high-volume or hostile traffic." },
        ],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    summary: "Resolve common catalogue, build, email, admin, database, and display problems.",
    keywords: ["error", "troubleshoot", "failed", "missing", "cache", "zoom", "font", "smtp"],
    sections: [
      {
        blocks: [
          { type: "table", headers: ["Problem", "Likely cause and action"], rows: [
            ["taxonomy.json is not valid JSON", "Remove trailing commas and validate braces/quotes"],
            ["No images found", "Add at least cover.* directly inside every retained product/collection folder"],
            ["Classification must be one of…", "Add/correct the taxonomy slug, then regenerate"],
            ["Collection has no folder", "Create the matching collection folder or remove/reassign the product reference"],
            ["Category missing from menu", "It has no generated products; regenerate after adding one"],
            ["Classification missing", "No product in that category currently uses the slug"],
            ["Old product still live", "Delete its source folder, rerun catalogue, and include generated deletions in the push"],
            ["Different visual size between domains", "Browser zoom is stored per domain; press Ctrl+0 on each site"],
            ["Font letters look mixed", "Verify complete Fontsource packages are installed; do not restore old subset WOFF2 files"],
            ["Prisma missing table/column", "Check the correct database branch and run prisma migrate status/deploy"],
            ["Admin code not received", "Check Spam, active challenge timing, SMTP variables, and Vercel logs"],
            ["Admin magic link asks for code", "The link opened in a different browser context; paste the six-digit fallback"],
            ["Build regenerates next-env comments", "Run npm run comments:remove, then npm run comments:check"],
          ] },
          { type: "code", label: "Useful validation sequence", code: "npm run catalogue -- --force\nnpm test\nnpm run build\nnpm run comments:remove\nnpm run comments:check" },
        ],
      },
    ],
  },
  {
    id: "release-checklist",
    title: "Release checklist",
    summary: "A final checklist for catalogue and application releases.",
    keywords: ["release", "launch", "checklist", "smoke test", "production"],
    sections: [
      {
        blocks: [
          { type: "list", items: [
            "Catalogue command completes without errors; warnings are understood.",
            "Generated product, collection, thumbnail, and orphan-removal output is reviewed.",
            "Tests and production build pass.",
            "No removable comments remain.",
            "Both Vercel projects have the intended environment variables and stable secrets.",
            "Any new Prisma migration is applied and verified on both Neon branches.",
            "Homepage, active categories, Shop, product, collection, Contact, policies, and sitemap load.",
            "Images have correct crop/order and no missing asset response.",
            "Customer login email and admin OTP/magic link arrive from the correct project SMTP account.",
            "Admin dashboard, orders, coupon controls, tracking, and invoice access work.",
            "A controlled test order appears only in the intended Neon branch and is removed afterward if it is not business data.",
          ] },
        ],
      },
    ],
  },
]
