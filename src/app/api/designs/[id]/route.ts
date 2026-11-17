import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAuth } from '@/server/auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const { data, error } = await supabaseAdmin.from('designs').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Design not found.' }, { status: 404 });
    return NextResponse.json({ design: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load design' }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const { status } = await request.json();
    if (!['draft', 'confirmed', 'ordered'].includes(status)) return NextResponse.json({ error: 'Invalid design status.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('designs').update({ status }).eq('id', id).eq('user_id', userId).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Design not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update design' }, { status: 401 });
  }
}
