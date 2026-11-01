"use client";

import { useState } from "react";
import NetrifyHero from "@/components/netrify/NetrifyHero";
import FeaturedProducts from "@/components/netrify/FeaturedProducts";
import CollectionGrid from "@/components/netrify/CollectionGrid";
import CampusIdentity from "@/components/netrify/CampusIdentity";
import FeaturedCollection from "@/components/netrify/FeaturedCollection";
import QuickViewModal from "@/components/netrify/QuickViewModal";
import { NetrifyProduct } from "@/data/netrifyProducts";

export default function HomePage() {
  const [quickViewProduct, setQuickViewProduct] = useState<NetrifyProduct | null>(null);

  return (
    <div className="netrify-root min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-[#ff782e] selection:text-white">
      {/* 1. Hero Section with Real E-Cell Varsity Bomber Spotlight */}
      <NetrifyHero onQuickView={(product) => setQuickViewProduct(product)} />

      {/* 2. Featured Campus Merchandise Showcase */}
      <FeaturedProducts onQuickView={(product) => setQuickViewProduct(product)} />

      {/* 3. Browse by Campus Collections */}
      <CollectionGrid />

      {/* 4. Institutional Heritage & Mission */}
      <CampusIdentity />

      {/* 5. Featured Committee Banner: Innovation Cell Motorsport Grand Prix */}
      <FeaturedCollection onQuickView={(product) => setQuickViewProduct(product)} />

      {/* Interactive Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}