import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  CartItem,
  CartSyncStatus,
  Colorway,
  Order,
  Product,
  HandoverType,
  DeliveryAddress,
  Coupon,
  AuditLogEntry,
  CustomerSummary,
  CustomDesign,
  AdminDashboardStats,
  AdminOperationalAlert,
} from '../types/store';
import { calculateCartTotals, CurrencyCode } from '../utils/cartLogic';
import { PRODUCTS } from '../data/products';
import {
  apiProcessOrder,
  apiVerifyPayment,
  apiBulkVerifyPayments,
  apiDeleteOrder,
  apiCancelOrder,
  apiUpdateOrderStatus,
  apiFetchAdminDashboard,
  apiCreateCoupon,
  apiToggleCoupon,
  apiUpdateCoupon,
  apiDeleteCoupon,
  apiCreateProduct,
  apiUpdateProduct,
  apiAdjustProductStock,
  apiDeleteProduct,
  apiValidateCoupon,
} from '../api/client';
import {
  CLIENT_INSTANCE_ID,
  apiFetchAuthenticatedCart,
  apiMergeGuestCart,
  apiAddCartItem,
  apiUpdateCartItemQuantity,
  apiRemoveCartItem,
  apiClearAuthenticatedCart,
  apiValidateGuestCart,
  apiFetchCatalogProducts,
} from '../api/cartClient';
import { useSafeClerkAuth } from './SafeClerkContext';
import { useAdminAuth } from './AdminAuthContext';
import { useToast } from './ToastContext';

export interface PlaceOrderDetails {
  idempotencyKey?: string;
  customerName: string;
  rollNumber?: string;
  email: string;
  phone: string;
  handoverType: HandoverType;
  deliveryAddress?: DeliveryAddress;
  hostelDetails?: { hostelName: string; roomNumber: string };
  paymentMethod: 'upi_razorpay' | 'cash_at_desk';
  verificationStatus?: Order['verificationStatus'];
  utrNumber?: string;
  paymentReceiptImage?: string;
  whatsappVerified?: boolean;
}

export type AdminSyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface AdminDateRange {
  from?: string;
  to?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  code?: string;
}

interface CartContextType {
  products: Product[];
  catalogError: string | null;
  refreshCatalogProducts: () => Promise<boolean>;
  addProduct: (
    product: Omit<Product, 'id' | 'slug'> & { id?: string; slug?: string }
  ) => Promise<ActionResult & { product?: Product }>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<ActionResult & { product?: Product }>;
  deleteProduct: (id: string) => Promise<ActionResult>;
  adjustProductStock: (productId: string, delta: number) => Promise<ActionResult>;
  items: CartItem[];
  orders: Order[];
  totals: ReturnType<typeof calculateCartTotals>;
  // Cart persistence & sync state
  cartSyncStatus: CartSyncStatus;
  cartSyncError: string | null;
  cartWarnings: string[];
  hasStockIssues: boolean;
  isCartAuthenticated: boolean;
  retryCartSync: () => Promise<void>;
  validateCartForCheckout: () => Promise<{ valid: boolean; warnings: string[] }>;
  // Centralized Admin Dashboard & Live Sync
  adminStats: AdminDashboardStats | null;
  adminAlerts: AdminOperationalAlert[];
  adminSyncStatus: AdminSyncStatus;
  adminSyncError: string | null;
  adminLastSyncedAt: string | null;
  adminDateRange: AdminDateRange;
  setAdminDateRange: React.Dispatch<React.SetStateAction<AdminDateRange>>;
  refreshAdminDashboard: (force?: boolean) => Promise<void>;
  // Coupon Engine
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string; discount: number }>;
  removeCoupon: () => void;
  addCoupon: (coupon: Omit<Coupon, 'usageCount'>) => Promise<ActionResult>;
  toggleCouponActive: (code: string) => Promise<ActionResult>;
  updateCoupon: (
    code: string,
    updates: Partial<Omit<Coupon, 'code' | 'usageCount'>>
  ) => Promise<ActionResult>;
  deleteCoupon: (code: string) => Promise<ActionResult>;
  // Audit Logs & Customers Roster
  auditLogs: AuditLogEntry[];
  getCustomerRoster: () => CustomerSummary[];
  addToCart: (
    product: Product,
    color: Colorway,
    size: string,
    quantity?: number,
    customDesign?: CustomDesign
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<ActionResult>;
  cancelOrder: (orderId: string, cancellationReason: string) => Promise<ActionResult>;
  deleteOrder: (orderId: string) => Promise<ActionResult>;
  verifyOrder: (
    orderId: string,
    options?: { utrNumber?: string; verifiedBy?: string }
  ) => Promise<ActionResult>;
  bulkVerifyOrders: () => Promise<ActionResult & { verifiedCount?: number }>;
  submitOrder: (
    details: PlaceOrderDetails
  ) => Promise<{ success: boolean; order?: Order; error?: string; code?: string }>;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  isTrackOpen: boolean;
  setIsTrackOpen: (open: boolean) => void;
  lastCreatedOrder: Order | null;
  setLastCreatedOrder: (order: Order | null) => void;
  // User preferences
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_STORAGE_KEY = 'nitrr_guest_cart_v1';
const LEGACY_CART_STORAGE_KEY = 'nitrr_store_cart_v1';
const WISHLIST_STORAGE_KEY = 'nitrr_store_wishlist_v1';
const CURRENCY_STORAGE_KEY = 'nitrr_store_currency_v1';

// Legacy keys permanently removed so stale/mock/device-local data can never resurface
const LEGACY_ADMIN_STORAGE_KEYS = [
  'nitrr_store_orders_v1',
  'nitrr_store_products_v2',
  'nitrr_store_coupons_v1',
  'nitrr_store_audit_logs_v1',
  'nitrr_custom_staff_whitelist_v1',
];

function readGuestCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
    const legacy = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (Array.isArray(parsedLegacy)) {
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(parsedLegacy));
        localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
        return parsedLegacy;
      }
    }
    return [];
  } catch {
    return [];
  }
}

