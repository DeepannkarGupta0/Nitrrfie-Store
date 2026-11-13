import React from 'react';
import { CheckoutErrors } from '../types';

interface StudentDetailsSectionProps {
  customerName: string;
  setCustomerName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  errors: CheckoutErrors;
}

export const StudentDetailsSection: React.FC<StudentDetailsSectionProps> = ({
  customerName,
  setCustomerName,
  email,
  setEmail,
  phone,
  setPhone,
  errors,
}) => {
  return (
    <div className="bg-[var(--paper)] p-6 sm:p-7 rounded-[var(--r)] border border-[var(--line)] space-y-5 shadow-sm">
      <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
        <div className="w-6 h-6 rounded-[var(--r-in)] bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(252,76,2,0.2)] flex items-center justify-center font-mono font-bold text-xs">
          1
        </div>
        <div>
          <h2 className="text-base font-brand font-bold text-[var(--ink)]">Customer Details</h2>
          <p className="text-xs text-[var(--muted)]">Enter your contact details for order confirmation and updates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-mono font-semibold text-[var(--ink-2)] block">
            Full Name <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            type="text"
            required
            autoComplete="name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-3.5 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-sm outline-none transition-all placeholder:text-[var(--muted)] text-[var(--ink)]"
          />
          {errors.customerName && (
            <p className="text-[11px] font-mono text-[var(--bad)]">{errors.customerName}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-semibold text-[var(--ink-2)] block">
            Email Address <span className="text-[var(--accent)]">*</span>
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full px-3.5 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-sm outline-none transition-all placeholder:text-[var(--muted)] text-[var(--ink)]"
          />
          {errors.email && (
            <p className="text-[11px] font-mono text-[var(--bad)]">{errors.email}</p>
          )}
        </div>

        {/* Mobile / WhatsApp Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-semibold text-[var(--ink-2)] block">
            Mobile Number <span className="text-[var(--accent)]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--muted)]">
              +91
            </span>
            <input
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your mobile number"
              maxLength={12}
              className="w-full pl-12 pr-3.5 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-sm outline-none font-mono transition-all placeholder:text-[var(--muted)] text-[var(--ink)]"
            />
          </div>
          {errors.phone && (
            <p className="text-[11px] font-mono text-[var(--bad)]">{errors.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
};
