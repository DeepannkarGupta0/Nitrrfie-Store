import React from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useSafeClerkAuth, SafeSignIn } from '../../context/SafeClerkContext';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  AlertCircle,
  UserCheck,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { ActiveView } from '../../types/store';
import { CLERK_ACCOUNTS_URL } from '../../config/clerk';
import { useTheme } from '../../context/ThemeContext';
import { getClerkAppearance } from '../../config/clerkAppearance';

interface AdminLoginGateProps {
  onNavigate: (view: ActiveView) => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const { isSignedIn, user } = useSafeClerkAuth();
  const { isStaffAuthorized, isCheckingAuth, logout } = useAdminAuth();

  const currentUserEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim() || '';

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="max-w-xl w-full">
        <div className="bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] shadow-xl overflow-hidden relative">
          {/* Header Banner */}
          <div className="bg-[var(--ink-paper)] text-white p-6 sm:p-8 border-b border-[var(--on-ink-line)] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[var(--r-in)] bg-white/10 border border-[var(--on-ink-line)] flex items-center justify-center text-[var(--accent)] shrink-0">
                <ShieldAlert className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-[var(--r-pill)] border border-[var(--accent)]/30">
                    Official Staff Portal
                  </span>
                  <span className="text-[var(--on-ink-muted)] font-mono text-[11px]">NIT Raipur</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-brand font-black text-white tracking-tight mt-1">
                  Store Operations &amp; Admin Suite
                </h1>
              </div>
            </div>

            <p className="text-xs text-[var(--on-ink-muted)] leading-relaxed">
              Restricted portal for verified logistics managers, product coordinators, and store administrators. Protected by Clerk Identity Authentication.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Case 1: Signed Out */}
            {!isSignedIn && (
              <div className="space-y-5">
                <div className="p-4 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--ink)]">
                      <Lock className="w-4 h-4 text-[var(--accent)]" />
                      <span>Staff Authentication Required</span>
                    </div>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      Sign in directly below with your authorized institute or coordinator account.
                    </p>
                  </div>

                  {CLERK_ACCOUNTS_URL && (
                    <a
                      href={`${CLERK_ACCOUNTS_URL}/sign-in`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--paper)] hover:bg-[var(--paper-2)] rounded-[var(--r-in)] transition-colors text-[10px] font-mono font-semibold inline-flex items-center gap-1 border border-[var(--line)] shrink-0"
                      title="Open Clerk sign-in in standalone window"
                    >
                      <span>Full Tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Direct Native Embedded Clerk SignIn (no iframe, no SAMEORIGIN blockage) */}
                <div className="flex justify-center w-full py-2">
                  <SafeSignIn
                    key={theme}
                    routing="hash"
                    appearance={getClerkAppearance(theme, 'ink')}
                  />
                </div>

                <div className="p-3 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)] text-[11px] text-[var(--muted)] font-mono space-y-1">
                  <span className="font-bold text-[var(--ink)] block">Institutional Access Policy:</span>
                  <p>• Restricted to verified NIT Raipur Store administrators</p>
                  <p>• Staff roles and permissions are verified against the central directory</p>
                </div>
              </div>
            )}

            {/* Case 1.5: Verifying clearance against central database */}
            {isSignedIn && isCheckingAuth && !isStaffAuthorized && (
              <div className="p-6 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] text-center space-y-2">
                <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-mono font-bold text-[var(--ink)]">
                  Verifying institutional staff clearance...
                </p>
                <p className="text-[11px] text-[var(--muted)]">
                  Validating session credentials with central store directory.
                </p>
              </div>
            )}

            {/* Case 2: Signed In, but NOT authorized as staff */}
            {isSignedIn && !isCheckingAuth && !isStaffAuthorized && (
              <div className="space-y-5">
                <div className="p-4 rounded-[var(--r-in)] bg-[var(--bad-soft)] border border-[var(--bad-border)] text-xs space-y-2">
                  <div className="flex items-center gap-2 text-[var(--bad)] font-mono font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Staff Authorization Shield Active</span>
                  </div>
                  <p className="text-[var(--ink-2)] leading-relaxed">
                    You are signed in as <strong className="font-mono text-[var(--ink)]">{currentUserEmail}</strong> ({user?.fullName || 'Customer'}). However, this account has not been assigned administrative staff privileges.
                  </p>
                </div>

                <div className="p-4 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)] text-xs text-[var(--muted)] space-y-2 font-mono">
                  <div className="flex items-center gap-2 text-[var(--ink)] font-bold">
                    <ShieldCheck className="w-4 h-4 text-[var(--ok)]" />
                    <span>How Authorization Works:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Only verified accounts listed in the institutional roster or assigned the <code className="text-[var(--accent)] font-bold">admin</code> role in the Clerk Dashboard are permitted to access order fulfillment, customer roll numbers, and payment verification.
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="py-2.5 px-4 bg-[var(--paper-2)] hover:bg-[var(--paper-3)] border border-[var(--line-2)] text-[var(--ink)] font-mono font-bold text-xs uppercase tracking-wider rounded-[var(--r-in)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[var(--bad)]" />
                    <span>Switch Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate({ type: 'home' })}
                    className="py-2.5 px-4 bg-[var(--ink)] hover:bg-[var(--accent-solid)] text-[var(--on-ink)] hover:text-white font-mono font-bold text-xs uppercase tracking-wider rounded-[var(--r-in)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Store</span>
                  </button>
                </div>
              </div>
            )}

            {/* Case 3: Authorized */}
            {isStaffAuthorized && (
              <div className="p-4 bg-[var(--ok-soft)] border border-[var(--ok-border)] rounded-[var(--r-in)] text-xs space-y-2">
                <div className="flex items-center gap-2 text-[var(--ok)] font-mono font-bold">
                  <UserCheck className="w-4 h-4" />
                  <span>Verified Staff Clearance Confirmed</span>
                </div>
                <p className="text-[var(--ink-2)]">
                  Welcome, <strong>{user?.fullName || currentUserEmail}</strong>. You have verified staff operations clearance.
                </p>
              </div>
            )}

            {/* Return to Store Link */}
            <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => onNavigate({ type: 'home' })}
                className="inline-flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--ink)] font-mono transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Storefront</span>
              </button>
              <span className="text-[11px] font-mono text-[var(--muted)]">NIT Raipur Official Portal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
