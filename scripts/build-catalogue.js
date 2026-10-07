

const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const ROOT = path.join(__dirname, "..")
const SOURCE_DIR = path.join(ROOT, "catalogue")
const COLLECTIONS_SRC = path.join(SOURCE_DIR, "_collections")
const TAXONOMY_FILE = path.join(SOURCE_DIR, "taxonomy.json")
const ITEMS_DIR = path.join(ROOT, "public/images/shop/items")
const THUMBS_DIR = path.join(ROOT, "public/images/shop/thumbnails")
const COLLECTIONS_DIR = path.join(ROOT, "public/images/shop/collections")
const SHOP_TS = path.join(ROOT, "lib/data/shop.ts")
const COLLECTIONS_TS = path.join(ROOT, "lib/data/collections.ts")

const ITEM_SIZE = { width: 1200, height: 1600 }
const THUMB_SIZE = { width: 300, height: 400 }
const COLLECTION_SIZE = { width: 1600, height: 900 }
const ITEM_QUALITY = 82
const THUMB_QUALITY = 80

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"]
const CATEGORIES = ["menswear", "womenswear"]

const SIZES = ["S", "M", "L", "XL"]
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const RESERVED_VIEWS = ["new-arrivals", "bestsellers"]

const force = process.argv.includes("--force")

function fail(msg) {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}

function readJson(file, label) {
  if (!fs.existsSync(file)) fail(`${label}: missing ${path.basename(file)}`)
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (e) {
    fail(`${label}: ${path.basename(file)} is not valid JSON (${e.message})`)
  }
}

function webPath(absolute) {
  return "/" + path.relative(path.join(ROOT, "public"), absolute).split(path.sep).join("/")
}

function isFresh(src, out) {
  if (force || !fs.existsSync(out)) return false
  return fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs
}

async function encode(src, out, size, quality) {
  if (isFresh(src, out)) return false
  fs.mkdirSync(path.dirname(out), { recursive: true })

  const img = sharp(src).rotate()
  const m = await img.metadata()
  const rotated = (m.orientation ?? 1) >= 5
  const srcW = rotated ? m.height : m.width
  const srcH = rotated ? m.width : m.height
  const scale = Math.min(1, srcW / size.width, srcH / size.height)
  const width = Math.round(size.width * scale)
  const height = Math.round(size.height * scale)
  if (scale < 1) console.log(`       ${path.relative(ROOT, src)} is ${srcW}x${srcH}; output ${width}x${height} (ideal ${size.width}x${size.height})`)

  await img
    .resize({ width, height, fit: "cover", position: sharp.strategy.attention })
    .webp({ quality, effort: 6 })
    .toFile(out)
  return true
}

function listImages(label, dir) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXT.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  if (files.length === 0) fail(`${label}: no images found`)

  const coverIdx = files.findIndex((f) => path.parse(f).name.toLowerCase() === "cover")
  const cover = coverIdx >= 0 ? files.splice(coverIdx, 1)[0] : files.shift()
  if (coverIdx < 0) console.log(`       ${label}: no cover.* found, using ${cover} as cover`)
  return { cover, others: files }
}

function readTaxonomy() {
  const t = readJson(TAXONOMY_FILE, "taxonomy")
  if (!Array.isArray(t.classifications) || t.classifications.length === 0) fail("taxonomy: \"classifications\" must be a non-empty array")
  const seen = new Set()
  for (const c of t.classifications) {
    if (!SLUG_RE.test(c.slug || "")) fail(`taxonomy: classification slug "${c.slug}" must be lowercase letters, numbers and hyphens`)
    if (RESERVED_VIEWS.includes(c.slug)) fail(`taxonomy: "${c.slug}" is reserved and cannot be a classification`)
    if (typeof c.title !== "string" || !c.title.trim()) fail(`taxonomy: classification "${c.slug}" needs a title`)
    if (seen.has(c.slug)) fail(`taxonomy: duplicate classification "${c.slug}"`)
    seen.add(c.slug)
  }
  return t.classifications.map((c) => ({ slug: c.slug, title: c.title.trim() }))
}

