import React, { useState, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Order } from '../../types/store';
import { formatINR, buildWhatsAppStudentPingUrl } from '../../utils/cartLogic';
import {
  BadgeCheck,
  Clock,
  AlertCircle,
  Search,
  MessageSquare,
  Eye,
  FileText,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface VerificationDeskProps {
  onShowNotification: (msg: string) => void;
  onViewOrderDetails: (order: Order) => void;
}

export const VerificationDesk: React.FC<VerificationDeskProps> = ({
  onShowNotification,
  onViewOrderDetails,
}) => {
  const { orders, verifyOrder, bulkVerifyOrders } = useCart();
  const { adminUser } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'unverified' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [inspectSlipOrder, setInspectSlipOrder] = useState<Order | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [isBulkBusy, setIsBulkBusy] = useState(false);

  const canVerifyPayments = adminUser?.permissions?.verifyPayments !== false;

  // Filtered orders (exclude cancelled orders from active verification queues)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab === 'pending') {
        if (order.status === 'cancelled' || order.verificationStatus !== 'utr_submitted') return false;
      }
      if (activeTab === 'verified') {
        if (order.status === 'cancelled' || order.verificationStatus !== 'desk_verified') return false;
      }
      if (activeTab === 'unverified') {
        if (order.status === 'cancelled' || order.verificationStatus !== 'unverified') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesRoll = (order.rollNumber || '').toLowerCase().includes(q);
        const matchesPhone = order.phone.includes(q);
        const matchesUtr = order.utrNumber?.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesRoll && !matchesPhone && !matchesUtr) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Stats
  const counts = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== 'cancelled');
    const pending = activeOrders.filter((o) => o.verificationStatus === 'utr_submitted').length;
    const verified = activeOrders.filter((o) => o.verificationStatus === 'desk_verified').length;
    const unverified = activeOrders.filter((o) => o.verificationStatus === 'unverified').length;
    return { pending, verified, unverified, total: orders.length };
  }, [orders]);

  const handleCopyUtr = async (utr: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(utr);
        setCopiedUtr(utr);
        setTimeout(() => setCopiedUtr(null), 2000);
      } else {
        onShowNotification(`UTR reference: ${utr}`);
      }
    } catch {
      onShowNotification(`Copy blocked by browser. UTR reference: ${utr}`);
    }
  };

  const handleApprovePayment = async (order: Order): Promise<boolean> => {
    if (!canVerifyPayments || busyOrderId) return false;
    setBusyOrderId(order.id);
    try {
      const officer = adminUser
        ? `${adminUser.name} (${adminUser.roleTitle})`
        : 'NITRRFIE Coordinator Admin';

      const res = await verifyOrder(order.id, {
        utrNumber: order.utrNumber,
        verifiedBy: officer,
      });

      if (res.success) {
        onShowNotification(
          `Payment approved for Order #${order.id}. Order is now marked 'Garment In Production'.`
        );
        return true;
      }
      onShowNotification(res.error || `Unable to verify payment for Order #${order.id}.`);
      return false;
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (!canVerifyPayments || isBulkBusy) return;
    if (counts.pending === 0) {
      onShowNotification('No pending UTR submissions to verify.');
      return;
    }

    setIsBulkBusy(true);
    try {
      const res = await bulkVerifyOrders();
      if (res.success) {
        onShowNotification(`Batch verified ${res.verifiedCount ?? counts.pending} orders successfully!`);
      }
    } finally {
      setIsBulkBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[var(--paper)] p-5 rounded-[var(--r)] border border-[var(--line)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-brand font-bold text-[var(--ink)] tracking-tight">
              Payment Verification &amp; Clearance Desk
            </h2>
            {counts.pending > 0 && (
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 bg-[var(--accent-soft)] text-[var(--accent)] rounded-[var(--r-pill)] border border-[rgba(252,76,2,0.2)] animate-pulse">
                {counts.pending} Action Required
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Review UPI reference UTRs, verify payment slips against bank records, and clear orders for production.
          </p>
        </div>

        {counts.pending > 0 && canVerifyPayments && (
          <button
            type="button"
            disabled={isBulkBusy}
            onClick={handleBulkApprove}
            className="px-4 py-2 bg-[#15803D] enabled:hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-bold text-xs uppercase tracking-wider rounded-[var(--r-in)] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm active:translate-y-px"
          >
            <BadgeCheck className="w-4 h-4" />
            <span>{isBulkBusy ? 'Verifying...' : `Approve All Pending (${counts.pending})`}</span>
          </button>
        )}
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-[var(--paper)] p-4 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-[var(--r-in)] text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-[var(--accent-solid)] text-white shadow-xs'
                  : 'bg-[var(--paper-2)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)] border border-[var(--line)]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Awaiting Review</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === 'pending'
                    ? 'bg-black/20 text-white'
                    : 'bg-[var(--paper-3)] text-[var(--ink)]'
                }`}
              >
                {counts.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('verified')}
              className={`px-3 py-1.5 rounded-[var(--r-in)] text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'verified'
                  ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
                  : 'bg-[var(--paper-2)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)] border border-[var(--line)]'
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5 text-[var(--ok)]" />
              <span>Desk Verified</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === 'verified'
                    ? 'bg-[var(--on-ink)]/15 text-[var(--on-ink)]'
                    : 'bg-[var(--paper-3)] text-[var(--ink)]'
                }`}
              >
                {counts.verified}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unverified')}
              className={`px-3 py-1.5 rounded-[var(--r-in)] text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'unverified'
                  ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
                  : 'bg-[var(--paper-2)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)] border border-[var(--line)]'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-[var(--bad)]" />
              <span>Unverified / Unpaid</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === 'unverified'
                    ? 'bg-[var(--on-ink)]/15 text-[var(--on-ink)]'
                    : 'bg-[var(--paper-3)] text-[var(--ink)]'
                }`}
              >
                {counts.unverified}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-[var(--r-in)] text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
                  : 'bg-[var(--paper-2)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)] border border-[var(--line)]'
              }`}
            >
              <span>All Orders ({counts.total})</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by UTR, Roll, Phone, Name..."
              className="w-full pl-8 pr-4 py-1.5 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
        </div>
      </div>

      {/* Verification Queue Cards */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] space-y-2">
          <BadgeCheck className="w-10 h-10 text-[var(--ok)] mx-auto mb-2" />
          <h3 className="text-base font-brand font-bold text-[var(--ink)]">
            {activeTab === 'pending'
              ? 'All caught up! No pending payment verifications'
              : 'No orders found in this verification queue'}
          </h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            {activeTab === 'pending'
              ? 'When students submit their 12-digit UPI UTR numbers or receipts, they will appear here instantly.'
              : 'Try adjusting your search criteria or switch to another queue tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isVerified = order.verificationStatus === 'desk_verified';
            const isPendingUtr = order.verificationStatus === 'utr_submitted';
            const whatsappUrl = buildWhatsAppStudentPingUrl(order);

            return (
              <div
                key={order.id}
                className={`bg-[var(--paper)] rounded-[var(--r)] border p-5 shadow-sm transition-all ${
                  isPendingUtr
                    ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] bg-[var(--paper)]'
                    : isVerified
                    ? 'border-[var(--line)]'
                    : 'border-[var(--bad-border)] bg-[var(--bad-soft)]/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Order & Student Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[var(--ink)] bg-[var(--paper-2)] border border-[var(--line)] px-2.5 py-0.5 rounded-[var(--r-in)] tabular-nums">
                        {order.id}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--muted)]">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {/* Verification Status Badge */}
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[var(--ok)] bg-[var(--ok-soft)] px-2 py-0.5 rounded-[var(--r-pill)] border border-[var(--ok-border)]">
                          <BadgeCheck className="w-3 h-3 text-[var(--ok)]" />
                          <span>Cleared &amp; Verified</span>
                        </span>
                      ) : isPendingUtr ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-[var(--r-pill)] border border-[rgba(252,76,2,0.25)]">
                          <Clock className="w-3 h-3 text-[var(--accent)]" />
                          <span>UTR Ready For Review</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[var(--bad)] bg-[var(--bad-soft)] px-2 py-0.5 rounded-[var(--r-pill)] border border-[var(--bad-border)]">
                          <AlertCircle className="w-3 h-3 text-[var(--bad)]" />
                          <span>Awaiting Proof</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                      {/* Student info */}
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[var(--muted)] block">
                          Student
                        </span>
                        <span className="font-brand font-bold text-xs text-[var(--ink)] block truncate">
                          {order.customerName}
                        </span>
                        {order.rollNumber && order.rollNumber !== 'ALUMNI / DIRECT' && (
                          <span className="font-mono text-[11px] font-semibold text-[var(--accent)] block">
                            Roll: {order.rollNumber}
                          </span>
                        )}
                      </div>

                      {/* Contact & Route */}
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[var(--muted)] block">
                          Handover Route
                        </span>
                        {order.handoverType === 'hostel_delivery' ? (
                          <span className="text-[11px] text-[var(--ink)] font-semibold block truncate">
                            🏢 {order.hostelDetails?.hostelName} (Rm {order.hostelDetails?.roomNumber})
                          </span>
                        ) : order.handoverType === 'home_delivery' ? (
                          <span className="text-[11px] text-[var(--ink)] font-semibold block truncate">
                            🚚 Home Delivery ({order.deliveryAddress?.city})
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--ok)] font-semibold block">
                            📍 Makerspace Desk Ground Floor
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-[var(--muted)] block">
                          Ph: {order.phone}
                        </span>
                      </div>

                      {/* Items */}
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[var(--muted)] block">
                          Items ({order.items.length})
                        </span>
                        <span className="text-[11px] text-[var(--ink-2)] font-medium block truncate max-w-[200px]">
                          {order.items.map((i) => `${i.name} (${i.size})`).join(', ')}
                        </span>
                        <span className="font-mono font-bold text-xs text-[var(--ink)] block mt-0.5 tabular-nums">
                          Amount: {formatINR(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: UTR Reference & Slip */}
                  <div className="bg-[var(--paper-2)] p-3 rounded-[var(--r-in)] border border-[var(--line)] min-w-[240px] space-y-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-[var(--muted)] block">
                        UPI Transaction Ref / UTR
                      </span>
                      {order.utrNumber ? (
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <code className="text-xs font-mono font-bold text-[var(--ink)] bg-[var(--paper)] px-2 py-1 rounded-[var(--r-in)] border border-[var(--line)] tabular-nums">
                            {order.utrNumber}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyUtr(order.utrNumber!)}
                            title="Copy UTR number"
                            aria-label="Copy UTR number"
                            className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)] rounded-[var(--r-sm)] transition-colors cursor-pointer"
                          >
                            {copiedUtr === order.utrNumber ? (
                              <Check className="w-3.5 h-3.5 text-[var(--ok)]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-[var(--muted)] italic">
                          No UTR entered yet
                        </span>
                      )}
                    </div>

                    {order.verifiedBy && (
                      <div className="text-[10px] font-mono text-[var(--muted)] pt-1 border-t border-[var(--line)]">
                        <span>Cleared By: {order.verifiedBy}</span>
                      </div>
                    )}

                    {order.paymentReceiptImage && (
                      <button
                        type="button"
                        onClick={() => setInspectSlipOrder(order)}
                        className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 font-mono font-semibold cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Inspect Uploaded Payment Slip</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                    {!isVerified && order.status !== 'cancelled' && canVerifyPayments && (
                      <button
                        type="button"
                        disabled={busyOrderId === order.id}
                        onClick={() => handleApprovePayment(order)}
                        className="w-full sm:w-auto px-4 py-2 bg-[#15803D] enabled:hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-bold text-xs uppercase tracking-wider rounded-[var(--r-in)] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap active:translate-y-px"
                      >
                        <BadgeCheck className="w-4 h-4" />
                        <span>{busyOrderId === order.id ? 'Approving...' : 'Approve Payment'}</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-[var(--ok-soft)] hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-[var(--ok)] rounded-[var(--r-in)] border border-[var(--ok-border)] transition-colors flex items-center justify-center"
                        title="Ping student via WhatsApp"
                        aria-label="Ping student via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => onViewOrderDetails(order)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-[var(--ink)] font-mono text-xs font-semibold rounded-[var(--r-in)] transition-colors cursor-pointer flex items-center justify-center gap-1 border border-[var(--line)]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Pass</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Slip Modal */}
      {inspectSlipOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setInspectSlipOrder(null)}
        >
          <div
            className="bg-[var(--paper)] rounded-[var(--r)] max-w-lg w-full overflow-hidden shadow-2xl border border-[var(--line)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[var(--ink-paper)] text-white flex items-center justify-between border-b border-[var(--on-ink-line)]">
              <div>
                <span className="font-mono text-[10px] text-[var(--on-ink-muted)]">
                  Payment Slip • {inspectSlipOrder.id}
                </span>
                <h3 className="font-brand font-bold text-sm text-white">{inspectSlipOrder.customerName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectSlipOrder(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-[var(--r-in)] text-[var(--on-ink-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-[var(--paper-2)] min-h-[300px]">
              {inspectSlipOrder.paymentReceiptImage ? (
                <img
                  src={inspectSlipOrder.paymentReceiptImage}
                  alt="Receipt Slip"
                  onError={(e) => {
                    e.currentTarget.alt = 'Unable to render payment slip image';
                  }}
                  className="max-h-[70vh] object-contain rounded-[var(--r-in)] border border-[var(--line)]"
                />
              ) : (
                <span className="text-xs font-mono text-[var(--muted)]">No slip loaded</span>
              )}
            </div>
            <div className="p-4 border-t border-[var(--line)] flex items-center justify-between gap-3">
              <span className="font-mono text-xs font-bold text-[var(--ink)] tabular-nums">
                Amount: {formatINR(inspectSlipOrder.total)} • UTR: {inspectSlipOrder.utrNumber || 'N/A'}
              </span>
              {inspectSlipOrder.status !== 'cancelled' &&
                inspectSlipOrder.verificationStatus !== 'desk_verified' &&
                canVerifyPayments && (
                  <button
                    type="button"
                    disabled={busyOrderId === inspectSlipOrder.id}
                    onClick={async () => {
                      const ok = await handleApprovePayment(inspectSlipOrder);
                      if (ok) {
                        setInspectSlipOrder(null);
                      }
                    }}
                    className="px-4 py-2 bg-[#15803D] enabled:hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-xs font-bold uppercase tracking-wider rounded-[var(--r-in)] cursor-pointer transition-colors"
                  >
                    {busyOrderId === inspectSlipOrder.id ? 'Approving...' : 'Approve This Slip'}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
