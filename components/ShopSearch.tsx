"use client";

import { useState, useCallback, useEffect } from "react";
import type { FilterCriteria } from "@/lib/search/filterProducts";

interface ShopSearchProps {
  onFilterChange: (filters: FilterCriteria) => void;
  resultCount: number;
}

const SIZES = ["S", "M", "L", "XL"] as const;

export default function ShopSearch({ onFilterChange, resultCount }: ShopSearchProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  const hasActiveFilters =
    searchText !== "" ||
    selectedSizes.length > 0 ||
    priceMin !== "" ||
    priceMax !== "";

  const buildFilters = useCallback(
    (text: string, sizes: string[], min: string, max: string): FilterCriteria => ({
      searchText: text,
      selectedSizes: sizes,
      priceMin: min ? Number(min) : 0,
      priceMax: max ? Number(max) : 0,
    }),
    []
  );

  useEffect(() => {
    onFilterChange(buildFilters(searchText, selectedSizes, priceMin, priceMax));
  }, [searchText, selectedSizes, priceMin, priceMax, onFilterChange, buildFilters]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const clearAll = () => {
    setSearchText("");
    setSelectedSizes([]);
    setPriceMin("");
    setPriceMax("");
  };

  return (
    <div className="mb-12 space-y-6">
      {/* Search input */}
      <div>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search dresses..."
          className="w-full max-w-md px-4 py-3 border border-stone-300 rounded-lg bg-white text-fashion-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fashion-gold focus:border-transparent transition-all"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Size filters */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-1">Size:</span>
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
                selectedSizes.includes(size)
                  ? "bg-fashion-black text-white border-fashion-black"
                  : "bg-white text-gray-700 border-stone-300 hover:border-fashion-black"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Price range */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-1">Price:</span>
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Min"
            min={0}
            className="w-24 px-3 py-1.5 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-fashion-gold focus:border-transparent"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Max"
            min={0}
            className="w-24 px-3 py-1.5 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-fashion-gold focus:border-transparent"
          />
        </div>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="px-4 py-1.5 text-sm text-gray-600 hover:text-fashion-black underline underline-offset-2 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* No results message */}
      {resultCount === 0 && hasActiveFilters && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No products match your filters</p>
          <button
            onClick={clearAll}
            className="px-6 py-2 text-sm font-medium rounded-full border-2 border-fashion-gold text-fashion-gold hover:bg-fashion-gold hover:text-white transition-all"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
