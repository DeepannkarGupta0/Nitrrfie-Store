"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import CartItemRow from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";

export default function CartClient() {
  const { items } = useCart();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* ── Cart Header ── */}
      <div className="mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#ff782e] text-xs font-bold tracking-wide mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>INSTITUTIONAL MERCHANDISE BAG</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Your Shopping Bag
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Official NIT Raipur apparel prepared for direct campus handover.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-20 text-center max-w-lg mx-auto shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 text-[#ff782e] mx-auto flex items-center justify-center border border-orange-100 shadow-inner">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-sans">
              Your bag is empty
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              You haven't selected any official campus drops yet. Explore our varsity jackets and committee editions!
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#ff782e] hover:bg-[#e05b12] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#ff782e]/25 hover:shadow-xl transition-all cursor-pointer"
          >
            <span>Explore Campus Drops</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-7 space-y-4">
            {items.map((item, idx) => (
              <CartItemRow
                key={`${item.id}-${item.selectedSize}-${item.selectedColorId}-${item.designId ?? idx}`}
                item={item}
              />
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 sticky top-28">
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
}