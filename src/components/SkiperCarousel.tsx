import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'motion/react';
import { Product } from '../types/store';
import { formatPrice, calculateDiscountPercent } from '../utils/cartLogic';
import { simplifyTagline } from '../utils/productPresentation';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
} from 'lucide-react';

interface SkiperCarouselProps {
  products: Product[];
  onSelectProduct: (slug: string) => void;
}

export const SkiperCarousel: React.FC<SkiperCarouselProps> = ({ products, onSelectProduct }) => {
  const { addToCart, setQuickViewProduct, currency } = useCart();
  const { showToast } = useToast();
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragDeltaX, setDragDeltaX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState<{ productId: string; size: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = products.slice(0, 6);
  const total = items.length;

  useEffect(() => {
    if (total === 0) {
      setActiveIndex(0);
    } else if (activeIndex >= total) {
      setActiveIndex(0);
    }
  }, [total, activeIndex]);

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev + 1) % total);
    setDragDeltaX(0);
    setIsDragging(false);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
    setDragDeltaX(0);
    setIsDragging(false);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, total]);

  useEffect(() => {
    if (isPaused || isDragging || shouldReduceMotion || total <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, isDragging, shouldReduceMotion, activeIndex, nextSlide, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    setDragStartX(e.touches[0].clientX);
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartX !== null) {
      const delta = e.touches[0].clientX - dragStartX;
      setDragDeltaX(delta);
    }
  };

  const handleTouchEnd = () => {
    if (dragDeltaX < -45) {
      nextSlide();
    } else if (dragDeltaX > 45) {
      prevSlide();
    }
    setDragStartX(null);
    setDragDeltaX(0);
    setIsDragging(false);
    setIsPaused(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    setDragStartX(e.clientX);
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartX !== null) {
      const delta = e.clientX - dragStartX;
      setDragDeltaX(delta);
    }
  };

  const handleMouseUp = () => {
    if (dragDeltaX < -45) {
      nextSlide();
    } else if (dragDeltaX > 45) {
      prevSlide();
    }
    setDragStartX(null);
    setDragDeltaX(0);
    setIsDragging(false);
    setIsPaused(false);
  };

  const handleQuickAdd = (product: Product, size: string) => {
    const outOfStock =
      product.inStock === false || (typeof product.stock === 'number' && product.stock <= 0);
    if (outOfStock) {
      showToast(`"${product.name}" is currently out of stock.`, 'error');
      return;
    }
    addToCart(product, product.colorways?.[0] || { name: 'Standard', hex: '#18181b' }, size, 1);
    setAddedFeedback({ productId: product.id, size });
    showToast(`Added ${product.name} (Size ${size}) to bag.`, 'success');
    setTimeout(() => {
      setAddedFeedback(null);
    }, 1800);
  };

  if (total === 0) return null;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        setDragStartX(null);
        setDragDeltaX(0);
        setIsDragging(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ touchAction: 'pan-y' }}
      className={`relative w-full py-6 sm:py-8 select-none overflow-hidden ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      <div className="w-full flex items-center justify-center h-[480px] sm:h-[550px] md:h-[600px] perspective-1000 overflow-visible">
        <div className="relative w-full max-w-5xl h-full flex items-center justify-center preserve-3d">
          {items.map((product, idx) => {
            let offset = idx - activeIndex;
            if (offset < -Math.floor(total / 2)) offset += total;
            if (offset > Math.floor(total / 2)) offset -= total;

            const isCenter = offset === 0;
            const isLeft = offset === -1;
            const isRight = offset === 1;
            const isFarLeft = offset === -2;
            const isFarRight = offset === 2;
            const isVisible = Math.abs(offset) <= 2;

            if (!isVisible) return null;

            let transform = '';
            let zIndex = 10;
            let opacity = 0.25;

            if (isCenter) {
              const rotate = dragDeltaX * -0.04;
              transform = `translate3d(${dragDeltaX * 0.8}px, 0, 80px) rotateY(${rotate}deg) scale(1)`;
              zIndex = 30;
              opacity = 1;
            } else if (isLeft) {
              transform = `translate3d(calc(-100% - 24px + ${dragDeltaX * 0.3}px), 0, -60px) rotateY(18deg) scale(0.88)`;
              zIndex = 20;
              opacity = 0.65;
            } else if (isRight) {
              transform = `translate3d(calc(100% + 24px + ${dragDeltaX * 0.3}px), 0, -60px) rotateY(-18deg) scale(0.88)`;
              zIndex = 20;
              opacity = 0.65;
            } else if (isFarLeft) {
              transform = `translate3d(calc(-195% - 40px), 0, -160px) rotateY(32deg) scale(0.74)`;
              zIndex = 10;
              opacity = 0.2;
            } else if (isFarRight) {
              transform = `translate3d(calc(195% + 40px), 0, -160px) rotateY(-32deg) scale(0.74)`;
              zIndex = 10;
              opacity = 0.2;
            }

            const discount = calculateDiscountPercent(product.originalPrice, product.price);
            const isOutOfStock =
              product.inStock === false || (typeof product.stock === 'number' && product.stock <= 0);
            const customerSummary = simplifyTagline(product.tagline, product.category);

            return (
              <div
                key={product.id}
                style={{
                  transform,
                  zIndex,
                  opacity,
                  transition:
                    isDragging || shouldReduceMotion
                      ? 'none'
                      : 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms ease',
                }}
                className="absolute top-1/2 -translate-y-1/2 w-[265px] sm:w-[320px] md:w-[365px] preserve-3d"
                onClick={() => {
                  if (Math.abs(dragDeltaX) > 10) return;
                  if (isLeft || isFarLeft) prevSlide();
                  else if (isRight || isFarRight) nextSlide();
                }}
              >
                <div
                  className={`rounded-[var(--r)] backdrop-blur-xl bg-[var(--paper-card)]/95 border p-3.5 sm:p-4 shadow-xl transition-all duration-300 group ${
                    isCenter
                      ? 'border-[var(--line-2)] cursor-default'
                      : 'border-[var(--line)] hover:border-[var(--accent)]/50 cursor-pointer hover:opacity-90'
                  }`}
                >
                  <div
                    onClick={() => {
                      if (isCenter && Math.abs(dragDeltaX) < 8) {
                        onSelectProduct(product.slug);
                      }
                    }}
                    className={`relative aspect-[3/4] rounded-[var(--r-in)] bg-[var(--paper-2)] overflow-hidden ${
                      isCenter ? 'cursor-pointer' : ''
                    }`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallbackApplied) {
                          img.dataset.fallbackApplied = '1';
                          img.src = '/assets/aistudio/ecell-varsity-jacket_daef387e.png';
                        }
                      }}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                      draggable={false}
                    />

                    {discount > 0 && (
                      <span className="absolute top-2.5 right-2.5 text-[11px] font-semibold px-2 py-0.5 rounded-[var(--r-sm)] bg-[var(--accent-solid)] text-white shadow-xs">
                        Save {discount}%
                      </span>
                    )}

                    {isCenter && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between text-white pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickViewProduct(product);
                          }}
                          className="text-xs font-medium inline-flex items-center gap-1.5 hover:underline underline-offset-2 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Quick View</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Metadata */}
                  <div className="pt-3.5 space-y-2.5">
                    <div>
                      <span className="text-xs text-[var(--muted)] block truncate">
                        {product.clubShort} · {product.category}
                      </span>
                      <h3
                        onClick={() => {
                          if (isCenter) onSelectProduct(product.slug);
                        }}
                        className={`font-brand text-base font-semibold text-[var(--ink)] line-clamp-1 transition-colors mt-0.5 ${
                          isCenter ? 'hover:text-[var(--accent)] cursor-pointer' : ''
                        }`}
                      >
                        {product.name}
                      </h3>
                      <p className="text-xs text-[var(--muted)] line-clamp-1 font-sans mt-0.5">
                        {customerSummary}
                      </p>
                    </div>

                    {/* Price & Quick Size Row */}
                    <div className="pt-2.5 border-t border-[var(--line)] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--muted)]">Available Sizes</span>
                        <span className="font-mono text-sm font-semibold text-[var(--ink)] tabular-nums">
                          {formatPrice(product.price, currency)}
                        </span>
                      </div>

                      {isOutOfStock ? (
                        <div className="py-1.5 rounded-[var(--r-sm)] text-center text-xs font-medium text-[var(--bad)] bg-[var(--bad-soft)] border border-[var(--bad-border)]">
                          Out of Stock
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {(product.sizes || []).slice(0, 5).map((size) => {
                            const isJustAdded =
                              addedFeedback?.productId === product.id && addedFeedback?.size === size;
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAdd(product, size);
                                }}
                                className={`flex-1 min-h-[32px] py-1 rounded-[var(--r-sm)] text-xs font-mono border transition-all cursor-pointer text-center font-medium ${
                                  isJustAdded
                                    ? 'bg-[#15803D] text-white border-[#15803D]'
                                    : 'bg-[var(--paper-2)] hover:bg-[var(--accent-solid)] hover:text-white hover:border-[var(--accent-solid)] text-[var(--ink)] border-[var(--line)]'
                                }`}
                                title={`Add size ${size} to bag`}
                              >
                                {isJustAdded ? (
                                  <span className="inline-flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </span>
                                ) : (
                                  size
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls Bar */}
      <div className="mt-4 flex items-center justify-between gap-3 max-w-4xl mx-auto px-4 py-2.5 rounded-[var(--r)] bg-[var(--paper-card)] border border-[var(--line)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-mono text-[var(--muted)] tabular-nums">
            <span className="text-[var(--ink)] font-semibold">{String(activeIndex + 1).padStart(2, '0')}</span>
            <span>/</span>
            <span>{String(total).padStart(2, '0')}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {items.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setActiveIndex(dotIdx)}
                className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                  activeIndex === dotIdx
                    ? 'w-6 bg-[var(--accent)]'
                    : 'w-1.5 bg-[var(--line-2)] hover:bg-[var(--muted)]'
                }`}
                aria-label={`Jump to featured item ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="hidden sm:block w-36 md:w-52 h-1 rounded-full bg-[var(--line)] relative overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300 ease-out"
            style={{ width: `${((activeIndex + 1) / total) * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevSlide}
            className="w-9 h-9 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--accent-solid)] hover:text-white hover:border-[var(--accent-solid)] transition-colors cursor-pointer inline-flex items-center justify-center"
            aria-label="Previous featured item"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="w-9 h-9 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--accent-solid)] hover:text-white hover:border-[var(--accent-solid)] transition-colors cursor-pointer inline-flex items-center justify-center"
            aria-label="Next featured item"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
