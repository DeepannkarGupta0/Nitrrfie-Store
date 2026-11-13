import React from 'react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/cartLogic';
import { simplifyTagline } from '../utils/productPresentation';
import { ActiveView } from '../types/store';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Plus,
  Minus,
  Cloud,
  RefreshCw,
  AlertTriangle,
  Heart,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface CartViewProps {
  onNavigate: (view: ActiveView) => void;
}

export const CartView: React.FC<CartViewProps> = ({ onNavigate }) => {
  const {
    items,
    totals,
    updateQuantity,
    removeFromCart,
    currency,
    wishlist,
    toggleWishlist,
    cartSyncStatus,
    cartSyncError,
    cartWarnings,
    hasStockIssues,
    isCartAuthenticated,
    retryCartSync,
  } = useCart();
  const { showToast } = useToast();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-[var(--line)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-xs font-sans font-medium text-[var(--accent)] block">
            NIT Raipur Store
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-normal text-[var(--ink)] tracking-tight">
            Your Shopping Bag
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] max-w-xl font-sans">
            Review your items before choosing Campus Pickup or Pan-India Express Delivery.
          </p>
        </div>

        {isCartAuthenticated && (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-sm)] text-xs font-sans font-medium border ${
                cartSyncStatus === 'error'
                  ? 'border-[var(--bad-border)] text-[var(--bad)] bg-[var(--bad-soft)]'
                  : cartSyncStatus === 'syncing'
                  ? 'border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'border-[var(--ok-border)] text-[var(--ok)] bg-[var(--ok-soft)]'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>
                {cartSyncStatus === 'syncing'
                  ? 'Syncing Bag...'
                  : cartSyncStatus === 'error'
                  ? 'Sync Interrupted'
                  : 'Synced Across Devices'}
              </span>
            </span>
            {cartSyncStatus === 'error' && (
              <button
                type="button"
                onClick={() => retryCartSync()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--r-sm)] text-xs font-sans font-medium border border-red-500/40 text-red-500 hover:bg-red-500/10 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
      </div>

      {cartSyncError && (
        <div className="p-4 rounded-[var(--r-in)] bg-[var(--bad-soft)] border border-[var(--bad-border)] flex items-center justify-between gap-3 text-xs sm:text-sm font-sans text-[var(--bad)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{cartSyncError}</span>
          </div>
          <button
            type="button"
            onClick={() => retryCartSync()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-sm)] border border-[var(--bad-border)] hover:bg-[var(--bad-soft)] font-semibold shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Sync</span>
          </button>
        </div>
      )}

      {cartWarnings.length > 0 && (
        <div className="p-4 rounded-[var(--r-in)] bg-[var(--warn-soft)] border border-[var(--warn-border)] space-y-1.5 text-xs sm:text-sm font-sans text-[var(--warn)]">
          {cartWarnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        /* Empty Bag State */
        <div className="text-center py-20 px-6 rounded-[var(--r)] bg-[var(--paper-2)] border border-[var(--line)] max-w-xl mx-auto space-y-5">
          <div className="w-12 h-12 rounded-[var(--r-in)] bg-[var(--paper)] border border-[var(--line)] text-[var(--muted)] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-brand text-lg font-medium text-[var(--ink)]">Your bag is empty</h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] max-w-sm mx-auto leading-relaxed font-sans">
              You haven’t added any items yet. Browse our official outerwear, everyday tees, and society editions.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate({ type: 'shop' })}
              className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-[var(--r-in)] bg-[var(--ink)] hover:bg-[var(--accent-solid)] text-[var(--on-ink)] hover:text-white font-sans text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>Browse Collection</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {wishlist.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigate({ type: 'profile', section: 'wishlist' })}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper-card)] hover:bg-[var(--paper-2)] text-[var(--ink)] font-sans text-sm font-medium transition-colors cursor-pointer"
              >
                <Heart className="w-4 h-4 text-[var(--accent)]" />
                <span>View Wishlist ({wishlist.length})</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Items & Summary Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 rounded-[var(--r)] border border-[var(--line)] bg-[var(--paper-card)] divide-y divide-[var(--line)] px-5 sm:px-6">
            {items.map((item) => {
              const isItemOutOfStock =
                item.availabilityStatus === 'out_of_stock' ||
                item.availabilityStatus === 'unavailable' ||
                item.product.inStock === false ||
                (typeof item.product.stock === 'number' && item.product.stock <= 0);
              const maxAvailable = item.availableStock ?? item.product.stock ?? 50;
              const atStockLimit = isItemOutOfStock || item.quantity >= maxAvailable;

              return (
              <div
                key={item.cartItemId}
                className="py-5 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
              >
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                  <div className="w-20 sm:w-24 aspect-[3/4] rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={item.product.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png'}
                      alt={item.product.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallbackApplied) {
                          img.dataset.fallbackApplied = '1';
                          img.src = '/assets/aistudio/ecell-varsity-jacket_daef387e.png';
                        }
                      }}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <button
                      type="button"
                      onClick={() => onNavigate({ type: 'product', slug: item.product.slug })}
                      className="text-base font-brand font-medium text-[var(--ink)] hover:text-[var(--accent)] transition-colors text-left block truncate cursor-pointer leading-snug"
                    >
                      {item.product.name}
                    </button>
                    <p className="text-xs text-[var(--muted)] truncate font-sans">
                      {simplifyTagline(item.product.tagline, item.product.category)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 font-sans text-xs">
                      <span className="bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)] px-2.5 py-0.5 rounded-[var(--r-sm)]">
                        Size: {item.selectedSize}
                      </span>
                      <span className="bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)] px-2.5 py-0.5 rounded-[var(--r-sm)]">
                        {item.selectedColor.name}
                      </span>
                      {item.customDesign?.text && (
                        <span className="text-[var(--ink)] font-medium">
                          Lettering: "{item.customDesign.text}"
                        </span>
                      )}
                      {isItemOutOfStock && (
                        <span className="px-2.5 py-0.5 rounded-[var(--r-sm)] text-[11px] font-medium bg-[var(--bad-soft)] text-[var(--bad)] border border-[var(--bad-border)]">
                          {item.availabilityStatus === 'unavailable' ? 'Unavailable' : 'Out of Stock'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-1 sm:pt-0">
                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-2)] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-[var(--line)] text-[var(--ink)] cursor-pointer transition-colors"
                      aria-label={`Decrease quantity of ${item.product.name}`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-medium text-[var(--ink)] tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={atStockLimit}
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center enabled:hover:bg-[var(--paper-3)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--ink)] cursor-pointer transition-colors"
                      aria-label={`Increase quantity of ${item.product.name}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right min-w-[84px]">
                    <span className="font-mono text-sm font-semibold text-[var(--ink)] tabular-nums block">
                      {formatPrice(item.product.price * item.quantity, currency)}
                    </span>
                    <span className="text-[11px] font-sans text-[var(--muted)] block">
                      {formatPrice(item.product.price, currency)} each
                    </span>
                  </div>

                  {/* Save for Later & Remove Item */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!wishlist.includes(item.product.id)) {
                          toggleWishlist(item.product.id);
                        }
                        removeFromCart(item.cartItemId);
                        showToast(`Saved ${item.product.name} to wishlist.`, 'info');
                      }}
                      className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors cursor-pointer p-1.5 rounded-[var(--r-sm)]"
                      title="Save for later in wishlist"
                      aria-label={`Save ${item.product.name} to wishlist`}
                    >
                      <Heart className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="text-[var(--muted)] hover:text-[var(--bad)] transition-colors cursor-pointer p-1.5 rounded-[var(--r-sm)]"
                      title="Remove item"
                      aria-label={`Remove ${item.product.name} from bag`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* Order Summary Card */}
          <div className="lg:col-span-4 rounded-[var(--r)] bg-[var(--paper-card)] border border-[var(--line)] p-6 sm:p-7 space-y-5 shadow-xs">
            <h2 className="font-brand text-base text-[var(--ink)] font-semibold border-b border-[var(--line)] pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 font-sans text-xs sm:text-sm">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Items Subtotal ({totals.itemCount})</span>
                <span className="text-[var(--ink)] font-mono tabular-nums font-semibold">
                  {formatPrice(totals.subtotal, currency)}
                </span>
              </div>

              <div className="flex justify-between text-[var(--muted)]">
                <span>Campus Pickup</span>
                <span className="text-[var(--ok)] font-medium">Free</span>
              </div>

              <div className="flex justify-between text-[var(--muted)]">
                <span>Taxes &amp; Packaging</span>
                <span className="text-[var(--ink)] font-medium">Included</span>
              </div>

              <div className="border-t border-[var(--line)] pt-3 flex justify-between text-base">
                <span className="text-[var(--ink)] font-semibold">Total</span>
                <span className="text-[var(--ink)] font-mono font-bold tabular-nums">
                  {formatPrice(totals.total, currency)}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={hasStockIssues}
                onClick={() => onNavigate({ type: 'checkout' })}
                className="w-full min-h-[48px] py-3 px-5 rounded-[var(--r-in)] bg-[var(--ink)] enabled:hover:bg-[var(--accent-solid)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--on-ink)] enabled:hover:text-white font-sans text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>{hasStockIssues ? 'Resolve Stock Issues First' : 'Proceed to Checkout'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate({ type: 'shop' })}
                className="w-full py-2 text-center text-xs font-sans font-medium text-[var(--muted)] hover:text-[var(--ink)] underline underline-offset-4 cursor-pointer transition-colors"
              >
                Continue Shopping
              </button>

              {wishlist.length > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigate({ type: 'profile', section: 'wishlist' })}
                  className="w-full py-2 text-center text-xs font-sans font-medium text-[var(--accent)] hover:underline underline-offset-4 cursor-pointer transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>View Saved Wishlist ({wishlist.length})</span>
                </button>
              )}
            </div>

            <div className="border-t border-[var(--line)] pt-4 space-y-1.5 text-xs font-sans text-[var(--muted)]">
              <div className="flex items-center gap-2 text-[var(--ink)] font-medium">
                <ShieldCheck className="w-4 h-4 text-[var(--ok)] shrink-0" />
                <span>48-Hour Size Exchange Included</span>
              </div>
              <p className="leading-relaxed">
                Pickup daily at Makerspace Desk (4:00 PM – 7:30 PM) or select Pan-India courier at checkout.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
