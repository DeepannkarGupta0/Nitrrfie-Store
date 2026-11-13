import { CreateOrderPayload, AdminAuthResult } from './types';
import {
  Order,
  Product,
  Coupon,
  StaffMember,
  AdminUser,
  AdminDashboardPayload,
  PublicTrackedOrder,
  NewsletterSubscriber,
} from '../types/store';
import { CLIENT_INSTANCE_ID } from './cartClient';

function isJsonContentType(res: Response): boolean {
  const contentType = res.headers.get('content-type') || '';
  return contentType.toLowerCase().includes('application/json');
}

function buildHeaders(
  token?: string | null,
  _userEmail?: string,
  includeJson = false,
  extraClientId?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Client-Instance-Id': extraClientId || CLIENT_INSTANCE_ID,
  };
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiProcessOrder(
  payload: CreateOrderPayload,
  token?: string | null,
  clientInstanceId?: string
): Promise<{
  success: boolean;
  order?: Order;
  idempotentReplay?: boolean;
  error?: string;
  code?: string;
  status?: number;
}> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: buildHeaders(token, payload.email, true, clientInstanceId),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Server returned status ${res.status}` }));
      return {
        success: false,
        error: err.error || 'Failed to process order on server.',
        code: err.code,
        status: res.status,
      };
    }

    const data = await res.json();
    return {
      success: true,
      order: data.order,
      idempotentReplay: Boolean(data.idempotentReplay),
      status: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error communicating with order server.',
      code: 'NETWORK_ERROR',
    };
  }
}

export async function apiFetchOrders(
  token?: string | null,
  userEmail?: string
): Promise<{ success: boolean; orders?: Order[]; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/orders', {
      method: 'GET',
      headers: buildHeaders(token, userEmail),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
      return { success: false, error: err.error || 'Failed to fetch orders.', status: res.status };
    }

    const data = await res.json();
    return { success: true, orders: data.orders };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error fetching admin orders.' };
  }
}

export async function apiFetchMyOrders(
  token: string | null
): Promise<{ success: boolean; orders?: Order[]; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/orders?scope=mine', {
      method: 'GET',
      headers: buildHeaders(token),
    });

    if (!isJsonContentType(res)) {
      return { success: false, error: 'Order history endpoint returned an unexpected response.' };
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Failed to load your order history (status ${res.status}).`,
        status: res.status,
      };
    }

    return { success: true, orders: Array.isArray(data.orders) ? data.orders : [] };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error fetching your order history.' };
  }
}

export async function apiTrackOrder(query: string): Promise<{
  success: boolean;
  order?: PublicTrackedOrder;
  error?: string;
  status?: number;
}> {
  try {
    const res = await fetch(`/api/orders?track=${encodeURIComponent(query.trim())}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.order) {
      return {
        success: false,
        status: res.status,
        error:
          data?.error ||
          'No matching order found. Please verify your Order ID, Roll Number, or Phone.',
      };
    }
    return { success: true, order: data.order };
  } catch {
    return {
      success: false,
      error: 'Unable to reach order tracking service. Please try again.',
    };
  }
}

export async function apiValidateCoupon(
  code: string,
  subtotal: number
): Promise<{
  valid: boolean;
  discount: number;
  message: string;
  coupon?: Coupon;
}> {
  try {
    const qs = new URLSearchParams({
      action: 'validate_coupon',
      code: code.trim(),
      subtotal: String(Math.max(0, Number(subtotal) || 0)),
    });
    const res = await fetch(`/api/orders?${qs.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        valid: false,
        discount: 0,
        message: data?.error || 'Unable to validate coupon right now.',
      };
    }
    return {
      valid: Boolean(data.valid),
      discount: Number(data.discount ?? data.discountAmount) || 0,
      message:
        data.message ||
        data.error ||
        (data.valid ? 'Coupon applied.' : 'Invalid coupon code.'),
      coupon: data.coupon,
    };
  } catch {
    return {
      valid: false,
      discount: 0,
      message: 'Network error validating promotional code.',
    };
  }
}

