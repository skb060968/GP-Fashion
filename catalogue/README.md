# Catalogue

This folder is the source of truth for every product in the shop. Nothing under
`public/images/shop/` or in `lib/data/shop.ts` is edited by hand; both are
generated from here.

## Adding a product

1. Create a folder named after the product URL slug, lowercase with hyphens:

   ```
   catalogue/noir-silk-kurta/
   ```

   The product page will be `/shop/noir-silk-kurta`. Do not rename a folder after
   launch; the slug is what customers' wishlists and past orders point to.

2. Drop the photos in. Portrait 3:4 works best (the site crops everything to 3:4).
   Any of jpg, jpeg, png, webp. Phone originals are fine; the script resizes and
   compresses them.

   ```
   catalogue/noir-silk-kurta/cover.jpg   <- shown in grids, wishlist, search
   catalogue/noir-silk-kurta/01.jpg      <- gallery, in filename order
   catalogue/noir-silk-kurta/02.jpg
   ```

   If there is no file called `cover.*`, the first file alphabetically becomes the cover.

3. Add `meta.json`:

   ```json
   {
     "name": "Noir Silk Kurta",
     "category": "menswear",
     "priceInr": 12990,
     "sizes": ["S", "M", "L", "XL"],
     "description": "One or two sentences shown on the product page.",
     "order": 10
   }
   ```

   | Field         | Required | Notes                                                        |
   |---------------|----------|--------------------------------------------------------------|
   | `name`        | yes      | Must be unique across the whole shop                         |
   | `category`    | yes      | `menswear` or `womenswear`                                   |
   | `priceInr`    | yes      | Whole rupees. Converted to paise automatically               |
   | `sizes`       | yes      | Any of `S`, `M`, `L`, `XL`                                   |
   | `description` | no       | Plain text. Also used for search engine descriptions         |
   | `order`       | no       | Sort position within the category, lowest first. Default 1000 |

4. Build:

   ```
   npm run catalogue
   ```

   This writes the webp images and regenerates `lib/data/shop.ts`. Images already
   built are skipped unless the source photo is newer; use
   `npm run catalogue -- --force` to re-encode everything.

5. Check `/shop`, `/menswear` or `/womenswear`, and the product page locally,
   then commit `catalogue/<slug>/meta.json`, `public/images/shop/` and
   `lib/data/shop.ts`. Source photos are ignored by git (see `.gitignore`); keep
   them backed up elsewhere.

## Changing a product

Edit `meta.json` or swap photos, then run `npm run catalogue` again.

## Removing a product

Delete the product folder and run `npm run catalogue`. The generated images for
that slug are removed as well. Existing orders keep their own copy of the name,
price and thumbnail, so history is unaffected.

## Generated output

| Path                                                   | Size      | Used by                                  |
|--------------------------------------------------------|-----------|------------------------------------------|
| `public/images/shop/items/<slug>/<slug>-cover.webp`    | 1200x1600 | Product grids, wishlist, product gallery |
| `public/images/shop/items/<slug>/<slug>-N.webp`        | 1200x1600 | Product gallery                          |
| `public/images/shop/thumbnails/<slug>/<slug>-cover.webp` | 300x400 | Bag, checkout, order emails, admin       |
| `lib/data/shop.ts`                                     |           | Everything that lists or shows products  |
