/**
 * Build the product catalogue from source folders.
 *
 *   catalogue/<slug>/meta.json       product details (see catalogue/README.md)
 *   catalogue/<slug>/cover.jpg       cover photo (jpg/jpeg/png/webp)
 *   catalogue/<slug>/01.jpg, 02.jpg  further photos, shown in filename order
 *
 * Produces:
 *   public/images/shop/items/<slug>/<slug>-cover.webp, <slug>-1.webp, ...   (1200x1600, 3:4)
 *   public/images/shop/thumbnails/<slug>/<slug>-cover.webp                  (300x400, 3:4)
 *   lib/data/shop.ts                                                         (typed product array)
 *
 * Usage:
 *   npm run catalogue            # build (skips images whose output is newer than the source)
 *   npm run catalogue -- --force # re-encode every image
 *
 * Output folders for slugs that no longer exist in catalogue/ are removed, so
 * deleting a product is just deleting its source folder and re-running.
 */
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const ROOT = path.join(__dirname, "..")
const SOURCE_DIR = path.join(ROOT, "catalogue")
const ITEMS_DIR = path.join(ROOT, "public/images/shop/items")
const THUMBS_DIR = path.join(ROOT, "public/images/shop/thumbnails")
const OUTPUT_TS = path.join(ROOT, "lib/data/shop.ts")

const ITEM_SIZE = { width: 1200, height: 1600 }
const THUMB_SIZE = { width: 300, height: 400 }
const ITEM_QUALITY = 82
const THUMB_QUALITY = 80

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"]
const CATEGORIES = ["menswear", "womenswear"]
// Must match orderItemSchema in lib/validation/schemas.ts and SIZES in app/shop/ShopClient.tsx
const SIZES = ["S", "M", "L", "XL"]
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const force = process.argv.includes("--force")

function fail(msg) {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}

function readMeta(slug, dir) {
  const file = path.join(dir, "meta.json")
  if (!fs.existsSync(file)) fail(`${slug}: missing meta.json`)
  let meta
  try {
    meta = JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (e) {
    fail(`${slug}: meta.json is not valid JSON (${e.message})`)
  }

  if (!SLUG_RE.test(slug)) fail(`${slug}: folder name must be lowercase letters, numbers and hyphens`)
  if (typeof meta.name !== "string" || !meta.name.trim()) fail(`${slug}: "name" is required`)
  if (!CATEGORIES.includes(meta.category)) fail(`${slug}: "category" must be one of ${CATEGORIES.join(", ")}`)
  if (!Number.isInteger(meta.priceInr) || meta.priceInr <= 0) fail(`${slug}: "priceInr" must be a whole number of rupees`)
  if (!Array.isArray(meta.sizes) || meta.sizes.length === 0) fail(`${slug}: "sizes" must be a non-empty array`)
  for (const s of meta.sizes) if (!SIZES.includes(s)) fail(`${slug}: size "${s}" is not allowed (use ${SIZES.join(", ")})`)
  if (meta.description !== undefined && typeof meta.description !== "string") fail(`${slug}: "description" must be a string`)
  if (meta.order !== undefined && !Number.isInteger(meta.order)) fail(`${slug}: "order" must be a whole number`)

  return {
    name: meta.name.trim(),
    category: meta.category,
    description: (meta.description || "").trim(),
    price: meta.priceInr * 100, // paise
    sizes: SIZES.filter((s) => meta.sizes.includes(s)), // canonical order
    order: meta.order ?? 1000,
  }
}

function listImages(slug, dir) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXT.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  if (files.length === 0) fail(`${slug}: no images found`)

  const coverIdx = files.findIndex((f) => path.parse(f).name.toLowerCase() === "cover")
  const cover = coverIdx >= 0 ? files.splice(coverIdx, 1)[0] : files.shift()
  if (coverIdx < 0) console.log(`       ${slug}: no cover.* found, using ${cover} as cover`)
  return { cover, others: files }
}

function isFresh(src, out) {
  if (force || !fs.existsSync(out)) return false
  return fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs
}

