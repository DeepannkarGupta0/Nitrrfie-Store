import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/server/auth';
import { logAdminActivity } from '@/server/audit';

export const dynamic = 'force-dynamic';

const allowedTransitions: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['fulfilled', 'cancelled'],
  fulfilled: [],
  cancelled: [],
  failed: [],
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1));
    const pageSize = Math.min(100, Math.max(10, Number(request.nextUrl.searchParams.get('pageSize') || 50)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabaseAdmin
      .from('orders')
      .select('*, payments(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return NextResponse.json({ orders: data ?? [], page, pageSize, total: count ?? 0, hasMore: (count ?? 0) > to + 1 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load orders' }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const orderId = typeof body.orderId === 'string' ? body.orderId : '';
    const status = typeof body.status === 'string' ? body.status : '';
    if (!orderId || !Object.prototype.hasOwnProperty.call(allowedTransitions, status)) {
      return NextResponse.json({ error: 'Invalid order update' }, { status: 400 });
    }

    const { data: before, error: readError } = await supabaseAdmin
      .from('orders')
      .select('id, status, items, payment_id')
      .eq('id', orderId)
      .single();
    if (readError || !before) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!allowedTransitions[before.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change an order from ${before.status} to ${status}.` },
        { status: 409 }
      );
    }

    // An order can only be marked paid when it has a corresponding payment record.
    if (status === 'paid') {
      if (!before.payment_id) {
        return NextResponse.json({ error: 'This order has no payment record to verify.' }, { status: 409 });
      }
      const { data: paymentRecord, error: paymentReadError } = await supabaseAdmin
        .from('payments').select('id').eq('id', before.payment_id).maybeSingle();
      if (paymentReadError) throw paymentReadError;
      if (!paymentRecord) {
        return NextResponse.json({ error: 'The payment record for this order could not be found.' }, { status: 409 });
      }
    }

    // Compare-and-set prevents two admins from applying conflicting transitions.
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('status', before.status)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Order status changed. Refresh and try again.' }, { status: 409 });
    }

    if (status === 'paid' && before.payment_id) {
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .update({ status: 'captured', verified: true })
        .eq('id', before.payment_id);
      if (paymentError) {
        await supabaseAdmin.from('orders').update({ status: before.status }).eq('id', orderId).eq('status', status);
        throw paymentError;
      }
    }

    if (status === 'cancelled') {
      const { error: releaseError } = await supabaseAdmin.rpc('release_inventory', {
        p_items: (before.items ?? []).map((item: { id?: string; quantity?: number }) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      });
      if (releaseError) {
        await supabaseAdmin.from('orders').update({ status: before.status }).eq('id', orderId).eq('status', status);
        throw releaseError;
      }
    }

    await logAdminActivity('status_changed','order',orderId,orderId,{from:before.status,to:status});
    return NextResponse.json({ order: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update order' }, { status: 403 });
  }
}
