import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useSafeClerkAuth } from '../context/SafeClerkContext';
import { RotateCcw, AlertCircle } from 'lucide-react';

interface SplashScreenProps {
  onReady?: () => void;
}

const MAX_WAIT_MS = 1800;
const MIN_DISPLAY_MS = 320;

export const SplashScreen: React.FC<SplashScreenProps> = ({ onReady }) => {
  const { isLoaded } = useSafeClerkAuth();
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(28);
  const [retryCount, setRetryCount] = useState<number>(0);

  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;
    let innerTimer: number | undefined;
    const startedAt = performance.now();

    // Verify essential browser capabilities and store data availability
    try {
      if (typeof window === 'undefined' || !document.getElementById('root')) {
        throw new Error('Application mount container is unavailable.');
      }
    } catch (err: any) {
      setInitError(err?.message || 'Store initialization failed.');
      return;
    }

    setProgress(45);

    // Wait for essential resources only: fonts + auth readiness (not product gallery images)
    const fontsReady =
      typeof document !== 'undefined' && document.fonts?.ready
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve();

    const logoPreload = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Never block splash if logo fails
      img.src = '/assets/aistudio/nitrr_new_logo_new_155e66c7.png';
    });

    // Hard timeout guarantees splash screen never remains stuck indefinitely
    const maxTimeout = window.setTimeout(() => {
      if (!cancelled) {
        setProgress(100);
        setVisible(false);
        onReadyRef.current?.();
      }
    }, MAX_WAIT_MS);

    Promise.all([fontsReady, logoPreload]).then(() => {
      if (cancelled) return;
      setProgress(isLoaded ? 100 : 82);

      if (!isLoaded) return;

      const elapsed = performance.now() - startedAt;
      // Avoid unnecessary delays when already ready; apply only a brief smooth settle
      const remaining = prefersReducedMotion ? 0 : Math.max(0, MIN_DISPLAY_MS - elapsed);

      innerTimer = window.setTimeout(() => {
        if (!cancelled) {
          window.clearTimeout(maxTimeout);
          setProgress(100);
          setVisible(false);
          onReadyRef.current?.();
        }
      }, remaining);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(maxTimeout);
      if (innerTimer !== undefined) {
        window.clearTimeout(innerTimer);
      }
    };
  }, [isLoaded, prefersReducedMotion, retryCount]);

  // Dismiss promptly once auth finishes loading after fonts are ready
  useEffect(() => {
    if (!visible || initError || !isLoaded) return;
    setProgress(100);
    const timer = window.setTimeout(
      () => {
        setVisible(false);
        onReadyRef.current?.();
      },
      prefersReducedMotion ? 0 : 220
    );
    return () => window.clearTimeout(timer);
  }, [isLoaded, visible, initError, prefersReducedMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-label="Loading NIT Raipur Store"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.05 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--paper)] text-[var(--ink)] px-6 select-none"
        >
          <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
            {/* Brand Emblem */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center space-y-3"
            >
              <div className="w-16 h-16 rounded-[var(--r)] border border-[var(--line-2)] bg-white p-1 shadow-sm overflow-hidden">
                <img
                  src="/assets/aistudio/nitrr_new_logo_new_155e66c7.png"
                  alt="NIT Raipur Store Logo"
                  className="w-full h-full object-contain rounded-[var(--r-in)]"
                />
              </div>

              <div className="space-y-1">
                <span className="font-brand text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)] block">
                  NIT Raipur <span className="text-[var(--accent)] italic font-medium">Store</span>
                </span>
                <span className="text-xs text-[var(--muted)] block">
                  Official Campus &amp; Alumni Store
                </span>
              </div>
            </motion.div>

            {/* Minimal Hairline Progress or Error State */}
            {initError ? (
              <div className="w-full p-4 rounded-[var(--r)] bg-[var(--paper-2)] border border-[var(--line)] space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--bad)]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Initialization Issue</span>
                </div>
                <p className="text-xs text-[var(--muted)]">{initError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setInitError(null);
                    setRetryCount((c) => c + 1);
                  }}
                  className="w-full min-h-[40px] px-4 py-2 rounded-[var(--r-in)] bg-[var(--ink)] text-[var(--on-ink)] hover:bg-[var(--accent-solid)] hover:text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : (
              <div className="w-full space-y-2">
                <div className="w-full h-1 rounded-full bg-[var(--line)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[var(--accent)]"
                    initial={{ width: '15%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="text-xs text-[var(--muted)] block">
                  Loading Storefront
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
