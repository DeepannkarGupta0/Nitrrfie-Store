import React, { useEffect, useState } from 'react';
import { ActiveView } from '../types/store';
import { apiUnsubscribeNewsletter } from '../api/client';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

interface UnsubscribeViewProps {
  token?: string;
  onNavigate: (view: ActiveView) => void;
}

export const UnsubscribeView: React.FC<UnsubscribeViewProps> = ({ token, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    token ? 'loading' : 'idle'
  );
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setStatus('loading');

    apiUnsubscribeNewsletter({ token }).then((res) => {
      if (cancelled) return;
      if (res.success) {
        setStatus('success');
        setMessage(
          res.message || 'You have been unsubscribed from NIT Raipur Store newsletter updates.'
        );
      } else {
        setStatus('error');
        setMessage(res.error || 'This unsubscribe link is invalid or expired.');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleEmailUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;

    const cleaned = email.trim().toLowerCase();
    if (!cleaned || !cleaned.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    const res = await apiUnsubscribeNewsletter({ email: cleaned });
    if (res.success) {
      setStatus('success');
      setMessage(
        res.message || 'You have been unsubscribed from NIT Raipur Store newsletter updates.'
      );
      setEmail('');
    } else {
      setStatus('error');
      setMessage(res.error || 'Unable to process your unsubscribe request.');
    }
  };

  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[var(--r)] bg-[var(--paper-card)] border border-[var(--line)] p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--accent)] flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="font-brand text-xl sm:text-2xl font-semibold text-[var(--ink)]">
            Manage Email Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
            Unsubscribe from NIT Raipur Store restock alerts, capsule launches, and promotional newsletters.
          </p>
        </div>

        {status === 'loading' && (
          <div className="p-4 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] text-xs sm:text-sm text-[var(--ink-2)]">
            Processing your unsubscribe request...
          </div>
        )}

        {status === 'success' && (
          <div className="p-4 rounded-[var(--r-in)] bg-[var(--ok-soft)] border border-[var(--ok-border)] space-y-1.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--ok)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Unsubscribed</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-[var(--r-in)] bg-[var(--bad-soft)] border border-[var(--bad-border)] space-y-1.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--bad)]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Unable to Unsubscribe</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">{message}</p>
          </div>
        )}

        {status !== 'success' && !token && (
          <form onSubmit={handleEmailUnsubscribe} className="space-y-3">
            <div>
              <label
                htmlFor="unsubscribe-email"
                className="block text-xs font-medium text-[var(--ink-2)] mb-1.5"
              >
                Subscribed Email Address
              </label>
              <input
                id="unsubscribe-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="you@nitrr.ac.in"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-[var(--r-in)] bg-[var(--paper)] border border-[var(--line-2)] text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-[var(--r-in)] bg-[var(--ink)] enabled:hover:bg-[var(--accent-solid)] text-[var(--on-ink)] enabled:hover:text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Updating...' : 'Unsubscribe'}
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={() => onNavigate({ type: 'home' })}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </button>
        </div>
      </div>
    </div>
  );
};
