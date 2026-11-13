import React from 'react';
import { Building, Truck, MapPin } from 'lucide-react';
import { HandoverType } from '../../types/store';
import { CheckoutErrors } from '../types';

interface CampusHandoverSectionProps {
  handoverType: HandoverType;
  setHandoverType: (val: HandoverType) => void;
  addressLine: string;
  setAddressLine: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  state: string;
  setState: (val: string) => void;
  pincode: string;
  setPincode: (val: string) => void;
  landmark: string;
  setLandmark: (val: string) => void;
  errors: CheckoutErrors;
}

export const CampusHandoverSection: React.FC<CampusHandoverSectionProps> = ({
  handoverType,
  setHandoverType,
  addressLine,
  setAddressLine,
  city,
  setCity,
  state,
  setState,
  pincode,
  setPincode,
  landmark,
  setLandmark,
  errors,
}) => {
  return (
    <div className="bg-[var(--paper)] p-6 sm:p-7 rounded-[var(--r)] border border-[var(--line)] space-y-5 shadow-sm">
      <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
        <div className="w-6 h-6 rounded-[var(--r-in)] bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(252,76,2,0.2)] flex items-center justify-center font-mono font-bold text-xs">
          2
        </div>
        <div>
          <h2 className="text-base font-brand font-bold text-[var(--ink)]">Fulfillment &amp; Delivery Method</h2>
          <p className="text-xs text-[var(--muted)]">Choose Pan-India express courier delivery or NIT Raipur campus pickup</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option 1: Pan-India Express Delivery */}
        <button
          type="button"
          onClick={() => setHandoverType('home_delivery')}
          aria-pressed={handoverType === 'home_delivery' || handoverType === 'hostel_delivery'}
          className={`w-full text-left p-4 rounded-[var(--r-in)] border transition-all cursor-pointer ${
            handoverType === 'home_delivery' || handoverType === 'hostel_delivery'
              ? 'border-[var(--ink)] bg-[var(--paper-2)] ring-1 ring-[var(--ink)]'
              : 'border-[var(--line)] hover:border-[var(--line-2)] hover:bg-[var(--paper-2)]/50 bg-[var(--paper)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-brand font-bold text-[var(--ink)] text-sm">Pan-India Express Delivery</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
            Doorstep courier across all Indian states &amp; PIN codes with tracking
          </p>
        </button>

        {/* Option 2: Campus Pickup Desk */}
        <button
          type="button"
          onClick={() => setHandoverType('makerspace_desk')}
          aria-pressed={handoverType === 'makerspace_desk'}
          className={`w-full text-left p-4 rounded-[var(--r-in)] border transition-all cursor-pointer ${
            handoverType === 'makerspace_desk'
              ? 'border-[var(--ink)] bg-[var(--paper-2)] ring-1 ring-[var(--ink)]'
              : 'border-[var(--line)] hover:border-[var(--line-2)] hover:bg-[var(--paper-2)]/50 bg-[var(--paper)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-brand font-bold text-[var(--ink)] text-sm">NIT Raipur Campus Pickup</span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
            Makerspace Desk, Ground Floor, Main Building • 4:00 PM – 7:30 PM (Free on-spot sizing exchange)
          </p>
        </button>
      </div>

      {/* Conditional Home Delivery Address Inputs */}
      {(handoverType === 'home_delivery' || handoverType === 'hostel_delivery') && (
        <div className="p-5 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--ink)] uppercase">
            <MapPin className="w-4 h-4 text-[var(--accent)]" />
            <span>Pan-India Shipping Destination</span>
          </div>

          <div className="space-y-3">
            {/* Street Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-[var(--ink-2)] block">
                Door / Flat / House No., Street, Area <span className="text-[var(--accent)]">*</span>
              </label>
              <textarea
                rows={2}
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Enter your complete delivery address"
                className="w-full px-3.5 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-sm outline-none transition-all placeholder:text-[var(--muted)] text-[var(--ink)] resize-none"
              />
              {errors.addressLine && (
                <p className="text-[11px] font-mono text-[var(--bad)]">{errors.addressLine}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* City */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-[var(--ink-2)] block">
                  City <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter your city"
                  className="w-full px-3.5 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-sm outline-none transition-all placeholder:text-[var(--muted)] text-[var(--ink)]"
                />
                {errors.city && (
                  <p className="text-[11px] font-mono text-[var(--bad)]">{errors.city}</p>
                )}
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-[var(--ink-2)] block">
                  State <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Enter your state"
                  className="w-full px-3.5 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-sm outline-none transition-all placeholder:text-[var(--muted)] text-[var(--ink)]"
                />
                {errors.state && (
                  <p className="text-[11px] font-mono text-[var(--bad)]">{errors.state}</p>
                )}
              </div>

              {/* PIN Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-[var(--ink-2)] block">
                  PIN Code <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter your PIN code"
                  maxLength={6}
                  className="w-full px-3.5 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper)] font-mono focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-sm outline-none transition-all placeholder:text-[var(--muted)] text-[var(--ink)]"
                />
                {errors.pincode && (
                  <p className="text-[11px] font-mono text-[var(--bad)]">{errors.pincode}</p>
                )}
              </div>
            </div>

            {/* Landmark */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-[var(--ink-2)] block">
                Landmark / Delivery Instructions <span className="text-[var(--muted)] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Landmark or delivery instructions (optional)"
                className="w-full px-3.5 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 text-sm outline-none transition-all placeholder:text-[var(--muted)] text-[var(--ink)]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
