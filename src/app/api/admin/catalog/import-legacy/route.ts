import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/server/auth';
import { netrifyProducts } from '@/data/netrifyProducts';

export async function POST() {
  try {
    await requireAdmin();
    let imported = 0;
    for (const product of netrifyProducts) {
      const categorySlug = product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const { data: category, error: categoryError } = await supabaseAdmin
        .from('catalog_categories')
        .upsert({ name: product.category, slug: categorySlug }, { onConflict: 'slug' })
        .select('id').single();
      if (categoryError) throw categoryError;

      const variants = product.colorways.flatMap((color) => product.sizes.map((size) => ({
        sku: `${product.id}-${color.name}-${size}`.toUpperCase().replace(/[^A-Z0-9-]/g, '-'),
        size, color: color.name, colorHex: color.hex, quantity: 0,
      })));
      const payload = {
        legacy_product_id: product.id, slug: product.slug, sku: product.id.toUpperCase(),
        name: product.name, tagline: product.tagline, description: product.description,
        club: product.club, category_id: category.id, price: product.price,
        original_price: product.originalPrice ?? null, images: [product.image],
        variants, features: product.features, customizable: product.customizable,
        featured: product.featured, status: 'active',
      };
      const { error } = await supabaseAdmin.from('catalog_products')
        .upsert(payload, { onConflict: 'legacy_product_id' });
      if (error) throw error;
      imported++;
    }
    return NextResponse.json({ imported });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Legacy catalogue import failed' }, { status: 500 });
  }
}
