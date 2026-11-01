"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag, Eye, Sparkles, Filter, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { netrifyProducts, type NetrifyProduct } from "@/data/netrifyProducts";
import { useCart } from "@/context/CartContext";
import QuickViewModal from "@/components/netrify/QuickViewModal";

export default function ShopPage() {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [quickViewProduct, setQuickViewProduct] = useState<NetrifyProduct | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const categories = [
    "All",
    "Outerwear",
    "Club Drops",
    "Campus Essentials",
    "Technical Societies",
    "Event Specials",
  ];

  const filteredProducts = useMemo(() => {
    return netrifyProducts
      .filter((p) => {
        const matchesCategory =
          selectedCategory === "All" || p.category === selectedCategory;
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.club.toLowerCase().includes(query) ||
          p.tagline.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query);
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [selectedCategory, searchQuery, sortBy]);

  const handleQuickAdd = (product: NetrifyProduct, e: React.MouseEvent) => {
    e.preventDefault();
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
      selectedColorId: product.colorways[0]?.name || "Default",
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-24">
      {/* ── Page Header & Institutional Banner ── */}
      <section className="bg-gradient-to-b from-white via-orange-50/20 to-slate-100/60 border-b border-slate-200 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100/80 border border-[#ff782e]/20 text-[#ff782e] text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#ff782e] animate-pulse" />
              <span>NITRRFIE CENTRAL STORE</span>
              <span className="text-[#ff782e]/40">•</span>
              <span className="text-slate-700 font-bold">ALL OFFICIAL MERCHANDISE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Official Campus Drops & Apparel
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Explore authentic varsity outerwear, technical society kits, and commemorative apparel co-designed with NIT Raipur clubs and committees. Every batch is manufactured to collegiate standards with direct campus handover.
            </p>
          </div>
        </div>
      </section>

      {/* ── Controls & Filter Bar ── */}
      <div className="sticky top-18 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-sans whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === category
                      ? "bg-[#ff782e] text-white shadow-md shadow-[#ff782e]/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Search Input & Sort Selector */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter drops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#ff782e] focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Product Catalog Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
          <span>
            Showing <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> official drops
          </span>
          <span className="flex items-center gap-1 text-[#ff782e] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Direct Campus Pickup Available
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#ff782e] mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-bold text-lg text-slate-900">No drops match your filter</h3>
            <p className="text-xs text-slate-500">
              Try searching for different committees, fests, or resetting the category filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-[#ff782e] text-white rounded-xl text-xs font-bold font-sans cursor-pointer hover:bg-[#e05b12] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((product) => {
              const isAdded = addedId === product.id;
              return (
                <div
                  key={product.id}
                  onClick={() => setQuickViewProduct(product)}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-[#ff782e]/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer relative"
                >
                  {/* Image Container with Badges */}
                  <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Committee & Drop Tags */}
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

                    {/* Hover Action Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewProduct(product);
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
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
                        <span className="truncate max-w-[140px]">{product.club}</span>
                        <span className="font-semibold text-[#ff782e]">{product.category}</span>
                      </div>

                      <h3 className="font-sans font-bold text-slate-900 text-base leading-snug group-hover:text-[#ff782e] transition-colors line-clamp-2">
                        {product.name}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                        {product.tagline}
                      </p>

                      {/* Colorway Swatches Preview */}
                      <div className="flex items-center gap-1.5 mt-3">
                        {product.colorways.map((cw) => (
                          <span
                            key={cw.name}
                            className="w-3 h-3 rounded-full border border-black/10 inline-block"
                            style={{ backgroundColor: cw.hex }}
                            title={cw.name}
                          />
                        ))}
                        <span className="text-[10px] text-slate-400 font-medium ml-1">
                          {product.colorways.length} shades
                        </span>
                      </div>
                    </div>

                    {/* Pricing & Add To Cart Button */}
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
                        <span className="text-[10px] text-slate-400 font-medium">
                          Free Campus Pickup
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/product/${product.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-2 text-xs font-bold text-slate-600 hover:text-[#ff782e] transition-colors"
                        >
                          Details
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(product, e)}
                          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                            isAdded
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105"
                              : "bg-slate-100 text-slate-700 hover:bg-[#ff782e] hover:text-white"
                          }`}
                          title="Quick add size L to cart"
                          aria-label="Add to cart"
                        >
                          {isAdded ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <ShoppingBag className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}