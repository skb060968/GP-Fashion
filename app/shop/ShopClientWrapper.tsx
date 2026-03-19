"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import RevealWrapper from "@/components/RevealWrapper";
import ShopSearch from "@/components/ShopSearch";
import { filterProducts, type FilterCriteria } from "@/lib/search/filterProducts";
import GoldCornerFrame from "@/components/GoldCornerFrame";

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
                <GoldCornerFrame className="shadow-xl transition-all duration-500 ease-out group-hover:shadow-2xl group-hover:-translate-y-2">
                  {/* Inner frame with image */}
                  <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg ring-1 ring-stone-200">
                    <div className="w-full aspect-[3/4] bg-stone-100 relative">
                      <Image
                        src={dress.coverImage}
                        alt={dress.name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                </GoldCornerFrame>
              </Link>
            </RevealWrapper>
          ))}
        </div>
      )}
    </>
  );
}
