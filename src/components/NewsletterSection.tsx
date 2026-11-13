import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Mail } from 'lucide-react';
import { ActiveView } from '../types/store';
import { useToast } from '../context/ToastContext';
import { apiSubscribeNewsletter, apiUnsubscribeNewsletter } from '../api/client';

interface NewsletterSectionProps {
  onNavigate?: (view: ActiveView) => void;
}

const NEWSLETTER_STORAGE_KEY = 'nitrr_store_newsletter_v1';
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function maskEmailForDisplay(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (local.length <= 2) {
    return `${local.slice(0, 1)}***@${domain}`;
  }
  if (local.length <= 4) {
    return `${local.slice(0, 2)}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({ onNavigate }) => {
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [subscribedState, setSubscribedState] = useState<{
    email: string;
    status: 'subscribed' | 'already_subscribed';
    confirmationEmailSent: boolean;
    emailDeliveryStatus: 'sent' | 'failed' | 'already_sent';
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const inFlightRef = useRef(false);

  const rememberLocalEmail = (cleaned: string) => {
    try {
      const savedRaw = localStorage.getItem(NEWSLETTER_STORAGE_KEY);
      const existing: string[] = savedRaw ? JSON.parse(savedRaw) : [];
      const list = Array.isArray(existing) ? existing : [];
      if (!list.includes(cleaned)) {
        localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify([...list, cleaned]));
      }
    } catch {
      // ignore storage quota errors
    }
  };

  const forgetLocalEmail = (cleaned: string) => {
    try {
      const savedRaw = localStorage.getItem(NEWSLETTER_STORAGE_KEY);
      const existing: string[] = savedRaw ? JSON.parse(savedRaw) : [];
      if (Array.isArray(existing)) {
        const next = existing.filter((item) => item.toLowerCase() !== cleaned.toLowerCase());
        localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(next));
      }
    } catch {
      // ignore storage errors
    }
  };

  const handleInlineUnsubscribe = async () => {
    if (!subscribedState || isUnsubscribing || inFlightRef.current) return;
    inFlightRef.current = true;
    setIsUnsubscribing(true);
    try {
      const targetEmail = subscribedState.email.trim().toLowerCase();
      const res = await apiUnsubscribeNewsletter({ email: targetEmail });
      if (!res.success) {
        showToast(res.error || 'Unable to unsubscribe right now. Please try again.', 'error');
        return;
      }
      forgetLocalEmail(targetEmail);
      setSubscribedState(null);
      setErrorMsg(null);
      showToast(res.message || 'You have been unsubscribed from newsletter updates.', 'info');
    } finally {
      inFlightRef.current = false;
      setIsUnsubscribing(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlightRef.current || isSubmitting) return;

    const cleaned = email.trim().toLowerCase();
    if (!cleaned) {
      const msg = 'Please enter your email address.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    if (cleaned.length > 254 || !EMAIL_REGEX.test(cleaned)) {
      const msg = 'Please enter a valid email address (e.g., name@nitrr.ac.in).';
      setErrorMsg(msg);
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    inFlightRef.current = true;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await apiSubscribeNewsletter(cleaned);
      if (!result.success) {
        const failureMsg =
          result.error || 'Unable to complete your subscription right now. Please try again.';
        setErrorMsg(failureMsg);
        showToast(failureMsg, 'error');
        return;
      }

      const finalStatus = result.status || 'subscribed';
      const emailDeliveryStatus =
        result.emailDeliveryStatus ||
        (result.confirmationEmailSent === false ? 'failed' : 'sent');
      const confirmationEmailSent = emailDeliveryStatus === 'sent';

      rememberLocalEmail(cleaned);
      setSubscribedState({
        email: result.email || cleaned,
        status: finalStatus,
        confirmationEmailSent,
        emailDeliveryStatus,
      });
      setEmail('');

      if (emailDeliveryStatus === 'sent') {
        showToast("You're subscribed — your welcome email is on its way.", 'success');
      } else if (emailDeliveryStatus === 'already_sent') {
        showToast(
          result.message || 'This email is already subscribed to NIT Raipur Store updates.',
          'info'
        );
      } else {
        showToast("You're subscribed to NIT Raipur Store updates.", 'success');
      }
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-label="Newsletter"
      className="w-full mt-0 border-t border-[var(--line)] bg-[var(--paper)] transition-colors duration-200"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-12 flex flex-col lg:flex-row lg:items-center justify-between gap-7 lg:gap-12">
        {/* Left Section: Newsletter Information */}
        <div className="space-y-2 max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            STAY CONNECTED
          </p>
          <h2 className="font-brand text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-[var(--ink)] leading-snug">
            Stay in the loop.
          </h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Be the first to know about new merchandise, upcoming releases, restocks and exclusive updates from NIT Raipur Store.
          </p>
        </div>

        {/* Right Section: Subscription Form / Confirmation */}
        <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {subscribedState ? (
              <motion.div
                key="newsletter-confirmed"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3.5"
              >
                {/* Small editorial status kicker with restrained check mark */}
                <div className="inline-flex items-center gap-2">
                  <motion.span
                    initial={{ scale: 0.75, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.24, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
                    aria-hidden="true"
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--ok-soft)] text-[var(--ok)] shrink-0"
                  >
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                  </motion.span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ok)]">
                    YOU&apos;RE ON THE LIST
                  </span>
                </div>

                {/* Editorial confirmation heading & supporting copy */}
                <div className="space-y-1.5">
                  <h3 className="font-brand text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)] leading-snug">
                    You&apos;re officially in.
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Thanks for subscribing to NIT Raipur Store. We&apos;ll keep you updated on new arrivals, upcoming releases and exclusive updates.
                  </p>
                </div>

                {/* Compact confirmation metadata row & useful subscriber actions */}
                <div className="pt-3 border-t border-[var(--line)] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail
                        className="w-3.5 h-3.5 text-[var(--muted)] shrink-0"
                        aria-hidden="true"
                      />
                      <span
                        className="font-mono text-xs sm:text-[13px] text-[var(--ink)] truncate"
                        title={maskEmailForDisplay(subscribedState.email)}
                      >
                        {maskEmailForDisplay(subscribedState.email)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSubscribedState(null);
                        setErrorMsg(null);
                      }}
                      className="text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] px-2 py-1 -mr-2 rounded-[var(--r-sm)] hover:bg-[var(--paper-2)] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      Use another email
                    </button>
                  </div>

                  {subscribedState.emailDeliveryStatus === 'sent' && (
                    <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                      Your welcome email is on its way.
                    </p>
                  )}
                  {subscribedState.emailDeliveryStatus === 'already_sent' && (
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      This address is already subscribed — you&apos;ll continue receiving drop and restock alerts.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5 text-xs">
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate({ type: 'shop' })}
                        className="font-medium text-[var(--ink)] hover:text-[var(--accent)] hover:underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Browse new drops
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleInlineUnsubscribe}
                      disabled={isUnsubscribing}
                      className="font-medium text-[var(--muted)] hover:text-[var(--bad)] hover:underline underline-offset-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUnsubscribing ? 'Unsubscribing...' : 'Unsubscribe'}
                    </button>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate({ type: 'unsubscribe' })}
                        className="text-[var(--muted)] hover:text-[var(--ink)] hover:underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Email preferences
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="newsletter-form"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={handleNewsletterSubmit}
                noValidate
                className="space-y-2.5"
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <input
                    id="newsletter-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Enter your email address"
                    aria-invalid={Boolean(errorMsg)}
                    aria-describedby={errorMsg ? 'newsletter-error' : undefined}
                    className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2 text-sm rounded-[var(--r-in)] bg-[var(--paper-card)] border border-[var(--line-2)] hover:border-[var(--muted)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 select-text transition-all duration-150"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="min-h-[44px] px-6 py-2 rounded-[var(--r-in)] bg-[var(--ink)] text-[var(--on-ink)] enabled:hover:bg-[var(--accent-solid)] enabled:hover:text-white enabled:active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold inline-flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </div>
                {errorMsg && (
                  <p
                    id="newsletter-error"
                    role="alert"
                    className="text-xs text-[var(--bad)]"
                  >
                    {errorMsg}
                  </p>
                )}
                <p className="text-xs text-[var(--muted)] leading-snug">
                  No spam.{' '}
                  {onNavigate ? (
                    <button
                      type="button"
                      onClick={() => onNavigate({ type: 'unsubscribe' })}
                      className="hover:text-[var(--ink)] hover:underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Unsubscribe anytime.
                    </button>
                  ) : (
                    'Unsubscribe anytime.'
                  )}
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
