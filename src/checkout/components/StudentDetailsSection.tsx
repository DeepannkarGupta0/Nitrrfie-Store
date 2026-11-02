import React from 'react';
import { CheckoutErrors } from '../types';

interface StudentDetailsSectionProps {
  customerName: string;
  setCustomerName: (val: string) => void;
  rollNumber: string;
  setRollNumber: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  errors: CheckoutErrors;
}

export const StudentDetailsSection: React.FC<StudentDetailsSectionProps> = ({
  customerName,
  setCustomerName,
  rollNumber,
  setRollNumber,
  email,
  setEmail,
  phone,
  setPhone,
  errors,
}) => {
  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#EBE7DF] shadow-2xs space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-7 h-7 rounded-lg bg-[#FFF3EB] text-[#FA5B29] flex items-center justify-center font-bold text-xs">
          1
        </div>
        <h2 className="text-base font-bold text-slate-900">Student Details</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Full Name <span className="text-[#FA5B29]">*</span>
          </label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Aditya Verma"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
          />
          {errors.customerName && (
            <p className="text-[11px] text-rose-600 font-medium">{errors.customerName}</p>
          )}
        </div>

        {/* Roll Number / Student ID without any assumption */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Roll Number / Student ID <span className="text-[#FA5B29]">*</span>
          </label>
          <input
            type="text"
            required
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
            placeholder="e.g. 21115042"
            maxLength={16}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm outline-none font-mono uppercase transition-all placeholder:text-slate-400"
          />
          {errors.rollNumber && (
            <p className="text-[11px] text-rose-600 font-medium">{errors.rollNumber}</p>
          )}
        </div>

        {/* Institute Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Institute Email <span className="text-[#FA5B29]">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. student@nitrr.ac.in"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
          />
          {errors.email && (
            <p className="text-[11px] text-rose-600 font-medium">{errors.email}</p>
          )}
        </div>

        {/* WhatsApp Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            WhatsApp Phone <span className="text-[#FA5B29]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
              +91
            </span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9827103849"
              maxLength={12}
              className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm outline-none font-mono transition-all placeholder:text-slate-400"
            />
          </div>
          {errors.phone && (
            <p className="text-[11px] text-rose-600 font-medium">{errors.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
};
