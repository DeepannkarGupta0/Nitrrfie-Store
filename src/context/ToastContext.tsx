import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info', durationMs = 3200) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);

      window.setTimeout(() => {
        dismissToast(id);
      }, durationMs);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 left-4 sm:left-auto z-[70] flex flex-col gap-2 pointer-events-none sm:max-w-sm"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-[var(--r-in)] bg-[var(--paper)] dark:bg-[#161619] border border-[var(--line-2)] dark:border-zinc-700 shadow-lg text-xs font-sans font-medium text-[var(--ink)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {toast.variant === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
                )}
                {toast.variant === 'error' && (
                  <AlertCircle className="w-4 h-4 text-[var(--bad)] shrink-0" />
                )}
                {toast.variant === 'info' && (
                  <Info className="w-4 h-4 text-[var(--accent)] shrink-0" />
                )}
                <span className="leading-snug break-words">{toast.message}</span>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="p-1 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
