"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Flame, Eye } from "lucide-react";
import { NetrifyProduct, netrifyProducts } from "@/data/netrifyProducts";

interface NetrifyHeroProps {
  onQuickView: (product: NetrifyProduct) => void;
}

export default function NetrifyHero({ onQuickView }: NetrifyHeroProps) {
  const heroProduct = netrifyProducts.find((p) => p.id === "netrify-1") || netrifyProducts[0];
  const thinkIndiaProduct = netrifyProducts.find((p) => p.id === "netrify-2") || netrifyProducts[1];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-orange-50/25 to-[#f8fafc] pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-200">
      {/* Decorative campus ambient background */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#ff782e]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Institutional Messaging & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Campus Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100/80 border border-[#ff782e]/20 text-[#ff782e] text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#ff782e] animate-pulse" />
              <span>NIT RAIPUR CAMPUS STORE</span>
              <span className="text-[#ff782e]/40">•</span>
              <span className="text-slate-700 font-bold">WINTER 2026 EDITION</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-sans text-slate-900 tracking-tight leading-[1.1]">
              Wear The Heritage Of <br className="hidden sm:inline" />
              <span className="text-[#ff782e]">NIT Raipur.</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              The centralized merchandise storefront for the National Institute of Technology Raipur. Official committee drops, varsity outerwear, and commemorative apparel crafted for students, clubs, technical societies, and proud alumni.
            </p>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#all-drops"
                className="px-6 py-3.5 rounded-2xl bg-[#ff782e] hover:bg-[#e05b12] text-white font-sans font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#ff782e]/25 hover:shadow-xl hover:shadow-[#ff782e]/30 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Explore Official Drops</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#collections"
                className="px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-sans font-bold text-sm flex items-center gap-2 transition-all shadow-sm hover:border-slate-300 cursor-pointer"
              >
                <span>Discover Campus Collections</span>
              </a>

              <button
                type="button"
                onClick={() => onQuickView(heroProduct)}
                className="px-4 py-3.5 text-xs font-bold font-sans text-slate-600 hover:text-[#ff782e] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Flame className="w-4 h-4 text-[#ff782e]" />
                <span>Featured: E-Cell Varsity</span>
              </button>
            </div>

            {/* Institutional Trust Elements */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#ff782e] shrink-0" />
                <span className="text-xs font-medium text-slate-700">Official Committee Licensing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#ff782e] shrink-0" />
                <span className="text-xs font-medium text-slate-700">Premium 240-380 GSM</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#ff782e] shrink-0" />
                <span className="text-xs font-medium text-slate-700">Free Campus Handover</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#ff782e] shrink-0" />
                <span className="text-xs font-medium text-slate-700">Hostel Desk Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Spotlight Card with Real Supplied Photography */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Card */}
              <div className="relative rounded-3xl bg-slate-900 p-4 sm:p-5 shadow-2xl border border-slate-800 text-white overflow-hidden group">
                {/* Glow backdrop */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#ff782e] to-amber-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 -z-10" />

                {/* Card Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      FLAGSHIP RELEASE
                    </span>
                  </div>
                  <span className="text-[11px] font-mono bg-white/10 px-2.5 py-0.5 rounded-full text-white/90">
                    NITRR-EC-01
                  </span>
                </div>

                {/* Hero Product Media */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-white/10">
                  <Image
                    src={heroProduct.image}
                    alt={heroProduct.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                  <div className="absolute top-3 left-3 bg-[#ff782e] text-white text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-md">
                    Varsity Jacket
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl flex items-center justify-between text-xs border border-white/10">
                    <span className="text-slate-300">{heroProduct.club}</span>
                    <span className="text-[#ff782e] font-bold">Official Drop</span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="mt-4 px-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-sans font-bold text-lg text-white">
                        {heroProduct.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Classic Black & Olive • Custom Back Embroidery • Heavyweight Fleece
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black font-sans text-white">
                        ₹{heroProduct.price}
                      </div>
                      {heroProduct.originalPrice && (
                        <div className="text-xs text-slate-500 line-through">
                          ₹{heroProduct.originalPrice}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onQuickView(heroProduct)}
                      className="flex-1 py-2.5 bg-[#ff782e] hover:bg-[#e05b12] text-white rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-[#ff782e]/20 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      View Drop Details
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickView(thinkIndiaProduct)}
                      className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold font-sans transition-colors cursor-pointer"
                      title="View Think India NIT Raipur Edition"
                    >
                      Think India Tee
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Verified Badge */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl p-3 shadow-xl border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#ff782e]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 font-sans">
                    100% Verified By NITRR
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Hand-delivered across Hostels & Campus
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
