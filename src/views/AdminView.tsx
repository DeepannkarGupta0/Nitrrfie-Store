import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useSafeClerkAuth } from '../context/SafeClerkContext';
import { apiFetchSupportInquiries } from '../api/client';
import { ActiveView, AdminUser, Order } from '../types/store';
import { formatINR, buildWhatsAppStudentPingUrl, escapeCsvCell } from '../utils/cartLogic';
import { ROLE_TITLES } from '../config/clerk';
import { AdminLoginGate } from '../components/Admin/AdminLoginGate';
import { ProductCatalogPanel } from '../components/Admin/ProductCatalogPanel';
import { AddProductPortal } from '../components/Admin/AddProductPortal';
import { VerificationDesk } from '../components/Admin/VerificationDesk';
import { HostelDeliveryLogistics } from '../components/Admin/HostelDeliveryLogistics';
import { CouponsManager } from '../components/Admin/CouponsManager';
import { CustomersManager } from '../components/Admin/CustomersManager';
import { AuditLogsViewer } from '../components/Admin/AuditLogsViewer';
import { NewsletterManager } from '../components/Admin/NewsletterManager';
import {
  Package,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Printer,
  MapPin,
  Building,
  Phone,
  Mail,
  ArrowLeft,
  X,
  XCircle,
  Truck,
  Sparkles,
  BadgeCheck,
  MessageSquare,
  FileCheck2,
  LogOut,
  Layers,
  BarChart3,
  UserCheck,
  Trash2,
  Shield,
  AlertCircle,
  AlertTriangle,
  Tag,
  Users,
  History,
  RefreshCw,
  Calendar,
} from 'lucide-react';

interface AdminViewProps {
  onNavigate: (view: ActiveView) => void;
}

const STATUS_CONFIG: Record<
  Order['status'],
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  confirmed: {
    label: 'Order Confirmed',
    bg: 'bg-[var(--info-soft)]',
    text: 'text-[var(--info)]',
    border: 'border-[var(--info-border)]',
    icon: Clock,
  },
  preparing: {
    label: 'Garment In Production',
    bg: 'bg-[var(--warn-soft)]',
    text: 'text-[var(--warn)]',
    border: 'border-[var(--warn-border)]',
    icon: Package,
  },
  ready_for_handover: {
    label: 'Ready For Handover',
    bg: 'bg-[var(--ok-soft)]',
    text: 'text-[var(--ok)]',
    border: 'border-[var(--ok-border)]',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered / Collected',
    bg: 'bg-[var(--paper-2)]',
    text: 'text-[var(--muted)]',
    border: 'border-[var(--line)]',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-[var(--bad-soft)]',
    text: 'text-[var(--bad)]',
    border: 'border-[var(--bad-border)]',
    icon: XCircle,
  },
};

