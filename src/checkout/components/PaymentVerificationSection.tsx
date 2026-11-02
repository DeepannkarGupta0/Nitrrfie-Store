import React, { useRef, useState } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Upload,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import {
  STORE_UPI_ID,
  COORDINATOR_PHONE,
  formatINR,
} from '../checkoutLogic';
import { CheckoutErrors } from '../types';

interface PaymentVerificationSectionProps {
  paymentMethod: 'upi_razorpay' | 'cash_at_desk';
  setPaymentMethod: (val: 'upi_razorpay' | 'cash_at_desk') => void;
  utrNumber: string;
  setUtrNumber: (val: string) => void;
  receiptImage: string | null;
  setReceiptImage: (val: string | null) => void;
  totalAmount: number;
  customerName: string;
  errors: CheckoutErrors;
  setErrors: React.Dispatch<React.SetStateAction<CheckoutErrors>>;
  isPaymentVerified: boolean;
  onVerifyPayment: () => void;
  onResetVerification: () => void;
}

export const PaymentVerificationSection: React.FC<PaymentVerificationSectionProps> = ({
  utrNumber,
  setUtrNumber,
  receiptImage,
  setReceiptImage,
  totalAmount,
  errors,
  setErrors,
  isPaymentVerified,
  onVerifyPayment,
  onResetVerification,
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formattedCoordinatorPhone = COORDINATOR_PHONE.startsWith('91')
    ? `+91 ${COORDINATOR_PHONE.slice(2)}`
    : `+91 ${COORDINATOR_PHONE}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(STORE_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, receipt: 'Screenshot must be under 5MB' }));
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptImage(event.target?.result as string);
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.receipt;
          return updated;
        });
        onResetVerification();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUtrChange = (val: string) => {
    setUtrNumber(val.replace(/\s/g, ''));
    if (isPaymentVerified) {
      onResetVerification();
    }
  };

  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#EBE7DF] shadow-2xs space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#E7F8ED] text-[#25D366] flex items-center justify-center font-bold text-xs">
            3
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment &amp; WhatsApp Manual Verification</h2>
            <p className="text-xs text-slate-500">
              Manual verification via Coordinator Desk ({formattedCoordinatorPhone})
            </p>
          </div>
        </div>
        {isPaymentVerified && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F8ED] border border-[#B3E8C8] text-[#1EBE5D] font-mono text-[11px] font-bold">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>WHATSAPP DISPATCHED</span>
          </span>
        )}
      </div>

      {/* Online UPI Details Box */}
      <div className="p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-5">
        {/* QR Code and Payment Coordinates */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Visual QR Code Card */}
          <div className="flex flex-col items-center bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs text-center shrink-0">
            <div className="p-1.5 bg-white rounded-xl border border-slate-900 mb-2">
              <svg
                className="w-28 h-28"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="100" height="100" fill="white" />
                <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="4" />
                <rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
                <rect x="13" y="13" width="12" height="12" fill="#0f172a" rx="1" />

                <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="4" />
                <rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
                <rect x="75" y="13" width="12" height="12" fill="#0f172a" rx="1" />

                <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="4" />
                <rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
                <rect x="13" y="75" width="12" height="12" fill="#0f172a" rx="1" />

                <rect x="40" y="8" width="6" height="6" fill="#0f172a" />
                <rect x="50" y="8" width="6" height="6" fill="#0f172a" />
                <rect x="40" y="20" width="10" height="6" fill="#0f172a" />
                <rect x="54" y="20" width="6" height="6" fill="#0f172a" />
                <rect x="44" y="30" width="16" height="6" fill="#0f172a" />

                <rect x="8" y="40" width="6" height="10" fill="#0f172a" />
                <rect x="20" y="40" width="8" height="6" fill="#0f172a" />
                <rect x="32" y="40" width="14" height="6" fill="#0f172a" />
                <rect x="50" y="40" width="10" height="8" fill="#0f172a" />
                <rect x="64" y="40" width="8" height="16" fill="#0f172a" />
                <rect x="76" y="40" width="16" height="6" fill="#0f172a" />

                <rect x="10" y="54" width="16" height="6" fill="#0f172a" />
                <rect x="30" y="50" width="8" height="16" fill="#0f172a" />
                <rect x="42" y="52" width="18" height="8" fill="#0f172a" />
                <rect x="76" y="50" width="16" height="10" fill="#0f172a" />

                <rect x="40" y="66" width="8" height="16" fill="#0f172a" />
                <rect x="52" y="64" width="8" height="10" fill="#0f172a" />
                <rect x="64" y="66" width="12" height="8" fill="#0f172a" />
                <rect x="80" y="64" width="12" height="12" fill="#0f172a" />

                <rect x="40" y="84" width="18" height="8" fill="#0f172a" />
                <rect x="62" y="78" width="8" height="14" fill="#0f172a" />
                <rect x="74" y="80" width="18" height="12" fill="#0f172a" />

                <rect x="42" y="42" width="16" height="16" fill="white" rx="3" />
                <rect x="44" y="44" width="12" height="12" fill="#25D366" rx="2" />
                <text
                  x="50"
                  y="53"
                  textAnchor="middle"
                  fill="white"
                  fontSize="7"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  NIT
                </text>
              </svg>
            </div>

            <div className="font-mono text-sm font-black text-slate-950">
              {formatINR(totalAmount)}
            </div>
          </div>

          {/* VPA Coordinates */}
          <div className="flex-1 space-y-2.5 w-full">
            <span className="text-xs font-semibold text-slate-700 block">
              Official Store UPI ID
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-xs font-bold text-slate-900 truncate">
                {STORE_UPI_ID}
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Scan QR or copy UPI ID to pay using Google Pay, PhonePe, Paytm, BHIM, or any UPI app.
            </p>
          </div>
        </div>

        {/* Verification Fields: UTR and Slip Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2 border-t border-slate-200/80">
          {/* UTR Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              12-Digit UPI Ref / UTR No. <span className="text-[#FA5B29]">*</span>
            </label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => handleUtrChange(e.target.value)}
              placeholder="e.g. 408219384910"
              maxLength={18}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
            />
            {errors.utr && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.utr}</p>
            )}
          </div>

          {/* Upload Screenshot */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Payment Screenshot <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {receiptImage ? (
              <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200">
                <img
                  src={receiptImage}
                  alt="Slip preview"
                  className="w-10 h-10 object-cover rounded-lg border border-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    Screenshot Attached
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptImage(null);
                    onResetVerification();
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3.5 bg-white border border-dashed border-slate-300 hover:border-slate-400 rounded-xl text-xs font-medium text-slate-600 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Screenshot</span>
              </button>
            )}
            {errors.receipt && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.receipt}</p>
            )}
          </div>
        </div>

        {/* WhatsApp Manual Verification Action Card */}
        <div className="pt-2">
          {!isPaymentVerified ? (
            <div className="p-4 bg-[#F3FCF6] border border-[#B3E8C8] rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Step 1: WhatsApp Manual Verification
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Click below to send your order details &amp; UTR directly to coordinator desk on WhatsApp (<span className="font-mono font-semibold">{formattedCoordinatorPhone}</span>). Place Order button will unlock once sent.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onVerifyPayment}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Verify on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          ) : (
            <div className="p-4 bg-[#E7F8ED] border border-[#B3E8C8] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    WhatsApp Verification Dispatched!
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Details sent to coordinator on WhatsApp ({formattedCoordinatorPhone}). Place Order button is now unlocked below.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onVerifyPayment}
                  className="text-xs text-[#1EBE5D] hover:underline font-bold cursor-pointer"
                >
                  Resend WhatsApp
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={onResetVerification}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