export async function apiFetchAdminMe(
  token: string | null,
  userEmail: string
): Promise<{
  success: boolean;
  authorized: boolean;
  identity?: AdminAuthResult['identity'];
  error?: string;
  status?: number;
}> {
  try {
    const res = await fetch('/api/admin?action=me', {
      method: 'GET',
      headers: buildHeaders(token, userEmail),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        authorized: false,
        status: res.status,
        error: data?.error || `Verification failed (status ${res.status}).`,
      };
    }
    return {
      success: true,
      authorized: Boolean(data.authorized),
      identity: data.identity,
    };
  } catch (err: any) {
    return {
      success: false,
      authorized: false,
      error: err?.message || 'Network error checking staff authorization.',
    };
  }
}

export async function apiFetchAdminDashboard(
  token: string | null,
  userEmail: string,
  params?: { from?: string; to?: string }
): Promise<{
  success: boolean;
  dashboard?: AdminDashboardPayload;
  officer?: AdminAuthResult['identity'];
  error?: string;
  status?: number;
}> {
  try {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const query = qs.toString();

    const res = await fetch(`/api/admin${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: buildHeaders(token, userEmail),
    });

    if (!isJsonContentType(res)) {
      return {
        success: false,
        status: res.status,
        error: 'Admin dashboard endpoint returned an unexpected response.',
      };
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.dashboard) {
      return {
        success: false,
        status: res.status,
        error: data?.error || `Failed to load centralized dashboard (status ${res.status}).`,
      };
    }

    return {
      success: true,
      dashboard: data.dashboard,
      officer: data.officer,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error syncing centralized dashboard.',
    };
  }
}

export async function apiVerifyPayment(
  orderId: string,
  utrNumber?: string,
  expectedVersion?: number,
  token?: string | null,
  userEmail?: string
): Promise<{
  success: boolean;
  order?: Order;
  verifiedBy?: string;
  verifiedAt?: string;
  metaVersion?: number;
  error?: string;
  code?: string;
  status?: number;
}> {
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({
        action: 'verify_payment',
        orderId,
        utrNumber,
        expectedVersion,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        code: data?.code,
        error: data?.error || `Payment verification failed (status ${res.status}).`,
      };
    }

    return {
      success: true,
      order: data.order,
      verifiedBy: data.verifiedBy,
      verifiedAt: data.verifiedAt,
      metaVersion: data.metaVersion,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error verifying payment.' };
  }
}

export async function apiBulkVerifyPayments(
  token?: string | null,
  userEmail?: string
): Promise<{
  success: boolean;
  verifiedCount?: number;
  orders?: Order[];
  metaVersion?: number;
  error?: string;
  status?: number;
}> {
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ action: 'bulk_verify_payments' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data?.error || `Bulk verification failed (status ${res.status}).`,
      };
    }
    return {
      success: true,
      verifiedCount: data.verifiedCount ?? 0,
      orders: data.orders,
      metaVersion: data.metaVersion,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error verifying payments.' };
  }
}

export async function apiUpdateOrderStatus(
  orderId: string,
  status: Order['status'],
  opts: { cancellationReason?: string; expectedVersion?: number } = {},
  token?: string | null,
  userEmail?: string
): Promise<{
  success: boolean;
  order?: Order;
  metaVersion?: number;
  error?: string;
  code?: string;
  status?: number;
}> {
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({
        action: status === 'cancelled' ? 'cancel_order' : 'update_order_status',
        orderId,
        status,
        cancellationReason: opts.cancellationReason,
        expectedVersion: opts.expectedVersion,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        code: data?.code,
        error: data?.error || `Failed to update order status (status ${res.status}).`,
      };
    }
    return { success: true, order: data.order, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error updating order status.' };
  }
}

export async function apiCancelOrder(
  orderId: string,
  cancellationReason: string,
  expectedVersion?: number,
  token?: string | null,
  userEmail?: string
) {
  return apiUpdateOrderStatus(
    orderId,
    'cancelled',
    { cancellationReason, expectedVersion },
    token,
    userEmail
  );
}

export async function apiDeleteOrder(
  orderId: string,
  expectedVersion?: number,
  token?: string | null,
  userEmail?: string
): Promise<{
  success: boolean;
  metaVersion?: number;
  error?: string;
  code?: string;
  status?: number;
}> {
  try {
    const res = await fetch('/api/admin', {
      method: 'DELETE',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ orderId, expectedVersion }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        code: data?.code,
        error: data?.error || `Failed to delete order (status ${res.status}).`,
      };
    }

    return { success: true, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error deleting order.' };
  }
}

export async function apiCreateCoupon(
  coupon: Omit<Coupon, 'usageCount'>,
  token?: string | null,
  userEmail?: string
): Promise<{ success: boolean; coupon?: Coupon; metaVersion?: number; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ action: 'create_coupon', coupon }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data?.error || `Failed to create coupon (status ${res.status}).`,
      };
    }
    return { success: true, coupon: data.coupon, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error creating coupon.' };
  }
}

export async function apiToggleCoupon(
  code: string,
  token?: string | null,
  userEmail?: string
): Promise<{ success: boolean; coupon?: Coupon; metaVersion?: number; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ action: 'toggle_coupon', code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data?.error || `Failed to update coupon (status ${res.status}).`,
      };
    }
    return { success: true, coupon: data.coupon, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error updating coupon.' };
  }
}

export async function apiUpdateCoupon(
  code: string,
  updates: Partial<Omit<Coupon, 'code' | 'usageCount'>>,
  token?: string | null,
  userEmail?: string
): Promise<{ success: boolean; coupon?: Coupon; metaVersion?: number; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ action: 'update_coupon', code, updates }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data?.error || `Failed to update coupon (status ${res.status}).`,
      };
    }
    return { success: true, coupon: data.coupon, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error updating coupon.' };
  }
}

export async function apiDeleteCoupon(
  code: string,
  token?: string | null,
  userEmail?: string
): Promise<{ success: boolean; deletedCode?: string; metaVersion?: number; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ action: 'delete_coupon', code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data?.error || `Failed to delete coupon (status ${res.status}).`,
      };
    }
    return { success: true, deletedCode: data.deletedCode, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error deleting coupon.' };
  }
}

export async function apiAddStaffMember(
  email: string,
  role: AdminUser['role'],
  token?: string | null,
  userEmail?: string
): Promise<{ success: boolean; staff?: StaffMember; metaVersion?: number; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ action: 'add_staff', email, role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data?.error || `Failed to add staff member (status ${res.status}).`,
      };
    }
    return { success: true, staff: data.staff, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error adding staff member.' };
  }
}

export async function apiUpdateStaffRole(
  email: string,
  role: AdminUser['role'],
  token?: string | null,
  userEmail?: string
): Promise<{ success: boolean; staff?: StaffMember; metaVersion?: number; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ action: 'update_staff_role', email, role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data?.error || `Failed to update staff role (status ${res.status}).`,
      };
    }
    return { success: true, staff: data.staff, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error updating staff role.' };
  }
}

export async function apiRemoveStaffMember(
  email: string,
  token?: string | null,
  userEmail?: string
): Promise<{ success: boolean; removedEmail?: string; metaVersion?: number; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ action: 'remove_staff', email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data?.error || `Failed to remove staff member (status ${res.status}).`,
      };
    }
    return { success: true, removedEmail: data.removedEmail, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error removing staff member.' };
  }
}

export async function apiCreateProduct(
  product: Product,
  token?: string | null,
  userEmail?: string
): Promise<{ success: boolean; product?: Product; metaVersion?: number; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ product }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data?.error || `Failed to create product (status ${res.status}).`,
      };
    }
    return { success: true, product: data.product, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error creating product.' };
  }
}

export async function apiUpdateProduct(
  product: Product,
  token?: string | null,
  userEmail?: string
): Promise<{
  success: boolean;
  product?: Product;
  metaVersion?: number;
  error?: string;
  code?: string;
  status?: number;
}> {
  try {
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ product, expectedVersion: product.version }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        code: data?.code,
        error: data?.error || `Failed to update product (status ${res.status}).`,
      };
    }
    return { success: true, product: data.product, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error updating product.' };
  }
}

export async function apiAdjustProductStock(
  productId: string,
  delta: number,
  token?: string | null,
  userEmail?: string
): Promise<{ success: boolean; product?: Product; metaVersion?: number; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ action: 'adjust_stock', productId, delta }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data?.error || `Failed to adjust product stock (status ${res.status}).`,
      };
    }
    return { success: true, product: data.product, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error adjusting stock.' };
  }
}

export async function apiDeleteProduct(
  productId: string,
  token?: string | null,
  userEmail?: string
): Promise<{ success: boolean; metaVersion?: number; error?: string; status?: number }> {
  try {
    const res = await fetch('/api/products', {
      method: 'DELETE',
      headers: buildHeaders(token, userEmail, true),
      body: JSON.stringify({ productId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data?.error || `Failed to delete product (status ${res.status}).`,
      };
    }
    return { success: true, metaVersion: data.metaVersion };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error deleting product.' };
  }
}

export async function apiSubscribeNewsletter(email: string): Promise<{
  success: boolean;
  status?: 'subscribed' | 'already_subscribed';
  email?: string;
  confirmationEmailSent?: boolean;
  emailDeliveryStatus?: 'sent' | 'failed' | 'already_sent';
  emailError?: string;
  message?: string;
  error?: string;
  code?: string;
}> {
  try {
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!isJsonContentType(res)) {
      return {
        success: false,
        code: 'INVALID_SERVER_RESPONSE',
        error: 'Subscription service is temporarily unavailable. Please try again later.',
      };
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      return {
        success: false,
        code: 'INVALID_SERVER_RESPONSE',
        error: 'Received an invalid response from the subscription service. Please try again.',
      };
    }

    if (!res.ok || data?.success !== true) {
      return {
        success: false,
        code: typeof data?.code === 'string' ? data.code : 'SUBSCRIPTION_FAILED',
        error:
          (typeof data?.message === 'string' && data.message) ||
          (typeof data?.error === 'string' && data.error) ||
          'Unable to complete your subscription right now. Please try again.',
      };
    }

    const deliveryStatus: 'sent' | 'failed' | 'already_sent' =
      data.emailDeliveryStatus === 'failed' || data.emailDeliveryStatus === 'already_sent'
        ? data.emailDeliveryStatus
        : data.confirmationEmailSent === false
        ? 'failed'
        : 'sent';

    const confirmationEmailSent =
      typeof data.confirmationEmailSent === 'boolean'
        ? data.confirmationEmailSent
        : deliveryStatus === 'sent';

    return {
      success: true,
      status: data.status === 'already_subscribed' ? 'already_subscribed' : 'subscribed',
      email: typeof data.email === 'string' ? data.email : email,
      confirmationEmailSent,
      emailDeliveryStatus: deliveryStatus,
      emailError: typeof data.emailError === 'string' ? data.emailError : undefined,
      message: typeof data.message === 'string' ? data.message : undefined,
    };
  } catch {
    return {
      success: false,
      code: 'NETWORK_ERROR',
      error: 'Unable to connect right now. Please check your internet connection and try again.',
    };
  }
}

export async function apiUnsubscribeNewsletter(payload: {
  token?: string;
  email?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/newsletter/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!isJsonContentType(res)) {
      return {
        success: false,
        error: 'Unsubscribe service is temporarily unavailable. Please try again later.',
      };
    }

    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success !== true) {
      return {
        success: false,
        error: data?.message || data?.error || 'Unable to process unsubscribe request.',
      };
    }
    return { success: true, message: data.message };
  } catch {
    return {
      success: false,
      error: 'Network error processing unsubscribe request.',
    };
  }
}

export async function apiFetchNewsletterSubscribers(
  params: { search?: string; status?: 'all' | 'active' | 'unsubscribed' },
  token?: string | null
): Promise<{
  success: boolean;
  subscribers?: NewsletterSubscriber[];
  counts?: { total: number; active: number; unsubscribed: number };
  error?: string;
}> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const qs = new URLSearchParams();
    if (params.search) qs.set('q', params.search);
    if (params.status && params.status !== 'all') qs.set('status', params.status);
    const query = qs.toString();

    const res = await fetch(`/api/newsletter/subscribers${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers,
    });
    if (!isJsonContentType(res)) {
      return { success: false, error: 'Subscribers API returned an unexpected response.' };
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success !== true) {
      return {
        success: false,
        error: data?.message || data?.error || `Failed to load subscribers (status ${res.status}).`,
      };
    }
    return {
      success: true,
      subscribers: data.subscribers,
      counts: data.counts,
    };
  } catch {
    return {
      success: false,
      error: 'Network error fetching newsletter subscribers.',
    };
  }
}

