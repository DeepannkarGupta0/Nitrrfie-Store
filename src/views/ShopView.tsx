import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { ActiveView } from '../types/store';
import { X, Search, ShoppingBag, AlertTriangle, RefreshCw } from 'lucide-react';

interface ShopViewProps {
  initialCategory?: string;
  initialClub?: string;
  onNavigate: (view: ActiveView) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({ initialCategory, initialClub, onNavigate }) => {
  const { products, catalogError, refreshCatalogProducts } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [selectedClub, setSelectedClub] = useState<string>(initialClub || 'All');
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'discount'>('featured');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    setSelectedCategory(initialCategory || 'All');
  }, [initialCategory]);

  useEffect(() => {
    setSelectedClub(initialClub || 'All');
  }, [initialClub]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const clubs = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.clubShort) set.add(p.clubShort);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const sizes = useMemo(() => {
    const preferredOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
    const set = new Set<string>();
    products.forEach((p) => {
      (p.sizes || []).forEach((s) => {
        if (s) set.add(s);
      });
    });
    const sorted = Array.from(set).sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
    return ['All', ...sorted];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return products
      .filter((p) => {
        const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchClub = selectedClub === 'All' || p.clubShort === selectedClub;
        const matchSize = selectedSize === 'All' || (p.sizes || []).includes(selectedSize);
        const matchSearch =
          !q ||
          (p.name || '').toLowerCase().includes(q) ||
          (p.tagline || '').toLowerCase().includes(q) ||
          (p.club || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q);

        return matchCategory && matchClub && matchSize && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'discount') {
          const discA = a.originalPrice - a.price;
          const discB = b.originalPrice - b.price;
          return discB - discA;
        }
        return 0;
      });
  }, [products, selectedCategory, selectedClub, selectedSize, sortBy, searchFilter]);

  const hasActiveFilters =
    selectedCategory !== 'All' || selectedClub !== 'All' || selectedSize !== 'All' || searchFilter !== '';

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedClub('All');
    setSelectedSize('All');
    setSearchFilter('');
    setSortBy('featured');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-10 space-y-8">
      {/* Clean Storefront Header */}
      <div className="border-b border-[var(--line)] pb-6 space-y-2">
        <span className="text-xs font-sans font-medium text-[var(--accent)] block">
          NIT Raipur Official Store
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-normal text-[var(--ink)] tracking-tight">
          All Merchandise
        </h1>
        <p className="text-sm text-[var(--muted)] max-w-2xl font-sans leading-relaxed">
          Explore official campus outerwear, comfortable everyday tees, society editions, and keepsakes for students and alumni.
        </p>
      </div>

      {catalogError && (
        <div className="p-4 rounded-[var(--r-in)] bg-[var(--bad-soft)] border border-[var(--bad-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--bad)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{catalogError}</span>
          </div>
          <button
            type="button"
            onClick={() => void refreshCatalogProducts()}
            className="px-3 py-1.5 rounded-[var(--r-sm)] bg-[var(--paper)] border border-[var(--bad-border)] text-[var(--ink)] font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:bg-[var(--paper-2)] shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-[var(--line)]">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2.5 text-xs sm:text-sm font-sans font-medium transition-colors cursor-pointer whitespace-nowrap border-b-2 -mb-[1px] ${
                  isSelected
                    ? 'border-[var(--ink)] text-[var(--ink)] font-semibold'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {cat === 'All' ? 'All Items' : cat}
              </button>
            );
          })}
        </div>

        {/* Search, Filter Dropdowns & Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Inline Search */}
            <div className="relative flex-1 min-w-[200px] sm:flex-none sm:w-56">
              <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search items..."
                aria-label="Filter merchandise"
                className="w-full min-h-[40px] pl-8 pr-3 py-2 rounded-[var(--r-in)] text-xs font-sans bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 transition-colors"
              />
            </div>

            {/* Club Filter */}
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              aria-label="Filter by club or collection"
              className="min-h-[40px] text-xs font-sans px-3 py-2 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 cursor-pointer"
            >
              <option value="All">All Collections</option>
              {clubs
                .filter((c) => c !== 'All')
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>

            {/* Size Filter */}
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              aria-label="Filter by size"
              className="min-h-[40px] text-xs font-sans px-3 py-2 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 cursor-pointer"
            >
              <option value="All">All Sizes</option>
              {sizes
                .filter((s) => s !== 'All')
                .map((s) => (
                  <option key={s} value={s}>
                    Size {s}
                  </option>
                ))}
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-sans font-medium text-[var(--ink)] px-3 py-2 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] hover:bg-[var(--paper-3)] cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Sort & Count */}
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <span className="text-xs font-sans text-[var(--muted)]">
              Showing <strong className="text-[var(--ink)] font-semibold">{filteredProducts.length}</strong> items
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc' | 'discount')}
              aria-label="Sort merchandise"
              className="min-h-[40px] text-xs font-sans px-3 py-2 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Biggest Savings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-[var(--r)] bg-[var(--paper-2)] border border-[var(--line)] space-y-3">
          <ShoppingBag className="w-8 h-8 text-[var(--muted)] mx-auto stroke-[1.5]" />
          <h3 className="font-brand text-lg font-medium text-[var(--ink)]">No items match your filters</h3>
          <p className="text-xs sm:text-sm text-[var(--muted)] max-w-sm mx-auto font-sans">
            Try clearing your search or selecting another category or size.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-2 min-h-[40px] px-5 py-2 rounded-[var(--r-in)] bg-[var(--ink)] text-[var(--on-ink)] text-xs font-sans font-semibold cursor-pointer hover:bg-[var(--accent-solid)] hover:text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {filteredProducts.map((product) => (
            <motion.div key={product.id} layout>
              <ProductCard
                product={product}
                onSelectProduct={(slug) => onNavigate({ type: 'product', slug })}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
