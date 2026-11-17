import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/server/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin.from('templates').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ templates: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load templates' }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const productId = String(form.get('product_id') ?? '').trim();
    const name = String(form.get('name') ?? '').trim();
    const image = form.get('image');
    let placements: unknown;
    let colors: unknown;
    try { placements = JSON.parse(String(form.get('placements') ?? '[]')); colors = JSON.parse(String(form.get('colors') ?? '[]')); }
    catch { return NextResponse.json({ error: 'Invalid template configuration.' }, { status: 400 }); }
    if (!productId || !name || !(image instanceof File) || !image.size || !Array.isArray(placements) || !Array.isArray(colors) || !placements.length || !colors.length) {
      return NextResponse.json({ error: 'Template details, image, at least one placement and one color are required.' }, { status: 400 });
    }
    if (!image.type.startsWith('image/') || image.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Please upload an image smaller than 8 MB.' }, { status: 400 });
    }
    const ext = image.type === 'image/png' ? 'png' : image.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `templates/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage.from('designs').upload(path, Buffer.from(await image.arrayBuffer()), { contentType: image.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data: url } = supabaseAdmin.storage.from('designs').getPublicUrl(path);
    const { data, error } = await supabaseAdmin.from('templates').insert({ product_id: productId, name, placements, colors, is_active: true, base_image_url: url.publicUrl }).select().single();
    if (error) throw error;
    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create template' }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const { id, updates } = await request.json();
    if (typeof id !== 'string' || !updates || typeof updates !== 'object' || Object.keys(updates).some((key) => !['name', 'placements', 'colors', 'is_active'].includes(key))) {
      return NextResponse.json({ error: 'Invalid template update.' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.from('templates').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json({ template: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update template' }, { status: 403 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Template ID is required.' }, { status: 400 });
    const { error } = await supabaseAdmin.from('templates').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to delete template' }, { status: 403 });
  }
}
