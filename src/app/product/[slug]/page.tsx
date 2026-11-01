"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Truck, 
  Sparkles, 
  Ruler, 
  Layers, 
  ArrowRight 
} from "lucide-react";
import { netrifyProducts, type NetrifyProduct } from "@/data/netrifyProducts";
import { useCart } from "@/context/CartContext";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { addItem } = useCart();

  // Find product by slug or fallback by legacy matching
  const product: NetrifyProduct | undefined = useMemo(() => {
    const directMatch = netrifyProducts.find((p) => p.slug === slug);
    if (directMatch) return directMatch;

    // Legacy fallback mapping
    if (slug === "404-not-found-tee") return netrifyProducts[0];
    if (slug === "passed-engineering-drawing-hoodie") return netrifyProducts[5];
    if (slug === "cosmic-voyager-longsleeve") return netrifyProducts[1];
    if (slug === "core-dump-pants") return netrifyProducts[2];

    return undefined;
  }, [slug]);

  const [selectedSize, setSelectedSize] = useState<string>("L");
  const [selectedColor, setSelectedColor] = useState<string>(
    product?.colorways[0]?.name || "Classic Black"
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return notFound();
  }

  const relatedProducts = netrifyProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        slug: product.slug,
        sku: `NITRRFIE-${product.id}-${selectedSize}`,
        name: product.name,
        tagline: product.tagline,
        price: product.price,
        image: product.image,
        category: product.category,
        description: product.description,
        selectedSize,
        selectedColorId: selectedColor,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleInstantCheckout = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-24">
      {/* ── Breadcrumbs & Back Link ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs text-slate-500">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-[#ff782e] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to All Drops
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-slate-900">Shop</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>
      </div>

      {/* ── Main Product Section ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Product Visuals */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-[4/3] sm:aspect-square rounded-3xl bg-slate-900 overflow-hidden shadow-xl border border-slate-200 group">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Committee Badge */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                <span className="bg-slate-950/85 backdrop-blur-md text-white text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg border border-white/10">
                  {product.clubShort}
                </span>
                {product.badge && (
                  <span className="bg-[#ff782e] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-md">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Verified Collegiate Seal */}
              <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-white border border-white/10">
                <ShieldCheck className="w-4 h-4 text-[#ff782e]" />
                <span>100% Verified Campus Drop</span>
              </div>
            </div>

            {/* Quick Guarantees Pill */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center">
                <MapPin className="w-4 h-4 text-[#ff782e] mx-auto mb-1" />
                <div className="text-[11px] font-bold text-slate-800">Campus Pickup</div>
                <div className="text-[10px] text-slate-500">Free at Handover Desk</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center">
                <Ruler className="w-4 h-4 text-[#ff782e] mx-auto mb-1" />
                <div className="text-[11px] font-bold text-slate-800">Size Guarantee</div>
                <div className="text-[10px] text-slate-500">Try before taking</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center">
                <Layers className="w-4 h-4 text-[#ff782e] mx-auto mb-1" />
                <div className="text-[11px] font-bold text-slate-800">240-380 GSM</div>
                <div className="text-[10px] text-slate-500">Heavyweight Fabric</div>
              </div>
            </div>
          </div>

          {/* Right Column: Details, Selection & Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#ff782e]" />
                <span className="text-xs font-bold text-[#ff782e] uppercase tracking-wider">
                  {product.club}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              <p className="text-sm sm:text-base text-slate-500 mt-2 italic">
                {product.tagline}
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900 font-sans">
                    ₹{product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-slate-400 line-through">
                      ₹{product.originalPrice}
                    </span>
                  )}
                  {product.originalPrice && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      Save ₹{product.originalPrice - product.price}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Inclusive of all taxes & institutional committee licensing
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#ff782e]">
                <Sparkles className="w-3.5 h-3.5" />
                In Stock
              </span>
            </div>

            {/* Color Swatch Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Colorway: <span className="text-[#ff782e] font-bold">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.colorways.map((cw) => (
                  <button
                    key={cw.name}
                    type="button"
                    onClick={() => setSelectedColor(cw.name)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedColor === cw.name
                        ? "border-[#ff782e] bg-orange-50/70 text-slate-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: cw.hex }}
                    />
                    <span>{cw.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Size
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Standard Collegiate Fit (Unisex)
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedSize === size
                        ? "bg-[#ff782e] text-white shadow-md shadow-[#ff782e]/25"
                        : "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    added
                      ? "bg-emerald-600 text-white shadow-emerald-500/20"
                      : "bg-slate-900 hover:bg-black text-white shadow-slate-900/10"
                  }`}
                >
                  {added ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Added To Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#ff782e]" />
                      <span>Add To Cart • ₹{product.price * quantity}</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleInstantCheckout}
                className="w-full py-3.5 rounded-2xl bg-[#ff782e] hover:bg-[#e05b12] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ff782e]/25 hover:shadow-xl transition-all cursor-pointer"
              >
                <span>Instant Order & Campus Handover</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Garment Details & Features */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Garment Specifications & Craftsmanship
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {product.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#ff782e] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Related Drops Section ── */}
        <div className="mt-20 pt-12 border-t border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                More Official Campus Drops
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Curated collegiate outerwear and editions by NITRRFIE
              </p>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-[#ff782e] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <Link
                key={rel.id}
                href={`/product/${rel.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-[#ff782e]/50 overflow-hidden shadow-sm hover:shadow-xl transition-all p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square w-full rounded-xl bg-slate-900 overflow-hidden mb-3">
                    <Image
                      src={rel.image}
                      alt={rel.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded">
                      {rel.clubShort}
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#ff782e] transition-colors line-clamp-1">
                    {rel.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {rel.tagline}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">₹{rel.price}</span>
                  <span className="text-[11px] font-bold text-[#ff782e]">View Drop →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}