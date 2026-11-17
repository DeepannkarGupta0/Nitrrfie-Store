import { auth, currentUser } from '@clerk/nextjs/server';
import { AuthenticationError, AuthorizationError } from './errors';

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new AuthenticationError('User not authenticated');
  return userId;
}

export async function getCurrentUser() {
  const user = await currentUser();
  if (!user) throw new AuthenticationError('User not authenticated');
  return user;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  const role = String((user.publicMetadata as { role?: string })?.role ?? '').toLowerCase();
  return role === 'admin' || role === 'super_admin';
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  const role = String((user.publicMetadata as { role?: string })?.role ?? '').toLowerCase();
  if (!['admin', 'super_admin'].includes(role)) throw new AuthorizationError('Admin privileges required');
  return { userId: user.id, role };
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  const role = String((user.publicMetadata as { role?: string })?.role ?? '').toLowerCase();
  if (role !== 'super_admin') throw new AuthorizationError('Super admin privileges required');
  return user.id;
}