async function buildCollection(slug) {
  const dir = path.join(COLLECTIONS_SRC, slug)
  const label = `collection ${slug}`
  const meta = readJson(path.join(dir, "meta.json"), label)

  if (!SLUG_RE.test(slug)) fail(`${label}: folder name must be lowercase letters, numbers and hyphens`)
  if (typeof meta.name !== "string" || !meta.name.trim()) fail(`${label}: "name" is required`)
  if (typeof meta.releaseDate !== "string" || !DATE_RE.test(meta.releaseDate) || isNaN(Date.parse(meta.releaseDate)))
    fail(`${label}: "releaseDate" must be YYYY-MM-DD`)
  if (meta.season !== undefined && typeof meta.season !== "string") fail(`${label}: "season" must be a string`)
  if (meta.description !== undefined && typeof meta.description !== "string") fail(`${label}: "description" must be a string`)
  if (meta.order !== undefined && !Number.isInteger(meta.order)) fail(`${label}: "order" must be a whole number`)

  const { cover } = listImages(label, dir)
  const out = path.join(COLLECTIONS_DIR, `${slug}.webp`)
  const encoded = await encode(path.join(dir, cover), out, COLLECTION_SIZE, ITEM_QUALITY)

  console.log(`  ok   ${slug.padEnd(28)} collection  released ${meta.releaseDate}${encoded ? "  (cover encoded)" : ""}`)

  return {
    slug,
    name: meta.name.trim(),
    season: (meta.season || "").trim(),
    releaseDate: meta.releaseDate,
    description: (meta.description || "").trim(),
    order: meta.order ?? 1000,
    coverImage: webPath(out),
  }
}

function readMeta(slug, dir, taxonomy, collections) {
  const meta = readJson(path.join(dir, "meta.json"), slug)

  if (!SLUG_RE.test(slug)) fail(`${slug}: folder name must be lowercase letters, numbers and hyphens`)
  if (typeof meta.name !== "string" || !meta.name.trim()) fail(`${slug}: "name" is required`)
  if (!CATEGORIES.includes(meta.category)) fail(`${slug}: "category" must be one of ${CATEGORIES.join(", ")}`)
  if (!taxonomy.some((c) => c.slug === meta.classification))
    fail(`${slug}: "classification" must be one of ${taxonomy.map((c) => c.slug).join(", ")} (see catalogue/taxonomy.json)`)
  if (meta.collection !== undefined && meta.collection !== null && !collections.has(meta.collection))
    fail(`${slug}: "collection" "${meta.collection}" has no folder under catalogue/_collections/`)
  if (!Number.isInteger(meta.priceInr) || meta.priceInr <= 0) fail(`${slug}: "priceInr" must be a whole number of rupees`)
  if (!Array.isArray(meta.sizes) || meta.sizes.length === 0) fail(`${slug}: "sizes" must be a non-empty array`)
  for (const s of meta.sizes) if (!SIZES.includes(s)) fail(`${slug}: size "${s}" is not allowed (use ${SIZES.join(", ")})`)
  if (meta.description !== undefined && typeof meta.description !== "string") fail(`${slug}: "description" must be a string`)
  if (meta.order !== undefined && !Number.isInteger(meta.order)) fail(`${slug}: "order" must be a whole number`)
  if (meta.bestseller !== undefined && typeof meta.bestseller !== "boolean") fail(`${slug}: "bestseller" must be true or false`)
  if (meta.releaseDate !== undefined && (!DATE_RE.test(meta.releaseDate) || isNaN(Date.parse(meta.releaseDate))))
    fail(`${slug}: "releaseDate" must be YYYY-MM-DD`)

  const collection = meta.collection || null
  const releaseDate = meta.releaseDate || (collection ? collections.get(collection).releaseDate : null)
  if (!releaseDate) fail(`${slug}: needs a "releaseDate" because it is not part of a collection`)

  return {
    name: meta.name.trim(),
    category: meta.category,
    classification: meta.classification,
    collection,
    releaseDate,
    description: (meta.description || "").trim(),
    price: meta.priceInr * 100,
    sizes: SIZES.filter((s) => meta.sizes.includes(s)),
    bestseller: meta.bestseller === true,
    order: meta.order ?? 1000,
  }
}

async function buildProduct(slug, taxonomy, collections) {
  const dir = path.join(SOURCE_DIR, slug)
  const meta = readMeta(slug, dir, taxonomy, collections)
  const { cover, others } = listImages(slug, dir)

  const itemDir = path.join(ITEMS_DIR, slug)
  const thumbDir = path.join(THUMBS_DIR, slug)

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

  console.log(
    `  ok   ${slug.padEnd(28)} ${meta.category.padEnd(10)} ${meta.classification.padEnd(20)} ₹${(meta.price / 100).toLocaleString("en-IN").padStart(8)}   ${images.length} image(s), ${encoded} encoded`
  )

  return {
    slug,
    name: meta.name,
    category: meta.category,
    classification: meta.classification,
    collection: meta.collection,
    releaseDate: meta.releaseDate,
    description: meta.description,
    price: meta.price,
    sizes: meta.sizes,
    bestseller: meta.bestseller,
    order: meta.order,
    images,
    coverImage: webPath(coverOut),
    coverThumbnail: webPath(coverThumbOut),
  }
}

