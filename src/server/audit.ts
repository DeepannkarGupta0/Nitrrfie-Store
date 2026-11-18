import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUser } from '@/server/auth';

export async function logAdminActivity(action: string, entityType: string, entityId: string | null, entityName: string, details: Record<string, unknown> = {}) {
  const user = await getCurrentUser();
  const email = user.primaryEmailAddress?.emailAddress ?? '';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || email || user.id;
  const { error } = await supabaseAdmin.from('admin_activity_logs').insert({
    actor_user_id: user.id, actor_email: email, actor_name: name,
    action, entity_type: entityType, entity_id: entityId, entity_name: entityName,
    details,
  });
  if (error) console.error('[admin-audit] Failed to record activity', error.message);
}
