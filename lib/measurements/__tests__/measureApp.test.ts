import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { products } from "@/lib/data/shop"
import { measureAppPayload } from "@/lib/measurements/measureApp"

const patterns = JSON.parse(readFileSync(path.join(process.cwd(), "measureapp", "patterns.json"), "utf8")) as {
  categories: Record<string, Record<string, string>>
  options: Record<string, { for: string[] | null; values: string[] }>
}

describe("catalogue patterns", () => {
  it("every product pattern exists in MeasureApp with valid options", () => {
    for (const p of products) {
      if (!p.pattern) continue
      expect(patterns.categories[p.pattern.app]?.[p.pattern.garment], `${p.slug} garment`).toBeTruthy()
      for (const [key, value] of Object.entries(p.pattern.options)) {
        const o = patterns.options[key]
        expect(o, `${p.slug} option ${key}`).toBeTruthy()
        expect(o.for === null || o.for.includes(p.pattern.garment), `${p.slug} option ${key} applies`).toBe(true)
        expect(o.values).toContain(value)
      }
    }
  })
})

describe("measureAppPayload", () => {
  const pattern = { app: "women", garment: "sheath", name: "Sheath dress (fitted)", options: { "d-length": "ankle" } }
  const snapshot = { profileId: "p", name: "Riya", kind: "women", values: { height: 64, chest: 37, waist: 31, hip: 40 }, notes: "loose", savedAt: "2026-11-15" }

  it("standard item sends the ordered size and the pattern", () => {
    const p = measureAppPayload("26010", { slug: "pink-petal-gown", name: "Pink Petal Gown", size: "L", pattern }, "womenswear")
    expect(p).toMatchObject({ category: "women", product: "pink-petal-gown", garment: "sheath", options: { "d-length": "ankle" }, size: "L" })
    expect(p?.values).toBeUndefined()
  })

  it("made-to-measure item sends the measurements, not the size", () => {
    const p = measureAppPayload("26011", { slug: "pink-petal-gown", name: "Pink Petal Gown", size: "Custom", pattern, measurements: snapshot }, "womenswear")
    expect(p).toMatchObject({ category: "women", values: snapshot.values, notes: "loose", garment: "sheath" })
    expect(p?.size).toBeUndefined()
    expect(p?.customer).toBe("Riya · order 26011")
  })

  it("item without a pattern still opens with the category", () => {
    const p = measureAppPayload("26012", { slug: "midnight-halter-gown", name: "Midnight Halter Gown", size: "M" }, "womenswear")
    expect(p).toMatchObject({ category: "women", product: "midnight-halter-gown", size: "M" })
    expect(p?.garment).toBeUndefined()
  })

  it("accessories are not opened", () => {
    expect(measureAppPayload("26013", { slug: "bag", name: "Bag", size: "ONE SIZE" }, "accessories")).toBeNull()
  })
})
