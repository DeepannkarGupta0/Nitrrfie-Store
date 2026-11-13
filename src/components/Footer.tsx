import React from 'react';
import { ActiveView } from '../types/store';
import {
  Lock,
  Sun,
  Moon,
  ArrowUp,
  ArrowUpRight,
  MapPin,
  Truck,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FooterProps {
  onNavigate: (view: ActiveView) => void;
  withNewsletterAbove?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, withNewsletterAbove = false }) => {
  const { theme, toggleTheme } = useTheme();

  const scrollToTop = () => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  return (
    <footer
      className={`w-full ${
        withNewsletterAbove ? 'mt-0' : 'mt-10 sm:mt-12'
      } border-t border-[var(--line)] bg-[var(--paper-2)] text-[var(--ink-2)] transition-colors duration-200 select-none`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 space-y-12">
        {/* Top Deck: Brand & Navigation Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Brand Summary + Fulfillment Overview */}
          <div className="lg:col-span-5 space-y-6">
            <button
              type="button"
              onClick={() => onNavigate({ type: 'home' })}
              className="inline-flex items-center gap-3.5 cursor-pointer group text-left"
            >
              <div className="w-11 h-11 rounded-[var(--r-in)] bg-white border border-[var(--line-2)] p-0.5 shrink-0 overflow-hidden transition-colors group-hover:border-[var(--accent)]">
                <img
                  src="/assets/aistudio/nitrr_new_logo_new_155e66c7.png"
                  alt="NIT Raipur Seal"
                  className="w-full h-full object-contain rounded-[var(--r-sm)]"
                />
              </div>
              <div>
                <span className="font-brand text-xl font-bold tracking-tight text-[var(--ink)] block transition-colors group-hover:text-[var(--accent)]">
                  NIT Raipur <span className="text-[var(--accent)] italic font-medium">Store</span>
                </span>
                <span className="text-xs text-[var(--muted)] block mt-0.5">
                  Official Campus &amp; Alumni Merchandise
                </span>
              </div>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <div className="p-4 rounded-[var(--r)] bg-[var(--paper-card)] border border-[var(--line)] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
                  <Truck className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span>Pan-India Courier</span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Insured doorstep delivery across 19,000+ PIN codes for alumni and supporters.
                </p>
              </div>

              <div className="p-4 rounded-[var(--r)] bg-[var(--paper-card)] border border-[var(--line)] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
                  <MapPin className="w-4 h-4 text-[var(--ok)] shrink-0" />
                  <span>Campus Pickup</span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Makerspace Desk, Main Building (Mon–Sat, 4:00 PM – 7:30 PM).
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Storefront
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'shop' })}
                    className="text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    Shop All Products
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'shop', category: 'Outerwear' })}
                    className="text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    Outerwear &amp; Hoodies
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'shop', category: 'Campus Essentials' })}
                    className="text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    Campus Essentials
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'customize', slug: 'ecell-varsity-bomber-jacket' })}
                    className="text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Customizer Studio</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Customer Care
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'support' })}
                    className="text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    Shipping &amp; Delivery
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'cart' })}
                    className="text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    Shopping Bag
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'profile', section: 'wishlist' })}
                    className="text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    Profile &amp; Wishlist
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'privacy' })}
                    className="text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Operations
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'admin' })}
                    className="text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-[var(--muted)]" />
                    <span>Staff Operations Portal</span>
                  </button>
                </li>
                <li>
                  <a
                    href="https://nitrrfie.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors inline-flex items-center gap-1"
                  >
                    <span>NITRRFIE Portal</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Utility Row */}
        <div className="pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <p className="text-center sm:text-left">
            © 2026 National Institute of Technology Raipur · NITRRFIE. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-in)] border border-[var(--line-2)] hover:border-[var(--accent)] text-[var(--ink)] transition-colors cursor-pointer text-xs font-medium bg-[var(--paper-card)]"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={scrollToTop}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r-in)] bg-[var(--paper-card)] border border-[var(--line-2)] hover:border-[var(--accent)] text-[var(--ink)] text-xs font-medium hover:text-[var(--accent)] transition-colors cursor-pointer group"
              aria-label="Scroll back to top of page"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform text-[var(--accent)]" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