function writeGuestCartToStorage(cartItems: CartItem[]) {
  try {
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch {
    // ignore storage quota errors
  }
}

function clearGuestCartStorage() {
  try {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isClerkEnabled, isLoaded, isSignedIn, user, getToken } = useSafeClerkAuth();
  const { isStaffAuthorized, adminUser, setStaffRosterFromServer } = useAdminAuth();
  const { showToast } = useToast();

  const authUserId = isClerkEnabled && isLoaded && isSignedIn && user?.id ? user.id : null;
  const adminEmail = adminUser?.email?.toLowerCase().trim() || '';

  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>(() => readGuestCartFromStorage());
  const [cartSyncStatus, setCartSyncStatus] = useState<CartSyncStatus>('idle');
  const [cartSyncError, setCartSyncError] = useState<string | null>(null);
  const [cartWarnings, setCartWarnings] = useState<string[]>([]);
  const [hasStockIssues, setHasStockIssues] = useState<boolean>(false);

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return Array.from(
        new Set(parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))
      );
    } catch {
      return [];
    }
  });

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode;
      if (saved && ['INR', 'USD', 'EUR', 'GBP', 'JPY'].includes(saved)) return saved;
      return 'INR';
    } catch {
      return 'INR';
    }
  });

  // Centralized SQLite-backed admin operational state (NEVER persisted in browser storage)
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [customersRoster, setCustomersRoster] = useState<CustomerSummary[]>([]);
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null);
  const [adminAlerts, setAdminAlerts] = useState<AdminOperationalAlert[]>([]);
  const [adminSyncStatus, setAdminSyncStatus] = useState<AdminSyncStatus>('idle');
  const [adminSyncError, setAdminSyncError] = useState<string | null>(null);
  const [adminLastSyncedAt, setAdminLastSyncedAt] = useState<string | null>(null);
  const [adminDateRange, setAdminDateRange] = useState<AdminDateRange>({});

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);

  // Concurrency and session refs
  const authUserIdRef = useRef<string | null>(authUserId);
  authUserIdRef.current = authUserId;
  const lastSyncedUserIdRef = useRef<string | null>(null);
  const itemsRef = useRef<CartItem[]>(items);
  itemsRef.current = items;
  const ordersRef = useRef<Order[]>(orders);
  ordersRef.current = orders;
  const cartVersionRef = useRef<number>(0);
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastRefreshAtRef = useRef<number>(0);
  const guestValidatedOnceRef = useRef<boolean>(false);

  const adminMetaVersionRef = useRef<number>(0);
  const lastAdminRefreshAtRef = useRef<number>(0);
  const adminDateRangeRef = useRef<AdminDateRange>(adminDateRange);
  adminDateRangeRef.current = adminDateRange;

  // One-time cleanup of legacy client-side order/inventory/coupon/audit/whitelist caches
  useEffect(() => {
    try {
      for (const key of LEGACY_ADMIN_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const enqueueCartMutation = useCallback((task: () => Promise<void>) => {
    const next = mutationQueueRef.current.then(task, task);
    mutationQueueRef.current = next.catch(() => {});
    return next;
  }, []);

  const applyServerCartPayload = useCallback(
    (payload: {
      items?: CartItem[];
      version?: number;
      warnings?: string[];
      hasStockIssues?: boolean;
    }) => {
      if (Array.isArray(payload.items)) {
        setItems(payload.items);
      }
      if (typeof payload.version === 'number') {
        cartVersionRef.current = payload.version;
      }
      const nextWarnings = Array.isArray(payload.warnings) ? payload.warnings : [];
      setCartWarnings(nextWarnings);
      setHasStockIssues(Boolean(payload.hasStockIssues));
    },
    []
  );

  // Load authoritative product catalog from backend DB & sync live updates across tabs/users
  const refreshCatalogProducts = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiFetchCatalogProducts();
      if (res.ok && res.products) {
        setProducts(res.products);
        setCatalogError(null);
        setQuickViewProduct((prev) =>
          prev ? res.products!.find((p) => p.id === prev.id) || prev : null
        );
        return true;
      } else {
        setCatalogError(res.error || 'Unable to synchronize catalog with the store database.');
        return false;
      }
    } catch (err: any) {
      setCatalogError(err?.message || 'Unable to reach store catalog service.');
      return false;
    }
  }, []);

  useEffect(() => {
    void refreshCatalogProducts();

    let isDisposed = false;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectCatalogSse = () => {
      if (isDisposed || typeof EventSource === 'undefined') return;
      try {
        eventSource = new EventSource('/api/products/events');
        eventSource.addEventListener('catalog_updated', () => {
          void refreshCatalogProducts();
        });
        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!isDisposed && !reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              connectCatalogSse();
            }, 8000);
          }
        };
      } catch {
        // Fallback polling & focus listeners remain active
      }
    };

    connectCatalogSse();

    const pollCatalog = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        void refreshCatalogProducts();
      }
    }, 30000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState !== 'hidden') {
        void refreshCatalogProducts();
      }
    };

    const handleOnline = () => {
      void refreshCatalogProducts();
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      isDisposed = true;
      clearInterval(pollCatalog);
      if (eventSource) eventSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshCatalogProducts]);

  // Persist ONLY guest cart & non-operational UI preferences (wishlist, currency)
  useEffect(() => {
    if (!isLoaded || authUserId) return;
    writeGuestCartToStorage(items);
  }, [items, authUserId, isLoaded]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  // Keep wishlist synchronized across browser tabs via localStorage storage events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== WISHLIST_STORAGE_KEY) return;
      try {
        if (!e.newValue) {
          setWishlist([]);
          return;
        }
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          setWishlist(
            Array.from(
              new Set(
                parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
              )
            )
          );
        }
      } catch {
        // ignore malformed storage updates
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch {
      // ignore
    }
  }, [currency]);

  // --------------------------------------------------------------------------
  // Centralized Admin Dashboard Fetching & Real-Time Cross-Admin Sync
  // --------------------------------------------------------------------------
  const refreshAdminDashboard = useCallback(
    async (force = false) => {
      if (!isStaffAuthorized || !authUserId || !adminEmail) {
        return;
      }

      const now = Date.now();
      if (!force && now - lastAdminRefreshAtRef.current < 1500) {
        return;
      }
      lastAdminRefreshAtRef.current = now;

      setAdminSyncStatus((prev) => (prev === 'idle' ? 'syncing' : prev));

      try {
        const token = await getToken();
        if (!token) {
          setAdminSyncStatus('error');
          setAdminSyncError('Administrative session token unavailable. Please re-authenticate.');
          return;
        }

        const res = await apiFetchAdminDashboard(token, adminEmail, adminDateRangeRef.current);
        if (!res.success || !res.dashboard) {
          setAdminSyncStatus('error');
          setAdminSyncError(res.error || 'Unable to reach centralized store dashboard.');
          return;
        }

        const d = res.dashboard;
        setOrders(d.orders);
        setAdminStats(d.stats);
        setProducts(d.products);
        setCoupons(d.coupons);
        setCustomersRoster(d.customers);
        setAuditLogs(d.auditLogs);
        setAdminAlerts(d.alerts);
        setStaffRosterFromServer(d.staffRoster);
        adminMetaVersionRef.current = d.meta?.version ?? adminMetaVersionRef.current;
        setAdminLastSyncedAt(d.meta?.updatedAt || new Date().toISOString());
        setAdminSyncStatus('synced');
        setAdminSyncError(null);
      } catch (err: any) {
        setAdminSyncStatus('error');
        setAdminSyncError(err?.message || 'Network interruption syncing admin dashboard.');
      }
    },
    [isStaffAuthorized, authUserId, adminEmail, getToken, setStaffRosterFromServer]
  );

  // Clear admin datasets whenever user signs out or loses staff authorization
  useEffect(() => {
    if (!isStaffAuthorized || !authUserId) {
      setOrders([]);
      setCoupons([]);
      setAuditLogs([]);
      setCustomersRoster([]);
      setAdminStats(null);
      setAdminAlerts([]);
      setAdminSyncStatus('idle');
      setAdminSyncError(null);
      setAdminLastSyncedAt(null);
      adminMetaVersionRef.current = 0;
      return;
    }

    void refreshAdminDashboard(true);
  }, [isStaffAuthorized, authUserId, adminDateRange, refreshAdminDashboard]);

  // Real-Time SSE (/api/admin/events) + 8s polling fallback + focus/visibility/online re-sync
  useEffect(() => {
    if (!isStaffAuthorized || !authUserId || !adminEmail) return;

    let isDisposed = false;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectAdminSse = async () => {
      if (isDisposed) return;
      try {
        const token = await getToken();
        if (!token || isDisposed) return;

        const streamUrl = `/api/admin/events?token=${encodeURIComponent(token)}`;

        eventSource = new EventSource(streamUrl);
        eventSource.addEventListener('admin_updated', (evt: MessageEvent) => {
          try {
            const payload = JSON.parse(evt.data);
            if (
              payload?.sourceClientId === CLIENT_INSTANCE_ID &&
              typeof payload?.version === 'number' &&
              payload.version <= adminMetaVersionRef.current
            ) {
              return;
            }
          } catch {
            // refresh anyway
          }
          void refreshAdminDashboard(true);
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!isDisposed && !reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              void connectAdminSse();
            }, 6000);
          }
        };
      } catch {
        // Fallback polling remains active
      }
    };

    void connectAdminSse();

    const pollInterval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        void refreshAdminDashboard(false);
      }
    }, 8000);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'hidden') return;
      void refreshAdminDashboard(false);
    };

    const handleOnline = () => {
      void refreshAdminDashboard(true);
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('online', handleOnline);

    return () => {
      isDisposed = true;
      clearInterval(pollInterval);
      if (eventSource) eventSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('online', handleOnline);
    };
  }, [isStaffAuthorized, authUserId, adminEmail, getToken, refreshAdminDashboard]);

  // --------------------------------------------------------------------------
  // Customer Cart Sync Logic
  // --------------------------------------------------------------------------
  const syncAccountCartOnAuth = useCallback(
    async (targetUserId: string) => {
      setCartSyncStatus('syncing');
      setCartSyncError(null);

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Authentication session token unavailable.');
        }

        const guestItems = readGuestCartFromStorage();
        const response =
          guestItems.length > 0
            ? await apiMergeGuestCart(token, guestItems)
            : await apiFetchAuthenticatedCart(token);

        if (authUserIdRef.current !== targetUserId) return;

        if (!response.ok) {
          throw new Error(response.data?.error || 'Unable to synchronize cart with account.');
        }

        applyServerCartPayload(response.data);
        clearGuestCartStorage();
        lastSyncedUserIdRef.current = targetUserId;
        setCartSyncStatus('synced');
        setCartSyncError(null);

        if (guestItems.length > 0) {
          showToast(
            `Synced ${guestItems.length} item${guestItems.length > 1 ? 's' : ''} from your guest bag to your account.`,
            'success'
          );
        }
        if (Array.isArray(response.data?.warnings) && response.data.warnings.length > 0) {
          showToast(response.data.warnings[0], 'info');
        }
      } catch (err: any) {
        if (authUserIdRef.current !== targetUserId) return;
        setCartSyncStatus('error');
        setCartSyncError(
          err?.message || 'Unable to sync your bag with your account. Please retry.'
        );
      }
    },
    [getToken, applyServerCartPayload, showToast]
  );

  const refreshAuthenticatedCart = useCallback(
    async (force = false) => {
      const currentUid = authUserIdRef.current;
      if (!currentUid) return;

      const now = Date.now();
      if (!force && now - lastRefreshAtRef.current < 1500) return;
      lastRefreshAtRef.current = now;

      try {
        const token = await getToken();
        if (!token || authUserIdRef.current !== currentUid) return;

        const res = await apiFetchAuthenticatedCart(token);
        if (authUserIdRef.current !== currentUid) return;

        if (res.ok) {
          applyServerCartPayload(res.data);
          setCartSyncStatus('synced');
          setCartSyncError(null);
        } else {
          setCartSyncStatus('error');
          setCartSyncError(res.data?.error || 'Failed to refresh account bag.');
        }
      } catch (err: any) {
        if (authUserIdRef.current !== currentUid) return;
        setCartSyncStatus('error');
        setCartSyncError(err?.message || 'Network interruption while syncing bag.');
      }
    },
    [getToken, applyServerCartPayload]
  );

  const retryCartSync = useCallback(async () => {
    const currentUid = authUserIdRef.current;
    if (!currentUid) return;

    const remainingGuest = readGuestCartFromStorage();
    if (remainingGuest.length > 0 || lastSyncedUserIdRef.current !== currentUid) {
      await enqueueCartMutation(() => syncAccountCartOnAuth(currentUid));
    } else {
      await refreshAuthenticatedCart(true);
    }
  }, [enqueueCartMutation, syncAccountCartOnAuth, refreshAuthenticatedCart]);

  useEffect(() => {
    if (!isLoaded) return;

    if (authUserId) {
      if (lastSyncedUserIdRef.current !== authUserId) {
        void enqueueCartMutation(() => syncAccountCartOnAuth(authUserId));
      }
    } else {
      if (lastSyncedUserIdRef.current !== null) {
        lastSyncedUserIdRef.current = null;
        cartVersionRef.current = 0;
        const guest = readGuestCartFromStorage();
        setItems(guest);
        setCartSyncStatus('idle');
        setCartSyncError(null);
        setCartWarnings([]);
        setHasStockIssues(false);
        setAppliedCoupon(null);
      } else if (!guestValidatedOnceRef.current) {
        guestValidatedOnceRef.current = true;
        const guest = readGuestCartFromStorage();
        if (guest.length > 0) {
          apiValidateGuestCart(guest)
            .then((res) => {
              if (!authUserIdRef.current && res.ok) {
                applyServerCartPayload(res.data);
              }
            })
            .catch(() => {});
        }
      }
    }
  }, [isLoaded, authUserId, enqueueCartMutation, syncAccountCartOnAuth, applyServerCartPayload]);

  useEffect(() => {
    if (!authUserId) return;

    let isDisposed = false;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectSse = async () => {
      if (isDisposed || authUserIdRef.current !== authUserId) return;
      try {
        const token = await getToken();
        if (!token || isDisposed || authUserIdRef.current !== authUserId) return;

        eventSource = new EventSource(`/api/cart/events?token=${encodeURIComponent(token)}`);
        eventSource.addEventListener('cart_updated', (evt: MessageEvent) => {
          try {
            const payload = JSON.parse(evt.data);
            if (payload?.sourceClientId && payload.sourceClientId === CLIENT_INSTANCE_ID) {
              return;
            }
            if (typeof payload?.version === 'number' && payload.version <= cartVersionRef.current) {
              return;
            }
            void refreshAuthenticatedCart(true);
          } catch {
            void refreshAuthenticatedCart(true);
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!isDisposed && !reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              void connectSse();
            }, 6000);
          }
        };
      } catch {
        // Fallback focus/interval sync will still run
      }
    };

    void connectSse();

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'hidden') return;
      void refreshAuthenticatedCart(false);
    };

    const handleOnline = () => {
      void retryCartSync();
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('online', handleOnline);

    return () => {
      isDisposed = true;
      if (eventSource) eventSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('online', handleOnline);
    };
  }, [authUserId, getToken, refreshAuthenticatedCart, retryCartSync]);

  const toggleWishlist = (productId: string) => {
    if (!productId) return;
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((id) => id !== productId));
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  // --------------------------------------------------------------------------
  // Admin Product Mutations (Server-Persisted & Broadcast)
  // --------------------------------------------------------------------------
  const addProduct = async (
    newProd: Omit<Product, 'id' | 'slug'> & { id?: string; slug?: string }
  ): Promise<ActionResult & { product?: Product }> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required to create catalog products.' };
    }

    const slug =
      newProd.slug ||
      newProd.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const id = newProd.id || `hlm-prod-${Date.now()}`;
    const product: Product = {
      ...newProd,
      id,
      slug,
      stock: newProd.stock ?? 50,
      inStock: newProd.inStock ?? true,
      colorways: newProd.colorways?.length
        ? newProd.colorways
        : [{ name: 'Standard Black', hex: '#18181b' }],
      sizes: newProd.sizes?.length ? newProd.sizes : ['XS', 'S', 'M', 'L', 'XL'],
      features: newProd.features?.length ? newProd.features : ['Heavyweight Organic Textile'],
    };

    const res = await apiCreateProduct(product, token, adminEmail);
    if (!res.success || !res.product) {
      showToast(res.error || 'Failed to save product on server.', 'error');
      return { success: false, error: res.error };
    }

    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    await Promise.all([refreshCatalogProducts(), refreshAdminDashboard(true)]);
    return { success: true, product: res.product };
  };

  const updateProduct = async (
    id: string,
    updates: Partial<Product>
  ): Promise<ActionResult & { product?: Product }> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required to update products.' };
    }

    const existing = products.find((p) => p.id === id);
    if (!existing) {
      return { success: false, error: 'Product not found in current catalog.' };
    }

    const merged: Product = {
      ...existing,
      ...updates,
      id: existing.id,
      slug: updates.slug || existing.slug,
      version: existing.version,
    };

    const res = await apiUpdateProduct(merged, token, adminEmail);
    if (!res.success || !res.product) {
      if (res.status === 409) {
        await Promise.all([refreshCatalogProducts(), refreshAdminDashboard(true)]);
      }
      showToast(res.error || 'Failed to update product on server.', 'error');
      return { success: false, error: res.error, code: res.code };
    }

    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    await Promise.all([refreshCatalogProducts(), refreshAdminDashboard(true)]);
    return { success: true, product: res.product };
  };

  const deleteProduct = async (id: string): Promise<ActionResult> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required to delete products.' };
    }

    const res = await apiDeleteProduct(id, token, adminEmail);
    if (!res.success) {
      showToast(res.error || 'Failed to delete product.', 'error');
      return { success: false, error: res.error };
    }

    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    await Promise.all([refreshCatalogProducts(), refreshAdminDashboard(true)]);
    return { success: true };
  };

  const adjustProductStock = async (productId: string, delta: number): Promise<ActionResult> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required to adjust stock.' };
    }

    const res = await apiAdjustProductStock(productId, delta, token, adminEmail);
    if (!res.success) {
      showToast(res.error || 'Failed to update inventory.', 'error');
      return { success: false, error: res.error };
    }

    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    await Promise.all([refreshCatalogProducts(), refreshAdminDashboard(true)]);
    return { success: true };
  };

  // --------------------------------------------------------------------------
  // Cart Line Mutations
  // --------------------------------------------------------------------------
  const addToCart = (
    product: Product,
    color: Colorway,
    size: string,
    quantity = 1,
    customDesign?: CustomDesign
  ) => {
    const availableStock = Math.max(0, product.stock ?? 50);
    if (product.inStock === false || availableStock <= 0) {
      showToast(`"${product.name}" is currently out of stock.`, 'error');
      return;
    }

    const customKey = customDesign ? `-${customDesign.text}-${customDesign.placement}` : '';
    const cartItemId = `${product.id}-${color.name}-${size}${customKey}`;
    const currentUid = authUserIdRef.current;

    if (!currentUid) {
      let stockCapped = false;
      let alreadyMaxed = false;

      setItems((prev) => {
        const existing = prev.find((item) => item.cartItemId === cartItemId);
        if (existing) {
          if (existing.quantity >= availableStock) {
            alreadyMaxed = true;
            return prev;
          }
          const nextQty = Math.min(availableStock, existing.quantity + quantity);
          if (existing.quantity + quantity > availableStock) stockCapped = true;
          return prev.map((item) =>
            item.cartItemId === cartItemId
              ? {
                  ...item,
                  quantity: nextQty,
                  availableStock,
                  availabilityStatus: 'available',
                }
              : item
          );
        }
        const nextQty = Math.min(availableStock, Math.max(1, quantity));
        if (quantity > availableStock) stockCapped = true;
        return [
          ...prev,
          {
            cartItemId,
            product,
            selectedColor: color,
            selectedSize: size,
            quantity: nextQty,
            customDesign,
            availableStock,
            availabilityStatus: 'available',
          },
        ];
      });

      if (alreadyMaxed) {
        showToast(`Maximum available stock (${availableStock}) is already in your bag.`, 'error');
        return;
      }
      if (stockCapped) {
        showToast(`Quantity capped at available stock (${availableStock}).`, 'info');
      }
      setIsCartDrawerOpen(true);
      return;
    }

    setIsCartDrawerOpen(true);
    setCartSyncStatus('syncing');
    setCartSyncError(null);

    void enqueueCartMutation(async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Authentication session expired. Please sign in again.');

        const res = await apiAddCartItem(token, {
          productId: product.id,
          colorName: color.name,
          colorHex: color.hex,
          size,
          quantity,
          customDesign,
        });

        if (res.ok) {
          applyServerCartPayload(res.data);
          setCartSyncStatus('synced');
          setCartSyncError(null);
          if (Array.isArray(res.data?.warnings) && res.data.warnings.length > 0) {
            showToast(res.data.warnings[0], 'info');
          }
        } else if (res.status === 409 || res.status === 404) {
          showToast(res.data?.error || 'Unable to add item due to stock limits.', 'error');
          await refreshAuthenticatedCart(true);
        } else {
          throw new Error(res.data?.error || 'Failed to save item to your account bag.');
        }
      } catch (err: any) {
        const msg = err?.message || 'Network error adding item to account bag.';
        setCartSyncStatus('error');
        setCartSyncError(msg);
        showToast(msg, 'error');
      }
    });
  };

  const removeFromCart = (cartItemId: string) => {
    const currentUid = authUserIdRef.current;

    if (!currentUid) {
      setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
      return;
    }

    setCartSyncStatus('syncing');
    setCartSyncError(null);

    void enqueueCartMutation(async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Authentication session expired. Please sign in again.');

        const res = await apiRemoveCartItem(token, cartItemId);
        if (res.ok) {
          applyServerCartPayload(res.data);
          setCartSyncStatus('synced');
          setCartSyncError(null);
        } else {
          throw new Error(res.data?.error || 'Failed to remove item from account bag.');
        }
      } catch (err: any) {
        const msg = err?.message || 'Network error removing item.';
        setCartSyncStatus('error');
        setCartSyncError(msg);
        showToast(msg, 'error');
      }
    });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    const currentUid = authUserIdRef.current;

    if (!currentUid) {
      let stockError: string | null = null;
      setItems((prev) =>
        prev.map((item) => {
          if (item.cartItemId !== cartItemId) return item;
          const availableStock = Math.max(0, item.product.stock ?? 50);
          if (item.product.inStock === false || availableStock <= 0) {
            stockError = `"${item.product.name}" is out of stock.`;
            return item;
          }
          if (quantity > availableStock) {
            stockError = `Only ${availableStock} unit(s) of "${item.product.name}" are available in stock.`;
            return { ...item, quantity: availableStock };
          }
          return { ...item, quantity };
        })
      );
      if (stockError) showToast(stockError, 'error');
      return;
    }

    setCartSyncStatus('syncing');
    setCartSyncError(null);

    void enqueueCartMutation(async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Authentication session expired. Please sign in again.');

        const res = await apiUpdateCartItemQuantity(token, cartItemId, quantity);
        if (res.ok) {
          applyServerCartPayload(res.data);
          setCartSyncStatus('synced');
          setCartSyncError(null);
        } else if (res.status === 409 || res.status === 404) {
          showToast(res.data?.error || 'Quantity exceeds available stock.', 'error');
          await refreshAuthenticatedCart(true);
        } else {
          throw new Error(res.data?.error || 'Failed to update quantity in account bag.');
        }
      } catch (err: any) {
        const msg = err?.message || 'Network error updating item quantity.';
        setCartSyncStatus('error');
        setCartSyncError(msg);
        showToast(msg, 'error');
      }
    });
  };

  const clearCart = () => {
    const currentUid = authUserIdRef.current;
    if (!currentUid) {
      setItems([]);
      clearGuestCartStorage();
      return;
    }

    setCartSyncStatus('syncing');
    setCartSyncError(null);
    void enqueueCartMutation(async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Authentication session expired.');
        const res = await apiClearAuthenticatedCart(token);
        if (res.ok) {
          applyServerCartPayload(res.data);
          setCartSyncStatus('synced');
          setCartSyncError(null);
        } else {
          throw new Error(res.data?.error || 'Failed to clear account bag.');
        }
      } catch (err: any) {
        setCartSyncStatus('error');
        setCartSyncError(err?.message || 'Network error clearing account bag.');
      }
    });
  };

  const validateCartForCheckout = useCallback(async (): Promise<{
    valid: boolean;
    warnings: string[];
  }> => {
    const currentUid = authUserIdRef.current;
    try {
      let stockValid = true;
      let warnings: string[] = [];
      let nextSubtotal = itemsRef.current.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      if (currentUid) {
        const token = await getToken();
        if (!token) {
          return { valid: false, warnings: ['Please sign in again to verify your bag.'] };
        }
        const res = await apiFetchAuthenticatedCart(token);
        if (!res.ok) {
          return { valid: false, warnings: [res.data?.error || 'Unable to verify bag inventory.'] };
        }
        applyServerCartPayload(res.data);
        warnings = Array.isArray(res.data?.warnings) ? [...res.data.warnings] : [];
        const hasIssues = Boolean(res.data?.hasStockIssues);
        const serverItems: CartItem[] = Array.isArray(res.data?.items) ? res.data.items : [];
        nextSubtotal = serverItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
        stockValid = !hasIssues && serverItems.length > 0;
      } else {
        const currentItems = itemsRef.current;
        if (currentItems.length === 0) return { valid: false, warnings: ['Your bag is empty.'] };
        const res = await apiValidateGuestCart(currentItems);
        if (!res.ok) {
          return {
            valid: false,
            warnings: [res.data?.error || 'Unable to verify live catalog inventory.'],
          };
        }
        applyServerCartPayload(res.data);
        warnings = Array.isArray(res.data?.warnings) ? [...res.data.warnings] : [];
        const serverItems: CartItem[] = Array.isArray(res.data?.items) ? res.data.items : currentItems;
        nextSubtotal = serverItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
        stockValid = !res.data?.hasStockIssues && serverItems.length > 0;
      }

      if (appliedCoupon) {
        const couponRes = await apiValidateCoupon(appliedCoupon.code, nextSubtotal);
        if (!couponRes.valid || !couponRes.coupon) {
          const msg =
            couponRes.message || `Promo code ${appliedCoupon.code} is no longer applicable.`;
          setAppliedCoupon(null);
          showToast(msg, 'info');
          warnings.push(msg);
        } else {
          setAppliedCoupon(couponRes.coupon);
        }
      }

      return { valid: stockValid, warnings };
    } catch {
      return {
        valid: !hasStockIssues && itemsRef.current.length > 0,
        warnings: cartWarnings,
      };
    }
  }, [getToken, applyServerCartPayload, hasStockIssues, cartWarnings, appliedCoupon, showToast]);

  // --------------------------------------------------------------------------
  // Server-Validated Coupons & Admin Operational Actions
  // --------------------------------------------------------------------------
  const applyCoupon = async (
    code: string
  ): Promise<{ success: boolean; message: string; discount: number }> => {
    const rawSubtotal = itemsRef.current.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const res = await apiValidateCoupon(code, rawSubtotal);
    if (!res.valid || !res.coupon) {
      return {
        success: false,
        message: res.message || 'Promo code could not be applied.',
        discount: 0,
      };
    }
    setAppliedCoupon(res.coupon);
    return {
      success: true,
      message: res.message,
      discount: res.discount,
    };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const addCoupon = async (coupon: Omit<Coupon, 'usageCount'>): Promise<ActionResult> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required to create coupons.' };
    }
    const res = await apiCreateCoupon(coupon, token, adminEmail);
    if (!res.success) {
      showToast(res.error || 'Failed to create coupon.', 'error');
      return { success: false, error: res.error };
    }
    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    await refreshAdminDashboard(true);
    return { success: true };
  };

  // Keep applied coupon revalidated whenever bag contents or store data change
  useEffect(() => {
    if (!appliedCoupon) return;
    if (items.length === 0) {
      setAppliedCoupon(null);
      return;
    }

    let cancelled = false;
    const rawSubtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    apiValidateCoupon(appliedCoupon.code, rawSubtotal)
      .then((res) => {
        if (cancelled) return;
        if (!res.valid || !res.coupon) {
          setAppliedCoupon(null);
          showToast(
            res.message || `Promo code ${appliedCoupon.code} is no longer valid and was removed.`,
            'info'
          );
        } else if (
          res.coupon.discountType !== appliedCoupon.discountType ||
          res.coupon.discountValue !== appliedCoupon.discountValue ||
          res.coupon.minOrderAmount !== appliedCoupon.minOrderAmount ||
          res.coupon.maxDiscount !== appliedCoupon.maxDiscount ||
          res.coupon.expiresAt !== appliedCoupon.expiresAt ||
          res.coupon.isActive !== appliedCoupon.isActive
        ) {
          setAppliedCoupon(res.coupon);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [appliedCoupon, items, products, adminLastSyncedAt, showToast]);

  const toggleCouponActive = async (code: string): Promise<ActionResult> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required.' };
    }
    const res = await apiToggleCoupon(code, token, adminEmail);
    if (!res.success) {
      showToast(res.error || 'Failed to update coupon.', 'error');
      return { success: false, error: res.error };
    }
    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    await refreshAdminDashboard(true);
    return { success: true };
  };

  const updateCoupon = async (
    code: string,
    updates: Partial<Omit<Coupon, 'code' | 'usageCount'>>
  ): Promise<ActionResult> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required to update coupons.' };
    }
    const res = await apiUpdateCoupon(code, updates, token, adminEmail);
    if (!res.success) {
      showToast(res.error || 'Failed to update coupon.', 'error');
      return { success: false, error: res.error };
    }
    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    await refreshAdminDashboard(true);
    return { success: true };
  };

  const deleteCoupon = async (code: string): Promise<ActionResult> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required to delete coupons.' };
    }
    const res = await apiDeleteCoupon(code, token, adminEmail);
    if (!res.success) {
      showToast(res.error || 'Failed to delete coupon.', 'error');
      return { success: false, error: res.error };
    }
    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    if (appliedCoupon?.code.toUpperCase() === code.toUpperCase()) {
      setAppliedCoupon(null);
    }
    await refreshAdminDashboard(true);
    return { success: true };
  };

  const getCustomerRoster = useCallback((): CustomerSummary[] => {
    return customersRoster;
  }, [customersRoster]);

  const updateOrderStatus = async (
    orderId: string,
    status: Order['status']
  ): Promise<ActionResult> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required.' };
    }
    const currentOrder = ordersRef.current.find((o) => o.id === orderId);
    const res = await apiUpdateOrderStatus(
      orderId,
      status,
      { expectedVersion: currentOrder?.version },
      token,
      adminEmail
    );
    if (!res.success) {
      if (res.status === 409) {
        await refreshAdminDashboard(true);
      }
      showToast(res.error || 'Unable to update order status.', 'error');
      return { success: false, error: res.error, code: res.code };
    }

    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    if (res.order) {
      setLastCreatedOrder((prev) => (prev && prev.id === orderId ? res.order! : prev));
    }
    await refreshAdminDashboard(true);
    return { success: true };
  };

  const cancelOrder = async (
    orderId: string,
    cancellationReason: string
  ): Promise<ActionResult> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required.' };
    }
    const currentOrder = ordersRef.current.find((o) => o.id === orderId);
    const res = await apiCancelOrder(
      orderId,
      cancellationReason,
      currentOrder?.version,
      token,
      adminEmail
    );
    if (!res.success) {
      if (res.status === 409) {
        await refreshAdminDashboard(true);
      }
      showToast(res.error || 'Unable to cancel order.', 'error');
      return { success: false, error: res.error, code: res.code };
    }

    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    if (res.order) {
      setLastCreatedOrder((prev) => (prev && prev.id === orderId ? res.order! : prev));
    }
    await Promise.all([refreshAdminDashboard(true), refreshCatalogProducts()]);
    showToast(`Order #${orderId} cancelled and inventory restored.`, 'info');
    return { success: true };
  };

  const deleteOrder = async (orderId: string): Promise<ActionResult> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required.' };
    }
    const currentOrder = ordersRef.current.find((o) => o.id === orderId);
    const res = await apiDeleteOrder(orderId, currentOrder?.version, token, adminEmail);
    if (!res.success) {
      if (res.status === 409) {
        await refreshAdminDashboard(true);
      }
      showToast(res.error || 'Failed to delete order.', 'error');
      return { success: false, error: res.error, code: res.code };
    }

    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    setLastCreatedOrder((prev) => (prev && prev.id === orderId ? null : prev));
    await Promise.all([refreshAdminDashboard(true), refreshCatalogProducts()]);
    return { success: true };
  };

  const verifyOrder = async (
    orderId: string,
    options?: { utrNumber?: string; verifiedBy?: string }
  ): Promise<ActionResult> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required to verify payments.' };
    }
    const currentOrder = ordersRef.current.find((o) => o.id === orderId);
    const res = await apiVerifyPayment(
      orderId,
      options?.utrNumber,
      currentOrder?.version,
      token,
      adminEmail
    );
    if (!res.success) {
      if (res.status === 409) {
        await refreshAdminDashboard(true);
      }
      showToast(res.error || 'Payment verification failed.', 'error');
      return { success: false, error: res.error, code: res.code };
    }

    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    if (res.order) {
      setLastCreatedOrder((prev) => (prev && prev.id === orderId ? res.order! : prev));
    }
    await refreshAdminDashboard(true);
    return { success: true };
  };

  const bulkVerifyOrders = async (): Promise<ActionResult & { verifiedCount?: number }> => {
    const token = await getToken();
    if (!token || !adminEmail) {
      return { success: false, error: 'Administrative session required.' };
    }
    const res = await apiBulkVerifyPayments(token, adminEmail);
    if (!res.success) {
      showToast(res.error || 'Bulk payment verification failed.', 'error');
      return { success: false, error: res.error };
    }
    if (typeof res.metaVersion === 'number') {
      adminMetaVersionRef.current = res.metaVersion;
    }
    await refreshAdminDashboard(true);
    return { success: true, verifiedCount: res.verifiedCount ?? 0 };
  };

  // --------------------------------------------------------------------------
  // Genuine Server-Side Checkout Submission (Zero Client Order Fabrication)
  // --------------------------------------------------------------------------
  const calculatedDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const rawSubtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    if (rawSubtotal < appliedCoupon.minOrderAmount) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      const calc = Math.round((rawSubtotal * appliedCoupon.discountValue) / 100);
      return appliedCoupon.maxDiscount ? Math.min(calc, appliedCoupon.maxDiscount) : calc;
    }
    return appliedCoupon.discountValue;
  }, [items, appliedCoupon]);

  const totals = calculateCartTotals(items, calculatedDiscount);

  const submitOrder = async (
    details: PlaceOrderDetails
  ): Promise<{ success: boolean; order?: Order; error?: string; code?: string }> => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) {
      return { success: false, error: 'Your shopping bag is empty.' };
    }

    const token = authUserIdRef.current ? await getToken() : null;
    const res = await apiProcessOrder(
      {
        idempotencyKey: details.idempotencyKey,
        customerName: details.customerName,
        rollNumber: details.rollNumber,
        email: details.email,
        phone: details.phone,
        handoverType: details.handoverType,
        deliveryAddress: details.deliveryAddress,
        hostelDetails: details.hostelDetails,
        couponCode: appliedCoupon?.code,
        discountAmount: totals.discountAmount > 0 ? totals.discountAmount : undefined,
        items: currentItems.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          color: i.selectedColor.name,
          size: i.selectedSize,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.image,
          customDesign: i.customDesign,
        })),
        total: totals.total,
        paymentMethod: details.paymentMethod,
        utrNumber: details.utrNumber,
        paymentReceiptImage: details.paymentReceiptImage,
      },
      token,
      CLIENT_INSTANCE_ID
    );

    if (!res.success || !res.order) {
      if (res.status === 409 || res.status === 400) {
        await refreshCatalogProducts().catch(() => {});
        await validateCartForCheckout().catch(() => {});
      }
      return {
        success: false,
        error: res.error || 'Order could not be processed. Please review your bag.',
        code: res.code,
      };
    }

    const finalOrder = res.order;
    setLastCreatedOrder(finalOrder);

    await refreshCatalogProducts().catch(() => {});
    if (isStaffAuthorized) {
      await refreshAdminDashboard(true).catch(() => {});
    }

    // Server already cleared authenticated DB cart inside createGenuineOrder transaction
    setItems([]);
    setAppliedCoupon(null);
    setCartWarnings([]);
    setHasStockIssues(false);
    if (!authUserIdRef.current) {
      clearGuestCartStorage();
    } else {
      setCartSyncStatus('synced');
    }

    return { success: true, order: finalOrder };
  };

  return (
    <CartContext.Provider
      value={{
        products,
        catalogError,
        refreshCatalogProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustProductStock,
        items,
        orders,
        totals,
        cartSyncStatus,
        cartSyncError,
        cartWarnings,
        hasStockIssues,
        isCartAuthenticated: Boolean(authUserId),
        retryCartSync,
        validateCartForCheckout,
        adminStats,
        adminAlerts,
        adminSyncStatus,
        adminSyncError,
        adminLastSyncedAt,
        adminDateRange,
        setAdminDateRange,
        refreshAdminDashboard,
        coupons,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        addCoupon,
        toggleCouponActive,
        updateCoupon,
        deleteCoupon,
        auditLogs,
        getCustomerRoster,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        updateOrderStatus,
        cancelOrder,
        deleteOrder,
        verifyOrder,
        bulkVerifyOrders,
        submitOrder,
        quickViewProduct,
        setQuickViewProduct,
        isTrackOpen,
        setIsTrackOpen,
        lastCreatedOrder,
        setLastCreatedOrder,
        wishlist,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        clearWishlist,
        isWishlistOpen,
        setIsWishlistOpen,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        currency,
        setCurrency,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
