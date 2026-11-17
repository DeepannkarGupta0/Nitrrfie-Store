
'use client';

import { SignIn } from '@clerk/nextjs';
import { appearance } from '@/lib/clerkAppearance';

export default function SignInPageClient({
  redirectUrl,
}: {
  redirectUrl: string;
}) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f5f1e9] px-4 py-8">
      <div className="w-full max-w-md">
        <SignIn
          appearance={appearance}
          signUpUrl="/sign-up"
          fallbackRedirectUrl={redirectUrl}
          transferable={false}
        />
      </div>
    </main>
  );
}
