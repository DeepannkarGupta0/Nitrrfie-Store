"use client";

import { useState } from "react";
import AnnouncementBar from "@/components/netrify/AnnouncementBar";
import NetrifyNavbar from "@/components/netrify/NetrifyNavbar";
import NetrifyHero from "@/components/netrify/NetrifyHero";
import FeaturedProducts from "@/components/netrify/FeaturedProducts";
import CollectionGrid from "@/components/netrify/CollectionGrid";
import CampusIdentity from "@/components/netrify/CampusIdentity";
import FeaturedCollection from "@/components/netrify/FeaturedCollection";
import NetrifyFooter from "@/components/netrify/NetrifyFooter";
import QuickViewModal from "@/components/netrify/QuickViewModal";
import SearchModal from "@/components/netrify/SearchModal";
import { NetrifyProduct } from "@/data/netrifyProducts";

export default function HomePage() {
  const [quickViewProduct, setQuickViewProduct] = useState<NetrifyProduct | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="netrify-root min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-[#ff782e] selection:text-white">
      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Responsive Netrify Header */}
      <NetrifyNavbar onOpenSearch={() => setSearchOpen(true)} />

      {/* 3. Hero Section with Real E-Cell Varsity Bomber Spotlight */}
      <NetrifyHero onQuickView={(product) => setQuickViewProduct(product)} />

      {/* 4. Featured Campus Merchandise Showcase */}
      <FeaturedProducts onQuickView={(product) => setQuickViewProduct(product)} />

      {/* 5. Browse by Campus Collections */}
      <CollectionGrid />

      {/* 6. Institutional Heritage & Mission */}
      <CampusIdentity />

      {/* 7. Featured Committee Banner: Innovation Cell Motorsport Grand Prix */}
      <FeaturedCollection onQuickView={(product) => setQuickViewProduct(product)} />

      {/* 8. Professional Institutional Footer */}
      <NetrifyFooter />

      {/* Interactive Modals */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={(product) => setQuickViewProduct(product)}
      />
    </div>
  );
}