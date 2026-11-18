import { redirect } from 'next/navigation';
import { requireAdmin } from '@/server/auth';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  let access: Awaited<ReturnType<typeof requireAdmin>>;
  try { access = await requireAdmin(); } catch { redirect('/'); }
  return <AdminDashboard canManageTeam={access.role === 'super_admin'} />;
}
