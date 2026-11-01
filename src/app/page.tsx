"use client";

import { useState } from "react";
import NetrifyHero from "@/components/netrify/NetrifyHero";
import FeaturedProducts from "@/components/netrify/FeaturedProducts";
import CollectionGrid from "@/components/netrify/CollectionGrid";
import QuickViewModal from "@/components/netrify/QuickViewModal";
import { NetrifyProduct } from "@/data/netrifyProducts";

export default function HomePage() {
  const [quickViewProduct, setQuickViewProduct] = useState<NetrifyProduct | null>(null);

  return (
    <div className="netrify-root min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-[#ff782e] selection:text-white">
      {/* 1. Hero Section */}
      <NetrifyHero onQuickView={(product) => setQuickViewProduct(product)} />

      {/* 2. Official Campus Merchandise Catalog */}
      <FeaturedProducts onQuickView={(product) => setQuickViewProduct(product)} />

      {/* 3. Browse by Campus Collections */}
      <CollectionGrid />

      {/* Interactive Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}