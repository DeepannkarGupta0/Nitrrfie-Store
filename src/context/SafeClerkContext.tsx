import React, { createContext, useContext, useCallback } from 'react';
import {
  useUser,
  useClerk,
  useAuth,
  SignedIn,
  SignedOut,
  UserButton,
  SignIn,
  SignUp,
} from '@clerk/clerk-react';
import { KeyRound } from 'lucide-react';
import { IS_CLERK_CONFIGURED, RAW_CLERK_PUBLISHABLE_KEY } from '../config/clerk';

type ClerkUserShape = ReturnType<typeof useUser>['user'];

interface SafeClerkContextValue {
  isClerkEnabled: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
  user: ClerkUserShape;
  getToken: () => Promise<string | null>;
  openSignIn: () => void;
  openSignUp: () => void;
  signOut: () => Promise<void>;
}

const SafeClerkContext = createContext<SafeClerkContextValue>({
  isClerkEnabled: false,
  isLoaded: true,
  isSignedIn: false,
  user: null,
  getToken: async () => null,
  openSignIn: () => {},
  openSignUp: () => {},
  signOut: async () => {},
});

const ClerkBridgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const { openSignIn, openSignUp, signOut } = useClerk();

  const safeGetToken = useCallback(async () => {
    try {
      return await getToken();
    } catch {
      return null;
    }
  }, [getToken]);

  return (
    <SafeClerkContext.Provider
      value={{
        isClerkEnabled: true,
        isLoaded,
        isSignedIn: Boolean(isSignedIn),
        user: user ?? null,
        getToken: safeGetToken,
        openSignIn: () => openSignIn(),
        openSignUp: () => openSignUp(),
        signOut: async () => {
          await signOut();
        },
      }}
    >
      {children}
    </SafeClerkContext.Provider>
  );
};

export const SafeClerkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (IS_CLERK_CONFIGURED) {
    return <ClerkBridgeProvider>{children}</ClerkBridgeProvider>;
  }

  return (
    <SafeClerkContext.Provider
      value={{
        isClerkEnabled: false,
        isLoaded: true,
        isSignedIn: false,
        user: null,
        getToken: async () => null,
        openSignIn: () => {},
        openSignUp: () => {},
        signOut: async () => {},
      }}
    >
      {children}
    </SafeClerkContext.Provider>
  );
};

export function useSafeClerkAuth(): SafeClerkContextValue {
  return useContext(SafeClerkContext);
}

export const SafeSignedIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!IS_CLERK_CONFIGURED) return null;
  return <SignedIn>{children}</SignedIn>;
};

export const SafeSignedOut: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!IS_CLERK_CONFIGURED) return <>{children}</>;
  return <SignedOut>{children}</SignedOut>;
};

export const SafeUserButton: React.FC<React.ComponentProps<typeof UserButton>> = (props) => {
  if (!IS_CLERK_CONFIGURED) return null;
  return <UserButton {...props} />;
};

const ClerkUnavailableNotice: React.FC<{ mode: 'signin' | 'signup' }> = ({ mode }) => {
  const hasInvalidKey = Boolean(RAW_CLERK_PUBLISHABLE_KEY);

  return (
    <div className="w-full p-5 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] space-y-3 text-left">
      <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--ink)]">
        <KeyRound className="w-4 h-4 text-[var(--accent)] shrink-0" />
        <span>
          {hasInvalidKey
            ? 'Invalid Clerk Publishable Key Detected'
            : `Clerk ${mode === 'signin' ? 'Sign In' : 'Sign Up'} Not Configured`}
        </span>
      </div>
      <p className="text-xs text-[var(--muted)] leading-relaxed">
        {hasInvalidKey ? (
          <>
            The configured <code className="font-mono text-[var(--accent)]">VITE_CLERK_PUBLISHABLE_KEY</code> is not a valid Clerk publishable key. Replace it with a valid key from your Clerk Dashboard starting with <code className="font-mono text-[var(--ink)]">pk_test_</code> or <code className="font-mono text-[var(--ink)]">pk_live_</code>.
          </>
        ) : (
          <>
            Add a valid <code className="font-mono text-[var(--accent)]">VITE_CLERK_PUBLISHABLE_KEY</code> (<code className="font-mono text-[var(--ink)]">pk_test_...</code> or <code className="font-mono text-[var(--ink)]">pk_live_...</code>) to enable account sign-in and staff authentication.
          </>
        )}
      </p>
      <p className="text-[11px] font-mono text-[var(--muted)]">
        You can continue browsing, customizing, and placing orders via WhatsApp checkout without signing in.
      </p>
    </div>
  );
};

export const SafeSignIn: React.FC<React.ComponentProps<typeof SignIn>> = (props) => {
  if (!IS_CLERK_CONFIGURED) return <ClerkUnavailableNotice mode="signin" />;
  return <SignIn {...props} />;
};

export const SafeSignUp: React.FC<React.ComponentProps<typeof SignUp>> = (props) => {
  if (!IS_CLERK_CONFIGURED) return <ClerkUnavailableNotice mode="signup" />;
  return <SignUp {...props} />;
};
