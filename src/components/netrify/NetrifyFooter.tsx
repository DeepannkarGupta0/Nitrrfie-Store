"use client";

import Link from "next/link";
import { Mail, MapPin, ShieldCheck, Heart } from "lucide-react";

export default function NetrifyFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300 font-sans border-t border-slate-900">
      {/* Upper Footer: Core Directories & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff782e] to-[#ff9457] flex items-center justify-center text-white font-black text-xl shadow-md shadow-[#ff782e]/20 font-sans">
                N
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-sans text-2xl font-black tracking-tight text-white">
                    NETRIFY
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#ff782e]" />
                </div>
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 -mt-1">
                  NIT Raipur Institutional Store
                </div>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              The centralized campus merchandise storefront spearheaded by <strong>NITRRFIE</strong> (NIT Raipur Foundation for Innovation and Entrepreneurship), National Institute of Technology Raipur. Built to unite student bodies, committees, and alumni with authentic collegiate apparel.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-4 h-4 text-[#ff782e] shrink-0" />
              <span>G.E. Road, Raipur, Chhattisgarh 492010</span>
            </div>
          </div>

          {/* Nav: Store */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ff782e] font-sans mb-4">
              Store & Drops
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a href="#all-drops" className="hover:text-white transition-colors">
                  All Campus Drops
                </a>
              </li>
              <li>
                <a href="#all-drops" className="hover:text-white transition-colors">
                  Varsity Outerwear
                </a>
              </li>
              <li>
                <a href="#all-drops" className="hover:text-white transition-colors">
                  Heavyweight Tees
                </a>
              </li>
              <li>
                <a href="#all-drops" className="hover:text-white transition-colors">
                  Hackathon Editions
                </a>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav: Committees & Clubs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ff782e] font-sans mb-4">
              Committees & Cells
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a href="#committees" className="hover:text-white transition-colors">
                  Entrepreneurship Cell (E-Cell)
                </a>
              </li>
              <li>
                <a href="#committees" className="hover:text-white transition-colors">
                  Innovation Cell & Makerspace
                </a>
              </li>
              <li>
                <a href="#committees" className="hover:text-white transition-colors">
                  Turing Club of Programmers
                </a>
              </li>
              <li>
                <a href="#committees" className="hover:text-white transition-colors">
                  Think India NIT Raipur
                </a>
              </li>
              <li>
                <a href="#collections" className="hover:text-white transition-colors">
                  Department Gear
                </a>
              </li>
            </ul>
          </div>

          {/* Nav: Support & Institutional Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ff782e] font-sans mb-4">
              Student Helpdesk
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/support" className="hover:text-white transition-colors">
                  Campus Handover Locations
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition-colors">
                  Size Verification & Fitting
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition-colors">
                  Committee Bulk Orders
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition-colors">
                  FAQs & Support Desk
                </Link>
              </li>
              <li className="pt-2">
                <span className="text-[11px] text-slate-500 block">Queries & Feedback:</span>
                <a
                  href="mailto:support@netrify.in"
                  className="text-white hover:text-[#ff782e] transition-colors font-medium flex items-center gap-1.5 mt-0.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#ff782e]" />
                  support@netrify.in
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Attribution Bar */}
      <div className="border-t border-slate-900 bg-black/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 Netrify. NITRRFIE (NIT Raipur Foundation for Innovation and Entrepreneurship) • NIT Raipur. All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-[#ff782e] fill-[#ff782e]" />
            <span>for the NIT Raipur Student Body</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
