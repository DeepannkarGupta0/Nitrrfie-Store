"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, Sparkles, ShieldCheck } from "lucide-react";
import { NetrifyProduct, netrifyProducts } from "@/data/netrifyProducts";

interface FeaturedCollectionProps {
  onQuickView: (product: NetrifyProduct) => void;
}

export default function FeaturedCollection({ onQuickView }: FeaturedCollectionProps) {
  // Flagship Innovation Cell F1 Papaya McLaren Edition
  const f1Papaya = netrifyProducts.find((p) => p.id === "netrify-3") || netrifyProducts[2];
  const f1Ferrari = netrifyProducts.find((p) => p.id === "netrify-5") || netrifyProducts[4];

  return (
    <section id="committees" className="py-16 sm:py-24 bg-slate-950 text-white relative overflow-hidden border-b border-slate-900">
      {/* Dynamic ambient highlights */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#ff782e]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800 rounded-3xl border border-slate-800 p-8 sm:p-12 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Spotlight Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff782e]/20 border border-[#ff782e]/30 text-[#ff782e] text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5" />
                <span>LIMITED COMMITTEE COLLABORATION</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black font-sans tracking-tight text-white leading-tight">
                Innovation Cell × Makerspace: <br />
                <span className="text-[#ff782e]">Grand Prix Motorsport Drop.</span>
              </h2>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Engineered for speed and craftsmanship. Featuring heavyweight 240 GSM drop-shoulder tees with iconic racing typography, team liveries, and the official NIT Raipur Innovation Cell crest.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onQuickView(f1Papaya)}
                  className="px-6 py-3.5 bg-[#ff782e] hover:bg-[#e05b12] text-white rounded-2xl font-sans font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#ff782e]/25 hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Quick View: McLaren Edition (₹450)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onQuickView(f1Ferrari)}
                  className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-sans font-bold text-sm transition-all border border-white/10 cursor-pointer"
                >
                  <span>View Ferrari #44 Edition</span>
                </button>
              </div>

              <div className="pt-4 flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#ff782e]" />
                  <span>240 GSM French Terry Cotton</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ff782e]" />
                  <span>High-Density Plastisol Print</span>
                </div>
              </div>
            </div>

            {/* Right Column: Split Photography Showcase */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div
                onClick={() => onQuickView(f1Papaya)}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-lg cursor-pointer"
              >
                <Image
                  src={f1Papaya.image}
                  alt={f1Papaya.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-xs">
                  <span className="text-[10px] uppercase font-bold text-[#ff782e] tracking-wider block">
                    Papaya 01
                  </span>
                  <span className="font-bold text-white text-xs truncate block">
                    McLaren Edition
                  </span>
                  <span className="text-white font-mono text-xs">₹450</span>
                </div>
              </div>

              <div
                onClick={() => onQuickView(f1Ferrari)}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-lg cursor-pointer"
              >
                <Image
                  src={f1Ferrari.image}
                  alt={f1Ferrari.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-xs">
                  <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider block">
                    Rosso Corsa 44
                  </span>
                  <span className="font-bold text-white text-xs truncate block">
                    Ferrari Edition
                  </span>
                  <span className="text-white font-mono text-xs">₹450</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
