export interface Colorway {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  club: string;
  clubShort: string;
  category: 'Outerwear' | 'Technical Societies' | 'Campus Essentials' | 'Club Drops' | 'Accessories' | 'Stationery & Gifts' | string;
  price: number;
  originalPrice: number;
  tagline: string;
  description: string;
  image: string;
  secondaryImage?: string;
  badge: string;
  colorways: Colorway[];
  sizes: string[];
  features: string[];
  customizable?: boolean;
  featured?: boolean;
  stock?: number;
  inStock?: boolean;
  version?: number;
  specs?: {
    material?: string;
    gsm?: string;
    fit?: string;
    print?: string;
  };
}

export interface AdminPermissions {
  viewDashboard: boolean;
  updateOrderStatus: boolean;
  verifyPayments: boolean;
  cancelOrders: boolean;
  deleteOrders: boolean;
  manageProducts: boolean;
  deleteProducts: boolean;
  manageCoupons: boolean;
  manageStaff: boolean;
  manageNewsletter: boolean;
}

export interface StaffMember {
  email: string;
  role: 'super_admin' | 'operations_lead' | 'verification_desk' | 'hostel_coordinator';
  roleTitle: string;
  isProtectedOwner?: boolean;
  addedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'operations_lead' | 'verification_desk' | 'hostel_coordinator';
  roleTitle: string;
  department: string;
  avatar?: string;
  token: string;
  lastLogin: string;
  permissions?: AdminPermissions;
}

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  image: string;
  itemCount: number;
  accentColor: string;
  featuredClub: string;
  categoryFilter?: string;
}

export interface CustomDesign {
  text: string;
  placement: 'back_embroidery' | 'chest_crest' | 'sleeve_batch';
  color: string;
  fontSize: number;
}

export interface CartItem {
  cartItemId: string; // unique combo of product id + color + size + custom text
  product: Product;
  selectedColor: Colorway;
  selectedSize: string;
  quantity: number;
  customDesign?: CustomDesign;
  availableStock?: number;
  availabilityStatus?: 'available' | 'out_of_stock' | 'unavailable';
  createdAt?: string;
  updatedAt?: string;
}

export type CartSyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface HydratedCartPayload {
  items: CartItem[];
  version: number;
  updatedAt: string;
  warnings: string[];
  hasStockIssues: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
  customDesign?: CustomDesign;
}

export type HandoverType = 'makerspace_desk' | 'home_delivery' | 'hostel_delivery';

export interface DeliveryAddress {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface Order {
  id: string; // e.g. "NITRR-2026-94821"
  createdAt: string;
  customerName: string;
  rollNumber: string;
  email: string;
  phone: string;
  handoverType: HandoverType;
  deliveryAddress?: DeliveryAddress;
  hostelDetails?: {
    hostelName: string; // e.g. "Hostel H-1 (Sir M. Visvesvaraya Hall)"
    roomNumber: string;
  };
  pickupDeskDetails?: {
    desk: string; // "Innovation Cell / Makerspace Desk, Ground Floor, Main Building"
    timing: string; // "4:00 PM – 7:30 PM (Mon-Sat)"
  };
  items: OrderItem[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string;
  handoverFee: number; // 0 (Free)
  total: number;
  status: 'confirmed' | 'preparing' | 'ready_for_handover' | 'delivered' | 'cancelled';
  paymentMethod: 'upi_razorpay' | 'cash_at_desk';
  paymentStatus: 'paid' | 'pending_verification' | 'pay_on_handover' | 'refunded';
  // Verification checking mechanism
  verificationStatus: 'unverified' | 'utr_submitted' | 'whatsapp_verified' | 'desk_verified';
  utrNumber?: string;
  paymentReceiptImage?: string;
  whatsappVerified?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  version?: number;
  idempotencyKey?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  refundStatus?: 'none' | 'pending' | 'refunded';
  refundAmount?: number;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // percentage (e.g. 10 for 10%) or INR amount (e.g. 150)
  minOrderAmount: number;
  maxDiscount?: number;
  expiresAt?: string;
  isActive: boolean;
  usageCount: number;
  description: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  officerEmail: string;
  action:
    | 'ORDER_CREATED'
    | 'ORDER_STATUS_UPDATE'
    | 'ORDER_CANCELLED'
    | 'PAYMENT_VERIFIED'
    | 'ORDER_DELETED'
    | 'PRODUCT_CREATED'
    | 'PRODUCT_UPDATED'
    | 'PRODUCT_DELETED'
    | 'COUPON_CREATED'
    | 'COUPON_UPDATED'
    | 'COUPON_TOGGLED'
    | 'COUPON_DELETED'
    | 'NEWSLETTER_UPDATED'
    | 'NEWSLETTER_DELETED'
    | 'STOCK_ADJUSTED'
    | 'STAFF_ADDED'
    | 'STAFF_REMOVED'
    | 'STAFF_ROLE_UPDATED';
  targetId?: string;
  details: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  lastDeliveryType: HandoverType;
  lastOrderStatus: Order['status'];
}

export interface AdminDashboardStats {
  totalCount: number;
  confirmedCount: number;
  pendingVerificationCount: number;
  preparingCount: number;
  readyCount: number;
  deliveredCount: number;
  cancelledCount: number;
  hostelDeliveries: number;
  courierDeliveries: number;
  deskPickups: number;
  verifiedPayments: number;
  grossRevenue: number;
  verifiedRevenue: number;
  pendingRevenue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface AdminOperationalAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  targetTab?: string;
}

export interface AdminDashboardPayload {
  orders: Order[];
  stats: AdminDashboardStats;
  products: Product[];
  coupons: Coupon[];
  customers: CustomerSummary[];
  auditLogs: AuditLogEntry[];
  staffRoster: StaffMember[];
  alerts: AdminOperationalAlert[];
  meta: {
    version: number;
    updatedAt: string;
    from?: string | null;
    to?: string | null;
  };
}

export interface PublicTrackedOrder {
  id: string;
  createdAt: string;
  customerName: string;
  rollNumber: string;
  handoverType: HandoverType;
  deliveryAddress?: {
    city: string;
    state: string;
    pincode: string;
  };
  hostelDetails?: {
    hostelName: string;
  };
  items: Array<{
    name: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  total: number;
  status: Order['status'];
  paymentMethod: Order['paymentMethod'];
  paymentStatus: Order['paymentStatus'];
  verificationStatus: Order['verificationStatus'];
  utrNumber?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  consentGiven: boolean;
  consentSource: string;
  confirmationEmailStatus: 'pending' | 'sent' | 'failed';
  confirmationSentAt?: string | null;
  confirmedAt?: string | null;
  brevoContactSynced?: boolean;
  brevoContactSyncedAt?: string | null;
  subscribedAt: string;
  unsubscribedAt?: string | null;
  updatedAt: string;
}

export type ActiveView =
  | { type: 'home' }
  | { type: 'shop'; category?: string; club?: string }
  | { type: 'product'; slug: string }
  | { type: 'cart' }
  | { type: 'checkout' }
  | { type: 'support' }
  | { type: 'privacy' }
  | { type: 'profile'; section?: 'wishlist' }
  | { type: 'customize'; slug: string }
  | { type: 'unsubscribe'; token?: string }
  | { type: 'admin' }
  | { type: 'not-found'; path?: string };
