'use client';

import { useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GoogleCompleteClient() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState('Checking Google account…');

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      router.replace('/sign-in');
      return;
    }

    // Preserve the email-match check used by the existing Google sign-in flow.
    const expectedEmail = (params.get('expectedEmail') || '').toLowerCase().trim();
    const actualEmail = (user.primaryEmailAddress?.emailAddress || '').toLowerCase().trim();

    if (expectedEmail && actualEmail !== expectedEmail) {
      void signOut({ redirectUrl: '/sign-in' });
      return;
    }

    // New Google users must complete the same required account-details step.
    const hasPhone = Boolean(user.unsafeMetadata?.contactPhone);
    const needsSetup = !user.username || !user.passwordEnabled || !hasPhone;

    if (needsSetup) {
      router.replace('/complete-profile');
      return;
    }

    const requestedRedirect = params.get('redirect') || '/';
    const safeRedirect = /^\/[A-Za-z0-9/_-]*$/.test(requestedRedirect)
      ? requestedRedirect
      : '/';
    router.replace(safeRedirect);
  }, [isLoaded, isSignedIn, user, params, router, signOut]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6 text-center text-sm text-slate-600">
      {message}
    </div>
  );
}
