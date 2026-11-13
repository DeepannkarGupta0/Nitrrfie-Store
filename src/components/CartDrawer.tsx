import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Minus, Plus, Trash2, ArrowRight, ShieldCheck, ShoppingBag, RefreshCw, AlertTriangle, Cloud } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/cartLogic';
import { ActiveView } from '../types/store';

interface CartDrawerProps {
  onNavigate: (view: ActiveView) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    items,
    totals,
    removeFromCart,
    updateQuantity,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    currency,
    cartSyncStatus,
    cartSyncError,
    cartWarnings,
    hasStockIssues,
    isCartAuthenticated,
    retryCartSync,
  } = useCart();
  const { showToast } = useToast();

  // Close drawer on Escape key & lock background scroll while open
  useEffect(() => {
    if (!isCartDrawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartDrawerOpen(false);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCartDrawerOpen, setIsCartDrawerOpen]);

  // Free delivery threshold: ₹1,500 or $150
  const freeShippingThreshold = currency === 'INR' ? 1500 : 150;
  const currentSubtotalVal = currency === 'INR' ? totals.subtotal : totals.subtotal * 0.012;
  const progressPercent = Math.min(100, Math.round((currentSubtotalVal / freeShippingThreshold) * 100));
  const amountRemaining = Math.max(0, freeShippingThreshold - currentSubtotalVal);

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Bag"
          className="fixed inset-0 z-50 overflow-hidden select-none"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setIsCartDrawerOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-xs cursor-pointer"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10 pointer-events-none">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto w-screen max-w-md bg-[var(--paper)] dark:bg-[#121214] border-l border-[var(--line)] dark:border-zinc-800 flex flex-col justify-between shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--line)] dark:border-zinc-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-brand text-base text-[var(--ink)] font-semibold">
                    Shopping Bag
                  </span>
                  <span className="text-xs font-sans text-[var(--muted)]">({totals.itemCount})</span>
                  {isCartAuthenticated && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-sm)] text-[11px] font-sans font-medium border ${
                        cartSyncStatus === 'error'
                          ? 'border-[var(--bad-border)] text-[var(--bad)] bg-[var(--bad-soft)]'
                          : cartSyncStatus === 'syncing'
                          ? 'border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent-soft)]'
                          : 'border-[var(--ok-border)] text-[var(--ok)] bg-[var(--ok-soft)]'
                      }`}
                    >
                      <Cloud className="w-3 h-3" />
                      <span>
                        {cartSyncStatus === 'syncing'
                          ? 'Syncing'
                          : cartSyncStatus === 'error'
                          ? 'Sync Error'
                          : 'Saved'}
                      </span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-9 h-9 rounded-[var(--r-in)] text-[var(--ink)] hover:text-[var(--muted)] hover:bg-[var(--paper-2)] transition-colors cursor-pointer border border-[var(--line)] dark:border-zinc-800 inline-flex items-center justify-center shrink-0"
                  aria-label="Close bag"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Complimentary Delivery Progress Bar */}
              <div className="px-6 py-3 bg-[var(--paper-2)] dark:bg-zinc-900 border-b border-[var(--line)] dark:border-zinc-800 text-xs font-sans">
                {amountRemaining === 0 ? (
                  <div className="flex items-center gap-1.5 text-[var(--ok)] font-medium">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Free campus pickup &amp; express delivery unlocked</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[var(--ink-2)] text-xs">
                      <span>Free Delivery Progress</span>
                      <span className="font-medium">
                        Add {currency === 'INR' ? `₹${amountRemaining}` : `$${Math.round(amountRemaining)}`} more
                      </span>
                    </div>
                    <div className="w-full rounded-full bg-[var(--line)] dark:bg-zinc-800 h-1.5 overflow-hidden">
                      <div
                        className="bg-[var(--accent)] h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sync Error / Stock Warning Banners */}
              {cartSyncError && (
                <div className="px-6 py-2.5 bg-red-500/10 border-b border-red-500/30 flex items-center justify-between gap-2 text-xs font-sans text-red-600 dark:text-red-400">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="truncate">{cartSyncError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => retryCartSync()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--r-sm)] border border-red-500/40 hover:bg-red-500/15 font-semibold shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {cartWarnings.length > 0 && (
                <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/30 space-y-1 text-xs font-sans text-amber-700 dark:text-amber-300">
                  {cartWarnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cart Item List */}
              <div className="flex-1 overflow-y-auto px-6 py-6 divide-y divide-[var(--line)] dark:divide-zinc-800">
                {items.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-12 h-12 rounded-[var(--r)] bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-5 h-5 text-[var(--muted)] stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-brand text-base text-[var(--ink)] font-semibold">
                        Your shopping bag is empty
                      </p>
                      <p className="text-xs sm:text-sm text-[var(--muted)] max-w-[240px] mx-auto font-sans">
                        Explore varsity jackets, hoodies, society tees, and campus keepsakes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCartDrawerOpen(false);
                        onNavigate({ type: 'shop' });
                      }}
                      className="min-h-[42px] px-5 py-2.5 rounded-[var(--r-in)] bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white text-xs sm:text-sm font-sans font-semibold transition-colors cursor-pointer"
                    >
                      Browse Catalog
                    </button>
                  </div>
                ) : (
                  items.map((item) => {
                    const isItemOutOfStock =
                      item.availabilityStatus === 'out_of_stock' ||
                      item.availabilityStatus === 'unavailable' ||
                      item.product.inStock === false ||
                      (typeof item.product.stock === 'number' && item.product.stock <= 0);
                    const maxAvailable = item.availableStock ?? item.product.stock ?? 50;
                    const atStockLimit = isItemOutOfStock || item.quantity >= maxAvailable;

                    return (
                    <div key={item.cartItemId} className="py-5 flex gap-4 first:pt-0 last:pb-0">
                      {/* Portrait Thumbnail */}
                      <div className="w-20 aspect-[3/4] rounded-[var(--r-in)] bg-[var(--paper-2)] dark:bg-zinc-900 border border-[var(--line)] dark:border-zinc-800 overflow-hidden shrink-0">
                        <img
                          src={item.product.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png'}
                          alt={item.product.name}
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

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-brand text-sm text-[var(--ink)] font-medium leading-snug line-clamp-1">
                              {item.product.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                removeFromCart(item.cartItemId);
                                showToast(`Removed ${item.product.name} from bag.`, 'info');
                              }}
                              className="text-[var(--muted)] hover:text-red-500 transition-colors p-1 rounded-[var(--r-sm)] cursor-pointer shrink-0"
                              title="Remove item"
                              aria-label={`Remove ${item.product.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs font-sans text-[var(--muted)]">
                            <span>{item.selectedColor.name}</span>
                            <span>·</span>
                            <span>Size {item.selectedSize}</span>
                            {item.customDesign?.text && (
                              <>
                                <span>·</span>
                                <span className="text-[var(--accent)] font-semibold">"{item.customDesign.text}"</span>
                              </>
                            )}
                          </div>

                          {isItemOutOfStock && (
                            <span className="mt-1.5 inline-block px-2 py-0.5 rounded-[var(--r-sm)] text-[11px] font-sans font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                              {item.availabilityStatus === 'unavailable' ? 'No Longer Available' : 'Out of Stock'}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          {/* Quantity Stepper */}
                          <div className="inline-flex items-center rounded-[var(--r-in)] border border-[var(--line)] dark:border-zinc-700 bg-[var(--paper-2)] dark:bg-zinc-900 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                              className="px-2.5 py-1.5 text-[var(--ink)] hover:bg-[var(--line)] dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 py-0.5 text-xs font-mono font-medium text-[var(--ink)] tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={atStockLimit}
                              onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                              className="px-2.5 py-1.5 text-[var(--ink)] enabled:hover:bg-[var(--paper-3)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-mono text-sm font-semibold text-[var(--ink)] tabular-nums">
                            {formatPrice(item.product.price * item.quantity, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>

              {/* Footer & Checkout Action */}
              {items.length > 0 && (
                <div className="p-6 border-t border-[var(--line)] dark:border-zinc-800 bg-[var(--paper-2)] dark:bg-zinc-900 space-y-4">
                  <div className="space-y-1.5 font-sans text-xs">
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>Subtotal</span>
                      <span className="text-[var(--ink)] font-mono tabular-nums font-semibold">
                        {formatPrice(totals.subtotal, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>Campus Pickup</span>
                      <span className="text-[var(--ok)] font-medium">Free</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={hasStockIssues}
                      onClick={() => {
                        setIsCartDrawerOpen(false);
                        onNavigate({ type: 'checkout' });
                      }}
                      className="w-full min-h-[46px] py-3 px-4 rounded-[var(--r-in)] bg-[var(--accent-solid)] enabled:hover:bg-[var(--accent-solid-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-sans font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>{hasStockIssues ? 'Resolve Stock Issues First' : 'Proceed to Checkout'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCartDrawerOpen(false);
                        onNavigate({ type: 'cart' });
                      }}
                      className="w-full py-2 text-center text-xs font-sans font-medium text-[var(--muted)] hover:text-[var(--ink)] underline underline-offset-4 transition-colors cursor-pointer"
                    >
                      View Full Bag
                    </button>
                  </div>

                  <p className="text-[11px] text-center text-[var(--muted)] font-sans">
                    Makerspace Pickup (4:00 – 7:30 PM) · Evening Hostel Dispatch
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
