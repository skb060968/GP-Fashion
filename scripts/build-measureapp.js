const fs = require("fs")
const path = require("path")
const vm = require("vm")

const ROOT = path.join(__dirname, "..")
const SOURCE = path.resolve(process.argv[2] || path.join(ROOT, "..", "MeasureApp"))
const OUT_DIR = path.join(ROOT, "measureapp")
const OUT_FILE = path.join(OUT_DIR, "index.html")
const PATTERNS_FILE = path.join(OUT_DIR, "patterns.json")
const EMBED_CSS = ".app-header { display: none !important; }"

function read(rel) {
  const file = path.resolve(SOURCE, rel)
  if (!file.startsWith(SOURCE + path.sep)) throw new Error(`Refusing to read outside the MeasureApp folder: ${rel}`)
  if (!fs.existsSync(file)) throw new Error(`Missing file referenced by index.html: ${rel}`)
  return fs.readFileSync(file, "utf8")
}

function checkInline(rel, code, closing) {
  if (code.toLowerCase().includes(closing)) throw new Error(`${rel} contains "${closing}", which would end the inline block early`)
  if (code.includes("<!--")) throw new Error(`${rel} contains "<!--", which is unsafe inside an inline block`)
  return code
}

function build() {
  const indexFile = path.join(SOURCE, "index.html")
  if (!fs.existsSync(indexFile)) throw new Error(`MeasureApp index.html not found at ${indexFile}. Pass the MeasureApp folder as the first argument.`)
  let html = fs.readFileSync(indexFile, "utf8")
  let styles = 0
  let scripts = 0

  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => {
    styles++
    return `<style>\n${checkInline(href, read(href), "</style")}\n</style>`
  })
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
    scripts++
    return `<script>\n${checkInline(src, read(src), "</script")}\n</script>`
  })

  if (/<script[^>]+\bsrc=|<link[^>]+\bhref=/i.test(html)) throw new Error("index.html still references an external file after inlining")
  if (!html.includes("</head>")) throw new Error("index.html has no </head>")
  html = html.replace("</head>", `  <meta name="robots" content="noindex, nofollow">\n  <style>${EMBED_CSS}</style>\n</head>`)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_FILE, html)
  const kb = Math.round(Buffer.byteLength(html) / 1024)
  console.log(`MeasureApp bundled: ${styles} stylesheet(s), ${scripts} script(s), ${kb} KB -> ${path.relative(ROOT, OUT_FILE)}`)

  const patterns = readPatterns(fs.readFileSync(indexFile, "utf8"))
  fs.writeFileSync(PATTERNS_FILE, JSON.stringify(patterns, null, 2) + "\n")
  const counts = Object.entries(patterns.categories).map(([c, g]) => `${c} ${Object.keys(g).length}`).join(", ")
  console.log(`Patterns: ${counts}; ${Object.keys(patterns.options).length} style options -> ${path.relative(ROOT, PATTERNS_FILE)}`)
}

const NO_DOM_SCRIPTS = ["js/render.js", "js/app.js"]

function readPatterns(indexHtml) {
  const context = { console }
  context.globalThis = context
  vm.createContext(context)
  const srcs = [...indexHtml.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]).filter((s) => !NO_DOM_SCRIPTS.includes(s))
  for (const src of srcs) vm.runInContext(read(src), context, { filename: src })
  const cats = context.MA && context.MA.categories
  if (!cats) throw new Error("MeasureApp categories did not load")
  const categories = {}
  for (const [cat, c] of Object.entries(cats)) {
    categories[cat] = Object.fromEntries(Object.entries(c.garments).map(([id, g]) => [id, g.name]))
  }

  const start = indexHtml.indexOf('<details class="options">')
  const end = indexHtml.indexOf("</details>", start)
  if (start < 0 || end < 0) throw new Error('index.html has no <details class="options"> block')
  const block = indexHtml.slice(start, end)
  const options = {}
  for (const m of block.matchAll(/<label([^>]*)>([\s\S]*?)<\/label>/g)) {
    const forAttr = m[1].match(/data-for="([^"]+)"/)
    const select = m[2].match(/<select id="([^"]+)">([\s\S]*?)<\/select>/)
    if (!select) continue
    const values = [...select[2].matchAll(/<option value="([^"]*)"/g)].map((o) => o[1])
    options[select[1]] = { for: forAttr ? forAttr[1].split(",") : null, values }
  }
  return { categories, options }
}

build()
