"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, X, ArrowRight } from "lucide-react";
import { NetrifyProduct, netrifyProducts } from "@/data/netrifyProducts";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: NetrifyProduct) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  onSelectProduct,
}: SearchModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = query.trim()
    ? netrifyProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.club.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : netrifyProducts.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#ff782e] shrink-0" />
          <input
            type="text"
            placeholder="Search by club (E-Cell, I-Cell, TCP), hoodie, F1 tee..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full text-sm sm:text-base font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
              ESC
            </kbd>
          )}
        </div>

        {/* Results / Suggestions Container */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 font-sans">
            {query.trim() ? `Search Results (${results.length})` : "Popular Campus Searches"}
          </div>

          {results.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No campus merchandise found matching &quot;{query}&quot;. Try &quot;E-Cell&quot;, &quot;Bomber&quot;, or &quot;F1&quot;.
            </div>
          ) : (
            results.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  onSelectProduct(product);
                  onClose();
                }}
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200 group"
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#ff782e] uppercase font-sans">
                      {product.clubShort}
                    </span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] text-slate-500">{product.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-[#ff782e] transition-colors font-sans">
                    {product.name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{product.tagline}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-slate-900 font-sans">
                    ₹{product.price}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">In Stock</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