export const AdminView: React.FC<AdminViewProps> = ({ onNavigate }) => {
  const {
    isAuthenticated,
    adminUser,
    logout,
    staffRoster,
    addStaffMember,
    updateStaffRole,
    removeStaffMember,
  } = useAdminAuth();

  const {
    orders,
    adminStats,
    adminAlerts,
    adminSyncStatus,
    adminSyncError,
    adminLastSyncedAt,
    adminDateRange,
    setAdminDateRange,
    refreshAdminDashboard,
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
    verifyOrder,
  } = useCart();

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    'orders' | 'verification' | 'products' | 'add_product' | 'logistics' | 'overview' | 'coupons' | 'customers' | 'newsletter' | 'inquiries' | 'audit_logs' | 'staff'
  >('orders');

  const { getToken } = useSafeClerkAuth();

  // Support / Bulk Inquiries State
  const [supportInquiries, setSupportInquiries] = useState<
    Array<{
      id: string;
      organization: string;
      contactEmail: string;
      estimatedQuantity: number;
      notes: string;
      createdAt: string;
    }>
  >([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiriesError, setInquiriesError] = useState<string | null>(null);

  // Staff Roster Management State
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<AdminUser['role']>('operations_lead');
  const [staffFeedback, setStaffFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isStaffBusy, setIsStaffBusy] = useState(false);

  // Modals & Selections
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  useEffect(() => {
    setSelectedOrder((prev) => (prev ? orders.find((o) => o.id === prev.id) ?? null : null));
  }, [orders]);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [handoverFilter, setHandoverFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const permissions = adminUser?.permissions;
  const canUpdateOrderStatus = permissions?.updateOrderStatus !== false;
  const canCancelOrders = permissions?.cancelOrders !== false;
  const canDeleteOrders = permissions?.deleteOrders === true;
  const canVerifyPayments = permissions?.verifyPayments !== false;
  const canManageStaff = permissions?.manageStaff === true;
  const canManageProducts = permissions?.manageProducts !== false;
  const canManageCoupons = permissions?.manageCoupons === true;
  const canManageNewsletter = permissions?.manageNewsletter === true;

  const loadSupportInquiries = useCallback(async () => {
    if (!isAuthenticated) return;
    setInquiriesLoading(true);
    setInquiriesError(null);
    const token = await getToken();
    const res = await apiFetchSupportInquiries(token);
    if (res.success && res.inquiries) {
      setSupportInquiries(res.inquiries);
    } else {
      setInquiriesError(res.error || 'Failed to load bulk support inquiries.');
    }
    setInquiriesLoading(false);
  }, [isAuthenticated, getToken]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'inquiries') {
      void loadSupportInquiries();
    }
  }, [isAuthenticated, activeTab, adminLastSyncedAt, loadSupportInquiries]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Authoritative KPI metrics from central backend (never fabricated locally)
  const stats = useMemo(() => {
    if (adminStats) {
      return adminStats;
    }
    return {
      totalCount: 0,
      confirmedCount: 0,
      pendingVerificationCount: 0,
      preparingCount: 0,
      readyCount: 0,
      deliveredCount: 0,
      cancelledCount: 0,
      hostelDeliveries: 0,
      courierDeliveries: 0,
      deskPickups: 0,
      verifiedPayments: 0,
      grossRevenue: 0,
      verifiedRevenue: 0,
      pendingRevenue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };
  }, [adminStats]);

  // Filtered orders (Unconditional hook before early return)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (handoverFilter !== 'all' && order.handoverType !== handoverFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesRoll = (order.rollNumber || '').toLowerCase().includes(q);
        const matchesPhone = order.phone.includes(q);
        const matchesUtr = order.utrNumber?.toLowerCase().includes(q);
        const matchesItem = order.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matchesId && !matchesName && !matchesRoll && !matchesPhone && !matchesUtr && !matchesItem) {
          return false;
        }
      }
      return true;
    });
  }, [orders, statusFilter, handoverFilter, searchQuery]);

  // Security Gate
  if (!isAuthenticated) {
    return <AdminLoginGate onNavigate={onNavigate} />;
  }

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    if (newStatus === 'cancelled') {
      const target = orders.find((o) => o.id === orderId);
      if (target) {
        setOrderToCancel(target);
        setCancelReason('');
      }
      return;
    }

    const res = await updateOrderStatus(orderId, newStatus);
    if (!res.success) return;

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    showNotification(`Order #${orderId} status set to: ${STATUS_CONFIG[newStatus].label}`);
  };

  const applyDatePreset = (preset: 'all' | 'today' | '7d' | '30d') => {
    if (preset === 'all') {
      setAdminDateRange({});
      return;
    }
    const now = new Date();
    const toStr = now.toISOString().slice(0, 10);
    if (preset === 'today') {
      setAdminDateRange({ from: toStr, to: toStr });
      return;
    }
    const days = preset === '7d' ? 7 : 30;
    const fromDate = new Date(now.getTime() - days * 86400000);
    setAdminDateRange({ from: fromDate.toISOString().slice(0, 10), to: toStr });
  };

  // CSV Export
  const handleExportCSV = () => {
    if (orders.length === 0) {
      showNotification('No orders available to export.');
      return;
    }
    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Roll Number',
      'Email',
      'Phone',
      'Handover Type',
      'Location',
      'Item Count',
      'Items Detail',
      'Total Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Verification Status',
      'UTR Number',
      'Cancellation Reason',
    ];

    const rows = orders.map((o) => [
      escapeCsvCell(o.id),
      escapeCsvCell(new Date(o.createdAt).toLocaleString('en-IN')),
      escapeCsvCell(o.customerName),
      escapeCsvCell(o.rollNumber),
      escapeCsvCell(o.email),
      escapeCsvCell(o.phone),
      escapeCsvCell(o.handoverType),
      escapeCsvCell(
        o.handoverType === 'hostel_delivery'
          ? `${o.hostelDetails?.hostelName || ''} Rm ${o.hostelDetails?.roomNumber || ''}`
          : o.handoverType === 'home_delivery'
          ? `${o.deliveryAddress?.city || ''}, ${o.deliveryAddress?.pincode || ''}`
          : 'Innovation Cell / Makerspace Desk'
      ),
      o.items.reduce((s, i) => s + i.quantity, 0),
      escapeCsvCell(o.items.map((i) => `${i.name} (${i.size}, ${i.color}) x${i.quantity}`).join('; ')),
      o.total,
      escapeCsvCell(o.paymentMethod === 'upi_razorpay' ? 'Direct UPI' : 'Pay at Handover'),
      escapeCsvCell(o.paymentStatus),
      escapeCsvCell(o.status),
      escapeCsvCell(o.verificationStatus),
      escapeCsvCell(o.utrNumber || ''),
      escapeCsvCell(o.cancellationReason || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NITRR_Store_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('CSV export downloaded successfully.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--ink-paper)] text-white text-xs font-mono px-4 py-3 rounded-[var(--r-in)] shadow-2xl flex items-center gap-2 border border-[var(--on-ink-line)]">
          <CheckCircle2 className="w-4 h-4 text-[var(--ok)]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header & Officer Authorization Status Bar */}
      <div className="bg-[var(--ink-paper)] text-white p-5 sm:p-6 rounded-[var(--r)] border border-[var(--on-ink-line)] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate({ type: 'home' })}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--on-ink-muted)] hover:text-white mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-brand font-black text-white tracking-tight">
              NITRRFIE Admin Operations Suite
            </h1>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[var(--accent-solid)] text-white rounded-[var(--r-pill)]">
              Central Source of Truth
            </span>
          </div>

          {/* Logged in Officer Badge & Sync State */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-mono text-[var(--on-ink-muted)]">
            <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-[var(--r-in)] border border-[var(--on-ink-line)] text-white">
              <UserCheck className="w-3.5 h-3.5 text-[var(--ok)]" />
              <span>Officer: <strong>{adminUser?.name}</strong></span>
            </span>
            <span className="text-white/30">•</span>
            <span>{adminUser?.roleTitle}</span>
            <span className="text-white/30">•</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--r-pill)] text-[10px] font-bold border ${
                adminSyncStatus === 'error'
                  ? 'bg-rose-500/20 text-rose-200 border-rose-400/40'
                  : adminSyncStatus === 'syncing'
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                  : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  adminSyncStatus === 'error'
                    ? 'bg-rose-400'
                    : adminSyncStatus === 'syncing'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span>
                {adminSyncStatus === 'error'
                  ? 'Sync Unavailable'
                  : adminSyncStatus === 'syncing'
                  ? 'Syncing...'
                  : 'Live Sync Active'}
              </span>
            </span>
            {adminLastSyncedAt && (
              <span className="text-[10px] text-[var(--on-ink-muted)]">
                ({new Date(adminLastSyncedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
              </span>
            )}
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshAdminDashboard(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-bold rounded-[var(--r-in)] border border-[var(--on-ink-line)] transition-colors cursor-pointer flex items-center gap-1.5"
            title="Refresh centralized dashboard from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--on-ink-muted)] ${adminSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-bold rounded-[var(--r-in)] border border-[var(--on-ink-line)] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[var(--on-ink-muted)]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              showNotification('Session locked and logged out.');
            }}
            className="px-3.5 py-2 bg-[var(--bad-soft)] hover:bg-[var(--bad)] text-rose-300 hover:text-white text-xs font-mono font-bold rounded-[var(--r-in)] border border-[var(--bad-border)] transition-colors cursor-pointer flex items-center gap-1.5"
            title="Lock administrative session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock &amp; Exit</span>
          </button>
        </div>
      </div>

      {/* Explicit Unavailable / Sync Error State (NEVER fabricate fallback metrics) */}
      {adminSyncStatus === 'error' && (
        <div className="p-4 rounded-[var(--r)] bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-rose-700 dark:text-rose-300">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-bold uppercase tracking-wider">Centralized Backend Unavailable</p>
              <p className="mt-0.5">{adminSyncError || 'Unable to retrieve genuine store data from the database.'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refreshAdminDashboard(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-wider rounded-[var(--r-in)] cursor-pointer shrink-0"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Operational Alerts Strip */}
      {adminAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {adminAlerts.slice(0, 3).map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => {
                if (alert.targetTab) {
                  setActiveTab(alert.targetTab as typeof activeTab);
                }
              }}
              className={`text-left p-3.5 rounded-[var(--r-in)] border flex items-start gap-2.5 transition-colors cursor-pointer ${
                alert.severity === 'critical'
                  ? 'bg-rose-500/8 border-rose-500/30 text-rose-800 dark:text-rose-300 hover:bg-rose-500/12'
                  : alert.severity === 'warning'
                  ? 'bg-amber-500/8 border-amber-500/30 text-amber-900 dark:text-amber-300 hover:bg-amber-500/12'
                  : 'bg-blue-500/8 border-blue-500/30 text-blue-900 dark:text-blue-300 hover:bg-blue-500/12'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-mono font-bold truncate">{alert.title}</p>
                <p className="text-[11px] opacity-85 line-clamp-2 mt-0.5">{alert.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main Suite Navigation Tabs */}
      <div className="flex overflow-x-auto pb-1 gap-2 border-b border-[var(--line)] text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-[var(--r-in)] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
              : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] border border-[var(--line)]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Fulfillment Queue</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'orders'
                ? 'bg-[var(--on-ink)]/15 text-[var(--on-ink)]'
                : 'bg-[var(--paper-2)] text-[var(--ink)] border border-[var(--line)]'
            }`}
          >
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2.5 rounded-[var(--r-in)] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'verification'
              ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
              : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] border border-[var(--line)]'
          }`}
        >
          <BadgeCheck className="w-4 h-4 text-[var(--ok)]" />
          <span>Payment Desk</span>
          {stats.pendingVerificationCount > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--accent-solid)] text-white font-bold animate-pulse">
              {stats.pendingVerificationCount}
            </span>
          ) : (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'verification'
                  ? 'bg-[var(--on-ink)]/15 text-[var(--on-ink)]'
                  : 'bg-[var(--paper-2)] text-[var(--muted)]'
              }`}
            >
              {stats.verifiedPayments}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-[var(--r-in)] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
              : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] border border-[var(--line)]'
          }`}
        >
          <Layers className="w-4 h-4 text-[var(--accent)]" />
          <span>Product Catalog</span>
        </button>

        {canManageProducts && (
          <button
            type="button"
            onClick={() => setActiveTab('add_product')}
            className={`px-4 py-2.5 rounded-[var(--r-in)] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'add_product'
                ? 'bg-[var(--accent-solid)] text-white shadow-xs'
                : 'bg-[var(--paper)] text-[var(--accent)] hover:bg-[var(--accent-soft)] border border-[var(--accent)]/35'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Product Portal</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('logistics')}
          className={`px-4 py-2.5 rounded-[var(--r-in)] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'logistics'
              ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
              : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] border border-[var(--line)]'
          }`}
        >
          <Truck className="w-4 h-4 text-[var(--info)]" />
          <span>Shipping &amp; Logistics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-[var(--r-in)] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
              : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] border border-[var(--line)]'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          <span>Operations Analytics</span>
        </button>

        {canManageCoupons && (
          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2.5 rounded-[var(--r-in)] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'coupons'
                ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
                : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] border border-[var(--line)]'
            }`}
          >
            <Tag className="w-4 h-4 text-[var(--accent)]" />
            <span>Vouchers &amp; Promo Codes</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2.5 rounded-[var(--r-in)] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'customers'
              ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
              : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] border border-[var(--line)]'
          }`}
        >
          <Users className="w-4 h-4 text-[var(--info)]" />
          <span>Customer Directory</span>
        </button>

        {canManageNewsletter && (
          <button
            type="button"
            onClick={() => setActiveTab('newsletter')}
            className={`px-4 py-2.5 rounded-[var(--r-in)] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'newsletter'
                ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
                : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] border border-[var(--line)]'
            }`}
          >
            <Mail className="w-4 h-4 text-[var(--accent)]" />
            <span>Newsletter Subscribers</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2.5 rounded-[var(--r-in)] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'inquiries'
              ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
              : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] border border-[var(--line)]'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-[var(--info)]" />
          <span>Bulk Inquiries</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2.5 rounded-[var(--r-in)] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'audit_logs'
              ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
              : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] border border-[var(--line)]'
          }`}
        >
          <History className="w-4 h-4 text-[var(--warn)]" />
          <span>Audit Log</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 rounded-[var(--r-in)] font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'staff'
              ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
              : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] border border-[var(--line)]'
          }`}
        >
          <Shield className="w-4 h-4 text-[var(--ok)]" />
          <span>Staff Access Roster</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'staff'
                ? 'bg-[var(--on-ink)]/15 text-[var(--on-ink)]'
                : 'bg-[var(--paper-2)] text-[var(--ink)] border border-[var(--line)]'
            }`}
          >
            {staffRoster.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ORDERS FULFILLMENT QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Date Range Synchronizer */}
          <div className="bg-[var(--paper)] p-3.5 rounded-[var(--r)] border border-[var(--line)] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[var(--muted)] flex items-center gap-1 mr-1 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Window:</span>
              </span>
              <button
                type="button"
                onClick={() => applyDatePreset('all')}
                className={`px-2.5 py-1 rounded-[var(--r-in)] cursor-pointer border transition-colors ${
                  !adminDateRange.from && !adminDateRange.to
                    ? 'bg-[var(--ink)] text-[var(--on-ink)] border-[var(--ink)]'
                    : 'bg-[var(--paper-2)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)] hover:border-[var(--line-2)]'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('today')}
                className="px-2.5 py-1 rounded-[var(--r-in)] cursor-pointer bg-[var(--paper-2)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)] hover:border-[var(--line-2)] transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('7d')}
                className="px-2.5 py-1 rounded-[var(--r-in)] cursor-pointer bg-[var(--paper-2)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)] hover:border-[var(--line-2)] transition-colors"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('30d')}
                className="px-2.5 py-1 rounded-[var(--r-in)] cursor-pointer bg-[var(--paper-2)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)] hover:border-[var(--line-2)] transition-colors"
              >
                Last 30 Days
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={adminDateRange.from || ''}
                onChange={(e) =>
                  setAdminDateRange((prev) => ({ ...prev, from: e.target.value || undefined }))
                }
                aria-label="Filter from date"
                className="px-2.5 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-xs text-[var(--ink)]"
              />
              <span className="text-[var(--muted)]">to</span>
              <input
                type="date"
                value={adminDateRange.to || ''}
                onChange={(e) =>
                  setAdminDateRange((prev) => ({ ...prev, to: e.target.value || undefined }))
                }
                aria-label="Filter to date"
                className="px-2.5 py-1 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-xs text-[var(--ink)]"
              />
            </div>
          </div>

          {/* Standardized Operational Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-[var(--paper)] p-4 rounded-[var(--r)] border border-[var(--line)] shadow-sm">
              <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wide block">
                Genuine Orders
              </span>
              <span className="text-2xl font-brand font-black text-[var(--ink)] font-mono mt-1 block tabular-nums">
                {stats.totalCount}
              </span>
              <span className="text-[10px] text-[var(--muted)] font-mono mt-1 block">
                Confirmed: {stats.confirmedCount}
              </span>
            </div>

            <div className="bg-[var(--paper)] p-4 rounded-[var(--r)] border border-[var(--line)] shadow-sm">
              <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wide block">
                Gross Revenue
              </span>
              <span className="text-2xl font-brand font-black text-[var(--accent)] font-mono mt-1 block tabular-nums">
                {formatINR(stats.grossRevenue)}
              </span>
              <span className="text-[10px] text-[var(--ok)] font-mono font-medium mt-1 block">
                Verified: {formatINR(stats.verifiedRevenue)}
              </span>
            </div>

            <div className="bg-[var(--paper)] p-4 rounded-[var(--r)] border border-[var(--line)] shadow-sm">
              <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wide block">
                Pending Verify
              </span>
              <span className="text-2xl font-brand font-black text-[var(--warn)] font-mono mt-1 block tabular-nums">
                {stats.pendingVerificationCount}
              </span>
              <span className="text-[10px] text-[var(--muted)] font-mono mt-1 block">
                Pending: {formatINR(stats.pendingRevenue)}
              </span>
            </div>

            <div className="bg-[var(--paper)] p-4 rounded-[var(--r)] border border-[var(--line)] shadow-sm">
              <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wide block">
                In Production
              </span>
              <span className="text-2xl font-brand font-black text-[var(--info)] font-mono mt-1 block tabular-nums">
                {stats.preparingCount}
              </span>
              <span className="text-[10px] text-[var(--muted)] font-mono mt-1 block">
                Ready: {stats.readyCount}
              </span>
            </div>

            <div className="bg-[var(--paper)] p-4 rounded-[var(--r)] border border-[var(--line)] shadow-sm">
              <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wide block">
                Delivered
              </span>
              <span className="text-2xl font-brand font-black text-[var(--ok)] font-mono mt-1 block tabular-nums">
                {stats.deliveredCount}
              </span>
              <span className="text-[10px] text-[var(--muted)] font-mono mt-1 block">
                Cancelled: {stats.cancelledCount}
              </span>
            </div>

            <div className="bg-[var(--paper)] p-4 rounded-[var(--r)] border border-[var(--line)] shadow-sm">
              <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wide block">
                Stock Alerts
              </span>
              <span className="text-2xl font-brand font-black text-[var(--ink)] font-mono mt-1 block tabular-nums">
                {stats.lowStockCount + stats.outOfStockCount}
              </span>
              <span className="text-[10px] text-[var(--muted)] font-mono mt-1 block">
                Low: {stats.lowStockCount} • Out: {stats.outOfStockCount}
              </span>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-[var(--paper)] p-4 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order ID, Roll Number, Student Name, Phone, or Item..."
                  className="w-full pl-9 pr-4 py-2 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Handover Type Filter */}
              <div className="flex items-center gap-1.5 bg-[var(--paper-2)] p-1 rounded-[var(--r-in)] border border-[var(--line)] text-xs font-mono">
                <span className="text-[var(--muted)] px-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Route:</span>
                </span>
                <button
                  onClick={() => setHandoverFilter('all')}
                  className={`px-2.5 py-1 rounded-[var(--r-in)] cursor-pointer transition-colors ${
                    handoverFilter === 'all'
                      ? 'bg-[var(--paper)] text-[var(--ink)] shadow-xs font-bold border border-[var(--line)]'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setHandoverFilter('makerspace_desk')}
                  className={`px-2.5 py-1 rounded-[var(--r-in)] cursor-pointer transition-colors ${
                    handoverFilter === 'makerspace_desk'
                      ? 'bg-[var(--paper)] text-[var(--ink)] shadow-xs font-bold border border-[var(--line)]'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  Desk
                </button>
                <button
                  onClick={() => setHandoverFilter('home_delivery')}
                  className={`px-2.5 py-1 rounded-[var(--r-in)] cursor-pointer transition-colors ${
                    handoverFilter === 'home_delivery'
                      ? 'bg-[var(--paper)] text-[var(--ink)] shadow-xs font-bold border border-[var(--line)]'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  Courier
                </button>
                <button
                  onClick={() => setHandoverFilter('hostel_delivery')}
                  className={`px-2.5 py-1 rounded-[var(--r-in)] cursor-pointer transition-colors ${
                    handoverFilter === 'hostel_delivery'
                      ? 'bg-[var(--paper)] text-[var(--ink)] shadow-xs font-bold border border-[var(--line)]'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  Hostel
                </button>
              </div>
            </div>

            {/* Status Tab Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--line)]">
              <span className="text-xs font-mono text-[var(--muted)] mr-2 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Status:</span>
              </span>
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'preparing', label: 'In Production' },
                { id: 'ready_for_handover', label: 'Ready For Handover' },
                { id: 'delivered', label: 'Delivered' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((tab) => {
                const count =
                  tab.id === 'all'
                    ? orders.length
                    : orders.filter((o) => o.status === tab.id).length;
                const isSelected = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-[var(--r-in)] text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[var(--ink)] text-[var(--on-ink)] shadow-xs'
                        : 'bg-[var(--paper-2)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)] border border-[var(--line)]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-[var(--on-ink)]/15 text-[var(--on-ink)]' : 'bg-[var(--paper-3)] text-[var(--ink)]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] shadow-sm overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Package className="w-10 h-10 text-[var(--muted)] mx-auto" />
                <h3 className="text-base font-brand font-bold text-[var(--ink)]">
                  {orders.length === 0 ? 'No genuine orders placed yet' : 'No matching orders found'}
                </h3>
                <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
                  {orders.length === 0
                    ? 'Genuine customer orders will appear here automatically in real time once placed through verified store checkout.'
                    : 'Try adjusting your search query, date window, or status filter.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[var(--paper-2)] border-b border-[var(--line)] font-mono text-[11px] text-[var(--muted)] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order ID &amp; Date</th>
                      <th className="py-3 px-4">Student Info</th>
                      <th className="py-3 px-4">Handover Route</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Total &amp; Payment</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {filteredOrders.map((order) => {
                      const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <tr key={order.id} className="hover:bg-[var(--paper-2)] transition-colors">
                          {/* Order ID & Date */}
                          <td className="py-3 px-4 align-top">
                            <span className="font-mono font-bold text-[var(--ink)] block tabular-nums">
                              {order.id}
                            </span>
                            <span className="text-[11px] text-[var(--muted)] font-mono block mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>

                          {/* Student Info */}
                          <td className="py-3 px-4 align-top">
                            <span className="font-brand font-bold text-[var(--ink)] block">
                              {order.customerName}
                            </span>
                            {order.rollNumber && order.rollNumber !== 'ALUMNI / DIRECT' && (
                              <span className="font-mono text-[11px] text-[var(--accent)] font-semibold block">
                                Roll: {order.rollNumber}
                              </span>
                            )}
                            <span className="text-[11px] text-[var(--muted)] font-mono block">
                              {order.phone}
                            </span>
                          </td>

                          {/* Handover Route */}
                          <td className="py-3 px-4 align-top">
                            {order.handoverType === 'hostel_delivery' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--info)] bg-[var(--info-soft)] px-2 py-0.5 rounded-[var(--r-in)] border border-[var(--info-border)]">
                                  <Building className="w-3 h-3" />
                                  <span>Hostel Handover</span>
                                </span>
                                <span className="text-[11px] text-[var(--muted)] block truncate max-w-[180px]">
                                  {order.hostelDetails?.hostelName}
                                </span>
                                <span className="text-[11px] font-mono font-semibold text-[var(--ink)] block">
                                  Room: {order.hostelDetails?.roomNumber}
                                </span>
                              </div>
                            ) : order.handoverType === 'home_delivery' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--warn)] bg-[var(--warn-soft)] px-2 py-0.5 rounded-[var(--r-in)] border border-[var(--warn-border)]">
                                  <Truck className="w-3 h-3" />
                                  <span>Home Delivery</span>
                                </span>
                                <span className="text-[11px] text-[var(--muted)] block truncate max-w-[180px]">
                                  {order.deliveryAddress?.city}, {order.deliveryAddress?.pincode}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--ok)] bg-[var(--ok-soft)] px-2 py-0.5 rounded-[var(--r-in)] border border-[var(--ok-border)]">
                                  <MapPin className="w-3 h-3" />
                                  <span>Makerspace Desk</span>
                                </span>
                                <span className="text-[11px] text-[var(--muted)] block">
                                  Ground Floor, Main Bldg
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Items */}
                          <td className="py-3 px-4 align-top">
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <img
                                    src={item.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png'}
                                    alt={item.name}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      const img = e.currentTarget;
                                      if (!img.dataset.fallbackApplied) {
                                        img.dataset.fallbackApplied = '1';
                                        img.src = '/assets/aistudio/ecell-varsity-jacket_daef387e.png';
                                      }
                                    }}
                                    className="w-7 h-7 object-cover rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-2)]"
                                  />
                                  <div className="text-[11px] leading-tight">
                                    <span className="font-brand font-medium text-[var(--ink)] block truncate max-w-[160px]">
                                      {item.name}
                                    </span>
                                    <span className="text-[var(--muted)] font-mono">
                                      {item.size} • {item.color} • Qty {item.quantity}
                                    </span>
                                    {item.customDesign && (
                                      <span className="inline-block text-[10px] text-[var(--accent)] font-mono font-bold">
                                        ✦ Custom: &quot;{item.customDesign.text}&quot;
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Total & Verification */}
                          <td className="py-3 px-4 align-top">
                            <span className="font-mono font-bold text-[var(--ink)] block tabular-nums">
                              {formatINR(order.total)}
                            </span>
                            <div className="mt-1 space-y-1">
                              {order.paymentStatus === 'refunded' || order.refundStatus === 'pending' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[var(--bad)] bg-[var(--bad-soft)] px-1.5 py-0.5 rounded-[var(--r-pill)] border border-[var(--bad-border)]">
                                  <span>{order.refundStatus === 'pending' ? 'Refund Pending' : 'Refunded'}</span>
                                </span>
                              ) : order.verificationStatus === 'desk_verified' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[var(--ok)] bg-[var(--ok-soft)] px-1.5 py-0.5 rounded-[var(--r-pill)] border border-[var(--ok-border)]">
                                  <BadgeCheck className="w-3 h-3 text-[var(--ok)]" />
                                  <span>Verified</span>
                                </span>
                              ) : order.verificationStatus === 'utr_submitted' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[var(--info)] bg-[var(--info-soft)] px-1.5 py-0.5 rounded-[var(--r-pill)] border border-[var(--info-border)]">
                                  <FileCheck2 className="w-3 h-3 text-[var(--info)]" />
                                  <span>UTR: {order.utrNumber?.slice(0, 8)}...</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[var(--warn)] bg-[var(--warn-soft)] px-1.5 py-0.5 rounded-[var(--r-pill)] border border-[var(--warn-border)]">
                                  <Clock className="w-3 h-3 text-[var(--warn)]" />
                                  <span>{order.paymentStatus === 'pay_on_handover' ? 'Pay at Desk' : 'Unverified'}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status & Quick Dropdown */}
                          <td className="py-3 px-4 align-top">
                            <div className="space-y-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--r-in)] text-[11px] font-mono font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                <span>{statusInfo.label}</span>
                              </span>

                              {order.status !== 'cancelled' && canUpdateOrderStatus && (
                                <select
                                  value={order.status}
                                  onChange={(e) =>
                                    void handleStatusChange(order.id, e.target.value as Order['status'])
                                  }
                                  className="block w-full py-1 px-1.5 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[11px] font-mono text-[var(--ink)] cursor-pointer focus:outline-none focus:border-[var(--accent)]"
                                >
                                  <option value="confirmed">Confirmed</option>
                                  <option value="preparing">In Production</option>
                                  <option value="ready_for_handover">Ready for Handover</option>
                                  <option value="delivered">Delivered</option>
                                  {canCancelOrders && <option value="cancelled">Cancel Order...</option>}
                                </select>
                              )}
                            </div>
                          </td>

                          {/* View Detail, Cancel & Delete Action */}
                          <td className="py-3 px-4 align-top text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="px-3 py-1.5 bg-[var(--paper-2)] hover:bg-[var(--paper-3)] border border-[var(--line)] text-[var(--ink)] font-mono font-semibold rounded-[var(--r-in)] text-xs cursor-pointer transition-colors inline-flex items-center gap-1"
                                title="View Order Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>

                              {order.status !== 'cancelled' && canCancelOrders && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOrderToCancel(order);
                                    setCancelReason('');
                                  }}
                                  className="p-1.5 text-[var(--muted)] hover:text-[var(--warn)] hover:bg-[var(--warn-soft)] border border-transparent hover:border-[var(--warn-border)] rounded-[var(--r-in)] cursor-pointer transition-colors"
                                  title="Cancel Order & Restore Stock"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {canDeleteOrders && (
                                <button
                                  type="button"
                                  onClick={() => setOrderToDelete(order)}
                                  className="p-1.5 text-[var(--muted)] hover:text-[var(--bad)] hover:bg-[var(--bad-soft)] border border-transparent hover:border-[var(--bad-border)] rounded-[var(--r-in)] cursor-pointer transition-colors"
                                  title="Permanently Delete Order Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT VERIFICATION DESK */}
      {activeTab === 'verification' && (
        <VerificationDesk
          onShowNotification={showNotification}
          onViewOrderDetails={(order) => setSelectedOrder(order)}
        />
      )}

      {/* TAB 3: PRODUCT CATALOG */}
      {activeTab === 'products' && (
        <ProductCatalogPanel
          onShowNotification={showNotification}
          onNavigateToAddProduct={canManageProducts ? () => setActiveTab('add_product') : undefined}
        />
      )}

      {/* TAB 3.5: ADD PRODUCT PORTAL */}
      {activeTab === 'add_product' && (
        <AddProductPortal
          onShowNotification={showNotification}
          onNavigateToCatalog={() => setActiveTab('products')}
          onNavigateToProduct={(slug) => onNavigate({ type: 'product', slug })}
        />
      )}

      {/* TAB 4: HOSTEL DELIVERY LOGISTICS */}
      {activeTab === 'logistics' && (
        <HostelDeliveryLogistics
          onShowNotification={showNotification}
          onViewOrderDetails={(order) => setSelectedOrder(order)}
        />
      )}

      {/* TAB 5: OPERATIONS ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-[var(--paper)] p-6 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-5">
            <div>
              <h3 className="text-lg font-brand font-bold text-[var(--ink)]">
                Campus Operations &amp; Merchandise Performance
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Computed centrally from genuine database orders across all active staff sessions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)]">
                <span className="text-xs font-mono text-[var(--muted)] block uppercase">
                  Gross Merchandise Volume
                </span>
                <span className="text-2xl font-brand font-black font-mono text-[var(--ink)] mt-1 block tabular-nums">
                  {formatINR(stats.grossRevenue)}
                </span>
                <span className="text-[11px] text-[var(--muted)] mt-1 block font-mono">
                  Excludes cancelled orders.
                </span>
              </div>

              <div className="p-4 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)]">
                <span className="text-xs font-mono text-[var(--muted)] block uppercase">
                  Verified Revenue
                </span>
                <span className="text-2xl font-brand font-black font-mono text-[var(--ok)] mt-1 block tabular-nums">
                  {formatINR(stats.verifiedRevenue)}
                </span>
                <span className="text-[11px] text-[var(--muted)] mt-1 block font-mono">
                  Cleared at payment desk.
                </span>
              </div>

              <div className="p-4 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)]">
                <span className="text-xs font-mono text-[var(--muted)] block uppercase">
                  Fulfillment Success Rate
                </span>
                <span className="text-2xl font-brand font-black font-mono text-[var(--ok)] mt-1 block tabular-nums">
                  {stats.totalCount > 0
                    ? Math.round((stats.deliveredCount / stats.totalCount) * 100)
                    : 0}
                  %
                </span>
                <span className="text-[11px] text-[var(--muted)] mt-1 block font-mono">
                  {stats.deliveredCount} delivered of {stats.totalCount} genuine orders.
                </span>
              </div>

              <div className="p-4 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)]">
                <span className="text-xs font-mono text-[var(--muted)] block uppercase">
                  Payment Verification Rate
                </span>
                <span className="text-2xl font-brand font-black font-mono text-[var(--info)] mt-1 block tabular-nums">
                  {stats.totalCount > 0
                    ? Math.round((stats.verifiedPayments / stats.totalCount) * 100)
                    : 0}
                  %
                </span>
                <span className="text-[11px] text-[var(--muted)] mt-1 block font-mono">
                  {stats.verifiedPayments} cleared • {stats.pendingVerificationCount} pending.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: VOUCHERS & PROMOTIONAL COUPONS */}
      {activeTab === 'coupons' && (
        canManageCoupons ? (
          <CouponsManager />
        ) : (
          <div className="p-6 rounded-[var(--r)] bg-[var(--paper)] border border-[var(--line)] text-xs font-mono text-[var(--muted)]">
            Your role ({adminUser?.roleTitle}) does not have permission to manage vouchers and promo codes.
          </div>
        )
      )}

      {/* TAB: CUSTOMER DIRECTORY & LTV ROSTER */}
      {activeTab === 'customers' && <CustomersManager />}

      {/* TAB: NEWSLETTER SUBSCRIBERS */}
      {activeTab === 'newsletter' && (
        canManageNewsletter ? (
          <NewsletterManager onShowNotification={showNotification} />
        ) : (
          <div className="p-6 rounded-[var(--r)] bg-[var(--paper)] border border-[var(--line)] text-xs font-mono text-[var(--muted)]">
            Your role ({adminUser?.roleTitle}) does not have permission to view or manage newsletter subscribers.
          </div>
        )
      )}

      {/* TAB: BULK ORDER & SUPPORT INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--r-sm)] text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(252,76,2,0.2)] mb-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Department &amp; Club Bulk Orders</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-brand font-bold text-[var(--ink)]">
                Submitted Bulk Inquiries
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)]">
                Inquiries submitted via the Store Support &amp; Custom Bulk Order form, persisted in SQLite.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadSupportInquiries()}
              className="min-h-[38px] px-3.5 py-2 rounded-[var(--r-in)] bg-[var(--paper)] hover:bg-[var(--paper-2)] border border-[var(--line)] text-xs font-mono font-semibold text-[var(--ink)] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${inquiriesLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {inquiriesError && (
            <div className="p-4 rounded-[var(--r-in)] bg-[var(--bad-soft)] border border-[var(--bad-border)] flex items-center gap-2 text-xs sm:text-sm text-[var(--bad)]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{inquiriesError}</span>
            </div>
          )}

          <div className="rounded-[var(--r)] bg-[var(--paper)] border border-[var(--line)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[var(--paper-2)] border-b border-[var(--line)] font-mono text-[11px] uppercase text-[var(--muted)]">
                  <tr>
                    <th className="py-3 px-4">Inquiry ID</th>
                    <th className="py-3 px-4">Organization / Club</th>
                    <th className="py-3 px-4">Contact Email</th>
                    <th className="py-3 px-4">Est. Qty</th>
                    <th className="py-3 px-4">Requirements</th>
                    <th className="py-3 px-4">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {inquiriesLoading && supportInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-[var(--muted)]">
                        Loading bulk inquiries...
                      </td>
                    </tr>
                  ) : supportInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs sm:text-sm text-[var(--muted)]">
                        No bulk order inquiries have been submitted yet.
                      </td>
                    </tr>
                  ) : (
                    supportInquiries.map((inq) => (
                      <tr key={inq.id} className="hover:bg-[var(--paper-2)]/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-[var(--ink)]">{inq.id}</td>
                        <td className="py-3.5 px-4 font-medium text-[var(--ink)]">{inq.organization}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[var(--muted)]">{inq.contactEmail}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-[var(--accent)] tabular-nums">
                          {inq.estimatedQuantity} pcs
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[var(--ink-2)] max-w-sm whitespace-pre-wrap">
                          {inq.notes || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[var(--muted)] whitespace-nowrap">
                          {new Date(inq.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SECURITY AUDIT & OPERATIONS LOG */}
      {activeTab === 'audit_logs' && <AuditLogsViewer />}

      {/* TAB 6: STAFF ACCESS ROSTER & CENTRALIZED RBAC */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="bg-[var(--paper)] p-6 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ok)] bg-[var(--ok-soft)] px-2.5 py-0.5 rounded-[var(--r-pill)] border border-[var(--ok-border)]">
                  Centralized Role-Based Access Roster
                </span>
                <h3 className="text-xl font-brand font-black text-[var(--ink)] tracking-tight mt-1">
                  Institutional Staff Access &amp; Authorization Control
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  All staff accounts share identical operational metrics from the central SQLite database. Permissions below govern destructive and roster-level actions.
                </p>
              </div>

              {adminUser && (
                <div className="flex items-center gap-3 p-3 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)] shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--line-2)] shrink-0 bg-[var(--ink)] text-[var(--on-ink)] flex items-center justify-center font-bold text-sm">
                    {adminUser.avatar ? (
                      <img
                        src={adminUser.avatar}
                        alt={adminUser.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      adminUser.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <span className="font-brand font-bold text-xs text-[var(--ink)] block">{adminUser.name}</span>
                    <span className="font-mono text-[11px] text-[var(--muted)] block">{adminUser.email}</span>
                    <span className="font-mono text-[10px] text-[var(--accent)] block font-semibold">{adminUser.roleTitle}</span>
                  </div>
                </div>
              )}
            </div>

            {canManageStaff ? (
              <div className="bg-[var(--paper-2)] p-4 rounded-[var(--r-in)] border border-[var(--line)] space-y-3">
                <label className="block text-xs font-mono font-bold text-[var(--ink)] uppercase">
                  Authorize New Staff / Coordinator Email
                </label>

                {staffFeedback && (
                  <div
                    className={`p-3 text-xs rounded-[var(--r-in)] flex items-center gap-2 ${
                      staffFeedback.type === 'ok'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {staffFeedback.type === 'ok' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{staffFeedback.text}</span>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (isStaffBusy) return;
                    setStaffFeedback(null);
                    if (!newStaffEmail.trim() || !newStaffEmail.includes('@')) {
                      setStaffFeedback({ type: 'err', text: 'Please enter a valid email address.' });
                      return;
                    }
                    setIsStaffBusy(true);
                    try {
                      const res = await addStaffMember(newStaffEmail, newStaffRole);
                      if (res.success) {
                        setStaffFeedback({
                          type: 'ok',
                          text: `Successfully authorized ${newStaffEmail.toLowerCase().trim()} as ${ROLE_TITLES[newStaffRole]}.`,
                        });
                        setNewStaffEmail('');
                        await refreshAdminDashboard(true);
                      } else {
                        setStaffFeedback({
                          type: 'err',
                          text: res.error || 'Unable to add staff member.',
                        });
                      }
                    } finally {
                      setIsStaffBusy(false);
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="e.g. coordinator.merch@nitrr.ac.in"
                    className="flex-1 px-3.5 py-2.5 bg-[var(--paper)] border border-[var(--line-2)] rounded-[var(--r-in)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                    required
                  />
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as AdminUser['role'])}
                    className="px-3 py-2.5 bg-[var(--paper)] border border-[var(--line-2)] rounded-[var(--r-in)] text-xs font-mono text-[var(--ink)] cursor-pointer focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="operations_lead">Operations Lead</option>
                    <option value="verification_desk">Payment Verification Desk</option>
                    <option value="hostel_coordinator">Hostel &amp; Dispatch Coordinator</option>
                    <option value="super_admin">Super Administrator</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isStaffBusy}
                    className="px-5 py-2.5 bg-[var(--ink)] enabled:hover:bg-[var(--accent-solid)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--on-ink)] enabled:hover:text-white font-mono font-bold text-xs uppercase tracking-wider rounded-[var(--r-in)] transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isStaffBusy ? 'Adding...' : 'Add to Roster'}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-3.5 bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)] text-xs font-mono text-[var(--muted)]">
                Your role ({adminUser?.roleTitle}) has read-only access to the staff directory. Only Super Administrators or Operations Leads can modify staff privileges.
              </div>
            )}

            {/* Centralized Staff Roster Table */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[var(--ink)] uppercase block">
                Centralized Authorized Staff Roster ({staffRoster.length})
              </span>

              <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-[var(--r-in)] overflow-hidden bg-[var(--paper)]">
                {staffRoster.map((member, idx) => {
                  const isPrimaryOwner = Boolean(member.isProtectedOwner);
                  const isCurrent = adminUser?.email?.toLowerCase() === member.email.toLowerCase();
                  return (
                    <div
                      key={member.email}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono hover:bg-[var(--paper-2)] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[var(--muted)] text-[11px] w-5 text-right font-bold">{idx + 1}.</span>
                        <div className="min-w-0">
                          <span className="font-bold text-[var(--ink)] block truncate">{member.email}</span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {isPrimaryOwner && (
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-xs bg-[var(--accent-soft)] text-[var(--accent)] font-bold border border-[var(--accent)]/30">
                                Primary Owner
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-xs bg-[var(--ok-soft)] text-[var(--ok)] border border-[var(--ok-border)] font-bold">
                                Current Session
                              </span>
                            )}
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-xs bg-[var(--paper-2)] text-[var(--ink-2)] border border-[var(--line)]">
                              {member.roleTitle}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canManageStaff && !isPrimaryOwner ? (
                          <>
                            <select
                              value={member.role}
                              onChange={async (e) => {
                                const res = await updateStaffRole(
                                  member.email,
                                  e.target.value as AdminUser['role']
                                );
                                if (res.success) {
                                  showNotification(`Updated role for ${member.email}.`);
                                  await refreshAdminDashboard(true);
                                } else {
                                  showNotification(res.error || 'Failed to update staff role.');
                                }
                              }}
                              className="py-1 px-2 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[11px] font-mono text-[var(--ink)]"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="operations_lead">Operations Lead</option>
                              <option value="verification_desk">Verification Desk</option>
                              <option value="hostel_coordinator">Hostel Coordinator</option>
                            </select>
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const res = await removeStaffMember(member.email);
                                  if (res.success) {
                                    showNotification(`Revoked administrative access for ${member.email}.`);
                                    await refreshAdminDashboard(true);
                                  } else {
                                    showNotification(res.error || 'Unable to remove staff member.');
                                  }
                                }}
                                className="p-1.5 text-[var(--muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-[var(--r-in)] transition-colors cursor-pointer"
                                title="Revoke Staff Authorization"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-[var(--muted)]">
                            {isPrimaryOwner ? 'Protected Owner' : member.role}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-2xl bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-[var(--ink-paper)] text-white flex items-center justify-between border-b border-[var(--on-ink-line)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase px-2 py-0.5 bg-[var(--accent-solid)] text-white font-bold rounded-[var(--r-pill)]">
                    NIT Raipur Handover Pass
                  </span>
                  <span className="font-mono text-sm text-[var(--on-ink-muted)] tabular-nums">
                    {selectedOrder.id}
                  </span>
                </div>
                <h2 className="text-xl font-brand font-bold text-white mt-1">
                  {selectedOrder.customerName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-[var(--r-in)] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[var(--ink)]">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-[var(--r-in)] border flex items-center justify-between ${STATUS_CONFIG[selectedOrder.status].bg} ${STATUS_CONFIG[selectedOrder.status].border}`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className={`w-5 h-5 ${STATUS_CONFIG[selectedOrder.status].text}`} />
                  <div>
                    <span className="text-[11px] font-mono uppercase text-[var(--muted)] block">
                      Order Status
                    </span>
                    <span className={`text-sm font-bold font-mono ${STATUS_CONFIG[selectedOrder.status].text}`}>
                      {STATUS_CONFIG[selectedOrder.status].label}
                    </span>
                    {selectedOrder.cancellationReason && (
                      <p className="text-xs text-[var(--bad)] mt-0.5">
                        Reason: {selectedOrder.cancellationReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status action toggle buttons */}
                {selectedOrder.status !== 'cancelled' && canUpdateOrderStatus && (
                  <div className="flex items-center gap-1.5">
                    {selectedOrder.status !== 'ready_for_handover' && (
                      <button
                        type="button"
                        onClick={() => void handleStatusChange(selectedOrder.id, 'ready_for_handover')}
                        className="px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-mono font-bold rounded-[var(--r-in)] cursor-pointer transition-colors shadow-xs"
                      >
                        Mark Ready
                      </button>
                    )}
                    {selectedOrder.status !== 'delivered' && (
                      <button
                        type="button"
                        onClick={() => void handleStatusChange(selectedOrder.id, 'delivered')}
                        className="px-3 py-1.5 bg-[var(--ink)] hover:bg-[var(--accent-solid)] text-[var(--on-ink)] hover:text-white text-xs font-mono font-bold rounded-[var(--r-in)] cursor-pointer transition-colors shadow-xs"
                      >
                        Mark Collected
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Student & Destination details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[var(--paper-2)] p-4 rounded-[var(--r-in)] border border-[var(--line)] space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-[var(--muted)]">
                    Customer Details
                  </h4>
                  <div className="text-xs space-y-1">
                    <p className="font-brand font-bold text-[var(--ink)]">{selectedOrder.customerName}</p>
                    {selectedOrder.rollNumber && selectedOrder.rollNumber !== 'ALUMNI / DIRECT' && (
                      <p className="font-mono text-[var(--accent)] font-semibold">
                        Roll No: {selectedOrder.rollNumber}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-[var(--muted)] font-mono">
                      <Phone className="w-3.5 h-3.5 text-[var(--muted)]" />
                      <span>{selectedOrder.phone}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-[var(--muted)] truncate">
                      <Mail className="w-3.5 h-3.5 text-[var(--muted)]" />
                      <span>{selectedOrder.email}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--paper-2)] p-4 rounded-[var(--r-in)] border border-[var(--line)] space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-[var(--muted)]">
                    Fulfillment Destination
                  </h4>
                  <div className="text-xs space-y-1">
                    {selectedOrder.handoverType === 'hostel_delivery' ? (
                      <>
                        <p className="font-bold text-[var(--info)] flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" />
                          <span>Hostel Evening Delivery</span>
                        </p>
                        <p className="text-[var(--ink)] font-medium">
                          {selectedOrder.hostelDetails?.hostelName}
                        </p>
                        <p className="font-mono font-bold text-[var(--ink)]">
                          Room: {selectedOrder.hostelDetails?.roomNumber}
                        </p>
                        <p className="text-[var(--muted)] text-[11px] font-mono">Slot: 7:00 PM - 9:00 PM</p>
                      </>
                    ) : selectedOrder.handoverType === 'home_delivery' ? (
                      <>
                        <p className="font-bold text-[var(--warn)] flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" />
                          <span>Home Delivery</span>
                        </p>
                        <p className="text-[var(--ink)]">
                          {selectedOrder.deliveryAddress?.addressLine}
                        </p>
                        <p className="text-[var(--muted)]">
                          {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} – {selectedOrder.deliveryAddress?.pincode}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-[var(--ok)] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Main Building Pickup Desk</span>
                        </p>
                        <p className="text-[var(--ink)]">Innovation Cell / Makerspace Desk</p>
                        <p className="text-[var(--muted)]">Ground Floor, Main Building</p>
                        <p className="text-[var(--muted)] text-[11px] font-mono">Desk Slot: 4:00 PM - 7:30 PM</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase text-[var(--muted)]">
                  Packaged Items ({selectedOrder.items.length})
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-in)] flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || '/assets/aistudio/ecell-varsity-jacket_daef387e.png'}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (!img.dataset.fallbackApplied) {
                              img.dataset.fallbackApplied = '1';
                              img.src = '/assets/aistudio/ecell-varsity-jacket_daef387e.png';
                            }
                          }}
                          className="w-12 h-12 object-contain bg-[var(--paper-2)] rounded-[var(--r-in)] border border-[var(--line)]"
                        />
                        <div>
                          <p className="font-brand font-bold text-xs text-[var(--ink)]">{item.name}</p>
                          <p className="text-[var(--muted)] font-mono text-[11px]">
                            Size: <span className="font-bold text-[var(--ink)]">{item.size}</span> • Color:{' '}
                            <span className="font-bold text-[var(--ink)]">{item.color}</span> • Qty:{' '}
                            <span className="font-bold text-[var(--ink)]">{item.quantity}</span>
                          </p>
                          {item.customDesign && (
                            <p className="text-[11px] font-mono font-bold text-[var(--accent)] flex items-center gap-1 mt-0.5">
                              <Sparkles className="w-3 h-3" />
                              <span>Embroidered Text: &quot;{item.customDesign.text}&quot;</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-[var(--ink)] tabular-nums">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Verification Clearance Section */}
              <div className="bg-[var(--paper-2)] p-4 rounded-[var(--r-in)] border border-[var(--line)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-[var(--muted)] block uppercase font-bold">
                      Payment Verification &amp; Proof
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-[var(--ink)]">
                        {selectedOrder.paymentMethod === 'upi_razorpay' ? 'Direct UPI' : 'Pay at Handover'}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-[var(--r-pill)] font-bold border ${
                          selectedOrder.verificationStatus === 'desk_verified'
                            ? 'bg-[var(--ok-soft)] text-[var(--ok)] border-[var(--ok-border)]'
                            : selectedOrder.verificationStatus === 'utr_submitted'
                            ? 'bg-[var(--info-soft)] text-[var(--info)] border-[var(--info-border)]'
                            : 'bg-[var(--warn-soft)] text-[var(--warn)] border-[var(--warn-border)]'
                        }`}
                      >
                        {(selectedOrder.verificationStatus || 'unverified').replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-[var(--muted)] block uppercase">
                      Total Amount
                    </span>
                    <span className="text-lg font-brand font-black font-mono text-[var(--accent)] block tabular-nums">
                      {formatINR(selectedOrder.total)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[var(--paper)] rounded-[var(--r-in)] border border-[var(--line)] space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)] font-medium">UPI Ref / UTR:</span>
                    <span className="font-bold text-[var(--ink)]">
                      {selectedOrder.utrNumber || 'Not submitted yet'}
                    </span>
                  </div>
                  {selectedOrder.verifiedBy && (
                    <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                      <span>Verified By:</span>
                      <span className="font-medium text-[var(--ink)]">{selectedOrder.verifiedBy}</span>
                    </div>
                  )}
                  {selectedOrder.verifiedAt && (
                    <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                      <span>Cleared At:</span>
                      <span>
                        {new Date(selectedOrder.verifiedAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {selectedOrder.verificationStatus !== 'desk_verified' &&
                  selectedOrder.status !== 'cancelled' &&
                  canVerifyPayments && (
                    <button
                      type="button"
                      onClick={async () => {
                        const officer = adminUser
                          ? `${adminUser.name} (${adminUser.roleTitle})`
                          : 'NITRRFIE Coordinator Admin';
                        const res = await verifyOrder(selectedOrder.id, {
                          utrNumber: selectedOrder.utrNumber,
                          verifiedBy: officer,
                        });
                        if (!res.success) return;
                        setSelectedOrder((prev) =>
                          prev
                            ? {
                                ...prev,
                                verificationStatus: 'desk_verified',
                                paymentStatus: 'paid',
                                status: prev.status === 'confirmed' ? 'preparing' : prev.status,
                                verifiedBy: officer,
                              }
                            : null
                        );
                        showNotification(`Payment verified for order ${selectedOrder.id}!`);
                      }}
                      className="w-full py-2.5 bg-[#15803D] hover:bg-[#166534] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-[var(--r-in)] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:translate-y-px"
                    >
                      <BadgeCheck className="w-4 h-4" />
                      <span>Approve Payment &amp; Issue Clearance Pass</span>
                    </button>
                  )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-[var(--paper-2)] border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <a
                  href={buildWhatsAppStudentPingUrl(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-[#168341] hover:bg-[#126B34] dark:bg-[#15803D] dark:hover:bg-[#166534] text-white font-mono text-xs font-bold rounded-[var(--r-in)] transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Notification</span>
                </a>

                {selectedOrder.status !== 'cancelled' && canCancelOrders && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderToCancel(selectedOrder);
                      setCancelReason('');
                    }}
                    className="px-3 py-2 text-xs font-mono font-bold text-[var(--warn)] hover:bg-[var(--warn-soft)] border border-[var(--warn-border)] rounded-[var(--r-in)] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Order</span>
                  </button>
                )}

                {canDeleteOrders && (
                  <button
                    type="button"
                    onClick={() => setOrderToDelete(selectedOrder)}
                    className="px-3 py-2 text-xs font-mono font-bold text-[var(--bad)] hover:bg-[var(--bad-soft)] border border-[var(--bad-border)] rounded-[var(--r-in)] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Order</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[var(--ink)] hover:bg-[var(--accent-solid)] text-[var(--on-ink)] hover:text-white font-mono text-xs font-bold rounded-[var(--r-in)] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Packing Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Cancel Order Confirmation Modal */}
      {orderToCancel && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setOrderToCancel(null)}
        >
          <div
            className="bg-[var(--paper)] rounded-[var(--r)] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[var(--line)] space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--warn-soft)] border border-[var(--warn-border)] text-[var(--warn)] flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-brand text-base font-bold text-[var(--ink)]">
                  Cancel Order #{orderToCancel.id}?
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Cancelling atomically restores item inventory and retains an auditable trail
                  {orderToCancel.paymentStatus === 'paid'
                    ? ' (payment will be flagged as Refund Pending).'
                    : '.'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold uppercase text-[var(--muted)] block">
                Cancellation Reason
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Duplicate UTR / Customer requested cancellation"
                className="w-full px-3 py-2 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-xs font-mono text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="px-4 py-2 text-xs font-mono font-bold text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] rounded-[var(--r-in)] cursor-pointer transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await cancelOrder(
                    orderToCancel.id,
                    cancelReason.trim() || 'Cancelled by store administrator'
                  );
                  if (res.success) {
                    showNotification(`Order #${orderToCancel.id} cancelled and stock restored.`);
                    if (selectedOrder && selectedOrder.id === orderToCancel.id) {
                      setSelectedOrder(null);
                    }
                    setOrderToCancel(null);
                  }
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-mono font-bold rounded-[var(--r-in)] shadow-xs cursor-pointer transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setOrderToDelete(null)}
        >
          <div
            className="bg-[var(--paper)] rounded-[var(--r)] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[var(--line)] space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-brand text-base font-bold text-[var(--ink)]">
                  Delete Order Record?
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Are you sure you want to permanently remove Order #{orderToDelete.id} ({orderToDelete.customerName})? For standard order closures, Cancel Order is recommended to preserve the audit trail.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-xs font-mono font-bold text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] rounded-[var(--r-in)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await deleteOrder(orderToDelete.id);
                  if (res.success) {
                    showNotification(`Order #${orderToDelete.id} permanently deleted.`);
                    if (selectedOrder && selectedOrder.id === orderToDelete.id) {
                      setSelectedOrder(null);
                    }
                    setOrderToDelete(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold rounded-[var(--r-in)] shadow-xs cursor-pointer transition-colors"
              >
                Yes, Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
