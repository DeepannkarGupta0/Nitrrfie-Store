export interface Product {
  id: string;
  slug: string;
  sku: string;
  store_skus?: Record<string, string>;
  name: string;
  tagline: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
  selectedColorId: string;
  designId?: string;
  designImageUrl?: string;
}

// ─── Design Builder ───────────────────────────────────────────────────────────

export interface PlacementSlot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "image" | "text" | "logo";
  label: string;
}

export interface ColorOption {
  id: string;
  hex: string;
  label: string;
}

export interface Template {
  id: string;
  product_id: string; // matches products.slug
  name: string;
  base_image_url: string;
  placements: PlacementSlot[];
  colors: ColorOption[];
  is_active: boolean;
  created_at: string;
}

export interface DesignConfig {
  template_id: string;
  color: ColorOption;
  placement: PlacementSlot;
}

export interface Design {
  id: string;
  user_id: string;
  template_id: string;
  product_slug: string;
  selected_color: ColorOption;
  selected_placement: PlacementSlot;
  design_config: DesignConfig;
  preview_image_url?: string;
  status: "draft" | "confirmed" | "ordered";
  created_at: string;
}

// ─── Orders & Payments ────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "fulfilled"
  | "failed"
  | "cancelled";

export type PaymentStatus = "created" | "captured" | "failed" | "refunded";

export interface OrderItem {
  slug: string;
  name: string;
  quantity: number;
  price: number;
  selectedSize: string;
  selectedColorId: string;
  designId?: string;
  designImageUrl?: string;
  image?: string;
}

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Payment {
  id: string;
  gateway: string;
  gateway_order_id: string;
  gateway_payment_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  verified: boolean;
  webhook_payload?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  total_amount: number;
  payment_id?: string;
  payments?: Payment;         // joined via Supabase select
  qikink_order_id?: string;
  qikink_response?: Record<string, unknown>;
  retry_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ErrorLog {
  id: string;
  context: string;
  severity: "info" | "warn" | "error" | "critical";
  message: string;
  payload?: Record<string, unknown>;
  user_id?: string;
  order_id?: string;
  created_at: string;
}