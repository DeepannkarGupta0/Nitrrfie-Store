/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { CartProvider } from './context/CartContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ActiveView } from './types/store';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NewsletterSection } from './components/NewsletterSection';
import { HomeView } from './views/HomeView';
import { QuickViewModal } from './components/QuickViewModal';
import { TrackOrderModal } from './components/TrackOrderModal';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { SplashScreen } from './components/SplashScreen';

const ShopView = lazy(() => import('./views/ShopView').then((m) => ({ default: m.ShopView })));
const ProductDetailView = lazy(() =>
  import('./views/ProductDetailView').then((m) => ({ default: m.ProductDetailView }))
);
const CartView = lazy(() => import('./views/CartView').then((m) => ({ default: m.CartView })));
const CheckoutView = lazy(() =>
  import('./checkout/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
);
const SupportView = lazy(() =>
  import('./views/SupportView').then((m) => ({ default: m.SupportView }))
);
const PrivacyPolicyView = lazy(() =>
  import('./views/PrivacyPolicyView').then((m) => ({ default: m.PrivacyPolicyView }))
);
const CustomizeView = lazy(() =>
  import('./views/CustomizeView').then((m) => ({ default: m.CustomizeView }))
);
const UnsubscribeView = lazy(() =>
  import('./views/UnsubscribeView').then((m) => ({ default: m.UnsubscribeView }))
);
const AdminView = lazy(() => import('./views/AdminView').then((m) => ({ default: m.AdminView })));
const ProfileView = lazy(() =>
  import('./views/ProfileView').then((m) => ({ default: m.ProfileView }))
);
const NotFoundView = lazy(() =>
  import('./views/NotFoundView').then((m) => ({ default: m.NotFoundView }))
);

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] w-full flex items-center justify-center px-4 py-16">
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="w-6 h-6 rounded-full border-2 border-[var(--line-2)] border-t-[var(--accent)] animate-spin" />
      <span className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
        Loading Storefront...
      </span>
    </div>
  </div>
);

function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  const cleaned = pathname.replace(/\/+$/, '');
  return cleaned === '' ? '/' : cleaned;
}

export function parsePathToView(pathname: string, search = '', hash = ''): ActiveView {
  const path = normalizePathname(pathname);
  const params = new URLSearchParams(search);

  if (path === '/' || path === '/index.html') {
    return { type: 'home' };
  }
  if (path === '/shop') {
    return {
      type: 'shop',
      category: params.get('category') || undefined,
      club: params.get('club') || undefined,
    };
  }
  if (path === '/cart') {
    return { type: 'cart' };
  }
  if (path === '/checkout') {
    return { type: 'checkout' };
  }
  if (path === '/support') {
    return { type: 'support' };
  }
  if (path === '/privacy' || path === '/privacy-policy') {
    return { type: 'privacy' };
  }
  if (path === '/profile') {
    return {
      type: 'profile',
      section: hash === '#wishlist' ? 'wishlist' : undefined,
    };
  }
  if (path === '/customize') {
    return {
      type: 'customize',
      slug: params.get('slug') || 'ecell-varsity-bomber-jacket',
    };
  }
  if (path === '/unsubscribe') {
    return {
      type: 'unsubscribe',
      token: params.get('token') || undefined,
    };
  }
  if (path === '/admin') {
    return { type: 'admin' };
  }
  if (path.startsWith('/product/')) {
    const slug = path.slice('/product/'.length).trim();
    if (slug && !slug.includes('/')) {
      return { type: 'product', slug };
    }
    return { type: 'not-found', path: pathname };
  }

  return { type: 'not-found', path: pathname };
}

