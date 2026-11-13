import type { IncomingMessage, ServerResponse } from 'http';
import type { AdminPermissions, AdminUser, CustomDesign } from '../types/store';

export interface ApiRequest extends IncomingMessage {
  body: any;
  query: Record<string, string | string[]>;
  method?: string;
  originalUrl?: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface ApiResponse extends ServerResponse {
  status: (statusCode: number) => ApiResponse;
  json: (data: any) => ApiResponse;
  send: (body: any) => ApiResponse;
}

export interface CreateOrderPayload {
  idempotencyKey?: string;
  customerName: string;
  rollNumber?: string;
  email: string;
  phone: string;
  handoverType: 'makerspace_desk' | 'home_delivery' | 'hostel_delivery';
  deliveryAddress?: {
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  hostelDetails?: {
    hostelName: string;
    roomNumber: string;
  };
  items: Array<{
    productId: string;
    name: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
    image?: string;
    customDesign?: CustomDesign;
  }>;
  total: number;
  couponCode?: string;
  discountAmount?: number;
  paymentMethod: 'upi_razorpay' | 'cash_at_desk';
  utrNumber?: string;
  paymentReceiptImage?: string;
}

export interface AdminAuthResult {
  authorized: boolean;
  identity?: {
    userId?: string;
    email?: string;
    role: AdminUser['role'];
    roleTitle?: string;
    permissions?: AdminPermissions;
  };
  statusCode?: number;
  error?: string;
}
