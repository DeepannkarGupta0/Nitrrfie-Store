import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useCart } from '../context/CartContext';
import { apiTrackOrder } from '../api/client';
import { formatINR } from '../utils/cartLogic';
import { X, CheckCircle2, Building, Truck, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { PublicTrackedOrder } from '../types/store';

export const TrackOrderModal: React.FC = () => {
  const { isTrackOpen, setIsTrackOpen } = useCart();
  const [searchKey, setSearchKey] = useState('');
  const [matchedOrder, setMatchedOrder] = useState<PublicTrackedOrder | null>(null);
  const [searched, setSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTrackOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsTrackOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTrackOpen, setIsTrackOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKey.trim() || isSearching) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await apiTrackOrder(searchKey.trim());
      if (res.success && res.order) {
        setMatchedOrder(res.order);
      } else {
        setMatchedOrder(null);
        setSearchError(res.error || null);
      }
      setSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const statusSteps = [
    { key: 'confirmed', label: 'Order Registered', desc: 'Order logged with NITRRFIE Logistics' },
    { key: 'preparing', label: 'Quality Verification', desc: 'Garments inspected for sizing standard' },
    {
      key: 'ready_for_handover',
      label: 'Ready for Dispatch / Pickup',
      desc: 'Handed to express courier or ready at Main Building desk',
    },
    { key: 'delivered', label: 'Delivered / Handed Over', desc: 'Received by customer' },
  ];

  const getStepIndex = (status: PublicTrackedOrder['status']) => {
    switch (status) {
      case 'confirmed':
        return 0;
      case 'preparing':
        return 1;
      case 'ready_for_handover':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <AnimatePresence>
      {isTrackOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Order Tracker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsTrackOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--paper)] rounded-[var(--r)] max-w-xl w-full overflow-hidden shadow-2xl border border-[var(--line)] relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-[var(--on-ink-line)] flex items-center justify-between bg-[var(--ink-paper)] text-white">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[var(--accent)]" />
                <h2 className="text-base font-brand font-bold tracking-tight">
                  Pan-India &amp; Campus Order Tracker
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackOpen(false)}
                className="min-w-[36px] min-h-[36px] p-1.5 text-[var(--on-ink-muted)] hover:text-white rounded-[var(--r-in)] transition-colors cursor-pointer inline-flex items-center justify-center"
                aria-label="Close order tracker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Search Box */}
              <form onSubmit={handleSearch} className="space-y-2">
                <label className="text-xs font-mono font-semibold text-[var(--ink-2)] block">
                  Enter Order ID or Mobile Number:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                    placeholder="Enter Order ID or mobile number"
                    className="flex-1 min-w-0 px-3.5 py-2.5 border border-[var(--line-2)] rounded-[var(--r-in)] text-sm font-mono uppercase bg-[var(--paper)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 text-[var(--ink)] placeholder:text-[var(--muted)]"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="min-h-[42px] px-5 py-2.5 bg-[var(--accent-solid)] enabled:hover:bg-[var(--accent-solid-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-mono font-bold text-xs uppercase tracking-wider rounded-[var(--r-in)] transition-colors cursor-pointer shrink-0 shadow-sm enabled:active:translate-y-px inline-flex items-center gap-1.5"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{isSearching ? 'Tracking' : 'Track'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--muted)] font-mono">
                  Tip: Queries live order records from the NIT Raipur Store database.
                </p>
              </form>

              {/* Result */}
              {matchedOrder ? (
                <div className="bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] p-5 space-y-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[var(--accent)] uppercase">
                        {matchedOrder.handoverType === 'home_delivery'
                          ? 'Pan-India Delivery'
                          : 'Campus Pickup'}
                      </span>
                      <h3 className="text-lg font-brand font-bold font-mono text-[var(--ink)] mt-0.5 tabular-nums">
                        {matchedOrder.id}
                      </h3>
                      <p className="text-xs text-[var(--muted)]">
                        Customer:{' '}
                        <strong className="text-[var(--ink)]">{matchedOrder.customerName}</strong>
                        {matchedOrder.rollNumber && matchedOrder.rollNumber !== 'ALUMNI / DIRECT'
                          ? ` (${matchedOrder.rollNumber})`
                          : ''}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-[var(--r-pill)] uppercase shrink-0 border ${
                        matchedOrder.status === 'cancelled'
                          ? 'bg-[var(--bad-soft)] text-[var(--bad)] border-[var(--bad-border)]'
                          : 'bg-[var(--ok-soft)] text-[var(--ok)] border-[var(--ok-border)]'
                      }`}
                    >
                      {matchedOrder.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {matchedOrder.status === 'cancelled' ? (
                    <div className="p-4 rounded-[var(--r-in)] bg-[var(--bad-soft)] border border-[var(--bad-border)] flex items-start gap-2.5 text-xs text-[var(--bad)]">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--bad)]" />
                      <div>
                        <p className="font-bold">Order Cancelled</p>
                        {matchedOrder.cancellationReason && (
                          <p className="mt-0.5">{matchedOrder.cancellationReason}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Progress Stepper */
                    <div className="py-2">
                      <div className="space-y-4">
                        {statusSteps.map((step, idx) => {
                          const currentIndex = getStepIndex(matchedOrder.status);
                          const isDone = idx <= currentIndex;
                          const isCurrent = idx === currentIndex;
                          return (
                            <div key={step.key} className="flex items-start gap-3 relative">
                              <div
                                className={`w-6 h-6 rounded-[var(--r-in)] flex items-center justify-center font-mono font-bold text-xs shrink-0 z-10 ${
                                  isDone
                                    ? 'bg-[var(--ok)] text-white'
                                    : 'bg-[var(--paper-3)] text-[var(--muted)]'
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              <div>
                                <p
                                  className={`text-xs font-brand font-bold ${
                                    isCurrent
                                      ? 'text-[var(--accent)]'
                                      : isDone
                                      ? 'text-[var(--ink)]'
                                      : 'text-[var(--muted)]'
                                  }`}
                                >
                                  {step.label}
                                </p>
                                <p className="text-[11px] text-[var(--muted)]">{step.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Handover / Courier Destination info */}
                  <div className="bg-[var(--paper)] p-3.5 rounded-[var(--r-in)] border border-[var(--line)] text-xs space-y-1">
                    <span className="font-brand font-bold text-[var(--ink)] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>
                        {matchedOrder.handoverType === 'home_delivery'
                          ? 'Pan-India Delivery Address:'
                          : 'Collection Point:'}
                      </span>
                    </span>
                    <p className="text-[var(--muted)]">
                      {matchedOrder.handoverType === 'home_delivery'
                        ? matchedOrder.deliveryAddress
                          ? `${matchedOrder.deliveryAddress.city}, ${matchedOrder.deliveryAddress.state} – ${matchedOrder.deliveryAddress.pincode} (Insured Express Courier)`
                          : 'Pan-India Express Courier Delivery'
                        : 'NITRRFIE Innovation Cell / Makerspace Desk (Ground Floor, Main Building). Hours: 4:00 PM – 7:30 PM (Mon-Sat).'}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div className="text-xs space-y-1.5 border-t border-[var(--line)] pt-3">
                    <span className="font-bold text-[var(--ink-2)] font-mono uppercase text-[11px]">
                      Merchandise Enclosed:
                    </span>
                    {matchedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[var(--muted)]">
                        <span>
                          {it.name} ({it.size}) × {it.quantity}
                        </span>
                        <span className="font-mono font-bold text-[var(--ink)] tabular-nums">
                          {formatINR(it.price * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : searched ? (
                <div className="text-center py-8 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-dashed border-[var(--line-2)] space-y-1">
                  <AlertCircle className="w-7 h-7 text-[var(--muted)] mx-auto mb-2" />
                  <p className="text-sm font-brand font-bold text-[var(--ink)]">No Order Found</p>
                  <p className="text-xs text-[var(--muted)]">
                    {searchError || 'Please verify your Order ID, phone number, or roll number and try again.'}
                  </p>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
