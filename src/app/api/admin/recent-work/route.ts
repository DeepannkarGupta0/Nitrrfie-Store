import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireSuperAdmin } from '@/server/auth';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const limit = Math.min(200, Math.max(10, Number(request.nextUrl.searchParams.get('limit') || 100)));
    const { data, error } = await supabaseAdmin.from('admin_activity_logs')
      .select('id,actor_user_id,actor_email,actor_name,action,entity_type,entity_id,entity_name,details,created_at')
      .order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return NextResponse.json({ activities: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load recent work' }, { status: 403 });
  }
}
