export const productCategories = ["menswear","womenswear","kidswear","accessories"] as const

export type ProductCategory = typeof productCategories[number]

export const sizeOptionsByCategory: Record<ProductCategory, readonly string[]> = {
  "menswear": [
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "XXXL"
  ],
  "womenswear": [
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "XXXL"
  ],
  "kidswear": [
    "2-3Y",
    "3-4Y",
    "4-5Y",
    "5-6Y",
    "6-7Y",
    "7-8Y",
    "8-9Y",
    "9-10Y",
    "10-11Y",
    "11-12Y",
    "12-13Y",
    "13-14Y"
  ],
  "accessories": [
    "ONE SIZE"
  ]
}

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
  },
  {
    "slug": "dresses-gowns",
    "title": "Dresses & Gowns"
  },
  {
    "slug": "tops-shirts",
    "title": "Tops & Shirts"
  },
  {
    "slug": "bottoms",
    "title": "Bottoms"
  },
  {
    "slug": "co-ord-sets",
    "title": "Co-ord Sets"
  },
  {
    "slug": "tailoring",
    "title": "Tailoring"
  },
  {
    "slug": "occasionwear",
    "title": "Occasionwear"
  },
  {
    "slug": "playwear",
    "title": "Playwear"
  },
  {
    "slug": "bags",
    "title": "Bags"
  },
  {
    "slug": "jewellery",
    "title": "Jewellery"
  },
  {
    "slug": "belts",
    "title": "Belts"
  },
  {
    "slug": "scarves-stoles",
    "title": "Scarves & Stoles"
  },
  {
    "slug": "footwear",
    "title": "Footwear"
  },
  {
    "slug": "headwear",
    "title": "Headwear"
  },
  {
    "slug": "other-accessories",
    "title": "Other Accessories"
  },
  {
    "slug": "general",
    "title": "General"
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
