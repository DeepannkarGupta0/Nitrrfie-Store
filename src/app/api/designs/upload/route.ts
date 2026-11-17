import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAuth } from '@/server/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const form = await request.formData();
    const image = form.get('image');
    if (!(image instanceof File) || image.type !== 'image/png' || image.size < 1 || image.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'A PNG design preview smaller than 8 MB is required.' }, { status: 400 });
    }
    const path = `user-designs/${userId}/${crypto.randomUUID()}.png`;
    const { error } = await supabaseAdmin.storage.from('designs').upload(path, Buffer.from(await image.arrayBuffer()), { contentType: 'image/png', upsert: false });
    if (error) throw error;
    const { data } = supabaseAdmin.storage.from('designs').getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to upload design preview' }, { status: 400 });
  }
}
