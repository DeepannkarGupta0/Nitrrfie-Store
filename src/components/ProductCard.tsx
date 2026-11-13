import React, { useState } from 'react';
import { Product } from '../types/store';
import { formatPrice, calculateDiscountPercent } from '../utils/cartLogic';
import { simplifyTagline } from '../utils/productPresentation';
import { Eye, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (slug: string) => void;
}

const getSecondaryImage = (product: Product): string => {
  return product.secondaryImage || '';
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct }) => {
  const { setQuickViewProduct, addToCart, wishlist, toggleWishlist, currency } = useCart();
  const { showToast } = useToast();
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const discount = calculateDiscountPercent(product.originalPrice, product.price);
  const isWishlisted = wishlist.includes(product.id);
  const isOutOfStock =
    product.inStock === false || (typeof product.stock === 'number' && product.stock <= 0);
  const currentColor =
    product.colorways?.[selectedColorIdx] ||
    product.colorways?.[0] || { name: 'Standard', hex: '#18181b' };
  const secondaryImage = getSecondaryImage(product);
  const customerSummary = simplifyTagline(product.tagline, product.category);

  const handleQuickAddSize = (e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    if (isOutOfStock) {
      showToast(`"${product.name}" is currently out of stock.`, 'error');
      return;
    }
    addToCart(product, currentColor, size, 1);
    showToast(`Added ${product.name} (${size}) to bag.`, 'success');
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col justify-between rounded-[var(--r)] bg-[var(--paper-card)] border border-[var(--line)] hover:border-[var(--line-2)] p-2.5 sm:p-3.5 transition-all duration-300 shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5"
    >
      {/* Portrait Product Image */}
      <div
        onClick={() => onSelectProduct(product.slug)}
        className="relative aspect-[3/4] rounded-[var(--r-in)] bg-[var(--paper-2)] overflow-hidden cursor-pointer"
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
          className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out ${
            secondaryImage
              ? 'group-hover:opacity-0 group-hover:scale-105'
              : 'group-hover:scale-105'
          }`}
          loading="lazy"
        />

        {Boolean(secondaryImage && secondaryImage.trim()) && (
          <img
            src={secondaryImage}
            alt={`${product.name} alternate view`}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.dataset.fallbackApplied) {
                img.dataset.fallbackApplied = '1';
                img.src = '/assets/aistudio/ecell-varsity-jacket_daef387e.png';
              }
            }}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
            loading="lazy"
          />
        )}

        {/* Single Subtle Status Tag (top-left) */}
        {(isOutOfStock || discount > 0) && (
          <div className="absolute top-2.5 left-2.5 pointer-events-none">
            {isOutOfStock ? (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-[var(--r-sm)] bg-zinc-900/85 text-white backdrop-blur-xs">
                Out of Stock
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[var(--r-sm)] bg-[var(--accent-solid)] text-white shadow-xs">
                -{discount}%
              </span>
            )}
          </div>
        )}

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
            showToast(
              isWishlisted ? `Removed ${product.name} from wishlist.` : `Saved ${product.name} to wishlist.`,
              'info'
            );
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-[var(--r-sm)] backdrop-blur-md bg-white/85 dark:bg-zinc-900/85 border border-black/10 dark:border-white/10 text-[var(--ink)] hover:text-red-500 transition-colors cursor-pointer inline-flex items-center justify-center shadow-xs"
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={isWishlisted}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-[var(--ink)]'
            }`}
          />
        </button>

        {/* Quick Add Size Strip on Hover */}
        <div
          className={`hidden sm:flex absolute inset-x-0 bottom-0 backdrop-blur-xl bg-white/92 dark:bg-zinc-900/92 border-t border-[var(--line)] p-2.5 transition-all duration-300 flex-col gap-2 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span className="font-medium">Quick Add</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuickViewProduct(product);
              }}
              className="text-[var(--ink)] hover:text-[var(--accent)] font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Quick View</span>
            </button>
          </div>

          {isOutOfStock ? (
            <div className="py-1.5 rounded-[var(--r-sm)] text-center text-[11px] font-medium text-[var(--bad)] bg-[var(--bad-soft)] border border-[var(--bad-border)]">
              Currently Unavailable
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1">
              {(product.sizes || []).slice(0, 5).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={(e) => handleQuickAddSize(e, size)}
                  className="flex-1 min-h-[30px] py-1 rounded-[var(--r-sm)] text-[11px] font-mono text-[var(--ink)] bg-[var(--paper-2)] hover:bg-[var(--accent-solid)] hover:text-white border border-[var(--line)] transition-colors cursor-pointer text-center font-medium"
                  title={`Quick Add Size ${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Metadata */}
      <div className="pt-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="text-xs text-[var(--muted)] line-clamp-1">
            {product.clubShort} · {product.category}
          </div>

          <h3
            onClick={() => onSelectProduct(product.slug)}
            className="font-brand text-sm sm:text-base font-semibold text-[var(--ink)] hover:text-[var(--accent)] transition-colors line-clamp-1 cursor-pointer leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          <p className="text-xs text-[var(--muted)] line-clamp-1 font-sans">
            {customerSummary}
          </p>
        </div>

        {/* Color Swatches & Price */}
        <div className="pt-2.5 border-t border-[var(--line)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {(product.colorways || []).slice(0, 4).map((c, idx) => (
              <button
                key={c.name}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedColorIdx(idx);
                }}
                className={`w-3 h-3 rounded-full border transition-transform cursor-pointer ${
                  selectedColorIdx === idx
                    ? 'ring-1.5 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--paper-card)] scale-110 border-transparent'
                    : 'border-black/20 dark:border-white/25 hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
                aria-label={`Select color ${c.name}`}
              />
            ))}
            {(product.colorways || []).length > 4 && (
              <span className="text-[11px] text-[var(--muted)]">
                +{(product.colorways || []).length - 4}
              </span>
            )}
          </div>

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
        </div>
      </div>
    </div>
  );
};
