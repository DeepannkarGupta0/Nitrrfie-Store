import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { requireSuperAdmin } from '@/server/auth';
import { logAdminActivity } from '@/server/audit';

export async function GET() {
  try {
    await requireSuperAdmin();
    const client = await clerkClient();
    const result = await client.users.getUserList({ limit: 100 });
    const admins = result.data.filter((user) => ['admin', 'super_admin'].includes(String(user.publicMetadata.role ?? ''))).map((user) => ({ id: user.id, email: user.primaryEmailAddress?.emailAddress ?? '', role: String(user.publicMetadata.role ?? 'admin') }));
    return NextResponse.json({ admins });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Forbidden' }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const { email } = await request.json();
    if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    const client = await clerkClient();
    const result = await client.users.getUserList({ emailAddress: [email.toLowerCase().trim()], limit: 1 });
    const user = result.data[0];
    if (!user) return NextResponse.json({ error: 'This person must create a normal store account first.' }, { status: 404 });
    if (user.primaryEmailAddress?.verification?.status !== 'verified') return NextResponse.json({ error: 'The account email must be verified before admin access can be granted.' }, { status: 400 });
    await client.users.updateUserMetadata(user.id, { publicMetadata: { ...user.publicMetadata, role: 'admin' } });
    await logAdminActivity('admin_added','team_member',user.id,user.primaryEmailAddress?.emailAddress ?? email.toLowerCase().trim(),{role:'admin'});
    return NextResponse.json({ success: true, email: user.primaryEmailAddress?.emailAddress });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to add admin' }, { status: 403 });
  }
}


// Remove administrator privileges. Only a Super Admin may perform this action.
// Super Admin accounts and the currently authenticated account cannot be demoted here.
export async function DELETE(request: NextRequest) {
  try {
    const actorId = await requireSuperAdmin();
    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';

    if (!userId) {
      return NextResponse.json({ error: 'A valid user ID is required.' }, { status: 400 });
    }
    if (userId === actorId) {
      return NextResponse.json({ error: 'You cannot remove your own Super Admin access.' }, { status: 400 });
    }

    const client = await clerkClient();
    const target = await client.users.getUser(userId);
    const targetRole = String(target.publicMetadata.role ?? '').toLowerCase();

    if (targetRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only regular Admin accounts can be removed here. Super Admin accounts are protected.' },
        { status: 403 }
      );
    }

    const { role: _previousRole, ...remainingMetadata } = target.publicMetadata;
    await client.users.updateUserMetadata(userId, {
      publicMetadata: remainingMetadata,
    });
    await logAdminActivity('admin_removed','team_member',userId,target.primaryEmailAddress?.emailAddress ?? userId,{previousRole:targetRole});

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to remove admin access.' },
      { status: 403 }
    );
  }
}
