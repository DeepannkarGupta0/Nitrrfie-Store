import React, { useState, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { AuditLogEntry } from '../../types/store';
import { Shield, Clock, Search, Filter, CheckCircle2, AlertTriangle, Layers, Tag, RefreshCw } from 'lucide-react';

export const AuditLogsViewer: React.FC = () => {
  const { auditLogs } = useCart();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (filterAction !== 'all' && log.action !== filterAction) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          log.details.toLowerCase().includes(q) ||
          log.officerEmail.toLowerCase().includes(q) ||
          (log.targetId && log.targetId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [auditLogs, filterAction, search]);

  const actionConfig: Record<
    AuditLogEntry['action'],
    { label: string; bg: string; text: string; border: string }
  > = {
    ORDER_CREATED: {
      label: 'Order Created',
      bg: 'bg-teal-50 dark:bg-teal-500/15',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-500/30',
    },
    ORDER_STATUS_UPDATE: {
      label: 'Status Change',
      bg: 'bg-[var(--info-soft)]',
      text: 'text-[var(--info)]',
      border: 'border-[var(--info-border)]',
    },
    ORDER_CANCELLED: {
      label: 'Order Cancelled',
      bg: 'bg-[var(--warn-soft)]',
      text: 'text-[var(--warn)]',
      border: 'border-[var(--warn-border)]',
    },
    PAYMENT_VERIFIED: {
      label: 'Payment Verified',
      bg: 'bg-[var(--ok-soft)]',
      text: 'text-[var(--ok)]',
      border: 'border-[var(--ok-border)]',
    },
    ORDER_DELETED: {
      label: 'Order Deleted',
      bg: 'bg-[var(--bad-soft)]',
      text: 'text-[var(--bad)]',
      border: 'border-[var(--bad-border)]',
    },
    PRODUCT_CREATED: {
      label: 'Product Created',
      bg: 'bg-purple-50 dark:bg-purple-500/15',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-500/30',
    },
    PRODUCT_UPDATED: {
      label: 'Product Updated',
      bg: 'bg-indigo-50 dark:bg-indigo-500/15',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-500/30',
    },
    PRODUCT_DELETED: {
      label: 'Product Deleted',
      bg: 'bg-[var(--bad-soft)]',
      text: 'text-[var(--bad)]',
      border: 'border-[var(--bad-border)]',
    },
    COUPON_CREATED: {
      label: 'Coupon Created',
      bg: 'bg-[var(--warn-soft)]',
      text: 'text-[var(--warn)]',
      border: 'border-[var(--warn-border)]',
    },
    COUPON_TOGGLED: {
      label: 'Coupon Toggled',
      bg: 'bg-[var(--paper-2)]',
      text: 'text-[var(--ink-2)]',
      border: 'border-[var(--line)]',
    },
    COUPON_UPDATED: {
      label: 'Coupon Updated',
      bg: 'bg-[var(--info-soft)]',
      text: 'text-[var(--info)]',
      border: 'border-[var(--info-border)]',
    },
    COUPON_DELETED: {
      label: 'Coupon Deleted',
      bg: 'bg-[var(--bad-soft)]',
      text: 'text-[var(--bad)]',
      border: 'border-[var(--bad-border)]',
    },
    NEWSLETTER_UPDATED: {
      label: 'Subscriber Updated',
      bg: 'bg-[var(--info-soft)]',
      text: 'text-[var(--info)]',
      border: 'border-[var(--info-border)]',
    },
    NEWSLETTER_DELETED: {
      label: 'Subscriber Deleted',
      bg: 'bg-[var(--bad-soft)]',
      text: 'text-[var(--bad)]',
      border: 'border-[var(--bad-border)]',
    },
    STOCK_ADJUSTED: {
      label: 'Stock Adjusted',
      bg: 'bg-orange-50 dark:bg-orange-500/15',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-500/30',
    },
    STAFF_ADDED: {
      label: 'Staff Added',
      bg: 'bg-[var(--ok-soft)]',
      text: 'text-[var(--ok)]',
      border: 'border-[var(--ok-border)]',
    },
    STAFF_REMOVED: {
      label: 'Staff Removed',
      bg: 'bg-[var(--bad-soft)]',
      text: 'text-[var(--bad)]',
      border: 'border-[var(--bad-border)]',
    },
    STAFF_ROLE_UPDATED: {
      label: 'Role Updated',
      bg: 'bg-sky-50 dark:bg-sky-500/15',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-500/30',
    },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--paper-2)] text-[var(--ink)] border border-[var(--line)]">
              <Shield className="w-3 h-3 text-[var(--accent)]" /> Security &amp; Compliance Ledger
            </span>
          </div>
          <h2 className="text-2xl font-serif text-[var(--ink)]">Immutable Operational Audit Log</h2>
          <p className="text-sm text-[var(--muted)]">Chronological record of admin actions, verification stamps, stock deductions, and discounts.</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-xs font-mono text-[var(--ink)] cursor-pointer outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
          >
            <option value="all">All Action Types</option>
            <option value="ORDER_CREATED">Orders Placed</option>
            <option value="ORDER_STATUS_UPDATE">Status Updates</option>
            <option value="ORDER_CANCELLED">Order Cancellations</option>
            <option value="PAYMENT_VERIFIED">Payment Verifications</option>
            <option value="ORDER_DELETED">Order Deletions</option>
            <option value="COUPON_CREATED">Coupon Creations</option>
            <option value="STOCK_ADJUSTED">Stock Adjustments</option>
            <option value="STAFF_ADDED">Staff Roster Changes</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-xs text-[var(--ink)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
            />
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="border border-[var(--line)] rounded-2xl overflow-hidden bg-[var(--paper)] divide-y divide-[var(--line)]">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--muted)]">
            No audit records match the current filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const cfg = actionConfig[log.action] || {
              label: log.action,
              bg: 'bg-[var(--paper-2)]',
              text: 'text-[var(--ink-2)]',
              border: 'border-[var(--line)]',
            };

            return (
              <div key={log.id} className="p-4 hover:bg-[var(--paper-2)]/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--ink)]">{log.details}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted)]">
                      <span className="font-mono">Officer: {log.officerEmail}</span>
                      {log.targetId && (
                        <span className="font-mono bg-[var(--paper-2)] px-1.5 py-0.5 rounded border border-[var(--line)]">
                          Ref: {log.targetId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-[var(--muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3 inline" />
                    {new Date(log.timestamp).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
