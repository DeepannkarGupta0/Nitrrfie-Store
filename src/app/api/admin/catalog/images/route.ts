import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/server/auth';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const files = form.getAll('files').filter((item): item is File => item instanceof File);
    if (!files.length || files.length > 8) return NextResponse.json({ error: 'Upload between 1 and 8 images.' }, { status: 400 });
    const urls: string[] = [];
    for (const file of files) {
      if (!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type) || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Only JPEG, PNG, WebP or AVIF images up to 5 MB each are allowed.' }, { status: 400 });
      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `catalog/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabaseAdmin.storage.from('designs').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabaseAdmin.storage.from('designs').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return NextResponse.json({ urls });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Image upload failed. Check the designs Storage bucket.' }, { status: 400 });
  }
}
