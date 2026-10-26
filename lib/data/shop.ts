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

export interface ProductColor {
  slug: string
  name: string
  hex: string
  images: string[]
  coverImage: string
  coverThumbnail: string
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
  colors: ProductColor[]
  defaultColor: string | null
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
    "slug": "partywear",
    "title": "Partywear"
  },
  {
    "slug": "formalwear",
    "title": "Formalwear"
  },
  {
    "slug": "occasionwear",
    "title": "Occasionwear"
  },
  {
    "slug": "outerwear",
    "title": "Outerwear"
  },
  {
    "slug": "playwear",
    "title": "Playwear"
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
  }
]

export const products: Product[] = [
  {
    "slug": "t-shirt",
    "name": "T-Shirt",
    "category": "menswear",
    "classification": "outerwear",
    "collection": "winter-2026",
    "releaseDate": "2026-10-06",
    "description": "Pure wool T-Shirts to keep you warm.",
    "price": 599000,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "bestseller": false,
    "order": 10,
    "images": [
      "/images/shop/items/t-shirt/green/t-shirt-green-cover.webp"
    ],
    "coverImage": "/images/shop/items/t-shirt/green/t-shirt-green-cover.webp",
    "coverThumbnail": "/images/shop/thumbnails/t-shirt/green/t-shirt-green-cover.webp",
    "colors": [
      {
        "slug": "green",
        "name": "Green",
        "hex": "#008000",
        "images": [
          "/images/shop/items/t-shirt/green/t-shirt-green-cover.webp"
        ],
        "coverImage": "/images/shop/items/t-shirt/green/t-shirt-green-cover.webp",
        "coverThumbnail": "/images/shop/thumbnails/t-shirt/green/t-shirt-green-cover.webp"
      },
      {
        "slug": "blue",
        "name": "Blue",
        "hex": "#0000ff",
        "images": [
          "/images/shop/items/t-shirt/blue/t-shirt-blue-cover.webp"
        ],
        "coverImage": "/images/shop/items/t-shirt/blue/t-shirt-blue-cover.webp",
        "coverThumbnail": "/images/shop/thumbnails/t-shirt/blue/t-shirt-blue-cover.webp"
      },
      {
        "slug": "red",
        "name": "Red",
        "hex": "#ff0000",
        "images": [
          "/images/shop/items/t-shirt/red/t-shirt-red-cover.webp"
        ],
        "coverImage": "/images/shop/items/t-shirt/red/t-shirt-red-cover.webp",
        "coverThumbnail": "/images/shop/thumbnails/t-shirt/red/t-shirt-red-cover.webp"
      }
    ],
    "defaultColor": "green"
  }
]
