export interface Collection {
  slug: string
  name: string
  season: string
  releaseDate: string
  description: string
  order: number
  coverImage: string
}

export const collections: Collection[] = [
  {
    "slug": "deepawali-2026",
    "name": "Deepawali 2026",
    "season": "Festive 2026",
    "releaseDate": "2026-10-06",
    "description": "The label's first release. Festive dressing for men and women, from kurta sets and anarkalis to evening suits and gowns, finished with hand embroidery from Delhi.",
    "order": 10,
    "coverImage": "/images/shop/collections/deepawali-2026.webp"
  },
  {
    "slug": "winter-2026",
    "name": "Winter 2026",
    "season": "Festive 2026",
    "releaseDate": "2026-10-06",
    "description": "The label's first release. Festive dressing for men and women, from kurta sets and anarkalis to evening suits and gowns, finished with hand embroidery from Delhi.",
    "order": 10,
    "coverImage": "/images/shop/collections/winter-2026.webp"
  }
]
