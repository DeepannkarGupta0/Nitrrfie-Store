"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, MapPin, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartSummary() {
  const { totalPrice, items } = useCart();

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="font-extrabold text-lg text-slate-900 font-sans">
          Order Summary
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-[#ff782e]">
          NIT Raipur Official
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span className="font-bold text-slate-900 font-sans">
            ₹{totalPrice.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Campus Handover</span>
          <span className="font-bold text-emerald-600 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            FREE
          </span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Taxes & Committee Licensing</span>
          <span className="text-slate-500 font-medium">Included</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-bold text-base text-slate-900">Total Payable</span>
          <span className="text-2xl font-black text-slate-900 font-sans">
            ₹{totalPrice.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          Payment processed securely via Razorpay test mode
        </p>
      </div>

      <Link
        href="/checkout"
        className="w-full py-4 rounded-2xl bg-[#ff782e] hover:bg-[#e05b12] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#ff782e]/25 hover:shadow-xl transition-all cursor-pointer"
      >
        <span>Proceed to Checkout</span>
        <ArrowRight className="w-4 h-4" />
      </Link>

      <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#ff782e] shrink-0" />
          <span>Handover at NIT Raipur Main Building / Hostels</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#ff782e] shrink-0" />
          <span>Free size exchange available at handover desk</span>
        </div>
      </div>
    </div>
  );
}