"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ShieldCheck, MapPin, Sparkles, Check, ShoppingBag } from "lucide-react";
import { NetrifyProduct } from "@/data/netrifyProducts";
import { useCart } from "@/context/CartContext";

interface QuickViewModalProps {
  product: NetrifyProduct | null;
  onClose: () => void;
}

export default function QuickViewModal({
  product,
  onClose,
}: QuickViewModalProps) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("L");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[2] || product.sizes[0] || "L");
      setSelectedColor(product.colorways[0]?.name || "Standard");
      setAdded(false);
    }
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      slug: product.slug,
      sku: `NETRIFY-${product.id}-${selectedSize}`,
      name: product.name,
      tagline: product.tagline,
      price: product.price,
      image: product.image,
      category: product.category,
      description: product.description,
      selectedSize,
      selectedColorId: selectedColor,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 transition-colors cursor-pointer"
          aria-label="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Product Image & Badges */}
        <div className="relative w-full md:w-1/2 h-72 md:h-auto bg-slate-950 flex items-center justify-center p-6">
          <div className="relative w-full h-full min-h-[260px]">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold font-sans uppercase bg-slate-900 text-white shadow-sm border border-white/10">
              {product.club}
            </span>
            {product.badge && (
              <span className="px-3 py-1 rounded-full text-xs font-bold font-sans uppercase bg-[#ff782e] text-white shadow-sm">
                {product.badge}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Details & Actions */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-100px)] md:max-h-[90vh] flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#ff782e] font-sans">
                {product.category}
              </span>
              <h2 className="text-2xl font-black font-sans text-slate-900 mt-1">
                {product.name}
              </h2>
              <p className="text-xs text-slate-500 italic mt-0.5">
                {product.tagline}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black font-sans text-slate-900">
                ₹{product.price}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-slate-400 line-through font-sans">
                  ₹{product.originalPrice}
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                In Stock on Campus
              </span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
              {product.description}
            </p>

            {/* Color Selector */}
            <div className="pt-2">
              <label className="block text-xs font-bold font-sans uppercase text-slate-800 mb-2">
                Available Shades: <span className="text-[#ff782e]">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.colorways.map((c) => {
                  const isSelected = selectedColor === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#ff782e] bg-orange-50/70 text-[#ff782e] font-bold"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold font-sans uppercase text-slate-800">
                  Select Size: <span className="text-[#ff782e]">{selectedSize}</span>
                </label>
                <span className="text-[11px] text-slate-500">Regular Collegiate Fit</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const isSelected = selectedSize === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`w-11 h-10 rounded-xl text-xs font-bold font-sans transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-[#ff782e] text-white border-[#ff782e] shadow-md shadow-[#ff782e]/25"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Features List */}
            <div className="pt-3 border-t border-slate-100">
              <ul className="space-y-1.5">
                {product.features.map((feat) => (
                  <li key={feat} className="text-xs text-slate-600 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff782e] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 space-y-2.5">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={added}
              className={`w-full py-3.5 rounded-2xl font-sans font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                added
                  ? "bg-emerald-600 text-white shadow-emerald-500/25"
                  : "bg-[#ff782e] hover:bg-[#e05b12] text-white shadow-[#ff782e]/25 hover:shadow-xl"
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Added To Campus Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>Add To Bag • Handover At Hostel</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#ff782e]" />
                Zero ₹ Campus Delivery
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified NITRR Design
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