async function encode(src, out, size, quality) {
  if (isFresh(src, out)) return false
  fs.mkdirSync(path.dirname(out), { recursive: true })
  await sharp(src)
    .rotate() // honour EXIF orientation from phone cameras
    .resize({ ...size, fit: "cover", position: sharp.strategy.attention, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(out)
  return true
}

async function buildProduct(slug) {
  const dir = path.join(SOURCE_DIR, slug)
  const meta = readMeta(slug, dir)
  const { cover, others } = listImages(slug, dir)

  const itemDir = path.join(ITEMS_DIR, slug)
  const thumbDir = path.join(THUMBS_DIR, slug)
  const webPath = (absolute) => "/" + path.relative(path.join(ROOT, "public"), absolute).split(path.sep).join("/")

  // Remove stale outputs (e.g. a photo was deleted or renumbered)
  for (const d of [itemDir, thumbDir]) if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true })

  let encoded = 0
  const coverOut = path.join(itemDir, `${slug}-cover.webp`)
  const coverThumbOut = path.join(thumbDir, `${slug}-cover.webp`)
  encoded += (await encode(path.join(dir, cover), coverOut, ITEM_SIZE, ITEM_QUALITY)) ? 1 : 0
  encoded += (await encode(path.join(dir, cover), coverThumbOut, THUMB_SIZE, THUMB_QUALITY)) ? 1 : 0

  const images = [webPath(coverOut)]
  for (let i = 0; i < others.length; i++) {
    const out = path.join(itemDir, `${slug}-${i + 1}.webp`)
    encoded += (await encode(path.join(dir, others[i]), out, ITEM_SIZE, ITEM_QUALITY)) ? 1 : 0
    images.push(webPath(out))
  }

  console.log(`  ok   ${slug.padEnd(28)} ${meta.category.padEnd(10)} ₹${(meta.price / 100).toLocaleString("en-IN").padStart(8)}   ${images.length} image(s), ${encoded} encoded`)

  return {
    slug,
    name: meta.name,
    category: meta.category,
    description: meta.description,
    price: meta.price,
    sizes: meta.sizes,
    order: meta.order,
    images,
    coverImage: webPath(coverOut),
    coverThumbnail: webPath(coverThumbOut),
  }
}

function removeOrphans(slugs) {
  for (const base of [ITEMS_DIR, THUMBS_DIR]) {
    if (!fs.existsSync(base)) continue
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (entry.isDirectory() && !slugs.includes(entry.name)) {
        fs.rmSync(path.join(base, entry.name), { recursive: true, force: true })
        console.log(`  rm   ${path.relative(ROOT, path.join(base, entry.name))}`)
      }
    }
  }
}

function writeShopTs(products) {
  const body = JSON.stringify(products, null, 2)
  const src = `// AUTO-GENERATED by scripts/build-catalogue.js. Do not edit.
// Source of truth: catalogue/<slug>/meta.json and photos. Run \`npm run catalogue\`.

export type ProductCategory = "menswear" | "womenswear"

export interface Product {
  slug: string
  name: string
  category: ProductCategory
  description: string
  /** Price in paise. */
  price: number
  sizes: string[]
  /** Sort position within its category; lower first. */
  order: number
  /** Gallery images, cover first. 1200x1600 webp. */
  images: string[]
  coverImage: string
  /** 300x400 webp used in bag, checkout and order emails. */
  coverThumbnail: string
}

export const products: Product[] = ${body}
`
  fs.writeFileSync(OUTPUT_TS, src)
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) fail(`Source folder not found: ${path.relative(ROOT, SOURCE_DIR)}`)

  const slugs = fs
    .readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !e.name.startsWith("_"))
    .map((e) => e.name)
    .sort()

  console.log(`\nBuilding catalogue from ${slugs.length} product folder(s)${force ? " (force)" : ""}\n`)

  const products = []
  for (const slug of slugs) products.push(await buildProduct(slug))

  const names = new Map()
  for (const p of products) {
    const key = p.name.toLowerCase()
    if (names.has(key)) fail(`Duplicate product name "${p.name}" in ${names.get(key)} and ${p.slug} (names must be unique)`)
    names.set(key, p.slug)
  }

  products.sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order || a.name.localeCompare(b.name))

  removeOrphans(slugs)
  writeShopTs(products)

  const byCat = CATEGORIES.map((c) => `${c}: ${products.filter((p) => p.category === c).length}`).join(", ")
  console.log(`\nWrote ${path.relative(ROOT, OUTPUT_TS)} with ${products.length} product(s) (${byCat})\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
