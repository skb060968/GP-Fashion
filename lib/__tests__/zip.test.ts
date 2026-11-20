import { describe, expect, it } from "vitest"
import { crc32, makeZip } from "../zip"

const enc = new TextEncoder()

describe("zip", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(enc.encode("123456789"))).toBe(0xcbf43926)
    expect(crc32(new Uint8Array())).toBe(0)
  })

  it("stores each file with its name, size and checksum", () => {
    const a = enc.encode("hello")
    const b = enc.encode("Invoice register\n")
    const zip = makeZip([
      { name: "records/a.txt", data: a, date: new Date(2026, 10, 20, 12, 30, 10) },
      { name: "records/Invoices/b.csv", data: b, date: new Date(2026, 10, 20, 12, 30, 10) },
    ])
    const view = new DataView(zip.buffer)
    expect(view.getUint32(0, true)).toBe(0x04034b50)
    expect(view.getUint32(14, true)).toBe(crc32(a))
    expect(view.getUint32(18, true)).toBe(5)
    expect(new TextDecoder().decode(zip.subarray(30, 30 + 13))).toBe("records/a.txt")
    expect(new TextDecoder().decode(zip.subarray(43, 48))).toBe("hello")

    const end = zip.length - 22
    expect(view.getUint32(end, true)).toBe(0x06054b50)
    expect(view.getUint16(end + 10, true)).toBe(2)
    const centralStart = view.getUint32(end + 16, true)
    expect(view.getUint32(centralStart, true)).toBe(0x02014b50)
    expect(view.getUint32(end + 12, true)).toBe(end - centralStart)

    const second = 30 + 13 + 5
    expect(view.getUint32(second, true)).toBe(0x04034b50)
    expect(view.getUint32(centralStart + 46 + 13 + 42, true)).toBe(second)
  })

  it("makes an empty archive", () => {
    const zip = makeZip([])
    expect(zip.length).toBe(22)
    expect(new DataView(zip.buffer).getUint32(0, true)).toBe(0x06054b50)
  })
})