function removeOrphans(productSlugs, collectionSlugs) {
  for (const base of [ITEMS_DIR, THUMBS_DIR]) {
    if (!fs.existsSync(base)) continue
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (entry.isDirectory() && !productSlugs.includes(entry.name)) {
        fs.rmSync(path.join(base, entry.name), { recursive: true, force: true })
        console.log(`  rm   ${path.relative(ROOT, path.join(base, entry.name))}`)
      }
    }
  }
  if (fs.existsSync(COLLECTIONS_DIR)) {
    for (const f of fs.readdirSync(COLLECTIONS_DIR)) {
      if (!collectionSlugs.includes(path.parse(f).name)) {
        fs.rmSync(path.join(COLLECTIONS_DIR, f), { force: true })
        console.log(`  rm   ${path.relative(ROOT, path.join(COLLECTIONS_DIR, f))}`)
      }
    }
  }
}

function writeShopTs(products, taxonomy) {
  const src = `export type ProductCategory = "menswear" | "womenswear"

export interface Classification {
  slug: string
  title: string
}

export interface Product {
  slug: string
  name: string
  category: ProductCategory
  classification: string
  collection: string | null
  releaseDate: string
  description: string
  price: number
  sizes: string[]
  bestseller: boolean
  order: number
  images: string[]
  coverImage: string
  coverThumbnail: string
}

export const classifications: Classification[] = ${JSON.stringify(taxonomy, null, 2)}

export const products: Product[] = ${JSON.stringify(products, null, 2)}
`
  fs.writeFileSync(SHOP_TS, src)
}

function writeCollectionsTs(collections) {
  const src = `export interface Collection {
  slug: string
  name: string
  season: string
  releaseDate: string
  description: string
  order: number
  coverImage: string
}

export const collections: Collection[] = ${JSON.stringify(collections, null, 2)}
`
  fs.writeFileSync(COLLECTIONS_TS, src)
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) fail(`Source folder not found: ${path.relative(ROOT, SOURCE_DIR)}`)

  const taxonomy = readTaxonomy()

  const collectionSlugs = fs.existsSync(COLLECTIONS_SRC)
    ? fs.readdirSync(COLLECTIONS_SRC, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name).sort()
    : []

  const productSlugs = fs
    .readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !e.name.startsWith("_"))
    .map((e) => e.name)
    .sort()

  console.log(`\nBuilding catalogue: ${collectionSlugs.length} collection(s), ${productSlugs.length} product(s)${force ? " (force)" : ""}\n`)

  const collections = []
  for (const slug of collectionSlugs) collections.push(await buildCollection(slug))
  const collectionMap = new Map(collections.map((c) => [c.slug, c]))
  collections.sort((a, b) => a.order - b.order || b.releaseDate.localeCompare(a.releaseDate))

  const products = []
  for (const slug of productSlugs) products.push(await buildProduct(slug, taxonomy, collectionMap))

  const names = new Map()
  for (const p of products) {
    const key = p.name.toLowerCase()
    if (names.has(key)) fail(`Duplicate product name "${p.name}" in ${names.get(key)} and ${p.slug} (names must be unique)`)
    names.set(key, p.slug)
  }
  for (const c of collections) {
    if (!products.some((p) => p.collection === c.slug)) console.log(`       warning: collection ${c.slug} has no products`)
  }

  products.sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order || a.name.localeCompare(b.name))

  removeOrphans(productSlugs, collectionSlugs)
  writeShopTs(products, taxonomy)
  writeCollectionsTs(collections)

  const byCat = CATEGORIES.map((c) => `${c}: ${products.filter((p) => p.category === c).length}`).join(", ")
  console.log(`\nWrote ${path.relative(ROOT, SHOP_TS)} with ${products.length} product(s) (${byCat})`)
  console.log(`Wrote ${path.relative(ROOT, COLLECTIONS_TS)} with ${collections.length} collection(s)\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
