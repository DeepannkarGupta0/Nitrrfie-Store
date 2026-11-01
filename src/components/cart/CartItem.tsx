"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { CartItem } from "@/types";
import { useCart, type CartItemKey } from "@/context/CartContext";

interface CartItemProps {
  item: CartItem;
}

export default function CartItemRow({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  const itemKey: CartItemKey = {
    id: item.id,
    selectedSize: item.selectedSize,
    selectedColorId: item.selectedColorId,
    designId: item.designId,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 shadow-sm hover:border-slate-300 transition-colors">
      {/* Product Image */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
            NIT
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/product/${item.slug}`}
          className="font-bold text-slate-900 text-sm sm:text-base hover:text-[#ff782e] transition-colors line-clamp-1"
        >
          {item.name}
        </Link>
        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
          {item.tagline}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {item.selectedSize && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
              Size: {item.selectedSize}
            </span>
          )}
          {item.selectedColorId && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-50 text-[#ff782e] text-[11px] font-bold border border-[#ff782e]/20">
              {item.selectedColorId}
            </span>
          )}
          <span className="text-[11px] text-emerald-600 font-medium">
            Campus Pickup Ready
          </span>
        </div>
      </div>

      {/* Quantity & Price */}
      <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        {/* Quantity Controls */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
          <button
            type="button"
            onClick={() => updateQuantity(itemKey, item.quantity - 1)}
            aria-label="Decrease quantity"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white font-bold text-sm transition-colors cursor-pointer"
          >
            -
          </button>
          <span className="w-8 text-center font-bold text-xs text-slate-900">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => updateQuantity(itemKey, item.quantity + 1)}
            aria-label="Increase quantity"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white font-bold text-sm transition-colors cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Total Item Price */}
        <div className="text-right min-w-[70px]">
          <div className="text-base sm:text-lg font-black text-slate-900 font-sans">
            ₹{item.price * item.quantity}
          </div>
          <div className="text-[10px] text-slate-400">
            ₹{item.price} each
          </div>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => removeItem(itemKey)}
          className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
          title="Remove from cart"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}