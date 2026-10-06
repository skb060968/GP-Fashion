// lib/data/sizeGuide.ts
// Body measurements for each size, shown in the "Size guide" dialog on product
// pages. Values are in inches; the dialog converts to centimetres.
// Edit the numbers here once the label's grading is finalised.

import type { CategorySlug } from "./categories"

export type SizeGuideRow = { size: string; values: number[] }

export interface SizeGuide {
  /** Column headings, in order. */
  measurements: string[]
  rows: SizeGuideRow[]
  /** One tip per measurement, same order as `measurements`. */
  howToMeasure: string[]
  /** Advice shown under the table. */
  notes: string[]
}

export const sizeGuides: Record<CategorySlug, SizeGuide> = {
  menswear: {
    measurements: ["Chest", "Waist", "Hip", "Shoulder"],
    rows: [
      { size: "S", values: [36, 30, 37, 17] },
      { size: "M", values: [38, 32, 39, 17.5] },
      { size: "L", values: [40, 34, 41, 18] },
      { size: "XL", values: [42, 36, 43, 18.5] },
    ],
    howToMeasure: [
      "Around the fullest part of the chest, under the arms, tape level across the back.",
      "Around the natural waistline, where the trousers normally sit.",
      "Around the fullest part of the seat, feet together.",
      "Across the back, from the edge of one shoulder to the other.",
    ],
    notes: [
      "These are body measurements, not garment measurements. Each piece has ease added for its intended fit.",
      "Between sizes? Choose the larger for tailored jackets and sherwanis, the smaller for shirts and kurtas.",
    ],
  },
  womenswear: {
    measurements: ["Bust", "Waist", "Hip", "Shoulder"],
    rows: [
      { size: "S", values: [34, 28, 37, 14.5] },
      { size: "M", values: [36, 30, 39, 15] },
      { size: "L", values: [38, 32, 41, 15.5] },
      { size: "XL", values: [40, 34, 43, 16] },
    ],
    howToMeasure: [
      "Around the fullest part of the bust, tape level across the back, wearing the bra you will wear with the piece.",
      "Around the narrowest part of the torso, usually just above the navel.",
      "Around the fullest part of the hips, feet together.",
      "Across the back, from the edge of one shoulder to the other.",
    ],
    notes: [
      "These are body measurements, not garment measurements. Each piece has ease added for its intended fit.",
      "Gowns and fitted pieces follow the bust and waist; for anarkalis and flowing silhouettes, the bust measurement matters most.",
    ],
  },
}
