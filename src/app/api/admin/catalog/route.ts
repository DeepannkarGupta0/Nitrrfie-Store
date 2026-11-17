import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/server/auth';
import { logAdminActivity } from '@/server/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const [{ data: products, error: productError }, { data: categories, error: categoryError }] = await Promise.all([
      supabaseAdmin.from('catalog_products').select('*, catalog_categories(id,name,slug)').order('updated_at', { ascending: false }),
      supabaseAdmin.from('catalog_categories').select('*').order('sort_order').order('name'),
    ]);
    if (productError) throw productError;
    if (categoryError) throw categoryError;
    return NextResponse.json({ products: products ?? [], categories: categories ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load catalogue' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
    const price = Number(body.price);
    if (!name || !slug || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Name, slug, SKU and a valid price are required.' }, { status: 400 });
    }
    let categoryPrefix = 'GENERAL';
    if (body.categoryId) {
      const { data: category, error: categoryError } = await supabaseAdmin.from('catalog_categories').select('slug,name').eq('id', body.categoryId).single();
      if (categoryError || !category) return NextResponse.json({ error: 'Selected category was not found.' }, { status: 400 });
      categoryPrefix = String(category.slug || category.name).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 10) || 'GENERAL';
    }
    const slugPart = slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 18) || 'ITEM';
    const sku = `NITRR-${categoryPrefix}-${slugPart}`;
    const variants = Array.isArray(body.variants) ? body.variants.map((variant: Record<string, unknown>) => {
      const suffix = String(variant.sku || `${variant.size || 'STD'}-${variant.color || 'DEFAULT'}`).toUpperCase().replace(/[^A-Z0-9-]+/g, '-').replace(/^-|-$/g, '');
      return { ...variant, sku: `${sku}-${suffix}` };
    }) : [];
    const payload = {
      name, slug, sku, price: Math.round(price),
      tagline: String(body.tagline ?? ''),
      description: String(body.description ?? ''),
      club: String(body.club ?? ''),
      category_id: body.categoryId || null,
      original_price: body.originalPrice === '' || body.originalPrice == null ? null : Math.round(Number(body.originalPrice)),
      images: Array.isArray(body.images) ? body.images.slice(0, 8) : [],
      variants,
      features: Array.isArray(body.features) ? body.features : [],
      customizable: Boolean(body.customizable),
      featured: Boolean(body.featured),
      status: ['draft', 'active', 'archived'].includes(body.status) ? body.status : 'draft',
    };
    const { data, error } = await supabaseAdmin.from('catalog_products').insert(payload).select('*, catalog_categories(id,name,slug)').single();
    if (error) throw error;
    await logAdminActivity('created','product',data.id,data.name,{sku:data.sku,status:data.status});
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create product';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    if (typeof body.id !== 'string' || !body.id) return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    const allowed = ['name','slug','price','tagline','description','club','category_id','original_price','images','variants','features','customizable','featured','status'] as const;
    const payload: Record<string, unknown> = {};
    for (const key of allowed) if (Object.prototype.hasOwnProperty.call(body, key)) payload[key] = body[key];
    if (typeof payload.name === 'string') payload.name = payload.name.trim();
    if (typeof payload.slug === 'string') payload.slug = payload.slug.trim().toLowerCase();
    if (typeof payload.sku === 'string') payload.sku = payload.sku.trim().toUpperCase();
    if (payload.price !== undefined && (!Number.isFinite(Number(payload.price)) || Number(payload.price) < 0)) return NextResponse.json({ error: 'Invalid price.' }, { status: 400 });
    if (payload.status !== undefined && !['draft','active','archived'].includes(String(payload.status))) return NextResponse.json({ error: 'Invalid product status.' }, { status: 400 });
    const { data: existing, error: existingError } = await supabaseAdmin.from('catalog_products').select('sku').eq('id', body.id).single();
    if (existingError || !existing) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    if (Array.isArray(body.variants)) {
      payload.variants = body.variants.map((variant: Record<string, unknown>) => {
        const raw = String(variant.sku || `${variant.size || 'STD'}-${variant.color || 'DEFAULT'}`);
        const suffix = raw.startsWith(`${existing.sku}-`) ? raw.slice(existing.sku.length + 1) : raw;
        return { ...variant, sku: `${existing.sku}-${suffix.toUpperCase().replace(/[^A-Z0-9-]+/g, '-')}` };
      });
    }
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from('catalog_products').update(payload).eq('id', body.id).select('*, catalog_categories(id,name,slug)').single();
    if (error) throw error;
    await logAdminActivity('updated','product',data.id,data.name,{sku:data.sku,changedFields:Object.keys(payload)});
    return NextResponse.json({ product: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update product' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const action = body.action === 'delete' ? 'delete' : 'archive';
    if (!id) return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    const { data: product, error: lookupError } = await supabaseAdmin.from('catalog_products').select('id,name,sku').eq('id',id).single();
    if (lookupError || !product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    if (action === 'archive') {
      const { data, error } = await supabaseAdmin.from('catalog_products').update({ status:'archived', updated_at:new Date().toISOString() }).eq('id',id).select('id,status').single();
      if (error) throw error;
      await logAdminActivity('archived','product',id,product.name,{sku:product.sku});
      return NextResponse.json({ product:data });
    }

    // Do not hard-delete products referenced by historical orders.
    const [{ data: orderRefs, error: orderError }, { data: inventoryRefs, error: inventoryError }] = await Promise.all([
      supabaseAdmin.from('orders').select('id').contains('items', [{ id }]).limit(1),
      supabaseAdmin.from('inventory').select('product_id').eq('product_id', id).limit(1),
    ]);
    if (orderError) throw orderError;
    if (inventoryError && !/does not exist|relation .*inventory/i.test(inventoryError.message)) throw inventoryError;
    if ((orderRefs ?? []).length || (inventoryRefs ?? []).length) {
      return NextResponse.json({ error:'This product is referenced by order history or inventory. Archive it instead to preserve records.' }, { status:409 });
    }

    const { error: deleteError } = await supabaseAdmin.from('catalog_products').delete().eq('id',id);
    if (deleteError) throw deleteError;
    await logAdminActivity('deleted','product',id,product.name,{sku:product.sku});
    return NextResponse.json({ success:true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to process product action' }, { status: 400 });
  }
}
