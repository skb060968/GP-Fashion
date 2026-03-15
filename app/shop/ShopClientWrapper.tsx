"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import RevealWrapper from "@/components/RevealWrapper";
import ShopSearch from "@/components/ShopSearch";
import { filterProducts, type FilterCriteria } from "@/lib/search/filterProducts";

interface Dress {
  slug: string;
  name: string;
  price: number;
  sizes: string[];
  coverImage: string;
}

interface ShopClientWrapperProps {
  dresses: Dress[];
}

export default function ShopClientWrapper({ dresses }: ShopClientWrapperProps) {
  const [filters, setFilters] = useState<FilterCriteria>({
    searchText: "",
    selectedSizes: [],
    priceMin: 0,
    priceMax: 0,
  });

  const filtered = filterProducts(dresses, filters);

  const handleFilterChange = useCallback((newFilters: FilterCriteria) => {
    setFilters(newFilters);
  }, []);

  return (
    <>
      <ShopSearch onFilterChange={handleFilterChange} resultCount={filtered.length} />

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {filtered.map((dress, index) => (
            <RevealWrapper key={dress.slug} index={index}>
              <Link href={`/shop/${dress.slug}`} className="group block">
                {/* Premium Frame Container */}
                <div className="relative p-3 sm:p-4 bg-gradient-to-br from-stone-100 via-white to-stone-100 rounded-2xl sm:rounded-3xl shadow-xl transition-all duration-500 ease-out group-hover:shadow-2xl group-hover:-translate-y-2">
                  {/* Decorative corner accents */}
                  <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-fashion-gold rounded-tl-xl sm:rounded-tl-2xl"></div>
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-fashion-gold rounded-tr-xl sm:rounded-tr-2xl"></div>
                  <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 border-fashion-gold rounded-bl-xl sm:rounded-bl-2xl"></div>
                  <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-fashion-gold rounded-br-xl sm:rounded-br-2xl"></div>

                  {/* Inner frame with image */}
                  <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg ring-1 ring-stone-200">
                    <div className="w-full aspect-[3/4] bg-stone-100 relative">
                      <Image
                        src={dress.coverImage}
                        alt={dress.name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        priority
                      />
                    </div>

                    {/* Dress name overlay - appears on hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <h2 className="text-xl font-medium text-white">
                        {dress.name}
                      </h2>
                    </div>

                    {/* Hover CTA */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span className="px-5 py-2 bg-white text-sm font-medium rounded-full shadow-lg">
                        View Details
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </RevealWrapper>
          ))}
        </div>
      )}
    </>
  );
}
