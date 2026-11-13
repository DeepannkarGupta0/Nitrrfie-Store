import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  ArrowRight,
  Sun,
  Moon,
  Truck,
  Lock,
  ChevronRight,
  User,
  Home,
  Sparkles,
  ShieldCheck,
  Store,
  Heart,
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { SafeSignedIn, SafeSignedOut, SafeUserButton } from '../context/SafeClerkContext';
import { useCart } from '../context/CartContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useTheme } from '../context/ThemeContext';
import { ActiveView } from '../types/store';
import { formatPrice } from '../utils/cartLogic';
import { getClerkAppearance } from '../config/clerkAppearance';
import { WishlistSection } from './WishlistSection';

interface HeaderProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onOpenAuth }) => {
  const {
    totals,
    products,
    currency,
    wishlist,
    setIsCartDrawerOpen,
    setIsTrackOpen,
  } = useCart();

  const { theme, toggleTheme } = useTheme();
  const { isStaffAuthorized, adminUser } = useAdminAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        if (window.innerWidth >= 768) {
          setIsSearchDropdownOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        } else {
          setMenuOpen(true);
          setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
        }
      }
      if (e.key === 'Escape') {
        if (isSearchDropdownOpen) {
          setIsSearchDropdownOpen(false);
          searchInputRef.current?.blur();
        } else if (menuOpen) {
          setMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchDropdownOpen, menuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim()
    ? products
        .filter((p) => {
          const q = searchQuery.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.club.toLowerCase().includes(q) ||
            p.clubShort.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.tagline.toLowerCase().includes(q) ||
            (p.features && p.features.some((f) => f.toLowerCase().includes(q)))
          );
        })
        .slice(0, 5)
    : [];

  const handleSelectProduct = (slug: string) => {
    onNavigate({ type: 'product', slug });
    setIsSearchDropdownOpen(false);
    setSearchQuery('');
    setMenuOpen(false);
  };

  const handleNav = (view: ActiveView) => {
    onNavigate(view);
    setMenuOpen(false);
    setIsSearchDropdownOpen(false);
  };

  const isActive = (type: string) => currentView.type === type;

  return (
    <header
      className="fixed top-2.5 sm:top-3.5 inset-x-0 z-40 px-2.5 sm:px-5 lg:px-6 xl:px-10 pointer-events-none select-none box-border"
    >
      {/* Full-viewport Backdrop when Navigation Menu is Open */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="header-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 pointer-events-auto cursor-pointer"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Floating Header Bar */}
      <div
        className={`pointer-events-auto relative z-40 w-full max-w-[1440px] mx-auto px-2.5 sm:px-4 lg:px-5 xl:px-6 rounded-[var(--r)] box-border transition-[background-color,border-color,box-shadow] duration-200 ${
          isScrolled
            ? 'bg-[var(--paper)]/92 backdrop-blur-md border border-[var(--line-2)] shadow-[var(--shadow-card)]'
            : 'bg-[var(--paper)]/95 backdrop-blur-sm border border-[var(--line)] shadow-[var(--shadow-1)]'
        }`}
      >
        <div className="h-14 md:h-16 flex items-center justify-between gap-2 md:gap-3 lg:gap-4 min-w-0">
          {/* Brand Identity */}
          <button
            type="button"
            onClick={() => handleNav({ type: 'home' })}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group flex-1 md:flex-none min-w-0 text-left"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 xl:w-10 xl:h-10 rounded-[var(--r-in)] overflow-hidden border border-[var(--line-2)] bg-white p-0.5 shrink-0 transition-colors group-hover:border-[var(--accent)]">
              <img
                src="/assets/aistudio/nitrr_new_logo_new_155e66c7.png"
                alt="NIT Raipur Store Logo"
                className="w-full h-full object-contain rounded-[var(--r-sm)]"
              />
            </div>

            <div className="min-w-0">
              <span className="font-brand text-[15px] sm:text-base xl:text-lg font-bold tracking-tight text-[var(--ink)] block transition-colors group-hover:text-[var(--accent)] leading-none truncate">
                NIT Raipur <span className="text-[var(--accent)] italic font-medium">Store</span>
              </span>
              <span className="hidden md:block lg:hidden xl:block text-[11px] text-[var(--muted)] mt-0.5 truncate">
                Official Merchandise
              </span>
            </div>
          </button>

          {/* Desktop Primary Navigation Links (lg+) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-0.5 xl:gap-1 xl:ml-2 shrink-0"
          >
            <button
              type="button"
              onClick={() => handleNav({ type: 'shop' })}
              className={`px-2 xl:px-3 py-2 rounded-[var(--r-in)] text-xs xl:text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive('shop')
                  ? 'text-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]'
              }`}
            >
              Shop All
            </button>
            <button
              type="button"
              onClick={() => handleNav({ type: 'customize', slug: 'ecell-varsity-bomber-jacket' })}
              className={`px-2 xl:px-3 py-2 rounded-[var(--r-in)] text-xs xl:text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive('customize')
                  ? 'text-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]'
              }`}
            >
              Customizer Studio
            </button>
            <button
              type="button"
              onClick={() => handleNav({ type: 'support' })}
              className={`px-2 xl:px-3 py-2 rounded-[var(--r-in)] text-xs xl:text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive('support')
                  ? 'text-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]'
              }`}
            >
              Shipping &amp; Help
            </button>
            <button
              type="button"
              onClick={() => setIsTrackOpen(true)}
              className="px-2 xl:px-3 py-2 rounded-[var(--r-in)] text-xs xl:text-[13px] font-medium whitespace-nowrap text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] transition-colors cursor-pointer"
            >
              Track Order
            </button>
          </nav>

          {/* Tablet & Desktop Inline Search (md+) */}
          <div
            ref={searchContainerRef}
            className="relative hidden md:block flex-1 min-w-0 max-w-xs xl:max-w-sm"
          >
            <div className="relative flex items-center w-full min-w-0">
              <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 pointer-events-none" />

              <input
                ref={searchInputRef}
                type="text"
                size={1}
                value={searchQuery}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                placeholder="Search hoodies, tees, clubs..."
                aria-label="Search store catalog"
                className="w-full min-w-0 min-h-[38px] lg:min-h-[40px] pl-9 pr-10 xl:pr-12 py-1.5 text-[13px] font-sans rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus:bg-[var(--paper-card)] focus:border-[var(--accent)] transition-all"
              />

              <div className="absolute right-2.5 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 rounded-[var(--r-sm)] text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden xl:inline-block px-1.5 py-0.5 rounded-[var(--r-sm)] text-[10px] font-mono bg-[var(--paper-card)] text-[var(--muted)] border border-[var(--line)] pointer-events-none">
                    ⌘K
                  </kbd>
                )}
              </div>
            </div>

            {/* Desktop Inline Search Dropdown */}
            <AnimatePresence>
              {isSearchDropdownOpen && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.99 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-[var(--r)] bg-[var(--paper-card)] border border-[var(--line-2)] shadow-xl z-50 overflow-hidden divide-y divide-[var(--line)]"
                >
                  <div className="px-3.5 py-2.5 bg-[var(--paper-2)] flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
                    <span>Search Results</span>
                    <span className="text-[var(--accent)] font-semibold">
                      {searchResults.length} {searchResults.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
                    {searchResults.length === 0 ? (
                      <div className="py-5 text-center text-xs text-[var(--muted)]">
                        No matching products found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    ) : (
                      searchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelectProduct(product.slug)}
                          className="w-full p-2 rounded-[var(--r-in)] flex items-center justify-between hover:bg-[var(--paper-2)] transition-colors cursor-pointer group text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-12 rounded-[var(--r-sm)] bg-[var(--paper-2)] border border-[var(--line)] overflow-hidden shrink-0">
                              <img
                                src={product.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png'}
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
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <span className="text-[11px] text-[var(--muted)] block truncate">
                                {product.clubShort} · {product.category}
                              </span>
                              <h4 className="font-brand text-[13px] font-semibold text-[var(--ink)] truncate group-hover:text-[var(--accent)] transition-colors">
                                {product.name}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="font-mono text-xs font-semibold text-[var(--ink)] tabular-nums">
                              {formatPrice(product.price, currency)}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate({ type: 'shop' });
                      setIsSearchDropdownOpen(false);
                    }}
                    className="w-full py-2.5 bg-[var(--paper-2)] text-center text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    Browse Full Catalog →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {/* Theme Toggle (md+ top bar; available inside mobile menu on <768px) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden md:inline-flex w-9 h-9 lg:w-10 lg:h-10 items-center justify-center rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-card)] text-[var(--ink)] hover:border-[var(--line-2)] hover:bg-[var(--paper-2)] transition-colors cursor-pointer shrink-0"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--ink-2)]" />
              )}
            </button>

            {/* Profile & Wishlist Button (md+ top bar; inside mobile menu on <768px) */}
            <button
              type="button"
              onClick={() => handleNav({ type: 'profile', section: 'wishlist' })}
              data-testid="header-wishlist-button"
              className={`hidden md:inline-flex relative w-9 h-9 lg:w-10 lg:h-10 items-center justify-center rounded-[var(--r-in)] border transition-colors cursor-pointer shrink-0 ${
                isActive('profile')
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--line)] bg-[var(--paper-card)] text-[var(--ink)] hover:border-[var(--line-2)] hover:bg-[var(--paper-2)]'
              }`}
              title={`Profile & Wishlist (${wishlist.length} saved)`}
              aria-label={`Open Profile & Wishlist (${wishlist.length} saved)`}
            >
              <Heart
                className={`w-4 h-4 ${
                  wishlist.length > 0 ? 'text-[var(--accent)] fill-[var(--accent)]/15' : ''
                }`}
              />
              {wishlist.length > 0 && (
                <span
                  data-testid="header-wishlist-badge"
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-[var(--r-pill)] bg-[var(--accent-solid)] text-white text-[10px] font-mono font-bold inline-flex items-center justify-center leading-none tabular-nums shadow-xs"
                >
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Clerk User Account Controls (md+ top bar; inside mobile menu on <768px) */}
            <div className="hidden md:flex items-center shrink-0">
              <SafeSignedOut>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="min-h-[38px] xl:min-h-[40px] flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-card)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer text-xs font-medium whitespace-nowrap shrink-0"
                  title="Sign In / Create Account"
                  aria-label="Sign In"
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span className="hidden md:inline lg:hidden xl:inline">Sign In</span>
                </button>
              </SafeSignedOut>

              <SafeSignedIn>
                {(() => {
                  const clerkAppearance = getClerkAppearance(theme);
                  return (
                    <SafeUserButton
                      key={theme}
                      afterSignOutUrl="/"
                      appearance={{
                        ...clerkAppearance,
                        elements: {
                          ...clerkAppearance.elements,
                          userButtonAvatarBox: 'w-9 h-9 rounded-[var(--r-in)] border border-[var(--line-2)]',
                        },
                      }}
                    >
                      <UserButton.MenuItems>
                        <UserButton.Action
                          label={`Profile & Wishlist (${wishlist.length})`}
                          labelIcon={<Heart className="w-4 h-4" />}
                          onClick={() => handleNav({ type: 'profile', section: 'wishlist' })}
                        />
                      </UserButton.MenuItems>
                      <UserButton.UserProfilePage
                        label="Wishlist"
                        url="wishlist"
                        labelIcon={<Heart className="w-4 h-4" />}
                      >
                        <div className="p-4 sm:p-6">
                          <WishlistSection compact onNavigate={handleNav} />
                        </div>
                      </UserButton.UserProfilePage>
                    </SafeUserButton>
                  );
                })()}
              </SafeSignedIn>
            </div>

            {/* Shopping Bag Button (Always Visible at Every Viewport Size) */}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              data-testid="header-cart-button"
              className="min-h-[38px] md:min-h-[40px] flex items-center gap-1.5 text-xs font-semibold rounded-[var(--r-in)] text-[var(--on-ink)] bg-[var(--ink)] px-2.5 md:px-3 xl:px-3.5 py-1.5 md:py-2 hover:bg-[var(--accent-solid)] hover:text-white active:scale-[0.98] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label={`Open Shopping Bag (${totals.itemCount} items)`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="hidden xl:inline">Bag</span>
              <span
                data-testid="header-cart-badge"
                className="min-w-[18px] h-[18px] px-1 rounded-[var(--r-pill)] bg-[var(--accent-solid)] text-white text-[11px] font-mono font-bold inline-flex items-center justify-center leading-none tabular-nums shrink-0"
              >
                {totals.itemCount}
              </span>
            </button>

            {/* Hamburger Menu Toggle Button (Always Visible) */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="header-menu-button"
              className={`min-w-[40px] min-h-[38px] md:min-h-[40px] flex items-center justify-center gap-1.5 px-2.5 xl:px-3 py-1.5 md:py-2 rounded-[var(--r-in)] transition-colors cursor-pointer text-xs font-semibold whitespace-nowrap shrink-0 border ${
                menuOpen
                  ? 'bg-[var(--ink)] text-[var(--on-ink)] border-[var(--ink)]'
                  : 'bg-[var(--paper-card)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--line-2)] hover:bg-[var(--paper-2)]'
              }`}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <>
                  <X className="w-4 h-4 shrink-0" />
                  <span className="hidden xl:inline">Close</span>
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4 shrink-0" />
                  <span className="hidden xl:inline">Menu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Navigation Drawer Panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="header-menu-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            data-testid="header-mobile-menu"
            className="pointer-events-auto relative z-40 w-full max-w-[1440px] mx-auto mt-2 rounded-[var(--r)] bg-[var(--paper)] border border-[var(--line-2)] shadow-2xl max-h-[calc(100dvh-5.5rem)] overflow-y-auto"
          >
            <div className="max-w-2xl mx-auto px-4 sm:px-8 py-4 sm:py-6 space-y-4">
              {/* Mobile Search inside Navigation Panel (< 768px) */}
              <div className="md:hidden space-y-2">
                <div className="relative flex items-center w-full">
                  <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 pointer-events-none" />
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hoodies, tees, clubs..."
                    aria-label="Search store catalog"
                    className="w-full min-h-[42px] pl-9 pr-9 py-2 text-sm font-sans rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line-2)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus:bg-[var(--paper-card)] focus:border-[var(--accent)]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        mobileSearchInputRef.current?.focus();
                      }}
                      className="absolute right-2.5 p-1 rounded-[var(--r-sm)] text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                      aria-label="Clear mobile search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {searchQuery.trim() && (
                  <div className="rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-card)] divide-y divide-[var(--line)] max-h-60 overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <div className="py-4 text-center text-xs text-[var(--muted)]">
                        No matching products found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    ) : (
                      searchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelectProduct(product.slug)}
                          className="w-full p-2.5 flex items-center justify-between hover:bg-[var(--paper-2)] cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-11 rounded-[var(--r-sm)] bg-[var(--paper-2)] border border-[var(--line)] overflow-hidden shrink-0">
                              <img
                                src={product.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png'}
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
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-brand text-xs font-semibold text-[var(--ink)] truncate">
                                {product.name}
                              </h5>
                              <span className="text-[11px] text-[var(--muted)]">{product.clubShort}</span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-semibold text-[var(--ink)] tabular-nums shrink-0 ml-2">
                            {formatPrice(product.price, currency)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Account Banner */}
              <SafeSignedIn>
                <div className="flex items-center justify-between p-3 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <SafeUserButton
                      key={theme}
                      afterSignOutUrl="/"
                      appearance={getClerkAppearance(theme)}
                    >
                      <UserButton.MenuItems>
                        <UserButton.Action
                          label={`Profile & Wishlist (${wishlist.length})`}
                          labelIcon={<Heart className="w-4 h-4" />}
                          onClick={() => handleNav({ type: 'profile', section: 'wishlist' })}
                        />
                      </UserButton.MenuItems>
                      <UserButton.UserProfilePage
                        label="Wishlist"
                        url="wishlist"
                        labelIcon={<Heart className="w-4 h-4" />}
                      >
                        <div className="p-4 sm:p-6">
                          <WishlistSection compact onNavigate={handleNav} />
                        </div>
                      </UserButton.UserProfilePage>
                    </SafeUserButton>
                    <div className="min-w-0">
                      <span className="text-[11px] text-[var(--muted)] block">Signed in</span>
                      <span className="font-brand text-sm font-semibold text-[var(--ink)] truncate block">
                        {adminUser ? `${adminUser.name} (Staff)` : 'Customer Account'}
                      </span>
                    </div>
                  </div>
                  {isStaffAuthorized && (
                    <span className="px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--ok-soft)] border border-[var(--ok-border)] text-[var(--ok)] text-[11px] font-medium shrink-0">
                      Staff Access
                    </span>
                  )}
                </div>
              </SafeSignedIn>

              <SafeSignedOut>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-[var(--r-in)] border border-[var(--line-2)] hover:border-[var(--accent)] text-[var(--ink)] hover:text-[var(--accent)] text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer bg-[var(--paper-card)]"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In or Create Account</span>
                </button>
              </SafeSignedOut>

              {/* Navigation Links */}
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleNav({ type: 'home' })}
                  className={`w-full min-h-[44px] py-2.5 px-3 rounded-[var(--r-in)] flex items-center justify-between group cursor-pointer transition-colors text-left ${
                    isActive('home')
                      ? 'text-[var(--accent)] font-semibold bg-[var(--accent-soft)]'
                      : 'text-[var(--ink)] hover:bg-[var(--paper-2)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)]" />
                    <span className="text-sm sm:text-base font-medium">Home</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNav({ type: 'shop' })}
                  className={`w-full min-h-[44px] py-2.5 px-3 rounded-[var(--r-in)] flex items-center justify-between group cursor-pointer transition-colors text-left ${
                    isActive('shop')
                      ? 'text-[var(--accent)] font-semibold bg-[var(--accent-soft)]'
                      : 'text-[var(--ink)] hover:bg-[var(--paper-2)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Store className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)]" />
                    <span className="text-sm sm:text-base font-medium">Shop All Products</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNav({ type: 'customize', slug: 'ecell-varsity-bomber-jacket' })}
                  className={`w-full min-h-[44px] py-2.5 px-3 rounded-[var(--r-in)] flex items-center justify-between group cursor-pointer transition-colors text-left ${
                    isActive('customize')
                      ? 'text-[var(--accent)] font-semibold bg-[var(--accent-soft)]'
                      : 'text-[var(--ink)] hover:bg-[var(--paper-2)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-sm sm:text-base font-medium">Customizer Studio</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTrackOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] py-2.5 px-3 rounded-[var(--r-in)] flex items-center justify-between group cursor-pointer transition-colors text-left text-[var(--ink)] hover:bg-[var(--paper-2)]"
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)]" />
                    <span className="text-sm sm:text-base font-medium">Track Order</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNav({ type: 'support' })}
                  className={`w-full min-h-[44px] py-2.5 px-3 rounded-[var(--r-in)] flex items-center justify-between group cursor-pointer transition-colors text-left ${
                    isActive('support')
                      ? 'text-[var(--accent)] font-semibold bg-[var(--accent-soft)]'
                      : 'text-[var(--ink)] hover:bg-[var(--paper-2)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)]" />
                    <span className="text-sm sm:text-base font-medium">Shipping &amp; Support</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleNav({ type: 'profile', section: 'wishlist' })}
                  className={`w-full min-h-[44px] py-2.5 px-3 rounded-[var(--r-in)] flex items-center justify-between group cursor-pointer transition-colors text-left ${
                    isActive('profile')
                      ? 'text-[var(--accent)] font-semibold bg-[var(--accent-soft)]'
                      : 'text-[var(--ink)] hover:bg-[var(--paper-2)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-sm sm:text-base font-medium">
                      Profile &amp; Wishlist
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--muted)] tabular-nums">
                    {wishlist.length} saved
                    <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav({ type: 'admin' })}
                  className={`w-full min-h-[44px] py-2.5 px-3 rounded-[var(--r-in)] flex items-center justify-between group cursor-pointer transition-colors text-left ${
                    isActive('admin')
                      ? 'text-[var(--accent)] font-semibold bg-[var(--accent-soft)]'
                      : 'text-[var(--ink)] hover:bg-[var(--paper-2)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm sm:text-base font-medium">Staff Operations Portal</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                </button>
              </nav>

              {/* Mobile Theme Toggle (< 768px) & Quick Shopping Bag Action */}
              <div className="pt-3 border-t border-[var(--line)] space-y-2.5">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="md:hidden w-full min-h-[42px] py-2 px-4 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-card)] hover:bg-[var(--paper-2)] hover:border-[var(--line-2)] text-sm font-medium text-[var(--ink)] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-[var(--ink-2)]" />
                    )}
                    <span>Appearance</span>
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCartDrawerOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-[var(--r-in)] bg-[var(--ink)] text-[var(--on-ink)] hover:bg-[var(--accent-solid)] hover:text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    View Bag ({totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}) ·{' '}
                    {formatPrice(totals.total, currency)}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
