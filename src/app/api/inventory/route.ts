import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/server/auth';
import { logAdminActivity } from '@/server/audit';
import { netrifyProducts } from '@/data/netrifyProducts';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('inventory').select('product_id, quantity, updated_at');
  if (error) return NextResponse.json({ error: 'Inventory is not initialized. Run the latest Supabase migration.' }, { status: 503 });
  const quantities = Object.fromEntries((data ?? []).map((row) => [row.product_id, row.quantity]));
  return NextResponse.json({ inventory: netrifyProducts.map((product) => ({ productId: product.id, name: product.name, image: product.image, quantity: quantities[product.id] ?? 0 })) });
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const { productId, quantity } = await request.json();
    if (!netrifyProducts.some((product) => product.id === productId) || !Number.isInteger(quantity) || quantity < 0) {
      return NextResponse.json({ error: 'Provide a valid product and non-negative whole-number quantity.' }, { status: 400 });
    }
    const { data: previous } = await supabaseAdmin.from('inventory').select('quantity').eq('product_id',productId).maybeSingle();
    const { data, error } = await supabaseAdmin.from('inventory').upsert({ product_id: productId, quantity, updated_at: new Date().toISOString() }, { onConflict: 'product_id' }).select().single();
    if (error) throw error;
    const productName = netrifyProducts.find((product) => product.id === productId)?.name ?? productId;
    await logAdminActivity('stock_updated','inventory',productId,productName,{from:previous?.quantity ?? 0,to:quantity});
    return NextResponse.json({ item: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update inventory' }, { status: 403 });
  }
}
