import React, { useEffect, useState, useCallback } from 'react';
import {
  User,
  LogIn,
  LogOut,
  ShoppingBag,
  Truck,
  Sun,
  Moon,
  Lock,
  Heart,
  RefreshCw,
  Package,
  AlertCircle,
} from 'lucide-react';
import { ActiveView, Order } from '../types/store';
import { useSafeClerkAuth } from '../context/SafeClerkContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useCart } from '../context/CartContext';
import { CurrencyCode, formatINR } from '../utils/cartLogic';
import { apiFetchMyOrders } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { WishlistSection } from '../components/WishlistSection';

interface ProfileViewProps {
  initialSection?: 'wishlist';
  onNavigate: (view: ActiveView) => void;
  onOpenAuth: () => void;
}

const CURRENCIES: Array<{ code: CurrencyCode; label: string }> = [
  { code: 'INR', label: 'INR (₹)' },
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'JPY', label: 'JPY (¥)' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  initialSection,
  onNavigate,
  onOpenAuth,
}) => {
  const { isClerkEnabled, isSignedIn, user, signOut, getToken } = useSafeClerkAuth();
  const { isStaffAuthorized, adminUser } = useAdminAuth();
  const {
    wishlist,
    totals,
    currency,
    setCurrency,
    setIsTrackOpen,
    setIsCartDrawerOpen,
  } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const loadMyOrders = useCallback(async () => {
    if (!isSignedIn) {
      setMyOrders([]);
      setOrdersError(null);
      return;
    }
    setOrdersLoading(true);
    setOrdersError(null);
    let token = await getToken();
    if (!token) {
      await new Promise((r) => setTimeout(r, 450));
      token = await getToken();
    }
    if (!token) {
      setOrdersLoading(false);
      setOrdersError('Authentication token unavailable. Please refresh or sign in again.');
      return;
    }
    const res = await apiFetchMyOrders(token);
    if (res.success && res.orders) {
      setMyOrders(res.orders);
    } else {
      setOrdersError(res.error || 'Unable to load your order history.');
    }
    setOrdersLoading(false);
  }, [isSignedIn, getToken]);

  useEffect(() => {
    void loadMyOrders();
  }, [loadMyOrders]);

  useEffect(() => {
    if (initialSection === 'wishlist') {
      const target = document.getElementById('wishlist');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [initialSection]);

  const email = user?.primaryEmailAddress?.emailAddress || '';
  const displayName =
    user?.fullName ||
    user?.firstName ||
    (email ? email.split('@')[0] : '') ||
    'Guest Shopper';

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Signed out successfully.', 'info');
    } catch {
      showToast('Unable to complete sign out right now.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10">
      {/* Page Title */}
      <div className="space-y-1.5 border-b border-[var(--line)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-sans font-medium text-[var(--accent)] block">
            NIT Raipur Store
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-normal text-[var(--ink)] tracking-tight">
            User Profile
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] font-sans max-w-xl">
            Manage your account details, storefront preferences, and saved wishlist items.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="#wishlist"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('wishlist')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="min-h-[40px] px-3.5 py-2 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-card)] hover:bg-[var(--paper-2)] text-xs font-sans font-medium text-[var(--ink)] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Heart className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Wishlist ({wishlist.length})</span>
          </a>

          <button
            type="button"
            onClick={() => setIsTrackOpen(true)}
            className="min-h-[40px] px-3.5 py-2 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-card)] hover:bg-[var(--paper-2)] text-xs font-sans font-medium text-[var(--ink)] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Truck className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>Track Order</span>
          </button>
        </div>
      </div>

      {/* Account Overview & Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Identity Card */}
        <div className="lg:col-span-7 rounded-[var(--r)] border border-[var(--line)] bg-[var(--paper-card)] p-6 flex flex-col justify-between gap-6 shadow-[var(--shadow-1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-[var(--line-2)] bg-[var(--paper-2)] flex items-center justify-center shrink-0">
                {isSignedIn && user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-[var(--muted)]" />
                )}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                  <span>{isSignedIn ? 'Verified Account' : 'Guest Session'}</span>
                  {isStaffAuthorized && adminUser && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[var(--ok)] font-medium">{adminUser.roleTitle}</span>
                    </>
                  )}
                </div>
                <h2 className="font-brand text-xl font-semibold text-[var(--ink)] truncate">
                  {displayName}
                </h2>
                <p className="text-xs font-mono text-[var(--muted)] truncate">
                  {isSignedIn && email
                    ? email
                    : 'Wishlist & preferences saved locally in your browser'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isSignedIn ? (
                <>
                  {isStaffAuthorized && (
                    <button
                      type="button"
                      onClick={() => onNavigate({ type: 'admin' })}
                      className="min-h-[40px] px-3.5 py-2 rounded-[var(--r-in)] bg-[var(--ink)] hover:bg-[var(--accent-solid)] text-[var(--on-ink)] hover:text-white text-xs font-sans font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Admin Suite</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="min-h-[40px] px-3.5 py-2 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-2)] hover:bg-[var(--bad-soft)] hover:border-[var(--bad-border)] text-[var(--ink)] hover:text-[var(--bad)] text-xs font-sans font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="min-h-[40px] px-4 py-2 rounded-[var(--r-in)] bg-[var(--ink)] hover:bg-[var(--accent-solid)] text-[var(--on-ink)] hover:text-white text-xs font-sans font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isClerkEnabled ? 'Sign In / Register' : 'Account Details'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Account Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[var(--line)]">
            <div className="p-3 rounded-[var(--r-in)] bg-[var(--paper-2)]">
              <span className="text-[11px] font-sans text-[var(--muted)] block">Saved Wishlist</span>
              <span className="text-lg font-mono font-semibold text-[var(--ink)] tabular-nums">
                {wishlist.length}
              </span>
            </div>
            <div className="p-3 rounded-[var(--r-in)] bg-[var(--paper-2)]">
              <span className="text-[11px] font-sans text-[var(--muted)] block">Bag Items</span>
              <span className="text-lg font-mono font-semibold text-[var(--ink)] tabular-nums">
                {totals.itemCount}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="col-span-2 sm:col-span-1 p-3 rounded-[var(--r-in)] bg-[var(--paper-2)] hover:bg-[var(--paper-3)] border border-[var(--line)] text-left transition-colors cursor-pointer flex items-center justify-between gap-2"
            >
              <div>
                <span className="text-[11px] font-sans text-[var(--muted)] block">Quick Action</span>
                <span className="text-xs font-sans font-semibold text-[var(--ink)]">Open Bag</span>
              </div>
              <ShoppingBag className="w-4 h-4 text-[var(--accent)] shrink-0" />
            </button>
          </div>
        </div>

        {/* Storefront Preferences Card */}
        <div className="lg:col-span-5 rounded-[var(--r)] border border-[var(--line)] bg-[var(--paper-card)] p-6 flex flex-col justify-between gap-5 shadow-[var(--shadow-1)]">
          <div className="space-y-1">
            <h2 className="font-brand text-lg font-semibold text-[var(--ink)]">
              Store Preferences
            </h2>
            <p className="text-xs text-[var(--muted)] font-sans">
              Stored locally in your browser alongside your saved wishlist items.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-sans font-medium text-[var(--ink)] block">
                  Theme Appearance
                </span>
                <span className="text-[11px] text-[var(--muted)]">
                  {theme === 'dark' ? 'Dark mode active' : 'Light mode active'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="min-h-[38px] px-3.5 py-1.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-xs font-sans font-medium text-[var(--ink)] inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Switch to Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                    <span>Switch to Dark</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--line)]">
              <div>
                <label
                  htmlFor="profile-currency-select"
                  className="text-xs font-sans font-medium text-[var(--ink)] block"
                >
                  Display Currency
                </label>
                <span className="text-[11px] text-[var(--muted)]">
                  Applied across catalog &amp; bag
                </span>
              </div>
              <select
                id="profile-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="min-h-[38px] px-3 py-1.5 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line-2)] text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Order History (Synced with Centralized Database) */}
      {isSignedIn && (
        <section id="my-orders" className="rounded-[var(--r)] border border-[var(--line)] bg-[var(--paper-card)] p-6 space-y-5 shadow-[var(--shadow-1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
            <div>
              <h2 className="font-brand text-xl font-semibold text-[var(--ink)] flex items-center gap-2">
                <Package className="w-5 h-5 text-[var(--accent)]" />
                <span>My Order History</span>
              </h2>
              <p className="text-xs text-[var(--muted)] font-sans mt-0.5">
                Orders placed under your account, synchronized live with fulfillment operations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadMyOrders()}
              className="min-h-[36px] px-3 py-1.5 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-xs font-mono font-medium text-[var(--ink)] inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </button>
          </div>

          {ordersError && (
            <div className="p-3.5 rounded-[var(--r-in)] bg-[var(--bad-soft)] border border-[var(--bad-border)] text-xs text-[var(--bad)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {typeof ordersError === 'string'
                  ? ordersError
                  : 'Unable to load your order history right now.'}
              </span>
            </div>
          )}

          {ordersLoading && myOrders.length === 0 ? (
            <p className="text-xs text-[var(--muted)] font-mono py-4">Loading your orders...</p>
          ) : myOrders.length === 0 ? (
            <div className="py-6 text-center space-y-2 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)]">
              <p className="text-xs text-[var(--muted)] font-sans">
                No orders found for this account yet. You can also track guest orders by Order ID or Phone.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-2)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--ink)]">{order.id}</span>
                      <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-[10px] font-mono font-semibold uppercase bg-[var(--paper)] border border-[var(--line)] text-[var(--ink)]">
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-[var(--r-pill)] text-[10px] font-mono font-semibold uppercase border ${
                          order.paymentStatus === 'paid'
                            ? 'bg-[var(--ok-soft)] text-[var(--ok)] border-[var(--ok-border)]'
                            : 'bg-[var(--warn-soft)] text-[var(--warn)] border-[var(--warn-border)]'
                        }`}
                      >
                        {order.paymentStatus === 'paid' ? 'Payment Verified' : order.paymentStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)] truncate">
                      {order.items.map((i) => `${i.quantity}x ${i.name} (${i.size})`).join(', ')}
                    </p>
                    <p className="text-[11px] font-mono text-[var(--muted)]">
                      Placed {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className="font-mono text-sm font-bold text-[var(--ink)] tabular-nums">
                      {formatINR(order.total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsTrackOpen(true)}
                      className="px-3 py-1.5 rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--paper-3)] text-xs font-mono font-medium text-[var(--ink)] cursor-pointer"
                    >
                      Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Dedicated User Profile Wishlist Section */}
      <WishlistSection onNavigate={onNavigate} />
    </div>
  );
};
