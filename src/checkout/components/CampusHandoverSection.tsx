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
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#EBE7DF] shadow-2xs space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-7 h-7 rounded-lg bg-[#FFF3EB] text-[#FA5B29] flex items-center justify-center font-bold text-xs">
          2
        </div>
        <h2 className="text-base font-bold text-slate-900">Delivery / Handover Method</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Option 1: Makerspace Desk Option */}
        <div
          onClick={() => setHandoverType('makerspace_desk')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            handoverType === 'makerspace_desk'
              ? 'border-slate-900 bg-slate-50/70 shadow-2xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#FA5B29]" />
            <span className="font-bold text-slate-900 text-sm">Makerspace Desk Handover</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ground Floor, Main Building • 4:00 PM – 7:30 PM (Free size exchanges on spot)
          </p>
        </div>

        {/* Option 2: Home Delivery Option */}
        <div
          onClick={() => setHandoverType('home_delivery')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            handoverType === 'home_delivery' || handoverType === 'hostel_delivery'
              ? 'border-slate-900 bg-slate-50/70 shadow-2xs'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#FA5B29]" />
            <span className="font-bold text-slate-900 text-sm">Home Delivery</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Direct door delivery to your residence / campus address across India
          </p>
        </div>
      </div>

      {/* Conditional Home Delivery Address Inputs */}
      {(handoverType === 'home_delivery' || handoverType === 'hostel_delivery') && (
        <div className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <MapPin className="w-4 h-4 text-[#FA5B29]" />
            <span>Shipping / Delivery Address</span>
          </div>

          <div className="space-y-3">
            {/* Street Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Street Address / Flat No. / House / Hostel & Room <span className="text-[#FA5B29]">*</span>
              </label>
              <textarea
                rows={2}
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="e.g. Flat 302, Green Valley Apts, VIP Road / Hostel H-2 Room 114"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 resize-none"
              />
              {errors.addressLine && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.addressLine}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* City */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  City <span className="text-[#FA5B29]">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Raipur"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
                />
                {errors.city && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.city}</p>
                )}
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  State <span className="text-[#FA5B29]">*</span>
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Chhattisgarh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
                />
                {errors.state && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.state}</p>
                )}
              </div>

              {/* PIN Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  PIN Code <span className="text-[#FA5B29]">*</span>
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="e.g. 492010"
                  maxLength={6}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
                />
                {errors.pincode && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.pincode}</p>
                )}
              </div>
            </div>

            {/* Landmark */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Landmark / Delivery Instructions <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near NIT Raipur Main Gate / Opposite Central Tower"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
