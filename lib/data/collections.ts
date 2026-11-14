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
    "slug": "into-the-night",
    "name": "Into The Night",
    "season": "2027",
    "releaseDate": "2026-11-25",
    "description": "Inspired by the energy of the night, it’s about dressing without rules, owning your presence and showing up exactly as you   are. For the nights that call for a little more attitude, a little more confidence, and absolutely no holding back. Because the best thing you can wear is your own identity.",
    "order": 10,
    "coverImage": "/images/shop/collections/into-the-night.webp"
  }
]
