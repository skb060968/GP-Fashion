

const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const ROOT = path.join(__dirname, "..")
const SKIP_FOLDERS = ["shop", "brand", "payments"]
const INPUT_EXT = [".jpg", ".jpeg", ".png"]
const QUALITY = 85

const args = process.argv.slice(2)
const keepOriginals = args.includes("--keep")
const targetDir = path.resolve(
  ROOT,
  args.find((a) => !a.startsWith("--")) || "public/images"
)

function collect(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_FOLDERS.includes(entry.name)) {
        console.log(`skip   ${path.relative(ROOT, full)}`)
        continue
      }
      collect(full, out)
    } else if (INPUT_EXT.includes(path.extname(entry.name).toLowerCase())) {
      out.push(full)
    }
  }
  return out
}

async function convert(file) {
  const out = file.replace(/\.(jpe?g|png)$/i, ".webp")
  await sharp(file).webp({ quality: QUALITY, effort: 6 }).toFile(out)
  const before = fs.statSync(file).size
  const after = fs.statSync(out).size
  const saved = ((1 - after / before) * 100).toFixed(0)
  console.log(
    `ok     ${path.relative(ROOT, file)}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB  (-${saved}%)`
  )
  if (!keepOriginals) fs.unlinkSync(file)
  return path.basename(file)
}

function findReferences(names) {
  const srcDirs = ["app", "components", "lib"].map((d) => path.join(ROOT, d))
  const hits = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(tsx?|jsx?|css|md)$/.test(entry.name)) {
        const text = fs.readFileSync(full, "utf8")
        for (const name of names) {
          if (text.includes(name)) hits.push(`${path.relative(ROOT, full)}  ->  ${name}`)
        }
      }
    }
  }
  srcDirs.filter(fs.existsSync).forEach(walk)
  return hits
}

async function main() {
  if (!fs.existsSync(targetDir)) {
    console.error(`Folder not found: ${targetDir}`)
    process.exit(1)
  }
  const files = collect(targetDir)
  if (files.length === 0) {
    console.log("Nothing to convert.")
    return
  }
  console.log(`\nConverting ${files.length} file(s) in ${path.relative(ROOT, targetDir)}\n`)
  const converted = []
  for (const f of files) converted.push(await convert(f))

  const refs = findReferences(converted)
  if (refs.length) {
    console.log("\nUpdate these references to .webp:")
    refs.forEach((r) => console.log(`  ${r}`))
  } else {
    console.log("\nNo source references to the old filenames found.")
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
