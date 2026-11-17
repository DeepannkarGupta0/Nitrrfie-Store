import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAuth } from '@/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const id = request.nextUrl.searchParams.get('id');
    if (id) {
      const { data, error } = await supabaseAdmin.from('designs').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return NextResponse.json({ design: data ?? null });
    }
    const { data, error } = await supabaseAdmin.from('designs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ designs: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load designs' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { user_id: _ignoredUserId, ...design } = body ?? {};
    const { data, error } = await supabaseAdmin.from('designs').insert({ ...design, user_id: userId }).select().single();
    if (error) throw error;
    return NextResponse.json({ design: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save design' }, { status: 400 });
  }
}
