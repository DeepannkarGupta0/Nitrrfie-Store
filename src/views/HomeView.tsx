import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COLLECTIONS } from '../data/collections';
import { ProductCard } from '../components/ProductCard';
import { SkiperCarousel } from '../components/SkiperCarousel';
import { Hero2DAnimation } from '../components/Hero2DAnimation';
import { ActiveView } from '../types/store';
import {
  ArrowRight,
  ChevronDown,
  Sparkles,
  Truck,
  RotateCcw,
  CreditCard,
  Package,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/cartLogic';
import { simplifyTagline } from '../utils/productPresentation';
import { STORE_UPI_ID } from '../checkout/checkoutLogic';

interface HomeViewProps {
  onNavigate: (view: ActiveView) => void;
}

const softSpring = {
  type: 'spring' as const,
  stiffness: 90,
  damping: 20,
  mass: 0.8,
};

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { products, currency } = useCart();
  const [activeTab, setActiveTab] = useState<string>('All');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const flagshipProduct =
    products.find((p) => p.slug === 'ecell-varsity-bomber-jacket') || products[0];

  const filterTabs = [
    { label: 'All', category: null },
    { label: 'Outerwear', category: 'Outerwear' },
    { label: 'Essentials', category: 'Campus Essentials' },
    { label: 'Technical Societies', category: 'Technical Societies' },
    { label: 'Accessories', category: 'Accessories' },
  ];

  const filteredProducts = products.filter((p) => {
    const selected = filterTabs.find((t) => t.label === activeTab);
    if (!selected || !selected.category) return true;
    return p.category === selected.category;
  });

  const faqs = [
    {
      q: 'Where do I collect my order on campus?',
      a: 'Campus collections are handled at the Makerspace Desk (Ground Floor, Main Building, NIT Raipur) Monday to Saturday, 4:00 PM – 7:30 PM. Show your digital Order Pass or ID.',
    },
    {
      q: 'Do you ship Pan-India to alumni across the country?',
      a: 'Yes! We deliver across India to alumni, patrons, and supporters via express courier with real-time tracking, alongside on-campus collection for students and faculty.',
    },
    {
      q: 'Can I exchange my size if it doesn’t fit?',
      a: 'Yes. Easy size exchanges are supported within 48 hours of pickup at the Makerspace Desk, or via courier support for nationwide orders.',
    },
    {
      q: 'How does UPI payment verification work?',
      a: `Pay via any UPI app (GPay, PhonePe, Paytm, BHIM) to the official VPA ${STORE_UPI_ID}, enter your 12-digit bank UTR reference at checkout, and our team verifies it promptly.`,
    },
  ];

  const scrollToFeatured = () => {
    const el = document.getElementById('featured-pieces');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handoverHighlights = [
    {
      icon: Package,
      title: 'Makerspace Handover',
      description: 'Main Building Ground Floor (4:00 PM – 7:30 PM)',
    },
    {
      icon: Truck,
      title: 'Pan-India Express Courier',
      description: 'Doorstep delivery to alumni & supporters across 19,000+ PIN codes',
    },
    {
      icon: RotateCcw,
      title: '48-Hour Size Exchange',
      description: 'Simple fit swaps handled directly at the desk',
    },
    {
      icon: CreditCard,
      title: 'Direct UPI Verification',
      description: `Official VPA ${STORE_UPI_ID} with UTR reference tracking`,
    },
  ];

  return (
    <div className="w-full space-y-16 sm:space-y-20 pb-16 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative w-full min-h-[calc(100vh-4.625rem)] sm:min-h-[calc(100vh-5.5rem)] flex flex-col justify-between border-b border-[var(--line)] bg-[var(--paper)] overflow-hidden">
        <Hero2DAnimation />

        {/* Center Content Grid */}
        <div className="relative w-full flex-1 flex items-center px-4 md:px-8 lg:px-12 py-10 sm:py-14 z-10">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Crisp Typography & Navigation Actions */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-5 z-10"
            >
              <span className="inline-block text-xs font-sans font-semibold text-[var(--accent)] tracking-wide">
                Official Campus &amp; Alumni Store · NIT Raipur
              </span>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[64px] font-normal tracking-tight text-[var(--ink)] leading-[1.04] text-balance">
                Collegiate Heritage. <br />
                <span className="font-brand italic font-normal text-[var(--accent)]">
                  Thoughtfully Crafted.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[var(--ink-2)] max-w-xl font-sans leading-relaxed">
                Official apparel, varsity outerwear, and keepsakes designed for NIT Raipur students, alumni, and societies with Pan-India courier delivery.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate({ type: 'shop' })}
                  className="min-h-[46px] px-6 py-3 rounded-[var(--r-in)] bg-[var(--ink)] text-[var(--on-ink)] hover:bg-[var(--accent-solid)] hover:text-white font-sans text-sm font-semibold inline-flex items-center gap-2 group cursor-pointer transition-colors shadow-xs"
                >
                  <span>Shop Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate({ type: 'customize', slug: 'ecell-varsity-bomber-jacket' })}
                  className="min-h-[46px] px-5 py-3 rounded-[var(--r-in)] bg-[var(--paper-card)]/90 hover:bg-[var(--paper-2)] backdrop-blur-sm border border-[var(--line-2)] hover:border-[var(--accent)] font-sans text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                  <span>Customizer Studio</span>
                </button>
              </div>
            </motion.div>

            {/* Right Column: Highlighted Product Spotlight */}
            {flagshipProduct && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                className="lg:col-span-5 flex flex-col justify-center items-start lg:items-end z-10 w-full"
              >
                <div
                  onClick={() => onNavigate({ type: 'product', slug: flagshipProduct.slug })}
                  className="group relative w-full max-w-md rounded-[var(--r)] backdrop-blur-md bg-[var(--paper)]/90 dark:bg-zinc-900/80 border border-[var(--line)] p-4 sm:p-5 shadow-md hover:border-[var(--accent)]/60 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Compact Product Thumbnail */}
                    <div className="w-20 h-24 sm:w-24 sm:h-28 shrink-0 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] overflow-hidden">
                      <img
                        src={flagshipProduct.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png'}
                        alt={flagshipProduct.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (!img.dataset.fallbackApplied) {
                            img.dataset.fallbackApplied = '1';
                            img.src = '/assets/aistudio/ecell-varsity-jacket_daef387e.png';
                          }
                        }}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </div>

                    {/* Spotlight Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-sans font-semibold text-[var(--accent)]">
                          Featured Release
                        </span>
                        <span className="font-mono text-sm font-semibold text-[var(--ink)] tabular-nums">
                          {formatPrice(flagshipProduct.price, currency)}
                        </span>
                      </div>

                      <h3 className="font-brand text-base font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
                        {flagshipProduct.name}
                      </h3>

                      <p className="text-xs text-[var(--muted)] line-clamp-1 font-sans">
                        {simplifyTagline(flagshipProduct.tagline, flagshipProduct.category)}
                      </p>

                      <div className="pt-1 flex items-center text-xs font-sans font-medium text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                        <span className="inline-flex items-center gap-1">
                          View Piece <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Minimal Scroll Trigger */}
        <div className="relative w-full border-t border-[var(--line)]/70 px-4 py-3 z-10 bg-[var(--paper)]/70 backdrop-blur-xs flex justify-center">
          <button
            type="button"
            onClick={scrollToFeatured}
            className="group inline-flex items-center gap-1.5 text-xs font-sans font-medium text-[var(--muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
            aria-label="Scroll to featured collection"
          >
            <span>Browse Featured Pieces</span>
            <ChevronDown className="w-4 h-4 text-[var(--accent)] group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* 2. FEATURED CAROUSEL */}
      <motion.section
        id="featured-pieces"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={softSpring}
        className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-4 border-b border-[var(--line)]">
          <div>
            <span className="text-xs font-sans font-medium text-[var(--accent)] block">
              Curated Highlights
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-[var(--ink)] tracking-tight mt-0.5">
              Featured Pieces
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ type: 'shop' })}
            className="text-xs sm:text-sm font-sans font-medium text-[var(--ink)] hover:text-[var(--accent)] underline underline-offset-4 cursor-pointer transition-colors self-start sm:self-auto"
          >
            View All ({products.length}) →
          </button>
        </div>

        <SkiperCarousel
          products={products}
          onSelectProduct={(slug) => onNavigate({ type: 'product', slug })}
        />
      </motion.section>

      {/* 3. SHOP BY CATEGORY */}
      <motion.section
        id="curated-index"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={softSpring}
        className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12"
      >
        <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-[var(--line)]">
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-[var(--ink)] tracking-tight">
            Shop by Category
          </h2>
          <button
            type="button"
            onClick={() => onNavigate({ type: 'shop' })}
            className="text-xs sm:text-sm font-sans font-medium text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer transition-colors"
          >
            All Categories →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {COLLECTIONS.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => onNavigate({ type: 'shop', category: col.categoryFilter })}
              className="group text-left cursor-pointer space-y-2.5 rounded-[var(--r)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
            >
              <div className="relative aspect-[3/4] rounded-[var(--r)] bg-[var(--paper-2)] border border-[var(--line)] overflow-hidden group-hover:border-[var(--accent)]/60 transition-colors">
                <img
                  src={col.image}
                  alt={col.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.fallbackApplied) {
                      img.dataset.fallbackApplied = '1';
                      img.src = '/assets/aistudio/ecell-varsity-jacket_daef387e.png';
                    }
                  }}
                  className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </div>

              <div className="space-y-0.5 px-0.5">
                <h3 className="font-brand text-sm sm:text-[15px] font-medium text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                  {col.title}
                </h3>
                <span className="text-xs font-sans text-[var(--muted)] block">
                  {col.itemCount} Designs
                </span>
              </div>
            </button>
          ))}
        </div>
      </motion.section>

      {/* 4. SEASONAL RELEASES */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={softSpring}
        className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--line)]">
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-[var(--ink)] tracking-tight">
            Popular Releases
          </h2>

          {/* Clean Rounded Filter Switcher */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none rounded-[var(--r-in)] bg-[var(--paper-2)] p-1 border border-[var(--line)]">
            {filterTabs.map((t) => {
              const isSelected = activeTab === t.label;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setActiveTab(t.label)}
                  className={`min-h-[34px] px-3 py-1.5 rounded-[var(--r-sm)] text-xs font-sans font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[var(--ink)] text-[var(--on-ink)] font-semibold shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={(slug) => onNavigate({ type: 'product', slug })}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => onNavigate({ type: 'shop' })}
            className="min-h-[44px] px-6 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] hover:border-[var(--accent)] bg-[var(--paper-card)] font-sans text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] inline-flex items-center gap-2 group cursor-pointer transition-colors"
          >
            <span>View Full Catalog ({products.length} Items)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </motion.section>

      {/* 5. STORE PROMISE / FULFILLMENT STRIP */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={softSpring}
        className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {handoverHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-[var(--r)] border border-[var(--line)] bg-[var(--paper-card)] p-5 flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--accent)] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-brand text-sm font-semibold text-[var(--ink)]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--muted)] font-sans mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* 6. FAQ ACCORDION */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={softSpring}
        className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-[var(--ink)] tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="rounded-[var(--r)] border border-[var(--line)] bg-[var(--paper-card)] divide-y divide-[var(--line)] overflow-hidden">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full text-left font-brand text-sm sm:text-base font-medium text-[var(--ink)] flex items-center justify-between gap-4 cursor-pointer hover:text-[var(--accent)] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-[var(--accent)]' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2.5 text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed font-sans">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>
    </div>
  );
};
