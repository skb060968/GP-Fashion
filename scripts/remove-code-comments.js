const fs = require("fs")
const path = require("path")
const ts = require("typescript")

const ROOT = path.join(__dirname, "..")
const SKIP_DIRS = new Set([".git", ".next", ".kiro", ".vercel", "node_modules", "coverage", "public", "assets"])
const JS_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"])
const CODE_EXTS = new Set([...JS_EXTS, ".css", ".prisma", ".sql"])
const CHECK = process.argv.includes("--check")

function lineBreaks(value, space = false) {
  const breaks = value.match(/\r\n|\r|\n/g) || []
  return (space ? " " : "") + breaks.join("")
}

function scriptKind(file) {
  if (file.endsWith(".tsx")) return ts.ScriptKind.TSX
  if (file.endsWith(".jsx")) return ts.ScriptKind.JSX
  if (file.endsWith(".js") || file.endsWith(".mjs") || file.endsWith(".cjs")) return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

function sourceFile(file, value) {
  return ts.createSourceFile(file, value, ts.ScriptTarget.Latest, true, scriptKind(file))
}

function parseErrors(file, value) {
  return sourceFile(file, value).parseDiagnostics
}

function commentRanges(file, value) {
  const source = sourceFile(file, value)
  const ranges = new Map()

  function add(range) {
    const raw = value.slice(range.pos, range.end)
    if (raw.startsWith("/" + "// <reference")) return
    let start = range.pos
    let end = range.end
    let jsx = false
    const token = ts.getTokenAtPosition(source, range.pos)
    if (token.parent?.kind === ts.SyntaxKind.JsxExpression && !token.parent.expression) {
      start = token.parent.pos
      end = token.parent.end
      jsx = true
    }
    ranges.set(`${start}:${end}`, { start, end, kind: range.kind, jsx })
  }

  function walk(node) {
    for (const range of ts.getLeadingCommentRanges(value, node.pos) || []) add(range)
    for (const range of ts.getTrailingCommentRanges(value, node.end) || []) add(range)
    node.getChildren(source).forEach(walk)
  }

  walk(source)
  return [...ranges.values()].sort((a, b) => b.start - a.start)
}

function stripJs(file, value) {
  let output = value
  for (const range of commentRanges(file, value)) {
    const removed = value.slice(range.start, range.end)
    const replacement = lineBreaks(removed, !range.jsx && range.kind === ts.SyntaxKind.MultiLineCommentTrivia)
    output = output.slice(0, range.start) + replacement + output.slice(range.end)
  }
  const open = "<" + "!--"
  const close = "--" + ">"
  let start = output.indexOf(open)
  while (start >= 0) {
    const closeAt = output.indexOf(close, start + open.length)
    if (closeAt < 0) break
    const end = closeAt + close.length
    output = output.slice(0, start) + lineBreaks(output.slice(start, end)) + output.slice(end)
    start = output.indexOf(open, start)
  }
  return output
}

function stripBlocks(value) {
  let i = 0
  let output = ""
  let quote = null
  while (i < value.length) {
    const char = value[i]
    const next = value[i + 1]
    if (quote) {
      output += char
      i++
      if (char === "\\" && i < value.length) output += value[i++]
      else if (char === quote) quote = null
    } else if (char === "'" || char === '"') {
      quote = char
      output += char
      i++
    } else if (char === "/" && next === "*") {
      const start = i
      i += 2
      while (i < value.length && !(value[i] === "*" && value[i + 1] === "/")) i++
      i = Math.min(value.length, i + 2)
      output += lineBreaks(value.slice(start, i), true)
    } else {
      output += char
      i++
    }
  }
  return output
}

function stripLineMarker(value, marker) {
  let i = 0
  let output = ""
  let quote = null
  while (i < value.length) {
    const char = value[i]
    if (quote) {
      output += char
      i++
      if (char === "\\" && i < value.length) output += value[i++]
      else if (char === quote) {
        if (value[i] === quote) output += value[i++]
        else quote = null
      }
    } else if (char === "'" || char === '"') {
      quote = char
      output += char
      i++
    } else if (value.startsWith(marker, i)) {
      i += marker.length
      while (i < value.length && value[i] !== "\n" && value[i] !== "\r") i++
    } else {
      output += char
      i++
    }
  }
  return output
}

function tidy(value) {
  const newline = value.includes("\r\n") ? "\r\n" : "\n"
  const normalized = value.replace(/[ \t]+(?=\r?$)/gm, "").replace(/(?:\r?\n){3,}/g, `${newline}${newline}`)
  return normalized.endsWith(newline) ? normalized : normalized + newline
}

function collect(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collect(full, output)
    else if (CODE_EXTS.has(path.extname(entry.name).toLowerCase())) output.push(full)
  }
  return output
}

const changed = []
for (const file of collect(ROOT)) {
  const ext = path.extname(file).toLowerCase()
  const before = fs.readFileSync(file, "utf8")
  let after
  if (JS_EXTS.has(ext)) after = stripJs(file, before)
  else if (ext === ".css") after = stripBlocks(before)
  else if (ext === ".sql") after = stripLineMarker(stripBlocks(before), "--")
  else after = stripLineMarker(stripBlocks(before), "//")
  after = tidy(after)
  if (after === before) continue

  if (JS_EXTS.has(ext)) {
    const errors = parseErrors(file, after)
    if (errors.length) {
      const first = errors[0]
      throw new Error(`${path.relative(ROOT, file)}:${first.start ?? 0}: ${ts.flattenDiagnosticMessageText(first.messageText, " ")}`)
    }
  }
  changed.push(path.relative(ROOT, file))
  if (!CHECK) fs.writeFileSync(file, after)
}

if (CHECK && changed.length) {
  console.error(`${changed.length} file(s) still contain removable comments or untidy comment remnants:`)
  for (const file of changed) console.error(`  ${file}`)
  process.exit(1)
}
console.log(CHECK ? "No removable code comments found." : `Removed comments from ${changed.length} file(s).`)
