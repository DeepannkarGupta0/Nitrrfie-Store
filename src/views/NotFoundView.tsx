import React from 'react';
import { motion } from 'motion/react';
import { ActiveView } from '../types/store';
import { ArrowLeft, Home, ShoppingBag } from 'lucide-react';

interface NotFoundViewProps {
  missingPath?: string;
  onNavigate: (view: ActiveView) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ missingPath, onNavigate }) => {
  return (
    <div className="w-full min-h-[75vh] flex items-center justify-center px-4 sm:px-8 py-14">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl w-full rounded-[var(--r)] bg-[var(--paper-card)] dark:bg-zinc-900/50 border border-[var(--line)] p-8 sm:p-12 text-center space-y-7 shadow-sm"
      >
        {/* Minimal Architectural Collegiate Crest Illustration */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              aria-hidden="true"
            >
              <rect
                x="10"
                y="10"
                width="100"
                height="100"
                rx="12"
                stroke="currentColor"
                strokeWidth="1"
                className="text-[var(--line-2)]"
              />
              <rect
                x="20"
                y="20"
                width="80"
                height="80"
                rx="8"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="text-[var(--muted)]/50"
              />
              <path
                d="M36 82 L60 34 L84 82 Z"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-[var(--ink)]"
              />
              <circle
                cx="60"
                cy="62"
                r="8"
                stroke="currentColor"
                strokeWidth="1.75"
                className="text-[var(--accent)]"
              />
              <line
                x1="28"
                y1="90"
                x2="92"
                y2="90"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-[var(--accent)]"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-center gap-2 text-xs font-sans font-semibold text-[var(--accent)]">
            <span>Page Not Found</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-normal text-[var(--ink)] tracking-tight text-balance">
            This page isn’t available.
          </h1>

          <p className="text-xs sm:text-sm text-[var(--muted)] font-sans leading-relaxed max-w-md mx-auto">
            The link you followed may be outdated or misspelled, or the item may have moved to another section of the store.
          </p>

          {missingPath && (
            <div className="pt-1">
              <code className="inline-block px-3 py-1 rounded-[var(--r-sm)] bg-[var(--paper-2)] border border-[var(--line)] text-xs font-mono text-[var(--muted)] max-w-full truncate">
                {missingPath}
              </code>
            </div>
          )}
        </div>

        {/* Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate({ type: 'home' })}
            className="min-h-[44px] px-6 py-3 rounded-[var(--r-in)] bg-[var(--ink)] text-[var(--on-ink)] hover:bg-[var(--accent-solid)] hover:text-white font-sans text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ type: 'shop' })}
            className="min-h-[44px] px-6 py-3 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line-2)] hover:border-[var(--accent)] hover:bg-[var(--paper-3)] text-[var(--ink)] hover:text-[var(--accent)] font-sans text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Catalog</span>
          </button>
        </div>

        <div className="pt-4 border-t border-[var(--line)] flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                onNavigate({ type: 'home' });
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
