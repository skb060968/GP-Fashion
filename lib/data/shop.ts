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
  care: string | null
  price: number
  sizes: string[]
  bestseller: boolean
  order: number
  images: string[]
  coverImage: string
  coverThumbnail: string
  colors: ProductColor[]
  defaultColor: string | null
  pattern: ProductPattern | null
}

export interface ProductPattern {
  app: "men" | "women" | "girls" | "boys"
  garment: string
  name: string
  options: Record<string, string>
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
    "slug": "shirts",
    "title": "Shirts"
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
    "slug": "born-after-dark-shirt",
    "name": "Born After Dark Shirt",
    "category": "menswear",
    "classification": "shirts",
    "collection": "into-the-night",
    "releaseDate": "2026-11-25",
    "description": "Classic Dagger Collar Shirt in Solid Satin Crepe, Featuring a Sleek Minimalist Silhouette\nComponents: Shirt\nSurface: Plain / No Embellishment\nFabric: Satin Crepe",
    "care": null,
    "price": 499000,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "bestseller": false,
    "order": 10,
    "pattern": {
      "app": "men",
      "garment": "shirt",
      "name": "Shirt (dress shirt)",
      "options": {
        "shirt-sleeve": "full"
      }
    },
    "images": [
      "/images/shop/items/born-after-dark-shirt/black/born-after-dark-shirt-black-cover.webp",
      "/images/shop/items/born-after-dark-shirt/black/born-after-dark-shirt-black-1.webp",
      "/images/shop/items/born-after-dark-shirt/black/born-after-dark-shirt-black-2.webp",
      "/images/shop/items/born-after-dark-shirt/black/born-after-dark-shirt-black-3.webp"
    ],
    "coverImage": "/images/shop/items/born-after-dark-shirt/black/born-after-dark-shirt-black-cover.webp",
    "coverThumbnail": "/images/shop/thumbnails/born-after-dark-shirt/black/born-after-dark-shirt-black-cover.webp",
    "colors": [
      {
        "slug": "white",
        "name": "White",
        "hex": "#ffffff",
        "images": [
          "/images/shop/items/born-after-dark-shirt/white/born-after-dark-shirt-white-cover.webp",
          "/images/shop/items/born-after-dark-shirt/white/born-after-dark-shirt-white-1.webp",
          "/images/shop/items/born-after-dark-shirt/white/born-after-dark-shirt-white-2.webp"
        ],
        "coverImage": "/images/shop/items/born-after-dark-shirt/white/born-after-dark-shirt-white-cover.webp",
        "coverThumbnail": "/images/shop/thumbnails/born-after-dark-shirt/white/born-after-dark-shirt-white-cover.webp"
      },
      {
        "slug": "black",
        "name": "Black",
        "hex": "#000000",
        "images": [
          "/images/shop/items/born-after-dark-shirt/black/born-after-dark-shirt-black-cover.webp",
          "/images/shop/items/born-after-dark-shirt/black/born-after-dark-shirt-black-1.webp",
          "/images/shop/items/born-after-dark-shirt/black/born-after-dark-shirt-black-2.webp",
          "/images/shop/items/born-after-dark-shirt/black/born-after-dark-shirt-black-3.webp"
        ],
        "coverImage": "/images/shop/items/born-after-dark-shirt/black/born-after-dark-shirt-black-cover.webp",
        "coverThumbnail": "/images/shop/thumbnails/born-after-dark-shirt/black/born-after-dark-shirt-black-cover.webp"
      },
      {
        "slug": "wine",
        "name": "Wine",
        "hex": "#722f37",
        "images": [
          "/images/shop/items/born-after-dark-shirt/wine/born-after-dark-shirt-wine-cover.webp",
          "/images/shop/items/born-after-dark-shirt/wine/born-after-dark-shirt-wine-1.webp",
          "/images/shop/items/born-after-dark-shirt/wine/born-after-dark-shirt-wine-2.webp",
          "/images/shop/items/born-after-dark-shirt/wine/born-after-dark-shirt-wine-3.webp"
        ],
        "coverImage": "/images/shop/items/born-after-dark-shirt/wine/born-after-dark-shirt-wine-cover.webp",
        "coverThumbnail": "/images/shop/thumbnails/born-after-dark-shirt/wine/born-after-dark-shirt-wine-cover.webp"
      },
      {
        "slug": "beige",
        "name": "Beige",
        "hex": "#f5f5dc",
        "images": [
          "/images/shop/items/born-after-dark-shirt/beige/born-after-dark-shirt-beige-cover.webp",
          "/images/shop/items/born-after-dark-shirt/beige/born-after-dark-shirt-beige-1.webp",
          "/images/shop/items/born-after-dark-shirt/beige/born-after-dark-shirt-beige-2.webp",
          "/images/shop/items/born-after-dark-shirt/beige/born-after-dark-shirt-beige-3.webp"
        ],
        "coverImage": "/images/shop/items/born-after-dark-shirt/beige/born-after-dark-shirt-beige-cover.webp",
        "coverThumbnail": "/images/shop/thumbnails/born-after-dark-shirt/beige/born-after-dark-shirt-beige-cover.webp"
      }
    ],
    "defaultColor": "black"
  },
  {
    "slug": "coastline-jacket",
    "name": "Coastline Jacket",
    "category": "menswear",
    "classification": "outerwear",
    "collection": "into-the-night",
    "releaseDate": "2026-11-25",
    "description": "Contemporary Statement Blazer in Ivory and Midnight Blue, Featuring Bold Abstract Patterns with Dual Sequin Embellishments\nComponents: Blazer\nSurface: Dual Sequin Embellishment\nFabric: Sequin Net Lycra",
    "care": null,
    "price": 1499000,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "bestseller": false,
    "order": 10,
    "pattern": {
      "app": "men",
      "garment": "jacket",
      "name": "Jacket (single-breasted)",
      "options": {
        "jacket-length": "classic"
      }
    },
    "images": [
      "/images/shop/items/coastline-jacket/coastline-jacket-cover.webp",
      "/images/shop/items/coastline-jacket/coastline-jacket-1.webp",
      "/images/shop/items/coastline-jacket/coastline-jacket-2.webp",
      "/images/shop/items/coastline-jacket/coastline-jacket-3.webp",
      "/images/shop/items/coastline-jacket/coastline-jacket-4.webp"
    ],
    "coverImage": "/images/shop/items/coastline-jacket/coastline-jacket-cover.webp",
    "coverThumbnail": "/images/shop/thumbnails/coastline-jacket/coastline-jacket-cover.webp",
    "colors": [],
    "defaultColor": null
  },
  {
    "slug": "dark-romance-shirt",
    "name": "Dark Romance Shirt",
    "category": "menswear",
    "classification": "shirts",
    "collection": "into-the-night",
    "releaseDate": "2026-11-25",
    "description": "Ornate Statement Shirt in Champagne and Black, Intricately Embellished with Baroque-Inspired Motifs\nComponents: Shirt\nSurface: Intricate Thread Embroidery, Sequin and Bead Embellishments\nFabric: imported organza and satin crepe",
    "care": null,
    "price": 999000,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "bestseller": false,
    "order": 10,
    "pattern": {
      "app": "men",
      "garment": "casual",
      "name": "Casual shirt",
      "options": {
        "shirt-sleeve": "full"
      }
    },
    "images": [
      "/images/shop/items/dark-romance-shirt/dark-romance-shirt-cover.webp",
      "/images/shop/items/dark-romance-shirt/dark-romance-shirt-1.webp",
      "/images/shop/items/dark-romance-shirt/dark-romance-shirt-2.webp",
      "/images/shop/items/dark-romance-shirt/dark-romance-shirt-3.webp"
    ],
    "coverImage": "/images/shop/items/dark-romance-shirt/dark-romance-shirt-cover.webp",
    "coverThumbnail": "/images/shop/thumbnails/dark-romance-shirt/dark-romance-shirt-cover.webp",
    "colors": [],
    "defaultColor": null
  },
  {
    "slug": "golden-haze-shirt",
    "name": "Golden Haze Shirt",
    "category": "menswear",
    "classification": "shirts",
    "collection": "into-the-night",
    "releaseDate": "2026-11-25",
    "description": "Elegant Lace Sequin Shirt Featuring Intricate Lace Detailing and All-Over Sequin Embellishments\nComponents: Shirt\nSurface: Lace Detailing with Sequin Embellishment\nFabric: Lace and Sequin Fabric",
    "care": null,
    "price": 1099000,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "bestseller": false,
    "order": 10,
    "pattern": {
      "app": "men",
      "garment": "shirt",
      "name": "Shirt (dress shirt)",
      "options": {
        "shirt-sleeve": "full"
      }
    },
    "images": [
      "/images/shop/items/golden-haze-shirt/golden-haze-shirt-cover.webp",
      "/images/shop/items/golden-haze-shirt/golden-haze-shirt-1.webp",
      "/images/shop/items/golden-haze-shirt/golden-haze-shirt-2.webp",
      "/images/shop/items/golden-haze-shirt/golden-haze-shirt-3.webp",
      "/images/shop/items/golden-haze-shirt/golden-haze-shirt-4.webp"
    ],
    "coverImage": "/images/shop/items/golden-haze-shirt/golden-haze-shirt-cover.webp",
    "coverThumbnail": "/images/shop/thumbnails/golden-haze-shirt/golden-haze-shirt-cover.webp",
    "colors": [],
    "defaultColor": null
  },
  {
    "slug": "rib-knit-henley",
    "name": "Rib Knit Henley",
    "category": "menswear",
    "classification": "shirts",
    "collection": "into-the-night",
    "releaseDate": "2026-11-25",
    "description": "Ribbed Velvet Henley Top Featuring a Contemporary Zip-Front Neckline\nComponents: Henley Top\nSurface: Ribbed Texture\nFabric: Rib Knit Velvet",
    "care": null,
    "price": 599000,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "bestseller": false,
    "order": 10,
    "pattern": {
      "app": "men",
      "garment": "henley",
      "name": "Knit henley (zip placket, knit collar)",
      "options": {}
    },
    "images": [
      "/images/shop/items/rib-knit-henley/rib-knit-henley-cover.webp",
      "/images/shop/items/rib-knit-henley/rib-knit-henley-1.webp",
      "/images/shop/items/rib-knit-henley/rib-knit-henley-2.webp",
      "/images/shop/items/rib-knit-henley/rib-knit-henley-3.webp",
      "/images/shop/items/rib-knit-henley/rib-knit-henley-4.webp"
    ],
    "coverImage": "/images/shop/items/rib-knit-henley/rib-knit-henley-cover.webp",
    "coverThumbnail": "/images/shop/thumbnails/rib-knit-henley/rib-knit-henley-cover.webp",
    "colors": [],
    "defaultColor": null
  },
  {
    "slug": "thousand-stars-jacket",
    "name": "Thousand Stars Jacket",
    "category": "menswear",
    "classification": "outerwear",
    "collection": "into-the-night",
    "releaseDate": "2026-11-25",
    "description": "Statement Sequin Bomber Jacket Featuring a Luxurious Fur Collar and All-Over Sequin Embellishments\nComponents: Bomber Jacket\nSurface: All-Over Sequin Embellishment\nFabric: Sequin Fabric with Fur Collar",
    "care": null,
    "price": 999000,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "bestseller": false,
    "order": 10,
    "pattern": {
      "app": "men",
      "garment": "bomber",
      "name": "Bomber jacket (rib bands, zip front)",
      "options": {}
    },
    "images": [
      "/images/shop/items/thousand-stars-jacket/thousand-stars-jacket-cover.webp",
      "/images/shop/items/thousand-stars-jacket/thousand-stars-jacket-1.webp",
      "/images/shop/items/thousand-stars-jacket/thousand-stars-jacket-2.webp"
    ],
    "coverImage": "/images/shop/items/thousand-stars-jacket/thousand-stars-jacket-cover.webp",
    "coverThumbnail": "/images/shop/thumbnails/thousand-stars-jacket/thousand-stars-jacket-cover.webp",
    "colors": [],
    "defaultColor": null
  },
  {
    "slug": "coastline-dress",
    "name": "Coastline Dress",
    "category": "womenswear",
    "classification": "dresses-gowns",
    "collection": "into-the-night",
    "releaseDate": "2026-11-25",
    "description": "Glamorous Dual Sequin Net Lycra Dress Featuring All-Over Shimmering Embellishments and a Contemporary Statement Silhouette\nComponents: Dress\nSurface: Dual Sequin Embellishment\nFabric: Sequin Net Lycra",
    "care": null,
    "price": 1599000,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "bestseller": false,
    "order": 10,
    "pattern": {
      "app": "women",
      "garment": "straplessgown",
      "name": "Strapless gown (gored skirt)",
      "options": {
        "gw-skirt": "column",
        "sp-front": "bridged"
      }
    },
    "images": [
      "/images/shop/items/coastline-dress/coastline-dress-cover.webp",
      "/images/shop/items/coastline-dress/coastline-dress-1.webp",
      "/images/shop/items/coastline-dress/coastline-dress-2.webp",
      "/images/shop/items/coastline-dress/coastline-dress-3.webp"
    ],
    "coverImage": "/images/shop/items/coastline-dress/coastline-dress-cover.webp",
    "coverThumbnail": "/images/shop/thumbnails/coastline-dress/coastline-dress-cover.webp",
    "colors": [],
    "defaultColor": null
  },
  {
    "slug": "midnight-halter-gown",
    "name": "Midnight Halter Gown",
    "category": "womenswear",
    "classification": "dresses-gowns",
    "collection": "into-the-night",
    "releaseDate": "2026-11-25",
    "description": "Elegant Velvet Gown in a Rich Luxurious Finish, Featuring a Sophisticated Silhouette and Timeless Eveningwear Appeal\nComponents: Gown\nSurface: Plain Velvet\nFabric: Velvet",
    "care": null,
    "price": 1199000,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "bestseller": false,
    "order": 10,
    "pattern": {
      "app": "women",
      "garment": "haltergown",
      "name": "Halter gown (V-neck halter, gored skirt)",
      "options": {
        "gw-skirt": "trumpet"
      }
    },
    "images": [
      "/images/shop/items/midnight-halter-gown/midnight-halter-gown-cover.webp",
      "/images/shop/items/midnight-halter-gown/midnight-halter-gown-1.webp",
      "/images/shop/items/midnight-halter-gown/midnight-halter-gown-2.webp"
    ],
    "coverImage": "/images/shop/items/midnight-halter-gown/midnight-halter-gown-cover.webp",
    "coverThumbnail": "/images/shop/thumbnails/midnight-halter-gown/midnight-halter-gown-cover.webp",
    "colors": [],
    "defaultColor": null
  },
  {
    "slug": "pink-petal-gown",
    "name": "Pink Petal Gown",
    "category": "womenswear",
    "classification": "dresses-gowns",
    "collection": "into-the-night",
    "releaseDate": "2026-11-25",
    "description": "Elegant Printed Crepe Dress Featuring Intricate Embroidery and Delicate Surface Detailing\nComponents: Dress\nSurface: Printed with Intricate Thread Embroidery\nFabric: Crepe",
    "care": null,
    "price": 1499000,
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "bestseller": false,
    "order": 10,
    "pattern": {
      "app": "women",
      "garment": "sheath",
      "name": "Sheath dress (fitted)",
      "options": {
        "d-length": "ankle",
        "d-neck": "round",
        "d-sleeve": "none"
      }
    },
    "images": [
      "/images/shop/items/pink-petal-gown/pink-petal-gown-cover.webp",
      "/images/shop/items/pink-petal-gown/pink-petal-gown-1.webp",
      "/images/shop/items/pink-petal-gown/pink-petal-gown-2.webp"
    ],
    "coverImage": "/images/shop/items/pink-petal-gown/pink-petal-gown-cover.webp",
    "coverThumbnail": "/images/shop/thumbnails/pink-petal-gown/pink-petal-gown-cover.webp",
    "colors": [],
    "defaultColor": null
  }
]
