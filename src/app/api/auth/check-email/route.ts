import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { enforceRateLimit } from '@/lib/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(request, { limit: 5, windowMs: 60_000 });
    const { email } = await request.json();
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    const client = await clerkClient();
    const result = await client.users.getUserList({ emailAddress: [email.toLowerCase().trim()], limit: 1 });
    const user = result.data[0];
    const registered = Boolean(user?.emailAddresses.some((address) => address.emailAddress.toLowerCase() === email.toLowerCase().trim() && address.verification?.status === 'verified'));
    return NextResponse.json({ registered });
  } catch (error) {
    const status = (error as { status?: number })?.status === 429 ? 429 : 500;
    return NextResponse.json({ error: status === 429 ? 'Too many attempts. Please wait a minute and try again.' : 'Unable to check this email right now.' }, { status });
  }
}
