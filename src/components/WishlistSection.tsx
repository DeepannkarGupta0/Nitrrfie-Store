import React, { useMemo, useState } from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ActiveView, Product } from '../types/store';
import { calculateDiscountPercent, formatPrice } from '../utils/cartLogic';
import { simplifyTagline } from '../utils/productPresentation';

interface WishlistSectionProps {
  onNavigate?: (view: ActiveView) => void;
  compact?: boolean;
}

export const WishlistSection: React.FC<WishlistSectionProps> = ({
  onNavigate,
  compact = false,
}) => {
  const {
    products,
    wishlist,
    removeFromWishlist,
    clearWishlist,
    addToCart,
    currency,
  } = useCart();
  const { showToast } = useToast();

  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const savedProducts = useMemo(() => {
    const productById = new Map(products.map((p) => [p.id, p]));
    return wishlist
      .map((id) => productById.get(id))
      .filter((p): p is Product => Boolean(p));
  }, [products, wishlist]);

  const handleAddToBag = (product: Product) => {
    const isOutOfStock =
      product.inStock === false || (typeof product.stock === 'number' && product.stock <= 0);
    if (isOutOfStock) {
      showToast(`"${product.name}" is currently out of stock.`, 'error');
      return;
    }

    const chosenSize = selectedSizes[product.id] || product.sizes?.[0] || 'Standard';
    const chosenColor = product.colorways?.[0] || { name: 'Standard', hex: '#18181B' };
    addToCart(product, chosenColor, chosenSize, 1);
    setRecentlyAddedId(product.id);
    showToast(`Added ${product.name} (${chosenSize}) to bag.`, 'success');
    setTimeout(() => {
      setRecentlyAddedId((prev) => (prev === product.id ? null : prev));
    }, 1600);
  };

  const handleRemove = (product: Product) => {
    removeFromWishlist(product.id);
    showToast(`Removed ${product.name} from wishlist.`, 'info');
  };

  const handleClearAll = () => {
    if (savedProducts.length === 0) return;
    clearWishlist();
    showToast('Cleared all saved wishlist items.', 'info');
  };

  const openProduct = (slug: string) => {
    if (onNavigate) {
      onNavigate({ type: 'product', slug });
      return;
    }
    try {
      window.history.pushState(null, '', `/product/${encodeURIComponent(slug)}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.href = `/product/${encodeURIComponent(slug)}`;
    }
  };

  const openShop = () => {
    if (onNavigate) {
      onNavigate({ type: 'shop' });
      return;
    }
    try {
      window.history.pushState(null, '', '/shop');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.href = '/shop';
    }
  };

  return (
    <section
      id="wishlist"
      aria-labelledby="profile-wishlist-heading"
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2
              id="profile-wishlist-heading"
              className="font-display text-2xl sm:text-3xl font-normal text-[var(--ink)] tracking-tight"
            >
              Wishlist
            </h2>
            <span className="text-xs font-mono text-[var(--muted)] tabular-nums">
              {savedProducts.length} {savedProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted)] font-sans">
            Saved items stay stored on this browser so you can compare fits and add them to your bag anytime.
          </p>
        </div>

        {savedProducts.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="min-h-[38px] px-3.5 py-1.5 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-card)] text-xs font-sans font-medium text-[var(--muted)] hover:text-[var(--bad)] hover:border-[var(--bad-border)] hover:bg-[var(--bad-soft)] transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Wishlist</span>
          </button>
        )}
      </div>

      {/* Empty State vs Saved Grid */}
      {savedProducts.length === 0 ? (
        <div className="rounded-[var(--r)] border border-[var(--line)] bg-[var(--paper-2)] px-6 py-14 sm:py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-[var(--r-in)] bg-[var(--paper-card)] border border-[var(--line)] text-[var(--muted)] flex items-center justify-center mx-auto">
            <Heart className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-brand text-lg font-semibold text-[var(--ink)]">
              Your wishlist is empty
            </h3>
            <p className="text-xs sm:text-sm text-[var(--muted)] font-sans leading-relaxed">
              Tap the heart button on any hoodie, jacket, or campus essential to save it here for later.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={openShop}
              className="min-h-[42px] px-5 py-2.5 rounded-[var(--r-in)] bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white text-xs sm:text-sm font-sans font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={
            compact
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
          }
        >
          {savedProducts.map((product) => {
            const discount = calculateDiscountPercent(product.originalPrice, product.price);
            const isOutOfStock =
              product.inStock === false ||
              (typeof product.stock === 'number' && product.stock <= 0);
            const sizes = product.sizes?.length ? product.sizes : ['Standard'];
            const activeSize = selectedSizes[product.id] || sizes[0];
            const wasAdded = recentlyAddedId === product.id;

            return (
              <article
                key={product.id}
                data-testid={`wishlist-item-${product.id}`}
                className="flex flex-col justify-between rounded-[var(--r)] bg-[var(--paper-card)] border border-[var(--line)] hover:border-[var(--line-2)] p-3.5 transition-all duration-200 shadow-[var(--shadow-1)]"
              >
                {/* Product Media */}
                <div
                  onClick={() => openProduct(product.slug)}
                  className="relative aspect-[3/4] rounded-[var(--r-in)] bg-[var(--paper-2)] overflow-hidden cursor-pointer group"
                >
                  <img
                    src={product.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png'}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.fallbackApplied) {
                        img.dataset.fallbackApplied = '1';
                        img.src = '/assets/aistudio/ecell-varsity-jacket_daef387e.png';
                      }
                    }}
                    className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                    loading="lazy"
                  />

                  {(isOutOfStock || discount > 0) && (
                    <div className="absolute top-2.5 left-2.5 pointer-events-none">
                      {isOutOfStock ? (
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-[var(--r-sm)] bg-zinc-900/85 text-white">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[var(--r-sm)] bg-[var(--accent-solid)] text-white shadow-xs">
                          -{discount}%
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(product);
                    }}
                    aria-label={`Remove ${product.name} from wishlist`}
                    title="Remove from wishlist"
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-[var(--r-sm)] backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 border border-black/10 dark:border-white/15 text-red-500 hover:text-[var(--bad)] transition-colors cursor-pointer inline-flex items-center justify-center shadow-xs"
                  >
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </button>
                </div>

                {/* Details & Actions */}
                <div className="pt-3.5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="text-xs text-[var(--muted)] line-clamp-1">
                      {product.clubShort} · {product.category}
                    </div>
                    <button
                      type="button"
                      onClick={() => openProduct(product.slug)}
                      className="font-brand text-base font-semibold text-[var(--ink)] hover:text-[var(--accent)] transition-colors text-left line-clamp-1 cursor-pointer block w-full"
                    >
                      {product.name}
                    </button>
                    <p className="text-xs text-[var(--muted)] line-clamp-1 font-sans">
                      {simplifyTagline(product.tagline, product.category)}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2.5 border-t border-[var(--line)]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-sm sm:text-[15px] font-semibold text-[var(--ink)] tabular-nums">
                          {formatPrice(product.price, currency)}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-[var(--muted)] line-through tabular-nums">
                            {formatPrice(product.originalPrice, currency)}
                          </span>
                        )}
                      </div>

                      {sizes.length > 1 ? (
                        <select
                          aria-label={`Select size for ${product.name}`}
                          value={activeSize}
                          onChange={(e) =>
                            setSelectedSizes((prev) => ({
                              ...prev,
                              [product.id]: e.target.value,
                            }))
                          }
                          className="min-h-[34px] px-2.5 py-1 rounded-[var(--r-sm)] bg-[var(--paper-2)] border border-[var(--line)] text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                        >
                          {sizes.map((size) => (
                            <option key={size} value={size}>
                              Size {size}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-mono text-[var(--muted)]">
                          {sizes[0]}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleAddToBag(product)}
                        className="flex-1 min-h-[40px] py-2 px-3 rounded-[var(--r-in)] bg-[var(--ink)] enabled:hover:bg-[var(--accent-solid)] enabled:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-[var(--on-ink)] text-xs font-sans font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {isOutOfStock ? (
                          <span>Out of Stock</span>
                        ) : wasAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added to Bag</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Bag</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(product)}
                        aria-label={`Remove ${product.name}`}
                        title="Remove from wishlist"
                        className="min-w-[40px] min-h-[40px] p-2 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-2)] text-[var(--muted)] hover:text-[var(--bad)] hover:border-[var(--bad-border)] hover:bg-[var(--bad-soft)] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
