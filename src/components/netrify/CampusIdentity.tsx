"use client";

import { Award, Users, CheckCircle2, ShieldCheck, Building2, MapPin, Sparkles } from "lucide-react";
import { campusStats } from "@/data/netrifyProducts";

export default function CampusIdentity() {
  return (
    <section id="campus-heritage" className="py-16 sm:py-24 bg-gradient-to-b from-[#f8fafc] to-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Campus Heritage & Mission */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-[#ff782e]/20 text-[#ff782e] text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>EST. 1956 • G.E. ROAD, RAIPUR</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold font-sans text-slate-900 tracking-tight leading-tight">
              A Unified Institutional Storefront <br />
              <span className="text-[#ff782e]">For NIT Raipur Campus Life.</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Netrify is spearheaded by <strong>NITRRFIE</strong> (NIT Raipur Foundation for Innovation and Entrepreneurship) to provide an authentic, unified merchandise platform. Every piece in our centralized inventory is co-designed with committee heads, manufactured to heavyweight collegiate standards, and delivered directly to students across the campus.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#ff782e]/10 text-[#ff782e] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-sans">
                    Centralized Inventory & Zero Speculation
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    We maintain our own physical inventory batches right here at NIT Raipur. No random dropshippers or unauthorized third-party vendors.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#ff782e]/10 text-[#ff782e] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-sans">
                    Direct Committee Partnerships
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official graphics for E-Cell, Innovation Cell, Makerspace, and Turing Club are co-developed ensuring authentic club logos and motto typography.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#ff782e]/10 text-[#ff782e] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-sans">
                    Campus Handover & Size Exchanges
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Physical handover points across all hostel gates and Main Building portico with easy on-campus fitting verification.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Statistics Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff782e]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldCheck className="w-5 h-5 text-[#ff782e]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-sans">
                    CAMPUS STORE TRUST SCORE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  {campusStats.map((stat) => (
                    <div key={stat.label} className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60">
                      <div className="text-2xl sm:text-3xl font-black font-sans text-white text-[#ff782e]">
                        {stat.value}
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-1">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-800 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <MapPin className="w-4 h-4 text-[#ff782e] shrink-0" />
                    <span>Campus Pickup: Hostels A-H, Mahanadi & Main Building</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <Sparkles className="w-4 h-4 text-[#ff782e] shrink-0" />
                    <span>Designed Exclusively for National Institute of Technology Raipur</span>
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
