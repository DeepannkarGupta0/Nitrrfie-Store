import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, calculateDiscountPercent } from '../utils/cartLogic';
import { simplifyTagline } from '../utils/productPresentation';
import { X, Check, ShoppingBag, ArrowUpRight, ShieldCheck, Heart } from 'lucide-react';
import { Colorway } from '../types/store';

interface QuickViewModalProps {
  onNavigateToProduct: (slug: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ onNavigateToProduct }) => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    currency,
    wishlist,
    toggleWishlist,
  } = useCart();
  const { showToast } = useToast();
  const [selectedColor, setSelectedColor] = useState<Colorway | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

  useEffect(() => {
    if (quickViewProduct) {
      setSelectedColor(quickViewProduct.colorways?.[0] || { name: 'Standard', hex: '#18181b' });
      setSelectedSize(quickViewProduct.sizes?.[0] || 'Free Size');
      setQuantity(1);
      setAddedToast(false);
      setSelectedImgIdx(0);
    }
  }, [quickViewProduct]);

  useEffect(() => {
    if (!quickViewProduct) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuickViewProduct(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quickViewProduct, setQuickViewProduct]);

  const availableStock = quickViewProduct ? Math.max(0, quickViewProduct.stock ?? 50) : 0;
  const isOutOfStock = Boolean(
    quickViewProduct &&
      (quickViewProduct.inStock === false || availableStock <= 0)
  );

  const handleAddToCart = () => {
    if (!quickViewProduct || !selectedColor || !selectedSize || isOutOfStock) return;
    addToCart(quickViewProduct, selectedColor, selectedSize, quantity);
    setAddedToast(true);
    showToast(`Added ${quickViewProduct.name} (${selectedSize}) to bag.`, 'success');
    setTimeout(() => {
      setAddedToast(false);
    }, 1800);
  };

  return (
    <AnimatePresence>
      {quickViewProduct && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] select-none"
          onClick={() => setQuickViewProduct(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--paper)] rounded-[var(--r)] max-w-3xl w-full overflow-hidden shadow-2xl border border-[var(--line)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-[var(--r-in)] text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--paper)] hover:bg-[var(--paper-2)] transition-colors cursor-pointer border border-[var(--line)] inline-flex items-center justify-center"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {(() => {
              const discount = calculateDiscountPercent(
                quickViewProduct.originalPrice,
                quickViewProduct.price
              );
              const customerSummary = simplifyTagline(
                quickViewProduct.tagline,
                quickViewProduct.category
              );

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 max-h-[85vh] overflow-y-auto">
                  {/* Product Image */}
                  <div className="relative bg-[var(--paper-2)] p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[var(--line)]">
                    <div className="w-full aspect-[3/4] rounded-[var(--r-in)] bg-[var(--paper)] border border-[var(--line)] overflow-hidden flex items-center justify-center relative">
                      <img
                        src={
                          selectedImgIdx === 1 && quickViewProduct.secondaryImage
                            ? quickViewProduct.secondaryImage
                            : quickViewProduct.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png'
                        }
                        alt={quickViewProduct.name}
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
                    </div>

                    {quickViewProduct.secondaryImage && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedImgIdx(0)}
                          className={`px-3 py-1.5 rounded-[var(--r-sm)] text-xs font-medium border cursor-pointer transition-colors ${
                            selectedImgIdx === 0
                              ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]'
                              : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--paper)]'
                          }`}
                        >
                          Front View
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedImgIdx(1)}
                          className={`px-3 py-1.5 rounded-[var(--r-sm)] text-xs font-medium border cursor-pointer transition-colors ${
                            selectedImgIdx === 1
                              ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]'
                              : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--paper)]'
                          }`}
                        >
                          Alternate View
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Product Details & Options */}
                  <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-[var(--muted)] block">
                          {quickViewProduct.clubShort} · {quickViewProduct.category}
                        </span>
                        <h2
                          id="quick-view-title"
                          className="text-xl sm:text-2xl font-brand font-semibold text-[var(--ink)] tracking-tight mt-1 leading-snug pr-8"
                        >
                          {quickViewProduct.name}
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 font-sans leading-relaxed">
                          {customerSummary}
                        </p>
                      </div>

                      {/* Pricing & Stock */}
                      <div className="flex flex-wrap items-baseline justify-between gap-2 pt-3 border-t border-[var(--line)]">
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-xl font-mono font-semibold text-[var(--ink)] tabular-nums">
                            {formatPrice(quickViewProduct.price, currency)}
                          </span>
                          {quickViewProduct.originalPrice > quickViewProduct.price && (
                            <span className="text-xs font-mono text-[var(--muted)] line-through tabular-nums">
                              {formatPrice(quickViewProduct.originalPrice, currency)}
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-[var(--r-sm)]">
                              Save {discount}%
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            isOutOfStock ? 'text-[var(--bad)]' : 'text-[var(--ok)]'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                        </span>
                      </div>

                      {/* Colorways */}
                      {(quickViewProduct.colorways?.length ?? 0) > 0 && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-[var(--muted)] block">
                            Color:{' '}
                            <span className="text-[var(--ink)] font-semibold">
                              {selectedColor?.name}
                            </span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {quickViewProduct.colorways.map((c, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setSelectedColor(c)}
                                className={`min-h-[36px] flex items-center gap-2 px-3 py-1.5 rounded-[var(--r-in)] border text-xs font-medium transition-all cursor-pointer ${
                                  selectedColor?.name === c.name
                                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]'
                                    : 'border-[var(--line)] hover:border-[var(--line-2)] text-[var(--ink-2)] bg-[var(--paper)]'
                                }`}
                              >
                                <span
                                  className="w-3 h-3 rounded-full border border-black/20 dark:border-white/25 inline-block shrink-0"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span>{c.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sizes */}
                      {(quickViewProduct.sizes?.length ?? 0) > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <label className="font-medium text-[var(--muted)]">Size</label>
                            <span className="text-[var(--muted)]">Standard Unisex Fit</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {quickViewProduct.sizes.map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setSelectedSize(s)}
                                className={`min-w-[40px] min-h-[38px] px-3 rounded-[var(--r-in)] border text-xs font-mono font-medium transition-all cursor-pointer ${
                                  selectedSize === s
                                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)] font-semibold'
                                    : 'border-[var(--line)] hover:border-[var(--line-2)] text-[var(--ink-2)] bg-[var(--paper)]'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-xs font-medium text-[var(--muted)]">Quantity</span>
                        <div className="inline-flex items-center rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-2)] overflow-hidden">
                          <button
                            type="button"
                            disabled={isOutOfStock || quantity <= 1}
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-9 h-9 flex items-center justify-center enabled:hover:bg-[var(--paper-3)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--ink)] cursor-pointer transition-colors"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="w-9 text-center text-xs font-mono font-semibold text-[var(--ink)] tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isOutOfStock || quantity >= availableStock}
                            onClick={() => setQuantity(availableStock > 0 ? Math.min(availableStock, quantity + 1) : 1)}
                            className="w-9 h-9 flex items-center justify-center enabled:hover:bg-[var(--paper-3)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--ink)] cursor-pointer transition-colors"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-4 border-t border-[var(--line)] space-y-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={handleAddToCart}
                          className="flex-1 min-h-[46px] py-3 px-4 rounded-[var(--r-in)] bg-[var(--ink)] enabled:hover:bg-[var(--accent-solid)] enabled:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-[var(--on-ink)] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
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
                              <span>
                                Add to Bag · {formatPrice(quickViewProduct.price * quantity, currency)}
                              </span>
                            </>
                          )}
                        </button>

                        {(() => {
                          const isSaved = wishlist.includes(quickViewProduct.id);
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                toggleWishlist(quickViewProduct.id);
                                showToast(
                                  isSaved
                                    ? `Removed ${quickViewProduct.name} from wishlist.`
                                    : `Saved ${quickViewProduct.name} to wishlist.`,
                                  'info'
                                );
                              }}
                              aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                              aria-pressed={isSaved}
                              title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                              className={`min-w-[46px] min-h-[46px] px-3 rounded-[var(--r-in)] border inline-flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                isSaved
                                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                                  : 'border-[var(--line)] bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-[var(--ink)]'
                              }`}
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  isSaved ? 'fill-[var(--accent)] text-[var(--accent)]' : ''
                                }`}
                              />
                            </button>
                          );
                        })()}
                      </div>

                      <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[var(--ok)] shrink-0" />
                          <span>Campus Pickup &amp; Pan-India Courier</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const slug = quickViewProduct.slug;
                            setQuickViewProduct(null);
                            onNavigateToProduct(slug);
                          }}
                          className="font-medium text-[var(--ink)] hover:text-[var(--accent)] inline-flex items-center gap-0.5 cursor-pointer transition-colors"
                        >
                          <span>Full Details</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
