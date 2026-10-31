"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, ShoppingBag, Check } from "lucide-react";
import { NetrifyProduct, netrifyProducts } from "@/data/netrifyProducts";
import { useCart } from "@/context/CartContext";

interface FeaturedProductsProps {
  onQuickView: (product: NetrifyProduct) => void;
}

type FilterCategory = "all" | "Outerwear" | "Club Drops" | "Campus Essentials" | "Technical Societies";

export default function FeaturedProducts({ onQuickView }: FeaturedProductsProps) {
  const { addItem } = useCart();
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [addedId, setAddedId] = useState<string | null>(null);

  const filteredProducts = netrifyProducts.filter((product) => {
    if (activeFilter === "all") return true;
    return product.category === activeFilter;
  });

  const handleQuickAdd = (product: NetrifyProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: product.id,
      slug: product.slug,
      sku: `NITRRFIE-${product.id}-L`,
      name: product.name,
      tagline: product.tagline,
      price: product.price,
      image: product.image,
      category: product.category,
      description: product.description,
      selectedSize: "L",
      selectedColorId: product.colorways[0]?.name || "Standard",
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <section id="all-drops" className="py-16 sm:py-24 bg-[#f8fafc] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#ff782e]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#ff782e] font-sans">
                FEATURED APPAREL
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sans text-slate-900 tracking-tight">
              Official Campus Drops
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
              Authentic committee varsity jackets, custom oversized tees, and event editions crafted for the students of NIT Raipur.
            </p>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Drops" },
              { id: "Outerwear", label: "Varsity & Outerwear" },
              { id: "Club Drops", label: "Club & Cell Specials" },
              { id: "Campus Essentials", label: "Institutional Tees" },
              { id: "Technical Societies", label: "Tech Societies (TCP)" },
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id as FilterCategory)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#ff782e] text-white shadow-md shadow-[#ff782e]/20"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {filteredProducts.map((product) => {
            const isAdded = addedId === product.id;
            return (
              <div
                key={product.id}
                onClick={() => onQuickView(product)}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-[#ff782e]/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer relative"
              >
                {/* Image Container with Real Merchandise Asset */}
                <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />

                  {/* Overlays / Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    <span className="bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {product.clubShort}
                    </span>
                    {product.badge && (
                      <span className="bg-[#ff782e] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {/* Quick View Hover Button */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                      className="px-4 py-2 bg-white/95 backdrop-blur-sm text-slate-900 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 shadow-lg hover:bg-white transition-all transform translate-y-2 group-hover:translate-y-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#ff782e]" />
                      Quick View & Sizes
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Club Name & Category */}
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
                      <span className="truncate max-w-[140px]">{product.club}</span>
                      <span className="font-semibold text-[#ff782e]">{product.category}</span>
                    </div>

                    {/* Product Title */}
                    <h3 className="font-sans font-bold text-slate-900 text-base leading-snug group-hover:text-[#ff782e] transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Tagline */}
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                      {product.tagline}
                    </p>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 mt-3">
                      {product.colorways.map((col) => (
                        <span
                          key={col.name}
                          className="w-3 h-3 rounded-full border border-black/10 inline-block"
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        />
                      ))}
                      <span className="text-[10px] text-slate-400 font-medium ml-1">
                        {product.colorways.length} shades
                      </span>
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black font-sans text-slate-900">
                          ₹{product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-slate-400 line-through font-sans">
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Free Campus Pickup</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(product, e)}
                      disabled={isAdded}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                        isAdded
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-[#ff782e] hover:text-white"
                      }`}
                      title="Quick add size L to cart"
                      aria-label="Add to cart"
                    >
                      {isAdded ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <ShoppingBag className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
