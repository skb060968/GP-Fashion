const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")

const ROOT = path.join(__dirname, "..")
const INPUT_EXT = [".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"]
const TEMP_SUFFIX = ".compressing.mp4"
const MARK = "compressed-by-gp-fashion"
const MAX_SIDE = 1920
const CRF = 26
const MAX_RATE = "3M"
const BUF_SIZE = "6M"
const AUDIO_RATE = "128k"
const MAX_FPS = 30

const args = process.argv.slice(2)
const force = args.includes("--force")
const targetDir = path.resolve(ROOT, args.find((a) => !a.startsWith("--")) || "public/videos")

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg"
const FFPROBE =
  process.env.FFPROBE_PATH ||
  (process.env.FFMPEG_PATH ? path.join(path.dirname(process.env.FFMPEG_PATH), `ffprobe${path.extname(process.env.FFMPEG_PATH)}`) : "ffprobe")

function fail(msg) {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts })
  if (r.error && r.error.code === "ENOENT") {
    fail(`${cmd} was not found. Install FFmpeg (winget install Gyan.FFmpeg), open a new terminal, or set FFMPEG_PATH to ffmpeg.exe.`)
  }
  return r
}

function probe(file) {
  const r = run(FFPROBE, ["-v", "error", "-show_entries", "format=duration:format_tags=comment:stream=codec_type,width,height", "-of", "json", file])
  if (r.status !== 0) return null
  try {
    const data = JSON.parse(r.stdout)
    const video = (data.streams || []).find((s) => s.codec_type === "video")
    return {
      duration: Number(data.format?.duration) || 0,
      comment: data.format?.tags?.comment || data.format?.tags?.COMMENT || "",
      width: video?.width || 0,
      height: video?.height || 0,
      hasVideo: !!video,
      hasAudio: (data.streams || []).some((s) => s.codec_type === "audio"),
    }
  } catch {
    return null
  }
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)}MB`
const rel = (file) => path.relative(ROOT, file)

function collect(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collect(full, out)
    else if (entry.name.endsWith(TEMP_SUFFIX)) {
      fs.rmSync(full, { force: true })
      console.log(`rm     ${rel(full)}  (left over from an interrupted run)`)
    } else if (INPUT_EXT.includes(path.extname(entry.name).toLowerCase())) out.push(full)
  }
  return out
}

function compress(file) {
  const info = probe(file)
  if (!info || !info.hasVideo) {
    console.log(`skip   ${rel(file)}  (not a readable video)`)
    return null
  }
  if (info.comment === MARK && !force) {
    console.log(`skip   ${rel(file)}  (already compressed, ${mb(fs.statSync(file).size)}; use --force to re-encode)`)
    return null
  }

  const parsed = path.parse(file)
  const target = path.join(parsed.dir, `${parsed.name}.mp4`)
  if (target.toLowerCase() !== file.toLowerCase() && fs.existsSync(target)) {
    console.log(`skip   ${rel(file)}  (${rel(target)} already exists; remove one of them)`)
    return null
  }
  const temp = path.join(parsed.dir, `${parsed.name}${TEMP_SUFFIX}`)

  const scale = `scale=w='if(gte(iw,ih),min(${MAX_SIDE},iw),-2)':h='if(gte(iw,ih),-2,min(${MAX_SIDE},ih))'`
  console.log(`enc    ${rel(file)}  ${info.width}x${info.height}, ${info.duration.toFixed(1)}s, ${mb(fs.statSync(file).size)} ...`)
  const r = run(
    FFMPEG,
    [
      "-y", "-hide_banner", "-loglevel", "error",
      "-i", file,
      "-map", "0:v:0", "-map", "0:a:0?",
      "-vf", scale,
      "-fpsmax", String(MAX_FPS),
      "-c:v", "libx264", "-preset", "slow", "-crf", String(CRF), "-maxrate", MAX_RATE, "-bufsize", BUF_SIZE,
      "-pix_fmt", "yuv420p", "-profile:v", "high",
      "-c:a", "aac", "-b:a", AUDIO_RATE, "-ac", "2",
      "-movflags", "+faststart",
      "-map_metadata", "-1",
      "-metadata", `comment=${MARK}`,
      temp,
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  )
  if (r.status !== 0) {
    fs.rmSync(temp, { force: true })
    console.log(`fail   ${rel(file)}  ffmpeg: ${(r.stderr || "").trim().split("\n").slice(-3).join(" | ")}`)
    return { failed: true }
  }

  const out = probe(temp)
  if (!out || !out.hasVideo || Math.abs(out.duration - info.duration) > Math.max(1, info.duration * 0.02) || out.hasAudio !== info.hasAudio) {
    fs.rmSync(temp, { force: true })
    console.log(`fail   ${rel(file)}  the compressed file did not check out; the original was kept`)
    return { failed: true }
  }

  const before = fs.statSync(file).size
  const after = fs.statSync(temp).size
  if (after >= before && !force) {
    fs.rmSync(temp, { force: true })
    console.log(`keep   ${rel(file)}  (already smaller than a re-encode would be)`)
    return null
  }

  fs.rmSync(file, { force: true })
  fs.renameSync(temp, target)
  console.log(`ok     ${rel(file)} -> ${rel(target)}  ${mb(before)} -> ${mb(after)}  (-${((1 - after / before) * 100).toFixed(0)}%), ${out.width}x${out.height}`)
  return { from: path.basename(file), to: path.basename(target) }
}

function findReferences(names) {
  const hits = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(tsx?|jsx?|css|md)$/.test(entry.name)) {
        const text = fs.readFileSync(full, "utf8")
        for (const name of names) if (text.includes(name)) hits.push(`${rel(full)}  ->  ${name}`)
      }
    }
  }
  ;["app", "components", "lib"].map((d) => path.join(ROOT, d)).filter(fs.existsSync).forEach(walk)
  return hits
}

function main() {
  if (!fs.existsSync(targetDir)) fail(`Folder not found: ${targetDir}`)
  run(FFMPEG, ["-version"])
  const files = collect(targetDir)
  if (files.length === 0) {
    console.log("No videos found.")
    return
  }
  console.log(`\nCompressing ${files.length} video(s) in ${rel(targetDir)}${force ? " (force)" : ""}\n`)
  const results = files.map(compress).filter(Boolean)
  const renamed = results.filter((r) => r.from && r.from !== r.to).map((r) => r.from)
  if (renamed.length) {
    const refs = findReferences(renamed)
    if (refs.length) {
      console.log("\nUpdate these references to .mp4:")
      refs.forEach((r) => console.log(`  ${r}`))
    }
  }
  if (results.some((r) => r.failed)) process.exit(1)
}

main()
