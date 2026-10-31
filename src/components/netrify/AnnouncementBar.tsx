"use client";

import Link from "next/link";
import { Sparkles, MapPin, ShieldCheck } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <div className="bg-[#ff782e] text-white text-xs font-sans tracking-wide z-50 border-b border-[#e05b12]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
        {/* Left: Campus Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white">
            <Sparkles className="w-3 h-3 text-white" />
            Official Campus Store
          </span>
          <span className="hidden md:inline-block text-white/90 font-normal">
            National Institute of Technology Raipur
          </span>
        </div>

        {/* Center: Main notice / Drop alert */}
        <div className="flex items-center gap-2 text-center text-xs font-medium">
          <span className="truncate max-w-[280px] sm:max-w-md lg:max-w-xl">
            Winter 2026 Drops Live: <strong className="font-bold underline decoration-white/40">E-Cell Varsity Bomber</strong> & <strong className="font-bold underline decoration-white/40">Innovation Cell F1 Tees</strong>
          </span>
        </div>

        {/* Right: Fulfillment & Verification links */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] font-medium text-white/90">
          <span className="inline-flex items-center gap-1 text-white/95">
            <MapPin className="w-3 h-3" />
            Hostel & Campus Pickup
          </span>
          <span className="text-white/40">|</span>
          <span className="inline-flex items-center gap-1 text-white/95">
            <ShieldCheck className="w-3 h-3" />
            Verified Student Merch
          </span>
        </div>
      </div>
    </div>
  );
}
