import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveView, Colorway } from '../types/store';
import { ProductCard } from '../components/ProductCard';
import { NotFoundView } from './NotFoundView';
import { formatPrice, calculateDiscountPercent } from '../utils/cartLogic';
import {
  simplifyTagline,
  getCustomerHighlights,
  getTechnicalSpecs,
} from '../utils/productPresentation';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Check,
  Heart,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface ProductDetailViewProps {
  slug: string;
  onNavigate: (view: ActiveView) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ slug, onNavigate }) => {
  const { addToCart, products, currency, wishlist, toggleWishlist } = useCart();
  const { showToast } = useToast();
  const product = products.find((p) => p.slug === slug);

  const [selectedColor, setSelectedColor] = useState<Colorway>(
    product?.colorways?.[0] || { name: 'Standard', hex: '#121212' }
  );
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'L');
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [specsOpen, setSpecsOpen] = useState(false);

  const lastSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (!product) return;
    if (lastSlugRef.current !== product.slug) {
      lastSlugRef.current = product.slug;
      setSelectedColor(product.colorways?.[0] || { name: 'Standard', hex: '#121212' });
      setSelectedSize(product.sizes?.[0] || 'L');
      setQuantity(1);
      setAddedToast(false);
      setActivePhotoIdx(0);
      setSpecsOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const liveStock = Math.max(0, product.stock ?? 50);
      if (liveStock > 0) {
        setQuantity((prev) => Math.min(prev, liveStock));
      }
    }
  }, [product]);

  if (!product) {
    return <NotFoundView missingPath={`/product/${slug}`} onNavigate={onNavigate} />;
  }

  const discount = calculateDiscountPercent(product.originalPrice, product.price);
  const isWishlisted = wishlist.includes(product.id);
  const availableStock = Math.max(0, product.stock ?? 50);
  const isOutOfStock = product.inStock === false || availableStock <= 0;
  const isLowStock = !isOutOfStock && availableStock <= 8;

  const friendlyTagline = simplifyTagline(product.tagline, product.category);
  const highlights = getCustomerHighlights(product.features);
  const technicalSpecs = getTechnicalSpecs(product);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedColor, selectedSize, quantity);
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
    }, 2000);
  };

  const handleInstantBuy = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedColor, selectedSize, quantity);
    onNavigate({ type: 'checkout' });
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product.id);
    showToast(
      isWishlisted ? `Removed ${product.name} from wishlist.` : `Saved ${product.name} to wishlist.`,
      'info'
    );
  };

  const relatedProducts = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.clubShort === product.clubShort))
    .slice(0, 4);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 sm:py-10 space-y-16">
      {/* Schema.org Product Structured Data for SEO Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            image: product.image,
            description: product.description,
            sku: product.id,
            brand: {
              '@type': 'Brand',
              name: 'NIT Raipur Official Store',
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: product.price,
              availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: typeof window !== 'undefined' ? window.location.href : '',
            },
          }),
        }}
      />

      {/* Top Breadcrumb & Back Link */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-sans text-[var(--muted)]">
        <button
          type="button"
          onClick={() => onNavigate({ type: 'shop' })}
          className="inline-flex items-center gap-1.5 text-[var(--ink)] hover:text-[var(--accent)] font-medium cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </button>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onNavigate({ type: 'home' })} className="hover:text-[var(--ink)] cursor-pointer">
            Home
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => onNavigate({ type: 'shop', category: product.category })}
            className="hover:text-[var(--ink)] cursor-pointer"
          >
            {product.category}
          </button>
          <span>/</span>
          <span className="text-[var(--ink)] font-medium truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </div>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Portrait Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 space-y-4"
        >
          <div className="relative aspect-[3/4] rounded-[var(--r)] bg-[var(--paper-2)] border border-[var(--line)] overflow-hidden shadow-sm">
            <img
              src={activePhotoIdx === 1 && product.secondaryImage ? product.secondaryImage : (product.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png')}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fallbackApplied) {
                  img.dataset.fallbackApplied = '1';
                  img.src = '/assets/aistudio/ecell-varsity-jacket_daef387e.png';
                }
              }}
              className="w-full h-full object-cover object-center transition-opacity duration-300"
            />

            {(isOutOfStock || discount > 0) && (
              <div className="absolute top-4 left-4 pointer-events-none">
                {isOutOfStock ? (
                  <span className="text-xs font-sans font-semibold px-3 py-1 rounded-[var(--r-sm)] bg-[var(--ink)] text-[var(--on-ink)]">
                    Out of Stock
                  </span>
                ) : (
                  <span className="text-xs font-sans font-semibold px-3 py-1 rounded-[var(--r-sm)] bg-[var(--accent-solid)] text-white">
                    Save {discount}%
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleWishlistToggle}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isWishlisted}
              className="absolute top-4 right-4 w-10 h-10 rounded-[var(--r-in)] bg-[var(--paper)]/90 backdrop-blur-xs border border-[var(--line)] text-[var(--ink)] hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer flex items-center justify-center shadow-xs"
            >
              <Heart
                className={`w-4 h-4 ${isWishlisted ? 'fill-red-600 text-red-600' : 'text-[var(--ink)]'}`}
              />
            </button>
          </div>

          {/* Photo Angle Switcher */}
          {product.secondaryImage && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActivePhotoIdx(0)}
                className={`min-h-[38px] px-4 py-1.5 rounded-[var(--r-in)] text-xs font-sans font-medium border cursor-pointer transition-all ${
                  activePhotoIdx === 0
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]'
                    : 'border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Front View
              </button>
              <button
                type="button"
                onClick={() => setActivePhotoIdx(1)}
                className={`min-h-[38px] px-4 py-1.5 rounded-[var(--r-in)] text-xs font-sans font-medium border cursor-pointer transition-all ${
                  activePhotoIdx === 1
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]'
                    : 'border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Alternate View
              </button>
            </div>
          )}

          {/* Customer Fulfillment Guarantees (Replaced Technical GSM Badge) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-[var(--r)] border border-[var(--line)] p-4 bg-[var(--paper-card)]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center shrink-0 text-[var(--ok)]">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-sans font-semibold text-[var(--ink)] block">
                  Campus Pickup &amp; Pan-India Courier
                </span>
                <span className="text-xs text-[var(--muted)] block mt-0.5">
                  Collect at Makerspace Desk or ship nationwide
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center shrink-0 text-[var(--ok)]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-sans font-semibold text-[var(--ink)] block">
                  48-Hour Size Exchange
                </span>
                <span className="text-xs text-[var(--muted)] block mt-0.5">
                  Easy fit swaps at the desk or via courier
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Purchase Module */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="lg:col-span-5 space-y-6 lg:sticky lg:top-24"
        >
          <div className="space-y-2.5 border-b border-[var(--line)] pb-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-sans font-medium text-[var(--muted)]">
                {product.clubShort} · {product.category}
              </span>
              <span
                className={`text-xs font-sans font-medium px-2.5 py-0.5 rounded-[var(--r-sm)] border ${
                  isOutOfStock
                    ? 'bg-[var(--bad-soft)] text-[var(--bad)] border-[var(--bad-border)]'
                    : isLowStock
                    ? 'bg-[var(--warn-soft)] text-[var(--warn)] border-[var(--warn-border)]'
                    : 'bg-[var(--ok-soft)] text-[var(--ok)] border-[var(--ok-border)]'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${availableStock} left` : 'In Stock'}
              </span>
            </div>

            <h1 className="font-brand text-2xl sm:text-3xl font-semibold text-[var(--ink)] tracking-tight leading-snug">
              {product.name}
            </h1>

            <p className="text-sm text-[var(--muted)] font-sans leading-relaxed">{friendlyTagline}</p>

            {/* Price Row */}
            <div className="pt-1.5 flex items-baseline gap-3">
              <span className="text-2xl font-mono font-semibold text-[var(--ink)] tabular-nums">
                {formatPrice(product.price, currency)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-sm font-mono text-[var(--muted)] line-through tabular-nums">
                  {formatPrice(product.originalPrice, currency)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-xs font-sans font-semibold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-[var(--r-sm)]">
                  {discount}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Color Selection */}
          {product.colorways?.length > 0 && (
            <div className="space-y-2.5">
              <label className="text-xs font-sans font-medium text-[var(--muted)] block">
                Color: <span className="text-[var(--ink)] font-semibold">{selectedColor.name}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.colorways.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`min-h-[38px] flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--r-in)] border text-xs font-sans font-medium transition-all cursor-pointer ${
                      selectedColor.name === c.name
                        ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]'
                        : 'border-[var(--line)] hover:border-[var(--line-2)] text-[var(--ink-2)] bg-[var(--paper)]'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/15 dark:border-white/25 inline-block shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes?.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-sans font-medium text-[var(--muted)]">Select Size</label>
                <span className="text-xs font-sans text-[var(--muted)]">Unisex Fit</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-11 h-11 px-3 rounded-[var(--r-in)] border text-xs font-mono font-medium transition-all cursor-pointer ${
                      selectedSize === s
                        ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)] font-semibold'
                        : 'border-[var(--line)] hover:border-[var(--line-2)] text-[var(--ink)] bg-[var(--paper)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-sans font-medium text-[var(--muted)]">Quantity</span>
            <div className="inline-flex items-center rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-2)] overflow-hidden">
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
                className="w-9 h-9 flex items-center justify-center enabled:hover:bg-[var(--line)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--ink)] cursor-pointer transition-colors"
              >
                -
              </button>
              <span className="w-9 text-center text-xs font-mono font-medium text-[var(--ink)] tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || quantity >= availableStock}
                onClick={() => setQuantity(availableStock > 0 ? Math.min(availableStock, quantity + 1) : 1)}
                aria-label="Increase quantity"
                className="w-9 h-9 flex items-center justify-center enabled:hover:bg-[var(--line)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--ink)] cursor-pointer transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="w-full min-h-[48px] py-3.5 px-5 rounded-[var(--r-in)] bg-[var(--ink)] enabled:hover:bg-[var(--accent-solid)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--on-ink)] enabled:hover:text-white font-sans text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs enabled:active:translate-y-px"
            >
              {isOutOfStock ? (
                <span>Out of Stock</span>
              ) : addedToast ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag · {formatPrice(product.price * quantity, currency)}</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleInstantBuy}
                className="w-full min-h-[44px] py-3 px-4 rounded-[var(--r-in)] bg-[var(--paper-2)] enabled:hover:bg-[var(--paper-3)] disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--line)] text-[var(--ink)] font-sans text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                {isOutOfStock ? 'Unavailable' : 'Proceed to Checkout'}
              </button>

              <button
                type="button"
                onClick={handleWishlistToggle}
                aria-pressed={isWishlisted}
                className={`w-full min-h-[44px] py-3 px-4 rounded-[var(--r-in)] border font-sans text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  isWishlisted
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'border-[var(--line)] bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-[var(--ink)]'
                }`}
              >
                <Heart
                  className={`w-4 h-4 shrink-0 ${
                    isWishlisted ? 'fill-[var(--accent)] text-[var(--accent)]' : ''
                  }`}
                />
                <span>{isWishlisted ? 'Saved in Wishlist' : 'Save for Later'}</span>
              </button>
            </div>

            {product.customizable && (
              <button
                type="button"
                onClick={() => onNavigate({ type: 'customize', slug: product.slug })}
                className="w-full min-h-[40px] py-2 px-4 rounded-[var(--r-in)] border border-dashed border-[var(--line-2)] hover:border-[var(--accent)] text-xs font-sans font-medium text-[var(--muted)] hover:text-[var(--accent)] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Looking for custom name or society lettering? Request in Customizer Studio</span>
              </button>
            )}
          </div>

          {/* Simplified Description & Customer Highlights */}
          <div className="border-t border-[var(--line)] pt-5 space-y-4">
            <div>
              <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--ink)] mb-1.5">
                About This Piece
              </h2>
              <p className="text-sm text-[var(--ink-2)] font-sans leading-relaxed">
                {product.description}
              </p>
            </div>

            {highlights.length > 0 && (
              <div>
                <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--ink)] mb-2">
                  Key Highlights
                </h2>
                <ul className="space-y-1.5 text-xs sm:text-sm font-sans text-[var(--ink-2)]">
                  {highlights.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[var(--ok)] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Collapsible Technical Specifications (Preserves GSM, Fabric Weight, Print Specs, Product ID) */}
            {technicalSpecs.length > 0 && (
              <div className="rounded-[var(--r)] border border-[var(--line)] bg-[var(--paper-card)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSpecsOpen(!specsOpen)}
                  aria-expanded={specsOpen}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-sans font-medium text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors cursor-pointer"
                >
                  <span>Product Details &amp; Specifications</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 ${
                      specsOpen ? 'rotate-180 text-[var(--ink)]' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {specsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-[var(--line)]"
                    >
                      <dl className="divide-y divide-[var(--line)] px-4 py-1 text-xs font-sans">
                        {technicalSpecs.map((spec) => (
                          <div key={spec.label} className="py-2.5 flex items-start justify-between gap-4">
                            <dt className="text-[var(--muted)] shrink-0">{spec.label}</dt>
                            <dd className="text-[var(--ink)] font-medium text-right">{spec.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Related Products Rail */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-[var(--line)] pt-14 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-sans font-medium text-[var(--muted)] block">
                You May Also Like
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-normal text-[var(--ink)] tracking-tight mt-0.5">
                More from NIT Raipur Store
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ type: 'shop', category: product.category })}
              className="text-xs font-sans font-medium text-[var(--ink)] underline underline-offset-4 hover:text-[var(--accent)] cursor-pointer transition-colors"
            >
              View Category
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onSelectProduct={(targetSlug: string) => onNavigate({ type: 'product', slug: targetSlug })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