export default function App() {
  const [currentView, setCurrentView] = useState<ActiveView>(() =>
    parsePathToView(window.location.pathname, window.location.search, window.location.hash)
  );

  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Sync window history and url
  const navigateTo = (view: ActiveView) => {
    setCurrentView(view);
    let newPath = '/';
    if (view.type === 'shop') {
      const qs = new URLSearchParams();
      if (view.category) qs.set('category', view.category);
      if (view.club) qs.set('club', view.club);
      const query = qs.toString();
      newPath = query ? `/shop?${query}` : '/shop';
    } else if (view.type === 'cart') newPath = '/cart';
    else if (view.type === 'checkout') newPath = '/checkout';
    else if (view.type === 'support') newPath = '/support';
    else if (view.type === 'privacy') newPath = '/privacy';
    else if (view.type === 'profile') {
      newPath = view.section === 'wishlist' ? '/profile#wishlist' : '/profile';
    }
    else if (view.type === 'customize') newPath = `/customize?slug=${encodeURIComponent(view.slug)}`;
    else if (view.type === 'unsubscribe') {
      newPath = view.token ? `/unsubscribe?token=${encodeURIComponent(view.token)}` : '/unsubscribe';
    }
    else if (view.type === 'admin') newPath = '/admin';
    else if (view.type === 'product') newPath = `/product/${encodeURIComponent(view.slug)}`;
    else if (view.type === 'not-found') newPath = view.path || '/404';

    try {
      window.history.pushState(null, '', newPath);
    } catch {
      // ignore in iframe
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(
        parsePathToView(window.location.pathname, window.location.search, window.location.hash)
      );
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <ToastProvider>
          <AdminAuthProvider>
            <CartProvider>
              <SplashScreen />

              <div className="min-h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)] font-sans antialiased selection:bg-[var(--accent)] selection:text-white transition-colors duration-200">
                {/* Subtle Viewport Scroll Position Progress Bar */}
                <ScrollProgressBar />

                {/* Navigation Header */}
                <Header
                  currentView={currentView}
                  onNavigate={navigateTo}
                  onOpenAuth={() => setIsAuthOpen(true)}
                />

                {/* Main Content Area with Fixed-Header Clearance & Subtle Spring Page Transitions */}
                <main className="flex-1 w-full pt-[74px] sm:pt-[88px] overflow-x-clip">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={
                        currentView.type +
                        (currentView.type === 'product' ? `-${currentView.slug}` : '') +
                        (currentView.type === 'customize' ? `-${currentView.slug}` : '') +
                        (currentView.type === 'not-found' ? `-${currentView.path || ''}` : '')
                      }
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full"
                    >
                      <Suspense fallback={<RouteLoadingFallback />}>
                        {currentView.type === 'home' && <HomeView onNavigate={navigateTo} />}
                        {currentView.type === 'shop' && (
                          <ShopView
                            initialCategory={currentView.category}
                            initialClub={currentView.club}
                            onNavigate={navigateTo}
                          />
                        )}
                        {currentView.type === 'product' && (
                          <ProductDetailView slug={currentView.slug} onNavigate={navigateTo} />
                        )}
                        {currentView.type === 'customize' && (
                          <CustomizeView initialSlug={currentView.slug} onNavigate={navigateTo} />
                        )}
                        {currentView.type === 'admin' && (
                          <AdminView onNavigate={navigateTo} />
                        )}
                        {currentView.type === 'cart' && <CartView onNavigate={navigateTo} />}
                        {currentView.type === 'checkout' && <CheckoutView onNavigate={navigateTo} />}
                        {currentView.type === 'support' && <SupportView onNavigate={navigateTo} />}
                        {currentView.type === 'privacy' && <PrivacyPolicyView onNavigate={navigateTo} />}
                        {currentView.type === 'profile' && (
                          <ProfileView
                            initialSection={currentView.section}
                            onNavigate={navigateTo}
                            onOpenAuth={() => setIsAuthOpen(true)}
                          />
                        )}
                        {currentView.type === 'unsubscribe' && (
                          <UnsubscribeView token={currentView.token} onNavigate={navigateTo} />
                        )}
                        {currentView.type === 'not-found' && (
                          <NotFoundView missingPath={currentView.path} onNavigate={navigateTo} />
                        )}
                      </Suspense>
                    </motion.div>
                  </AnimatePresence>
                </main>

                {/* Global Modals & Slide-over Drawer */}
                <CartDrawer onNavigate={navigateTo} />
                <QuickViewModal onNavigateToProduct={(slug) => navigateTo({ type: 'product', slug })} />
                <TrackOrderModal />
                <AuthModal
                  isOpen={isAuthOpen}
                  onClose={() => setIsAuthOpen(false)}
                  onNavigateToAdmin={() => navigateTo({ type: 'admin' })}
                  onNavigateToProfile={() => navigateTo({ type: 'profile', section: 'wishlist' })}
                />

                {/* Homepage-Only Newsletter Section Immediately Above Footer */}
                {currentView.type === 'home' && (
                  <NewsletterSection onNavigate={navigateTo} />
                )}

                {/* Site Footer */}
                <Footer
                  onNavigate={navigateTo}
                  withNewsletterAbove={currentView.type === 'home'}
                />
              </div>
            </CartProvider>
          </AdminAuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
