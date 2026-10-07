export type ProductCategory = "menswear" | "womenswear"

export interface Classification {
  slug: string
  title: string
}

export interface Product {
  slug: string
  name: string
  category: ProductCategory
  classification: string
  collection: string | null
  releaseDate: string
  description: string
  price: number
  sizes: string[]
  bestseller: boolean
  order: number
  images: string[]
  coverImage: string
  coverThumbnail: string
}

export const classifications: Classification[] = [
  {
    "slug": "ethnic-wear",
    "title": "Ethnic Wear"
  },
  {
    "slug": "leisurewear",
    "title": "Leisurewear"
  },
  {
    "slug": "cocktail-formalwear",
    "title": "Cocktail & Formalwear"
  },
  {
    "slug": "outerwear",
    "title": "Outerwear"
  }
]

export const products: Product[] = [
  {
    "slug": "noir-bespoke-suit",
    "name": "Noir Bespoke Suit",
    "category": "menswear",
    "classification": "outerwear",
    "collection": "deepawali-2026",
    "releaseDate": "2026-10-06",
    "description": "",
    "price": 1599000,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "bestseller": false,
    "order": 10,
    "images": [
      "/images/shop/items/noir-bespoke-suit/noir-bespoke-suit-cover.webp",
      "/images/shop/items/noir-bespoke-suit/noir-bespoke-suit-1.webp",
      "/images/shop/items/noir-bespoke-suit/noir-bespoke-suit-2.webp",
      "/images/shop/items/noir-bespoke-suit/noir-bespoke-suit-3.webp",
      "/images/shop/items/noir-bespoke-suit/noir-bespoke-suit-4.webp",
      "/images/shop/items/noir-bespoke-suit/noir-bespoke-suit-5.webp"
    ],
    "coverImage": "/images/shop/items/noir-bespoke-suit/noir-bespoke-suit-cover.webp",
    "coverThumbnail": "/images/shop/thumbnails/noir-bespoke-suit/noir-bespoke-suit-cover.webp"
  },
  {
    "slug": "diva-ball-gown",
    "name": "Diva Ball Gown",
    "category": "womenswear",
    "classification": "ethnic-wear",
    "collection": "winter-2026",
    "releaseDate": "2026-10-06",
    "description": "",
    "price": 1099000,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "bestseller": true,
    "order": 10,
    "images": [
      "/images/shop/items/diva-ball-gown/diva-ball-gown-cover.webp",
      "/images/shop/items/diva-ball-gown/diva-ball-gown-1.webp",
      "/images/shop/items/diva-ball-gown/diva-ball-gown-2.webp",
      "/images/shop/items/diva-ball-gown/diva-ball-gown-3.webp"
    ],
    "coverImage": "/images/shop/items/diva-ball-gown/diva-ball-gown-cover.webp",
    "coverThumbnail": "/images/shop/thumbnails/diva-ball-gown/diva-ball-gown-cover.webp"
  }
]
