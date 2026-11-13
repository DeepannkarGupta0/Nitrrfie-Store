import React, { useState, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Product } from '../../types/store';
import { formatINR, calculateDiscountPercent } from '../../utils/cartLogic';
import {
  Package,
  Plus,
  Search,
  Edit3,
  Trash2,
  Copy,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { EditProductModal } from './EditProductModal';

interface ProductCatalogPanelProps {
  onShowNotification: (msg: string) => void;
  onNavigateToAddProduct?: () => void;
}

export const ProductCatalogPanel: React.FC<ProductCatalogPanelProps> = ({
  onShowNotification,
  onNavigateToAddProduct,
}) => {
  const { products, catalogError, addProduct, updateProduct, deleteProduct, refreshCatalogProducts } = useCart();
  const { adminUser } = useAdminAuth();
  const canDeleteProducts = adminUser?.permissions?.deleteProducts !== false;
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [clubFilter, setClubFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract unique categories and clubs
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [products]);

  const clubs = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.clubShort));
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (clubFilter !== 'all' && p.clubShort !== clubFilter) return false;
      if (stockFilter === 'in_stock' && (p.inStock === false || (p.stock ?? 50) <= 0)) return false;
      if (stockFilter === 'out_of_stock' && p.inStock !== false && (p.stock ?? 50) > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesTag = p.tagline.toLowerCase().includes(q);
        const matchesClub = p.club.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        if (!matchesName && !matchesTag && !matchesClub && !matchesCat) return false;
      }
      return true;
    });
  }, [products, categoryFilter, clubFilter, stockFilter, searchQuery]);

  const handleDuplicate = async (product: Product) => {
    if (duplicatingId) return;
    setDuplicatingId(product.id);
    try {
      const { id: _id, slug: _slug, version: _ver, ...rest } = product;
      const copy: Omit<Product, 'id' | 'slug'> = {
        ...rest,
        name: `${product.name} (Copy)`,
        badge: 'New Variant',
        stock: 30,
        inStock: true,
      };
      const res = await addProduct(copy);
      if (res.success && res.product) {
        onShowNotification(`Duplicated "${res.product.name}" created.`);
      } else {
        onShowNotification(res.error || 'Failed to duplicate product.');
      }
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDeleteClick = (product: Product) => {
    if (!canDeleteProducts) return;
    setProductToDelete(product);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const res = await deleteProduct(productToDelete.id);
    if (res.success) {
      onShowNotification(`"${productToDelete.name}" removed from catalog.`);
      setProductToDelete(null);
    }
  };

  const handleToggleStock = async (product: Product) => {
    const currentlyAvailable = product.inStock !== false && (product.stock ?? 0) > 0;
    const nextInStock = !currentlyAvailable;
    if (nextInStock && (product.stock ?? 0) <= 0) {
      onShowNotification(
        `Stock for "${product.name}" is 0 units. Click Edit to add inventory before marking In Stock.`
      );
      return;
    }
    const res = await updateProduct(product.id, { inStock: nextInStock });
    if (res.success) {
      const actualAvailable = res.product
        ? res.product.inStock !== false && (res.product.stock ?? 0) > 0
        : nextInStock;
      onShowNotification(
        `"${product.name}" marked as ${actualAvailable ? 'Available' : 'Out of Stock'}.`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--paper)] p-5 rounded-[var(--r)] border border-[var(--line)] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-brand font-bold text-[var(--ink)] tracking-tight">
              Campus Store Catalog
            </h2>
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 bg-[var(--accent-soft)] text-[var(--accent)] rounded-[var(--r-pill)] border border-[rgba(252,76,2,0.2)]">
              {products.length} Products Active
            </span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Add new garments, update prices, manage collegiate sizes, and maintain stock levels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isRefreshing}
            onClick={async () => {
              if (isRefreshing) return;
              setIsRefreshing(true);
              try {
                const ok = await refreshCatalogProducts();
                onShowNotification(
                  ok
                    ? 'Catalog synchronized with central store database.'
                    : catalogError || 'Unable to synchronize catalog with the store database.'
                );
              } finally {
                setIsRefreshing(false);
              }
            }}
            title="Refresh catalog from central database"
            className="px-3 py-2 text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--paper-2)] hover:bg-[var(--paper-3)] disabled:opacity-50 text-xs font-mono rounded-[var(--r-in)] transition-colors cursor-pointer flex items-center gap-1.5 border border-[var(--line)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh Catalog'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToAddProduct?.()}
            className="px-4 py-2.5 bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-[var(--r-in)] transition-all cursor-pointer flex items-center gap-2 shadow-sm active:translate-y-px"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-[var(--paper)] p-4 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title, society, tag or category..."
              className="w-full pl-9 pr-4 py-2 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-3 bg-[var(--paper-2)] border border-[var(--line)] hover:border-[var(--line-2)] rounded-[var(--r-in)] text-xs font-mono text-[var(--ink)] cursor-pointer focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
              className="py-1.5 px-3 bg-[var(--paper-2)] border border-[var(--line)] hover:border-[var(--line-2)] rounded-[var(--r-in)] text-xs font-mono text-[var(--ink)] cursor-pointer focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            >
              <option value="all">All Societies / Clubs</option>
              {clubs.map((cl) => (
                <option key={cl} value={cl}>
                  {cl}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="py-1.5 px-3 bg-[var(--paper-2)] border border-[var(--line)] hover:border-[var(--line-2)] rounded-[var(--r-in)] text-xs font-mono text-[var(--ink)] cursor-pointer focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            >
              <option value="all">Stock: All</option>
              <option value="in_stock">In Stock Only</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid / Table */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] space-y-3">
          <Package className="w-10 h-10 text-[var(--muted)] mx-auto mb-2" />
          <h3 className="text-base font-brand font-bold text-[var(--ink)]">No products match your criteria</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            Try resetting your search query or filters, or add a new campus product to the catalog.
          </p>
          <button
            type="button"
            onClick={() => onNavigateToAddProduct?.()}
            className="px-4 py-2 bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-[var(--r-in)] cursor-pointer transition-colors"
          >
            Add New Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isAvailable = product.inStock !== false && (product.stock ?? 50) > 0;
            const discount = calculateDiscountPercent(product.originalPrice, product.price);

            return (
              <div
                key={product.id}
                className="bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] shadow-sm overflow-hidden flex flex-col hover:border-[var(--line-2)] transition-all"
              >
                {/* Image & Badges */}
                <div className="relative h-48 bg-[var(--paper-2)] border-b border-[var(--line)] flex items-center justify-center p-4">
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
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {product.badge && (
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--ink)] text-[var(--on-ink)] border border-[var(--line)]">
                        {product.badge}
                      </span>
                    )}
                    {product.customizable && (
                      <span className="font-mono text-[9px] font-semibold uppercase px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(252,76,2,0.2)] flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Customizable</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => handleToggleStock(product)}
                      className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-[var(--r-pill)] border transition-colors cursor-pointer ${
                        isAvailable
                          ? 'bg-[var(--ok-soft)] text-[var(--ok)] border-[var(--ok-border)] hover:opacity-85'
                          : 'bg-[var(--bad-soft)] text-[var(--bad)] border-[var(--bad-border)] hover:opacity-85'
                      }`}
                    >
                      {isAvailable ? '● In Stock' : '✕ Out of Stock'}
                    </button>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted)] mb-1">
                      <span>{product.category}</span>
                      <span className="font-bold text-[var(--ink)]">{product.clubShort}</span>
                    </div>

                    <h3 className="font-brand font-bold text-sm text-[var(--ink)] leading-snug line-clamp-2">
                      {product.name}
                    </h3>

                    <p className="text-[11px] text-[var(--muted)] line-clamp-1 mt-0.5">
                      {product.tagline}
                    </p>

                    {/* Price & Stock */}
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-base font-brand font-black font-mono text-[var(--ink)] tabular-nums">
                        {formatINR(product.price)}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-xs text-[var(--muted)] font-mono line-through tabular-nums">
                          {formatINR(product.originalPrice)}
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="text-[10px] font-mono font-semibold text-[var(--ok)]">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    {/* Sizes and Colors available */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--muted)] mt-2 pt-2 border-t border-[var(--line)]">
                      <span>Sizes: {(product.sizes || []).join(', ')}</span>
                      <span>•</span>
                      <span>{(product.colorways || []).length} Colors</span>
                      <span>•</span>
                      <span>Units: {product.stock ?? 50}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(product)}
                      className="px-3 py-1.5 bg-[var(--paper-2)] hover:bg-[var(--paper-3)] border border-[var(--line)] text-[var(--ink)] font-mono font-semibold text-xs rounded-[var(--r-in)] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={duplicatingId === product.id}
                        onClick={() => handleDuplicate(product)}
                        title="Duplicate product"
                        className="p-1.5 text-[var(--muted)] enabled:hover:text-[var(--ink)] enabled:hover:bg-[var(--paper-2)] disabled:opacity-50 rounded-[var(--r-in)] transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {canDeleteProducts && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(product)}
                          title="Delete product"
                          className="p-1.5 text-[var(--muted)] hover:text-[var(--bad)] hover:bg-[var(--bad-soft)] rounded-[var(--r-in)] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Product Modal */}
      <EditProductModal
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onUpdated={() => {
          onShowNotification(`Product changes saved successfully.`);
        }}
      />

      {/* In-App Delete Confirmation Modal (Replaces blocked window.confirm) */}
      {productToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setProductToDelete(null)}
        >
          <div
            className="bg-[var(--paper)] rounded-[var(--r)] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[var(--line)] space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-brand text-base font-bold text-[var(--ink)]">
                  Delete Campus Product?
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Are you sure you want to remove this piece from the store catalog? This item will no longer appear on the home drops, student shop, or search results.
                </p>
              </div>
            </div>

            {/* Product Snapshot */}
            <div className="p-3 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)] flex items-center gap-3">
              <img
                src={productToDelete.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png'}
                alt={productToDelete.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.dataset.fallbackApplied) {
                    img.dataset.fallbackApplied = '1';
                    img.src = '/assets/aistudio/ecell-varsity-jacket_daef387e.png';
                  }
                }}
                className="w-12 h-14 object-cover rounded bg-white shrink-0 border border-[var(--line)]"
              />
              <div className="min-w-0">
                <h4 className="font-brand text-xs font-bold text-[var(--ink)] truncate">
                  {productToDelete.name}
                </h4>
                <p className="text-[11px] font-mono text-[var(--accent)] font-semibold">
                  {productToDelete.clubShort} • {formatINR(productToDelete.price)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-mono font-bold text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] rounded-[var(--r-in)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold rounded-[var(--r-in)] shadow-xs cursor-pointer transition-colors"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