export async function apiUpdateNewsletterSubscriberStatus(
  id: string,
  status: 'active' | 'unsubscribed',
  token?: string | null
): Promise<{ success: boolean; subscriber?: NewsletterSubscriber; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/newsletter/subscribers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    if (!isJsonContentType(res)) {
      return { success: false, error: 'Subscriber API returned an unexpected response.' };
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success !== true) {
      return {
        success: false,
        error: data?.message || data?.error || `Failed to update subscriber (status ${res.status}).`,
      };
    }
    return { success: true, subscriber: data.subscriber };
  } catch {
    return {
      success: false,
      error: 'Network error updating subscriber status.',
    };
  }
}

export async function apiDeleteNewsletterSubscriber(
  id: string,
  token?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/newsletter/subscribers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    });
    if (!isJsonContentType(res)) {
      return { success: false, error: 'Subscriber API returned an unexpected response.' };
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success !== true) {
      return {
        success: false,
        error: data?.message || data?.error || `Failed to delete subscriber (status ${res.status}).`,
      };
    }
    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Network error deleting subscriber.',
    };
  }
}

export async function apiSubmitSupportInquiry(payload: {
  organization: string;
  contactEmail: string;
  estimatedQuantity: number;
  notes: string;
}): Promise<{
  success: boolean;
  inquiry?: {
    id: string;
    organization: string;
    contactEmail: string;
    estimatedQuantity: number;
    createdAt: string;
  };
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: buildHeaders(null, undefined, true),
      body: JSON.stringify(payload),
    });

    if (!isJsonContentType(res)) {
      return {
        success: false,
        error: 'Support inquiry service is temporarily unavailable. Please try again later.',
      };
    }

    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success !== true) {
      return {
        success: false,
        error: data?.error || `Unable to submit inquiry (status ${res.status}).`,
      };
    }

    return {
      success: true,
      inquiry: data.inquiry,
      message: data.message,
    };
  } catch {
    return {
      success: false,
      error: 'Network error submitting bulk inquiry. Please check your connection.',
    };
  }
}

export async function apiFetchSupportInquiries(token?: string | null): Promise<{
  success: boolean;
  inquiries?: Array<{
    id: string;
    organization: string;
    contactEmail: string;
    estimatedQuantity: number;
    notes: string;
    createdAt: string;
  }>;
  error?: string;
}> {
  try {
    const res = await fetch('/api/support', {
      method: 'GET',
      headers: buildHeaders(token),
    });
    if (!isJsonContentType(res)) {
      return { success: false, error: 'Support inquiry endpoint returned an unexpected response.' };
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success !== true) {
      return {
        success: false,
        error: data?.error || `Failed to load bulk inquiries (status ${res.status}).`,
      };
    }
    return { success: true, inquiries: Array.isArray(data.inquiries) ? data.inquiries : [] };
  } catch {
    return { success: false, error: 'Network error fetching bulk inquiries.' };
  }
}
