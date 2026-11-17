import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/server/auth';
import { logAdminActivity } from '@/server/audit';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
    if (!name || !slug) return NextResponse.json({ error: 'Category name and slug are required.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('catalog_categories').insert({ name, slug, description: String(body.description ?? ''), sort_order: Number(body.sortOrder) || 0 }).select().single();
    if (error) throw error;
    await logAdminActivity('created','category',data.id,data.name,{slug:data.slug});
    return NextResponse.json({ category: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create category' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    if (typeof body.id !== 'string') return NextResponse.json({ error: 'Category ID is required.' }, { status: 400 });
    const name = String(body.name ?? '').trim();
    const slug = String(body.slug ?? '').trim().toLowerCase();
    if (!name || !slug) return NextResponse.json({ error: 'Category name and slug are required.' }, { status: 400 });
    const { data: oldCategory, error: oldError } = await supabaseAdmin.from('catalog_categories').select('name,slug').eq('id',body.id).single();
    if (oldError || !oldCategory) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    const { data: affected, error } = await supabaseAdmin.rpc('admin_update_category', {
      p_category_id: body.id, p_name: name, p_slug: slug, p_description: String(body.description ?? '')
    });
    if (error) throw error;
    await logAdminActivity('updated','category',body.id,name,{oldName:oldCategory.name,oldSlug:oldCategory.slug,newSlug:slug,productsUpdated:affected});
    const { data } = await supabaseAdmin.from('catalog_categories').select('*').eq('id',body.id).single();
    return NextResponse.json({ category: data, productsUpdated: affected });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update category' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    if (typeof body.id !== 'string') return NextResponse.json({ error: 'Category ID is required.' }, { status: 400 });
    const { data: category, error: lookupError } = await supabaseAdmin.from('catalog_categories').select('id,name,slug').eq('id',body.id).single();
    if (lookupError || !category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    if (category.slug.toLowerCase() === 'reserve') return NextResponse.json({ error: 'The Reserve category is protected.' }, { status: 400 });
    const { data: moved, error } = await supabaseAdmin.rpc('admin_move_category_to_reserve',{p_category_id:body.id});
    if (error) throw error;
    await logAdminActivity('deleted','category',body.id,category.name,{slug:category.slug,productsMovedToReserve:moved});
    return NextResponse.json({ success:true, productsMovedToReserve:moved });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to delete category' }, { status: 400 });
  }
}
