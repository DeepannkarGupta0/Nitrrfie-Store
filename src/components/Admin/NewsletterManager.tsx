import React, { useState, useEffect, useCallback } from 'react';
import { NewsletterSubscriber } from '../../types/store';
import { useSafeClerkAuth } from '../../context/SafeClerkContext';
import { useCart } from '../../context/CartContext';
import {
  apiFetchNewsletterSubscribers,
  apiUpdateNewsletterSubscriberStatus,
  apiDeleteNewsletterSubscriber,
} from '../../api/client';
import { escapeCsvCell } from '../../utils/cartLogic';
import {
  Mail,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertCircle,
  UserX,
  UserCheck,
} from 'lucide-react';

interface NewsletterManagerProps {
  onShowNotification: (msg: string) => void;
}

export const NewsletterManager: React.FC<NewsletterManagerProps> = ({ onShowNotification }) => {
  const { getToken } = useSafeClerkAuth();
  const { adminLastSyncedAt } = useCart();

  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [counts, setCounts] = useState({ total: 0, active: 0, unsubscribed: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const resolveAuth = useCallback(async () => {
    const clerkJwt = await getToken();
    return {
      token: clerkJwt || '',
    };
  }, [getToken]);

  const loadSubscribers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const auth = await resolveAuth();
    const res = await apiFetchNewsletterSubscribers(
      { search: searchQuery, status: statusFilter },
      auth.token
    );
    if (res.success && res.subscribers) {
      setSubscribers(res.subscribers);
      if (res.counts) setCounts(res.counts);
    } else {
      setErrorMsg(res.error || 'Failed to load newsletter subscribers.');
    }
    setIsLoading(false);
  }, [resolveAuth, searchQuery, statusFilter]);

  useEffect(() => {
    void loadSubscribers();
  }, [loadSubscribers, adminLastSyncedAt]);

  const handleToggleStatus = async (sub: NewsletterSubscriber) => {
    if (busyId) return;
    const nextStatus = sub.status === 'active' ? 'unsubscribed' : 'active';
    setBusyId(sub.id);
    const auth = await resolveAuth();
    const res = await apiUpdateNewsletterSubscriberStatus(
      sub.id,
      nextStatus,
      auth.token
    );
    setBusyId(null);

    if (res.success && res.subscriber) {
      onShowNotification(
        `${sub.email} marked as ${nextStatus === 'active' ? 'Active' : 'Unsubscribed'}.`
      );
      loadSubscribers();
    } else {
      onShowNotification(res.error || 'Failed to update subscription status.');
    }
  };

  const handleDelete = async (sub: NewsletterSubscriber) => {
    if (busyId) return;
    setBusyId(sub.id);
    const auth = await resolveAuth();
    const res = await apiDeleteNewsletterSubscriber(sub.id, auth.token);
    setBusyId(null);

    if (res.success) {
      onShowNotification(`Removed ${sub.email} from newsletter records.`);
      loadSubscribers();
    } else {
      onShowNotification(res.error || 'Failed to delete subscriber record.');
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      onShowNotification('No subscriber records to export.');
      return;
    }

    const headers = [
      'Subscriber ID',
      'Email',
      'Status',
      'Consent Given',
      'Consent Source',
      'Confirmation Email Status',
      'Confirmation Sent At',
      'Subscribed At',
      'Unsubscribed At',
    ];

    const rows = subscribers.map((s) => [
      escapeCsvCell(s.id),
      escapeCsvCell(s.email),
      escapeCsvCell(s.status),
      escapeCsvCell(s.consentGiven ? 'Yes' : 'No'),
      escapeCsvCell(s.consentSource),
      escapeCsvCell(s.confirmationEmailStatus),
      escapeCsvCell(s.confirmationSentAt || ''),
      escapeCsvCell(s.subscribedAt),
      escapeCsvCell(s.unsubscribedAt || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NITRR_Newsletter_Subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowNotification(`Exported ${subscribers.length} subscriber record(s).`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--r-sm)] text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(252,76,2,0.2)] mb-1">
            <Mail className="w-3.5 h-3.5" />
            <span>Newsletter &amp; Release Updates</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-brand font-bold text-[var(--ink)]">
            Subscriber Directory
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            View opt-in newsletter subscribers, confirmation email statuses, and manage unsubscribe requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadSubscribers}
            className="min-h-[38px] px-3.5 py-2 rounded-[var(--r-in)] bg-[var(--paper)] hover:bg-[var(--paper-2)] border border-[var(--line)] hover:border-[var(--line-2)] text-xs font-mono font-semibold text-[var(--ink)] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[38px] px-3.5 py-2 rounded-[var(--r-in)] bg-[var(--ink)] hover:bg-[var(--accent-solid)] text-[var(--on-ink)] hover:text-white text-xs font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-[var(--r)] bg-[var(--paper)] border border-[var(--line)]">
          <span className="text-xs font-mono uppercase text-[var(--muted)] block">Total Records</span>
          <span className="text-2xl font-mono font-bold text-[var(--ink)] mt-1 block tabular-nums">
            {counts.total}
          </span>
        </div>
        <div className="p-4 rounded-[var(--r)] bg-[var(--paper)] border border-[var(--line)]">
          <span className="text-xs font-mono uppercase text-[var(--muted)] block">Active Subscribers</span>
          <span className="text-2xl font-mono font-bold text-[var(--ok)] mt-1 block tabular-nums">
            {counts.active}
          </span>
        </div>
        <div className="p-4 rounded-[var(--r)] bg-[var(--paper)] border border-[var(--line)]">
          <span className="text-xs font-mono uppercase text-[var(--muted)] block">Unsubscribed</span>
          <span className="text-2xl font-mono font-bold text-[var(--muted)] mt-1 block tabular-nums">
            {counts.unsubscribed}
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-[var(--r)] bg-[var(--paper)] border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscriber email..."
            className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-[var(--r-in)] bg-[var(--paper-2)] border border-[var(--line)] text-xs sm:text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[var(--paper-2)] p-1 rounded-[var(--r-in)] border border-[var(--line)] text-xs font-mono">
          {(['all', 'active', 'unsubscribed'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-[var(--r-sm)] capitalize cursor-pointer transition-colors ${
                statusFilter === status
                  ? 'bg-[var(--ink)] text-[var(--on-ink)] font-semibold'
                  : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)]/70'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="p-4 rounded-[var(--r-in)] bg-[var(--bad-soft)] border border-[var(--bad-border)] flex items-center gap-2 text-xs sm:text-sm text-[var(--bad)]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Subscribers Table */}
      <div className="rounded-[var(--r)] bg-[var(--paper)] border border-[var(--line)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[var(--paper-2)] border-b border-[var(--line)] font-mono text-[11px] uppercase text-[var(--muted)]">
              <tr>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Confirmation Email</th>
                <th className="py-3 px-4">Subscribed Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {isLoading && subscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-[var(--muted)]">
                    Loading subscribers...
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs sm:text-sm text-[var(--muted)]">
                    No newsletter subscribers match your current filter.
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[var(--paper-2)]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-[var(--ink)] font-medium">
                      {sub.email}
                    </td>
                    <td className="py-3.5 px-4">
                      {sub.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-sm)] text-[11px] font-medium bg-[var(--ok-soft)] text-[var(--ok)] border border-[var(--ok-border)]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-sm)] text-[11px] font-medium bg-[var(--paper-2)] text-[var(--muted)] border border-[var(--line)]">
                          <XCircle className="w-3 h-3" />
                          <span>Unsubscribed</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[var(--muted)]">
                      {sub.confirmationEmailStatus === 'sent' ? (
                        <span className="text-[var(--ink-2)]">Sent</span>
                      ) : (
                        <span className="capitalize">{sub.confirmationEmailStatus}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[var(--muted)]">
                      {new Date(sub.subscribedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busyId === sub.id}
                          onClick={() => handleToggleStatus(sub)}
                          className="px-2.5 py-1.5 rounded-[var(--r-in)] border border-[var(--line)] enabled:hover:border-[var(--line-2)] enabled:hover:bg-[var(--paper-3)] bg-[var(--paper-2)] text-[11px] font-mono font-medium text-[var(--ink)] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title={
                            sub.status === 'active'
                              ? 'Deactivate / Unsubscribe'
                              : 'Reactivate subscription'
                          }
                        >
                          {sub.status === 'active' ? (
                            <>
                              <UserX className="w-3 h-3" />
                              <span>Unsubscribe</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>Reactivate</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={busyId === sub.id}
                          onClick={() => handleDelete(sub)}
                          className="p-1.5 rounded-[var(--r-in)] text-[var(--muted)] enabled:hover:text-[var(--bad)] enabled:hover:bg-[var(--bad-soft)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Delete subscriber record"
                          aria-label={`Remove ${sub.email}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
