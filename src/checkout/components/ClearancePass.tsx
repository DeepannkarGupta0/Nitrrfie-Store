import React, { useState, useEffect } from 'react';
import {
  Printer,
  ArrowRight,
  BadgeCheck,
  Building,
  Truck,
  ShieldCheck,
  MessageSquare,
  Copy,
  Check,
  Package,
  Clock,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Order, ActiveView } from '../../types/store';
import { apiTrackOrder } from '../../api/client';
import { formatINR, buildWhatsAppVerificationUrl, COORDINATOR_PHONE } from '../checkoutLogic';

interface ClearancePassProps {
  order: Order;
  onNavigate: (view: ActiveView) => void;
  onClearOrder: () => void;
  whatsappDispatched: boolean;
  setWhatsappDispatched: (val: boolean) => void;
}

export const ClearancePass: React.FC<ClearancePassProps> = ({
  order,
  onNavigate,
  onClearOrder,
  whatsappDispatched: _whatsappDispatched,
  setWhatsappDispatched,
}) => {
  const [liveOrder, setLiveOrder] = useState<Order>(order);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLiveOrder(order);
  }, [order]);

  const syncLiveStatus = React.useCallback(async () => {
    const res = await apiTrackOrder(order.id);
    if (res.success && res.order) {
      const tracked = res.order;
      setLiveOrder((prev) => ({
        ...prev,
        status: tracked.status,
        paymentStatus: tracked.paymentStatus,
        verificationStatus: tracked.verificationStatus,
        utrNumber: tracked.utrNumber ?? prev.utrNumber,
        verifiedBy: tracked.verifiedBy ?? prev.verifiedBy,
        verifiedAt: tracked.verifiedAt ?? prev.verifiedAt,
        cancelledAt: tracked.cancelledAt ?? prev.cancelledAt,
        cancellationReason: tracked.cancellationReason ?? prev.cancellationReason,
      }));
    }
  }, [order.id]);

  const isCancelled = liveOrder.status === 'cancelled';
  const isApproved = liveOrder.verificationStatus === 'desk_verified' && !isCancelled;

  React.useEffect(() => {
    if (isApproved || isCancelled) return;
    const interval = setInterval(() => {
      void syncLiveStatus();
    }, 8000);
    return () => clearInterval(interval);
  }, [isApproved, isCancelled, syncLiveStatus]);

  const formattedCoordinatorPhone = COORDINATOR_PHONE.startsWith('91')
    ? `+91 ${COORDINATOR_PHONE.slice(2)}`
    : `+91 ${COORDINATOR_PHONE}`;

  const waUrl = buildWhatsAppVerificationUrl({
    id: liveOrder.id,
    customerName: liveOrder.customerName,
    rollNumber: liveOrder.rollNumber,
    phone: liveOrder.phone,
    total: liveOrder.total,
    handoverType: liveOrder.handoverType,
    deliveryAddress: liveOrder.deliveryAddress,
    utrNumber: liveOrder.utrNumber,
    items: liveOrder.items,
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncLiveStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8 animate-fade-in">
      {/* Pass Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--paper-2)] border border-[var(--line)] text-[var(--muted)] font-mono text-[11px] font-semibold tracking-wider uppercase">
            <span>OFFICIAL NIT RAIPUR STORE</span>
            <span className="text-[var(--line-2)]">•</span>
            <span className={isCancelled ? 'text-[var(--bad)]' : isApproved ? 'text-[var(--ok)]' : 'text-[var(--warn)]'}>
              {isCancelled
                ? 'ORDER CANCELLED'
                : isApproved
                ? 'ORDER CONFIRMED & IN PROCESS'
                : 'AWAITING ADMIN APPROVAL'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-brand font-black text-[var(--ink)] tracking-tight mt-2">
            Order Clearance Pass
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {isCancelled
              ? `This order was cancelled${liveOrder.cancellationReason ? `: ${liveOrder.cancellationReason}` : '.'}`
              : isApproved
              ? liveOrder.handoverType === 'home_delivery'
                ? 'Your order is confirmed, verified, and now under process for Pan-India express courier dispatch.'
                : 'Your order is confirmed, verified, and now ready for Makerspace desk handover.'
              : 'Your WhatsApp verification slip was sent. Awaiting coordinator review in the admin suite.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[var(--paper)] border border-[var(--line)] hover:bg-[var(--paper-2)] text-[var(--ink)] text-xs font-mono font-bold rounded-[var(--r-in)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[var(--muted)]" />
            <span>Print Pass</span>
          </button>
          <button
            onClick={() => {
              onClearOrder();
              onNavigate({ type: 'shop' });
            }}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-[var(--r-in)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Back to Store</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Verification Banner Based on Admin Approval State */}
      {isCancelled ? (
        <div className="p-6 rounded-[var(--r)] border bg-rose-500/5 border-rose-500/30 text-[var(--ink)] transition-all animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-[var(--r-in)] flex items-center justify-center shrink-0 bg-rose-600 text-white">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="font-brand font-bold text-base sm:text-lg text-[var(--ink)]">
                Order Cancelled
              </span>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                {liveOrder.cancellationReason || 'This order has been cancelled by the store operations desk.'}
              </p>
            </div>
          </div>
        </div>
      ) : isApproved ? (
        /* Approved State */
        <div className="p-6 rounded-[var(--r)] border bg-[var(--ok-soft)] border-[var(--ok-border)] text-[var(--ink)] transition-all animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-[var(--r-in)] flex items-center justify-center shrink-0 bg-[#15803D] text-white">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-brand font-bold text-base sm:text-lg text-[var(--ink)]">
                    Payment Confirmed &amp; Verified
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[var(--r-pill)] font-bold bg-[var(--ok-soft)] border border-[var(--ok-border)] text-[var(--ok)]">
                    CONFIRMED &amp; IN PROCESS ✓
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                  Your payment has been verified and approved by the coordinator. Merchandise fulfillment via{' '}
                  <strong className="text-[var(--ink)]">
                    {liveOrder.handoverType === 'home_delivery' ? 'Pan-India Express Courier' : 'Makerspace Desk Handover'}
                  </strong>
                  .
                </p>
                {liveOrder.verifiedBy && (
                  <p className="text-[11px] text-[var(--ok)] font-mono">
                    Approved by: {liveOrder.verifiedBy}
                  </p>
                )}
              </div>
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setWhatsappDispatched(true)}
              className="px-4 py-2.5 bg-[#168341] hover:bg-[#126B34] dark:bg-[#15803D] dark:hover:bg-[#166534] text-white font-mono text-xs font-bold rounded-[var(--r-in)] flex items-center gap-2 transition-colors cursor-pointer shrink-0"
              title="Open WhatsApp chat with coordinator"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>
      ) : (
        /* Pending Admin Approval State */
        <div className="p-6 rounded-[var(--r)] border bg-[var(--warn-soft)] border-[var(--warn-border)] text-[var(--ink)] transition-all animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-[var(--r-in)] flex items-center justify-center shrink-0 bg-[#D97706] text-white">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-brand font-bold text-base sm:text-lg text-[var(--ink)]">
                    Awaiting Coordinator Approval
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[var(--r-pill)] font-bold bg-[var(--warn-soft)] border border-[var(--warn-border)] text-[var(--warn)]">
                    PENDING REVIEW ⏳
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                  Your verification slip with UPI Ref{' '}
                  <strong className="font-mono text-[var(--ink)]">#{liveOrder.utrNumber || 'N/A'}</strong> was dispatched to coordinator ({formattedCoordinatorPhone}). Status updates here automatically upon approval.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleManualRefresh}
                className="px-3.5 py-2.5 bg-[var(--paper)] border border-[var(--line)] hover:bg-[var(--paper-2)] text-[var(--ink)] text-xs font-mono font-bold rounded-[var(--r-in)] flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh order status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Check Status</span>
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setWhatsappDispatched(true)}
                className="px-4 py-2.5 bg-[#168341] hover:bg-[#126B34] dark:bg-[#15803D] dark:hover:bg-[#166534] text-white font-mono text-xs font-bold rounded-[var(--r-in)] flex items-center gap-2 transition-colors cursor-pointer"
                title="Send receipt or message coordinator on WhatsApp"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Open WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* The Handover Pass Card */}
      <div className="bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] shadow-sm overflow-hidden divide-y divide-[var(--line)]">
        {/* Dark Header */}
        <div className="bg-[var(--ink-paper)] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-[var(--r-in)] bg-white/10 flex items-center justify-center font-brand font-black text-[var(--accent)] text-lg border border-[var(--on-ink-line)]">
              NIT
            </div>
            <div>
              <h2 className="text-lg font-brand font-black tracking-tight text-white">
                National Institute of Technology Raipur
              </h2>
              <p className="text-xs text-[var(--on-ink-muted)]">
                Campus Merchandise Division • G.E. Road, Raipur 492010
              </p>
            </div>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--on-ink-muted)] block">
              OFFICIAL TOKEN
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">
                {liveOrder.id}
              </span>
              <button
                onClick={async () => {
                  try {
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(liveOrder.id);
                      setCopiedOrderId(true);
                      setTimeout(() => setCopiedOrderId(false), 2000);
                    }
                  } catch {
                    // Clipboard permission denied; ignore silently
                  }
                }}
                className="p-1.5 rounded-[var(--r-in)] bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
                title="Copy Order ID"
              >
                {copiedOrderId ? <Check className="w-4 h-4 text-[var(--ok)]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Student & Handover Meta Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-[var(--paper-2)]">
          {/* Customer Info */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider block font-bold">
              Customer Details
            </span>
            <div className="font-brand font-bold text-[var(--ink)] text-base">{liveOrder.customerName}</div>
            {liveOrder.rollNumber && liveOrder.rollNumber !== 'ALUMNI / DIRECT' && (
              <div className="font-mono text-xs font-bold text-[var(--accent)]">
                Roll / Batch: {liveOrder.rollNumber}
              </div>
            )}
            <div className="text-xs text-[var(--muted)]">{liveOrder.email}</div>
            <div className="text-xs text-[var(--muted)] font-mono">📱 {liveOrder.phone}</div>
          </div>

          {/* Delivery / Fulfillment Details */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider block font-bold">
              {liveOrder.handoverType === 'home_delivery' ? 'Pan-India Delivery Address' : 'Fulfillment Point'}
            </span>
            <div className="font-brand font-bold text-[var(--ink)] text-sm flex items-center gap-1.5">
              {liveOrder.handoverType === 'home_delivery' ? (
                <>
                  <Truck className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span>Pan-India Express Courier</span>
                </>
              ) : (
                <>
                  <Building className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span>Makerspace Desk Handover</span>
                </>
              )}
            </div>

            {liveOrder.handoverType === 'home_delivery' ? (
              <div className="text-xs text-[var(--muted)] space-y-1">
                {liveOrder.deliveryAddress ? (
                  <>
                    <p className="leading-relaxed font-medium text-[var(--ink)]">
                      {liveOrder.deliveryAddress.addressLine}
                    </p>
                    <p>
                      {liveOrder.deliveryAddress.city}, {liveOrder.deliveryAddress.state} – {liveOrder.deliveryAddress.pincode}
                    </p>
                    {liveOrder.deliveryAddress.landmark && (
                      <p className="text-[11px] text-[var(--muted)]">
                        Landmark: {liveOrder.deliveryAddress.landmark}
                      </p>
                    )}
                  </>
                ) : (
                  <p>Standard Express Courier Delivery</p>
                )}
              </div>
            ) : (
              <div className="text-xs text-[var(--muted)] space-y-1">
                <p className="leading-relaxed">
                  Innovation Cell / Makerspace Desk, Ground Floor, Main Building (Beside Architecture Dept)
                </p>
                <div className="text-[11px] font-mono text-[var(--ok)] bg-[var(--ok-soft)] px-2 py-0.5 rounded-[var(--r-in)] border border-[var(--ok-border)] inline-block font-semibold">
                  Desk Hours: 4:00 PM – 7:30 PM (Mon-Sat)
                </div>
              </div>
            )}
          </div>

          {/* Payment & Verification Meta */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider block font-bold">
              Payment Verification
            </span>
            <div className="text-sm font-brand font-bold text-[var(--ink)] flex items-center gap-1.5">
              <span>{liveOrder.paymentMethod === 'upi_razorpay' ? 'Direct UPI' : 'Pay at Counter'}</span>
              {isApproved ? (
                <span className="text-[10px] font-mono font-bold text-[var(--ok)] bg-[var(--ok-soft)] border border-[var(--ok-border)] px-2 py-0.5 rounded-[var(--r-in)]">
                  VERIFIED ✓
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold text-[var(--warn)] bg-[var(--warn-soft)] border border-[var(--warn-border)] px-2 py-0.5 rounded-[var(--r-in)]">
                  PENDING ⏳
                </span>
              )}
            </div>
            {liveOrder.utrNumber && (
              <div className="font-mono text-xs text-[var(--ink-2)]">
                UTR / Ref: <span className="font-bold">{liveOrder.utrNumber}</span>
              </div>
            )}
            <div className="text-xs text-[var(--muted)] font-mono">
              Date: {new Date(liveOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
            <div className="pt-1">
              <span className="font-mono text-lg font-bold text-[var(--ink)] tabular-nums">
                Total: {formatINR(liveOrder.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Items Breakdown Table */}
        <div className="p-6 sm:p-8 space-y-4">
          <h3 className="text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-[var(--muted)]" />
            <span>Enclosed Official Garments ({liveOrder.items.reduce((s, i) => s + i.quantity, 0)})</span>
          </h3>
          <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-[var(--r-in)] overflow-hidden">
            {liveOrder.items.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-4 bg-[var(--paper)]">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.fallbackApplied) {
                        img.dataset.fallbackApplied = '1';
                        img.src = '/assets/aistudio/nitrr_new_logo_new_155e66c7.png';
                      }
                    }}
                    className="w-12 h-12 object-cover rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)]"
                  />
                  <div>
                    <div className="text-sm font-brand font-bold text-[var(--ink)]">{item.name}</div>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-mono mt-0.5">
                      <span>Color: {item.color}</span>
                      <span>•</span>
                      <span>Size: {item.size}</span>
                      <span>•</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-[var(--ink)] text-sm tabular-nums">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Screenshot Preview if attached */}
        {liveOrder.paymentReceiptImage && (
          <div className="p-6 sm:p-8 bg-[var(--paper-2)] space-y-3">
            <span className="text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-wider block">
              Attached Payment Slip
            </span>
            <div className="border border-[var(--line)] rounded-[var(--r-in)] p-2 bg-[var(--paper)] max-w-sm">
              <img
                src={liveOrder.paymentReceiptImage}
                alt="UPI Slip Proof"
                className="rounded-[var(--r-in)] object-contain w-full max-h-60"
              />
            </div>
          </div>
        )}

        {/* Quality Guarantee & Customer Support */}
        <div className="p-6 sm:p-7 bg-[var(--paper-2)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <div className="flex items-center gap-2 text-[var(--ink-2)] font-medium">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            <span>Makerspace Quality Guarantee • Official campus verified apparel</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate({ type: 'support' })}
              className="px-4 py-2 border border-[var(--line)] hover:bg-[var(--paper)] text-[var(--ink)] font-mono text-xs font-bold rounded-[var(--r-in)] transition-colors cursor-pointer"
            >
              Need Support?
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setWhatsappDispatched(true)}
              className="px-4 py-2 bg-[#168341] hover:bg-[#126B34] dark:bg-[#15803D] dark:hover:bg-[#166534] text-white font-mono text-xs font-bold rounded-[var(--r-in)] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Verify Payment on WhatsApp with Coordinator"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp Coordinator ({formattedCoordinatorPhone})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
