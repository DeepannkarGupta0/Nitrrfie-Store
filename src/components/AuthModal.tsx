import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  Lock,
  LogOut,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  RotateCcw,
  Heart,
} from 'lucide-react';
import { CLERK_ACCOUNTS_URL } from '../config/clerk';
import { useSafeClerkAuth, SafeSignIn, SafeSignUp } from '../context/SafeClerkContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { getClerkAppearance } from '../config/clerkAppearance';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToProfile?: () => void;
}

class AuthWidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry: () => void },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode; onRetry: () => void }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorMsg: error?.message || 'Unable to load authentication form.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-5 bg-[var(--paper-2)] border border-[var(--line)] space-y-3 text-left">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--bad)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Authentication Widget Error</span>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">{this.state.errorMsg}</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, errorMsg: '' });
              this.props.onRetry();
            }}
            className="min-h-[40px] px-4 py-2 bg-[var(--ink)] text-[var(--on-ink)] hover:bg-[var(--accent-solid)] hover:text-white font-mono text-xs uppercase tracking-wider font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors rounded-[var(--r-in)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onNavigateToAdmin,
  onNavigateToProfile,
}) => {
  const { isClerkEnabled, isLoaded, isSignedIn, user, signOut } = useSafeClerkAuth();
  const { isStaffAuthorized } = useAdminAuth();
  const { wishlist } = useCart();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const clerkAppearance = getClerkAppearance(theme, 'accent');

  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [preservedEmail, setPreservedEmail] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [widgetRetryKey, setWidgetRetryKey] = useState(0);
  const wasSignedInRef = useRef(isSignedIn);

  // Close on Escape key & lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Notify cleanly when user completes authentication inside the modal
  useEffect(() => {
    if (!wasSignedInRef.current && isSignedIn && user) {
      const name = user.firstName || user.fullName || user.primaryEmailAddress?.emailAddress || 'there';
      showToast(`Signed in as ${name}`, 'success');
    }
    wasSignedInRef.current = isSignedIn;
  }, [isSignedIn, user, showToast]);

  // Capture typed email / identifier so switching between Sign In and Create Account preserves it
  const handleEmailInputCapture = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLInputElement | null;
    if (!target || target.tagName !== 'INPUT') return;
    if (
      target.type === 'email' ||
      target.name === 'identifier' ||
      target.name === 'emailAddress'
    ) {
      setPreservedEmail(target.value);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      showToast('Signed out successfully.', 'info');
    } catch {
      showToast('Could not complete sign out. Please try again.', 'error');
    } finally {
      setIsSigningOut(false);
    }
  };

  const email = user?.primaryEmailAddress?.emailAddress || '';
  const displayName = user?.fullName || user?.firstName || email.split('@')[0] || 'Customer';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Account Authentication"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--paper)] rounded-[var(--r)] max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[var(--line)] relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Header Bar */}
            <div className="sticky top-0 z-10 bg-[var(--paper)]/95 backdrop-blur-xs p-4 sm:p-5 border-b border-[var(--line)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-[var(--r-in)] bg-[var(--ink-paper)] text-[var(--accent)] font-brand font-black text-sm flex items-center justify-center border border-[var(--line-2)] shrink-0">
                  NIT
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-brand font-black text-[var(--ink)] tracking-tight truncate">
                    NIT Raipur Account Portal
                  </h2>
                  <span className="text-[10px] font-mono text-[var(--muted)] block">
                    {isClerkEnabled ? 'Powered by Clerk' : 'Guest Checkout Available'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {CLERK_ACCOUNTS_URL && (
                  <a
                    href={`${CLERK_ACCOUNTS_URL}/${authTab === 'signup' ? 'sign-up' : 'sign-in'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[36px] px-2.5 py-1.5 text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--paper-2)] hover:bg-[var(--paper)] rounded-[var(--r-in)] transition-colors text-[10px] font-mono font-semibold inline-flex items-center gap-1 border border-[var(--line)]"
                    title="Open Clerk authentication in a standalone browser tab"
                  >
                    <span>Full Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="min-w-[36px] min-h-[36px] p-1.5 text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--paper-2)] hover:bg-[var(--paper)] rounded-[var(--r-in)] transition-colors cursor-pointer border border-[var(--line)] inline-flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {!isLoaded ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                  <p className="text-xs font-mono text-[var(--muted)]">
                    Loading authentication session...
                  </p>
                </div>
              ) : isSignedIn && user ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-center py-4 space-y-4"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--accent)] mx-auto shadow-md">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-bold text-xl">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--ok)] bg-[var(--ok-soft)] px-2.5 py-0.5 border border-[var(--ok-border)] rounded-[var(--r-sm)]">
                      Active Session
                    </span>
                    <h3 className="font-brand font-bold text-base text-[var(--ink)] mt-2">{displayName}</h3>
                    <p className="text-xs font-mono text-[var(--muted)] mt-0.5">{email}</p>
                  </div>

                  <div className="space-y-2.5 pt-2 max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full min-h-[44px] py-2.5 bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-[var(--r-in)] cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <span>Continue to Store</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {onNavigateToProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToProfile();
                        }}
                        className="w-full min-h-[42px] py-2 bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-[var(--ink)] border border-[var(--line)] font-mono text-xs font-bold uppercase tracking-wider rounded-[var(--r-in)] cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>View Profile &amp; Wishlist ({wishlist.length})</span>
                      </button>
                    )}

                    {isStaffAuthorized && onNavigateToAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToAdmin();
                        }}
                        className="w-full min-h-[42px] py-2 bg-[var(--ink)] text-[var(--on-ink)] hover:bg-[var(--accent-solid)] hover:text-white font-mono text-xs font-bold uppercase tracking-wider rounded-[var(--r-in)] cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Open Staff Operations Portal</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isSigningOut}
                      onClick={handleSignOut}
                      className="w-full min-h-[42px] py-2 bg-[var(--paper-2)] enabled:hover:bg-[var(--paper-3)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--ink-2)] enabled:hover:text-[var(--bad)] border border-[var(--line)] font-mono text-xs font-bold rounded-[var(--r-in)] cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isSigningOut ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5" />
                      )}
                      <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {/* Tab Selector: Sign In vs Sign Up */}
                  <div
                    role="tablist"
                    aria-label="Authentication mode"
                    className="flex bg-[var(--paper-2)] p-1 rounded-[var(--r-in)] border border-[var(--line)] text-xs font-mono font-semibold"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === 'signin'}
                      onClick={() => setAuthTab('signin')}
                      className={`flex-1 min-h-[38px] py-1.5 rounded-[var(--r-in)] transition-all cursor-pointer ${
                        authTab === 'signin'
                          ? 'bg-[var(--paper)] text-[var(--ink)] font-bold shadow-xs'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === 'signup'}
                      onClick={() => setAuthTab('signup')}
                      className={`flex-1 min-h-[38px] py-1.5 rounded-[var(--r-in)] transition-all cursor-pointer ${
                        authTab === 'signup'
                          ? 'bg-[var(--paper)] text-[var(--ink)] font-bold shadow-xs'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {/* Seamless Animated Switch with Preserved Email & Error Boundary */}
                  <div
                    onInputCapture={handleEmailInputCapture}
                    className="flex justify-center w-full py-1"
                  >
                    <AuthWidgetErrorBoundary
                      key={`${authTab}-${widgetRetryKey}`}
                      onRetry={() => setWidgetRetryKey((k) => k + 1)}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={authTab}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                          className="w-full flex justify-center"
                        >
                          {authTab === 'signin' ? (
                            <SafeSignIn
                              key={`signin-${theme}`}
                              routing="hash"
                              signUpUrl="#signup"
                              initialValues={
                                preservedEmail ? { emailAddress: preservedEmail } : undefined
                              }
                              appearance={clerkAppearance}
                            />
                          ) : (
                            <SafeSignUp
                              key={`signup-${theme}`}
                              routing="hash"
                              signInUrl="#signin"
                              initialValues={
                                preservedEmail ? { emailAddress: preservedEmail } : undefined
                              }
                              appearance={clerkAppearance}
                            />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </AuthWidgetErrorBoundary>
                  </div>

                  <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--muted)]">
                    {onNavigateToProfile ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToProfile();
                        }}
                        className="text-[var(--ink)] hover:text-[var(--accent)] font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                      >
                        <Heart className="w-3 h-3 text-[var(--accent)]" />
                        <span>Guest Wishlist ({wishlist.length})</span>
                      </button>
                    ) : (
                      <span>Coordinator / Staff?</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onNavigateToAdmin) onNavigateToAdmin();
                      }}
                      className="text-[var(--accent)] hover:underline font-mono font-semibold inline-flex items-center gap-1 cursor-pointer min-h-[36px]"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Admin Suite →</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
