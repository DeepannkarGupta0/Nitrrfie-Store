import React, { useState, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { CustomerSummary } from '../../types/store';
import { formatINR } from '../../utils/cartLogic';
import { Users, Search, Phone, Mail, MapPin, Building, ExternalLink, Calendar, ShoppingBag, ShieldCheck } from 'lucide-react';

export const CustomersManager: React.FC = () => {
  const { getCustomerRoster } = useCart();
  const [search, setSearch] = useState('');

  const customers: CustomerSummary[] = useMemo(() => {
    return getCustomerRoster();
  }, [getCustomerRoster]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.rollNumber || '').toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [customers, search]);

  const totalSpend = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const repeatCount = customers.filter((c) => c.orderCount > 1).length;
  const avgLtv = customers.length > 0 ? Math.round(totalSpend / customers.length) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info-border)]">
              <Users className="w-3 h-3" /> Customer Intelligence &amp; Roster
            </span>
          </div>
          <h2 className="text-2xl font-serif text-[var(--ink)]">Student, Faculty &amp; Alumni Client Directory</h2>
          <p className="text-sm text-[var(--muted)]">Aggregated profiles, purchase frequencies, and direct handover contact channels.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, roll, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--paper)] border border-[var(--line)] text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
          />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--paper)]">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-mono">Unique Customers</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-semibold text-[var(--ink)]">{customers.length}</span>
            <span className="text-xs text-[var(--muted)]">registered profiles</span>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--paper)]">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-mono">Repeat Buyers</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-semibold text-[var(--ok)]">{repeatCount}</span>
            <span className="text-xs text-[var(--muted)]">
              {customers.length > 0 ? `${Math.round((repeatCount / customers.length) * 100)}% retention` : '0%'}
            </span>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--paper)]">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-mono">Total Cumulative Value</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-semibold text-[var(--ink)]">₹{totalSpend.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--paper)]">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-mono">Average LTV</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-semibold text-[var(--accent)]">₹{avgLtv.toLocaleString('en-IN')}</span>
            <span className="text-xs text-[var(--muted)]">per patron</span>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="border border-[var(--line)] rounded-2xl overflow-hidden bg-[var(--paper)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--paper-2)] text-xs font-mono uppercase text-[var(--muted)] tracking-wider">
              <th className="py-3 px-4 font-medium">Customer Profile</th>
              <th className="py-3 px-4 font-medium">Contact Details</th>
              <th className="py-3 px-4 font-medium">Order Frequency</th>
              <th className="py-3 px-4 font-medium">Lifetime Spend</th>
              <th className="py-3 px-4 font-medium">Handover Mode</th>
              <th className="py-3 px-4 font-medium text-right">Quick Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] font-sans">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-[var(--muted)]">
                  No customers found matching search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-[var(--paper-2)]/70 transition">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[var(--ink)]">{customer.name}</p>
                    <span className="inline-block mt-0.5 font-mono text-xs px-2 py-0.5 rounded bg-[var(--paper-2)] text-[var(--muted)] border border-[var(--line)]">
                      {customer.rollNumber && customer.rollNumber !== 'ALUMNI / DIRECT'
                        ? customer.rollNumber
                        : 'Direct Buyer'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[var(--muted)]">
                      <Mail className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                      <span className="truncate max-w-[180px]">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--muted)]">
                      <Phone className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                      <span>+91 {customer.phone}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--paper-2)] text-[var(--ink)] border border-[var(--line)]">
                      <ShoppingBag className="w-3 h-3 text-[var(--muted)]" /> {customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}
                    </span>
                    <p className="text-[10px] text-[var(--muted)] mt-1">
                      Last: {new Date(customer.lastOrderDate).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[var(--ink)]">
                    ₹{customer.totalSpent.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    {customer.lastDeliveryType === 'makerspace_desk' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[var(--warn-soft)] text-[var(--warn)] border border-[var(--warn-border)]">
                        <Building className="w-3 h-3" /> Makerspace Desk
                      </span>
                    )}
                    {customer.lastDeliveryType === 'hostel_delivery' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30">
                        <MapPin className="w-3 h-3" /> Hostel Delivery
                      </span>
                    )}
                    {customer.lastDeliveryType === 'home_delivery' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info-border)]">
                        <MapPin className="w-3 h-3" /> Home Delivery
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={`https://wa.me/91${customer.phone}?text=${encodeURIComponent(
                        `Hello ${customer.name}, this is the NIT Raipur Store verification & handover team regarding your campus merchandise order.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md font-medium bg-[var(--ok-soft)] text-[var(--ok)] border border-[var(--ok-border)] hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition"
                    >
                      Ping on WhatsApp <ExternalLink className="w-3 h-3" />
                    </a>
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
