"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, Sparkles } from "lucide-react";
import { netrifyCollections } from "@/data/netrifyProducts";

export default function CollectionGrid() {
  return (
    <section id="collections" className="py-16 sm:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#ff782e]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#ff782e] font-sans">
                INSTITUTIONAL CURATION
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sans text-slate-900 tracking-tight">
              Browse By Campus Collection
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
              Curated gear organized across NIT Raipur core identities, governing student cells, technical societies, and cultural leagues.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#ff782e] hover:text-[#e05b12] font-sans group"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {netrifyCollections.map((col) => (
            <Link
              key={col.id}
              href="/shop"
              className="group relative rounded-3xl bg-slate-900 overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-end min-h-[380px] p-6 text-white"
            >
              {/* Background Merchandise Image with Gradient Overlay */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={col.image}
                  alt={col.title}
                  fill
                  className="object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
              </div>

              {/* Foreground Content */}
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ff782e] text-white text-[10px] font-extrabold uppercase tracking-wider">
                    {col.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-300 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {col.itemCount} Designs
                  </span>
                </div>

                <h3 className="text-xl font-bold font-sans text-white group-hover:text-[#ff782e] transition-colors pt-2">
                  {col.title}
                </h3>

                <p className="text-xs font-medium text-orange-200/90 font-sans">
                  {col.subtitle}
                </p>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {col.description}
                </p>

                <div className="pt-3 flex items-center gap-1 text-xs font-bold text-white group-hover:text-[#ff782e] transition-colors">
                  <span>Explore Series</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
