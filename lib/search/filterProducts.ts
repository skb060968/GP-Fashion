export interface FilterCriteria {
  searchText: string;
  selectedSizes: string[];
  priceMin: number;
  priceMax: number;
}

export function filterProducts<T extends { name: string; sizes: string[]; price: number }>(
  products: T[],
  filters: FilterCriteria
): T[] {
  return products.filter((product) => {
    if (filters.searchText) {
      if (!product.name.toLowerCase().includes(filters.searchText.toLowerCase())) {
        return false;
      }
    }

    if (filters.selectedSizes.length > 0) {
      if (!filters.selectedSizes.some((size) => product.sizes.includes(size))) {
        return false;
      }
    }

    if (filters.priceMin > 0) {
      if (product.price < filters.priceMin) {
        return false;
      }
    }

    if (filters.priceMax > 0) {
      if (product.price > filters.priceMax) {
        return false;
      }
    }

    return true;
  });
}
