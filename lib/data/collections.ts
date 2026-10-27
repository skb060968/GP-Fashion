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
    "slug": "summer-2027",
    "name": "Summer 2027",
    "season": "2027",
    "releaseDate": "2026-10-26",
    "description": "The label's first release.",
    "order": 10,
    "coverImage": "/images/shop/collections/summer-2027.webp"
  }
]
