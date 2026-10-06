# Catalogue

This folder is the source of truth for every product, classification and
collection in the shop. Nothing under `public/images/shop/`, `lib/data/shop.ts`
or `lib/data/collections.ts` is edited by hand; all of it is generated from here
with `npm run catalogue`.

```
catalogue/
  taxonomy.json                   classifications, in menu order
  _collections/
    deepawali-2026/
      meta.json                   name, season, release date, description
      cover.jpg                   16:9 banner for the collection page
  noir-bespoke-suit/              one folder per product, named by URL slug
    meta.json
    cover.jpg
    01.jpg, 02.jpg ...
```

## How the shop is organised

- Category: `menswear` or `womenswear`. Every product has exactly one.
- Classification: a fixed list shared by both categories (Ethnic Wear,
  Leisurewear, Cocktail & Formalwear, Outerwear). Every product has exactly one.
  The menu under Menswear / Womenswear shows only the classifications that
  currently have pieces in that category.
- Collection: a release such as Deepawali 2026, cutting across both
  categories. A product belongs to at most one collection.
- New Arrivals and Bestsellers are computed, not set here. New Arrivals are
  pieces released in the last 90 days (falling back to the latest release).
  Bestsellers come from real orders once a category has enough sales; until
  then the `bestseller` flag in `meta.json` is used.

## Releasing a collection

1. Create `catalogue/_collections/<slug>/` with a `cover.jpg` (landscape, 16:9
   works best) and `meta.json`:

   ```json
   {
     "name": "Deepawali 2026",
     "season": "Festive 2026",
     "releaseDate": "2026-10-06",
     "description": "One or two sentences for the collections page.",
     "order": 10
   }
   ```

   | Field         | Required | Notes                                                   |
   |---------------|----------|---------------------------------------------------------|
   | `name`        | yes      | Shown in the menu and on the page                       |
   | `releaseDate` | yes      | `YYYY-MM-DD`. Products inherit it for New Arrivals      |
   | `season`      | no       | Small label, e.g. "Festive 2026"                        |
   | `description` | no       | Plain text                                              |
   | `order`       | no       | Sort position on /collections, lowest first. Default 1000; ties go to the newest release |

2. Add the products (below) with `"collection": "<slug>"`.
3. Run `npm run catalogue`.

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
     "classification": "ethnic-wear",
     "collection": "deepawali-2026",
     "priceInr": 12990,
     "sizes": ["S", "M", "L", "XL"],
     "description": "One or two sentences shown on the product page.",
     "bestseller": false,
     "order": 10
   }
   ```

   | Field            | Required | Notes                                                        |
   |------------------|----------|--------------------------------------------------------------|
   | `name`           | yes      | Display name. Must be unique across the whole shop           |
   | `category`       | yes      | `menswear` or `womenswear`                                   |
   | `classification` | yes      | A slug from `taxonomy.json`                                  |
   | `collection`     | no       | Slug of a folder under `_collections/`                       |
   | `releaseDate`    | no*      | `YYYY-MM-DD`. *Required if the piece is not in a collection; otherwise inherited |
   | `priceInr`       | yes      | Whole rupees. Converted to paise automatically               |
   | `sizes`          | yes      | Any of `S`, `M`, `L`, `XL`                                   |
   | `description`    | no       | Plain text. Also used for search engine descriptions         |
   | `bestseller`     | no       | `true` to show under Bestsellers until real sales take over  |
   | `order`          | no       | Sort position within the category, lowest first. Default 1000 |

4. Build:

   ```
   npm run catalogue
   ```

   This writes the webp images and regenerates `lib/data/shop.ts` and
   `lib/data/collections.ts`. Images already built are skipped unless the source
   photo is newer; use `npm run catalogue -- --force` to re-encode everything.
   The script stops with a clear message if a classification or collection slug
   is unknown, a name is duplicated, or a size is not S/M/L/XL.

5. Check `/shop`, the category and classification pages, the collection page
   and the product page locally, then commit `catalogue/**/meta.json`,
   `catalogue/taxonomy.json`, `public/images/shop/` and the two generated
   `lib/data/*.ts` files. Source photos are ignored by git (see `.gitignore`);
   keep them backed up elsewhere.

## Adding a classification

Add an entry to `taxonomy.json` in the position you want it to appear in the
menu, then run `npm run catalogue`. `new-arrivals` and `bestsellers` are reserved
and cannot be used as classification slugs.

## Changing or removing

Edit `meta.json` or swap photos, then run `npm run catalogue` again. To remove a
product or collection, delete its folder and run the script; generated images
for that slug are removed too. Existing orders keep their own copy of the name,
price and thumbnail, so history is unaffected.

## Generated output

| Path                                                     | Size      | Used by                                  |
|----------------------------------------------------------|-----------|------------------------------------------|
| `public/images/shop/items/<slug>/<slug>-cover.webp`      | 1200x1600 | Product grids, wishlist, product gallery |
| `public/images/shop/items/<slug>/<slug>-N.webp`          | 1200x1600 | Product gallery                          |
| `public/images/shop/thumbnails/<slug>/<slug>-cover.webp` | 300x400   | Bag, checkout, order emails, admin       |
| `public/images/shop/collections/<slug>.webp`             | 1600x900  | Collections page and collection banner   |
| `lib/data/shop.ts`                                       |           | Products and classifications             |
| `lib/data/collections.ts`                                |           | Collections                              |
