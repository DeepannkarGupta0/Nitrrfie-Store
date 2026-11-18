'use client';

import { HandleSSOCallback } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SSOCallbackPage() {
  const router = useRouter();

  function getGoogleCompleteUrl() {
    const query = typeof window === 'undefined' ? '' : window.location.search;
    return `/auth/google-complete${query}`;
  }

  return (
    <HandleSSOCallback
      navigateToApp={({ decorateUrl }) => {
        const destination = decorateUrl(getGoogleCompleteUrl());
        if (destination.startsWith('http')) {
          window.location.href = destination;
        } else {
          router.replace(destination);
        }
      }}
      navigateToSignUp={() => router.replace(getGoogleCompleteUrl())}
      navigateToSignIn={() => router.replace('/sign-in')}
    />
  );
}
