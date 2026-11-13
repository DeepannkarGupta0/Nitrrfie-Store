import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Coupon } from '../../types/store';
import { Tag, Plus, Check, X, Percent, IndianRupee, Sparkles, ShieldCheck, Edit3, Trash2, Calendar } from 'lucide-react';

export const CouponsManager: React.FC = () => {
  const { coupons, addCoupon, toggleCouponActive, updateCoupon, deleteCoupon } = useCart();
  const { adminUser } = useAdminAuth();

  const canManageCoupons = adminUser?.permissions?.manageCoupons !== false;

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(499);
  const [maxDiscount, setMaxDiscount] = useState<number>(500);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [description, setDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editDiscountType, setEditDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [editDiscountValue, setEditDiscountValue] = useState<number>(10);
  const [editMinOrderAmount, setEditMinOrderAmount] = useState<number>(0);
  const [editMaxDiscount, setEditMaxDiscount] = useState<string>('');
  const [editExpiresAt, setEditExpiresAt] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCoupons || isSubmitting) return;
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      setFeedback({ type: 'err', text: 'Coupon code must be at least 3 characters.' });
      return;
    }
    if (discountValue <= 0) {
      setFeedback({ type: 'err', text: 'Discount value must be greater than zero.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addCoupon({
        code: cleanCode,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount: discountType === 'percentage' ? maxDiscount : undefined,
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59.999Z`).toISOString() : undefined,
        isActive: true,
        description:
          description.trim() ||
          `${discountType === 'percentage' ? `${discountValue}% off` : `₹${discountValue} flat off`} on eligible orders.`,
      });

      if (!res.success) {
        setFeedback({ type: 'err', text: res.error || 'Failed to create coupon.' });
        return;
      }

      setCode('');
      setDescription('');
      setExpiresAt('');
      setShowAddForm(false);
      setFeedback({ type: 'ok', text: `Promo code "${cleanCode}" saved to central store database.` });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditDiscountType(coupon.discountType);
    setEditDiscountValue(coupon.discountValue);
    setEditMinOrderAmount(coupon.minOrderAmount);
    setEditMaxDiscount(coupon.maxDiscount ? String(coupon.maxDiscount) : '');
    setEditExpiresAt(coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '');
    setEditDescription(coupon.description || '');
    setEditIsActive(coupon.isActive);
    setShowAddForm(false);
  };

  const handleSaveEditCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCoupons || !editingCoupon || isSubmitting) return;
    if (editDiscountValue <= 0) {
      setFeedback({ type: 'err', text: 'Discount value must be greater than zero.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedCap =
        editDiscountType === 'percentage' && editMaxDiscount.trim()
          ? Number(editMaxDiscount)
          : undefined;

      const res = await updateCoupon(editingCoupon.code, {
        discountType: editDiscountType,
        discountValue: editDiscountValue,
        minOrderAmount: editMinOrderAmount,
        maxDiscount: parsedCap && parsedCap > 0 ? parsedCap : undefined,
        expiresAt: editExpiresAt
          ? new Date(`${editExpiresAt}T23:59:59.999Z`).toISOString()
          : undefined,
        isActive: editIsActive,
        description:
          editDescription.trim() ||
          `${editDiscountType === 'percentage' ? `${editDiscountValue}% off` : `₹${editDiscountValue} flat off`} on eligible orders.`,
      });

      if (!res.success) {
        setFeedback({ type: 'err', text: res.error || 'Failed to update coupon.' });
        return;
      }

      const updatedCode = editingCoupon.code;
      setEditingCoupon(null);
      setFeedback({ type: 'ok', text: `Promo code "${updatedCode}" updated in central database.` });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteCoupon = async () => {
    if (!canManageCoupons || !couponToDelete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await deleteCoupon(couponToDelete.code);
      if (!res.success) {
        setFeedback({ type: 'err', text: res.error || 'Failed to delete coupon.' });
        return;
      }
      const deleted = couponToDelete.code;
      setCouponToDelete(null);
      if (editingCoupon?.code === deleted) setEditingCoupon(null);
      setFeedback({ type: 'ok', text: `Promo code "${deleted}" removed from central database.` });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRedemptions = coupons.reduce((sum, c) => sum + c.usageCount, 0);
  const activeCount = coupons.filter((c) => c.isActive).length;
  const maxConcessionCap = coupons.reduce((max, c) => {
    const cap = c.maxDiscount ?? (c.discountType === 'fixed' ? c.discountValue : 0);
    return cap > max ? cap : max;
  }, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(252,76,2,0.25)]">
              <Tag className="w-3 h-3" /> Promotions &amp; Discounts
            </span>
          </div>
          <h2 className="text-2xl font-serif text-[var(--ink)]">Institutional Voucher &amp; Coupon Engine</h2>
          <p className="text-sm text-[var(--muted)]">Configure sitewide discount codes, alumni grants, and promotional concessions.</p>
        </div>

        {canManageCoupons && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--ink)] text-[var(--on-ink)] text-sm font-medium hover:bg-[var(--accent-solid)] hover:text-white transition shadow-sm cursor-pointer"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Close Editor' : 'Create Voucher Code'}
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center gap-2 border ${
            feedback.type === 'err'
              ? 'bg-[var(--bad-soft)] border-[var(--bad-border)] text-[var(--bad)]'
              : 'bg-[var(--ok-soft)] border-[var(--ok-border)] text-[var(--ok)]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          {feedback.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--paper)]">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-mono">Active Campaigns</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-semibold text-[var(--ink)]">{activeCount}</span>
            <span className="text-xs text-[var(--muted)]">of {coupons.length} total</span>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--paper)]">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-mono">Total Redemptions</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-semibold text-[var(--ok)]">{totalRedemptions}</span>
            <span className="text-xs text-[var(--muted)]">orders discounted</span>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--paper)]">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-mono">Max Concession Cap</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-semibold text-[var(--accent)]">
              {maxConcessionCap > 0 ? `₹${maxConcessionCap.toLocaleString('en-IN')}` : 'Uncapped'}
            </span>
            <span className="text-xs text-[var(--muted)]">per transaction</span>
          </div>
        </div>
      </div>

      {/* Add Coupon Portal Form */}
      {showAddForm && (
        <form onSubmit={handleCreateCoupon} className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--line)]">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-base font-semibold text-[var(--ink)]">Deploy New Coupon Voucher</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">Coupon Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. FEST2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-sm font-mono uppercase text-[var(--ink)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">Discount Type</label>
              <div className="flex rounded-lg border border-[var(--line)] bg-[var(--paper)] p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    discountType === 'percentage'
                      ? 'bg-[var(--ink)] text-[var(--on-ink)]'
                      : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]'
                  }`}
                >
                  <Percent className="w-3 h-3" /> Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    discountType === 'fixed'
                      ? 'bg-[var(--ink)] text-[var(--on-ink)]'
                      : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]'
                  }`}
                >
                  <IndianRupee className="w-3 h-3" /> Flat INR (₹)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">
                {discountType === 'percentage' ? 'Discount Percentage (%) *' : 'Flat Amount (₹) *'}
              </label>
              <input
                type="number"
                min="1"
                max={discountType === 'percentage' ? 90 : 5000}
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">Min Cart Subtotal (₹)</label>
              <input
                type="number"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
              />
            </div>

            {discountType === 'percentage' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">Max Cap (₹)</label>
                <input
                  type="number"
                  min="50"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">Description / Terms</label>
            <input
              type="text"
              placeholder="e.g. Valid on official athletic merchandise and hoodies"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)] rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-medium rounded-lg bg-[var(--accent-solid)] text-white enabled:hover:bg-[var(--accent-solid-hover)] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition cursor-pointer"
            >
              {isSubmitting ? 'Deploying...' : 'Deploy Promo Voucher'}
            </button>
          </div>
        </form>
      )}

      {/* Edit Existing Coupon Form */}
      {editingCoupon && (
        <form onSubmit={handleSaveEditCoupon} className="p-6 rounded-2xl border border-[var(--accent)]/40 bg-[var(--paper-2)] space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--line)]">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-base font-semibold text-[var(--ink)]">
                Edit Voucher: <span className="font-mono">{editingCoupon.code}</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setEditingCoupon(null)}
              className="p-1 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              aria-label="Close voucher edit panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">Discount Type</label>
              <div className="flex rounded-lg border border-[var(--line)] bg-[var(--paper)] p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setEditDiscountType('percentage')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    editDiscountType === 'percentage'
                      ? 'bg-[var(--ink)] text-[var(--on-ink)]'
                      : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]'
                  }`}
                >
                  <Percent className="w-3 h-3" /> %
                </button>
                <button
                  type="button"
                  onClick={() => setEditDiscountType('fixed')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    editDiscountType === 'fixed'
                      ? 'bg-[var(--ink)] text-[var(--on-ink)]'
                      : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)]'
                  }`}
                >
                  <IndianRupee className="w-3 h-3" /> ₹
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">
                {editDiscountType === 'percentage' ? 'Percentage (%) *' : 'Flat Amount (₹) *'}
              </label>
              <input
                type="number"
                min="1"
                max={editDiscountType === 'percentage' ? 90 : 5000}
                required
                value={editDiscountValue}
                onChange={(e) => setEditDiscountValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">Min Cart Subtotal (₹)</label>
              <input
                type="number"
                min="0"
                value={editMinOrderAmount}
                onChange={(e) => setEditMinOrderAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {editDiscountType === 'percentage' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">Max Cap (₹)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Uncapped"
                  value={editMaxDiscount}
                  onChange={(e) => setEditMaxDiscount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">Expiry Date</label>
              <input
                type="date"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-mono text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)]"
                />
                <span>Voucher Active</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-1.5">Description / Terms</label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingCoupon(null)}
              className="px-4 py-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)] rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-medium rounded-lg bg-[var(--accent-solid)] text-white enabled:hover:bg-[var(--accent-solid-hover)] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Voucher Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Coupons Table */}
      <div className="border border-[var(--line)] rounded-2xl overflow-hidden bg-[var(--paper)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--paper-2)] text-xs font-mono uppercase text-[var(--muted)] tracking-wider">
                <th className="py-3 px-4 font-medium">Voucher Code</th>
                <th className="py-3 px-4 font-medium">Discount Value</th>
                <th className="py-3 px-4 font-medium">Order Threshold</th>
                <th className="py-3 px-4 font-medium">Times Used</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] font-sans">
              {coupons.map((coupon) => {
                const isExpired = Boolean(
                  coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()
                );
                return (
                  <tr key={coupon.code} className="hover:bg-[var(--paper-2)]/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)] tracking-wider">
                          {coupon.code}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-1">{coupon.description}</p>
                      {coupon.expiresAt && (
                        <p className="text-[11px] font-mono text-[var(--muted)] mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Expires {new Date(coupon.expiresAt).toLocaleDateString('en-IN')}
                            {isExpired ? ' (Expired)' : ''}
                          </span>
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[var(--ink)]">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Flat`}
                      {coupon.maxDiscount ? <span className="block text-xs font-normal text-[var(--muted)]">up to ₹{coupon.maxDiscount}</span> : null}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--muted)]">
                      Min. ₹{coupon.minOrderAmount}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--paper-2)] text-[var(--ink)] border border-[var(--line)]">
                        {coupon.usageCount} orders
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          coupon.isActive && !isExpired
                            ? 'bg-[var(--ok-soft)] text-[var(--ok)] border-[var(--ok-border)]'
                            : 'bg-[var(--paper-2)] text-[var(--muted)] border-[var(--line)]'
                        }`}
                      >
                        {coupon.isActive && !isExpired ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canManageCoupons ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditCoupon(coupon)}
                            title="Edit voucher settings"
                            className="p-1.5 rounded-md border border-[var(--line)] bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-[var(--ink)] cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await toggleCouponActive(coupon.code);
                              if (!res.success) {
                                setFeedback({ type: 'err', text: res.error || 'Failed to update coupon.' });
                              }
                            }}
                            className={`px-3 py-1 text-xs rounded-md font-medium border transition cursor-pointer ${
                              coupon.isActive
                                ? 'bg-[var(--bad-soft)] text-[var(--bad)] border-[var(--bad-border)] hover:bg-red-100 dark:hover:bg-red-500/20'
                                : 'bg-[var(--ok-soft)] text-[var(--ok)] border-[var(--ok-border)] hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                            }`}
                          >
                            {coupon.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCouponToDelete(coupon)}
                            title="Delete voucher"
                            className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--bad)] hover:bg-[var(--bad-soft)] cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-[var(--muted)]">Read-only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Coupon Confirmation Modal */}
      {couponToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setCouponToDelete(null)}
        >
          <div
            className="bg-[var(--paper)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--line)] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bad-soft)] border border-[var(--bad-border)] text-[var(--bad)] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-brand text-base font-bold text-[var(--ink)]">
                  Delete Voucher {couponToDelete.code}?
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  This permanently removes the coupon from the central database so customers can no longer apply it at checkout.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                className="px-4 py-2 text-xs font-mono font-bold text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDeleteCoupon}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-mono font-bold rounded-lg cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
