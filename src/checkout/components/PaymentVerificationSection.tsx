import React, { useRef, useState } from 'react';
import {
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
  whatsappUrl?: string | null;
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
  whatsappUrl,
  onVerifyPayment,
  onResetVerification,
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formattedCoordinatorPhone = COORDINATOR_PHONE.startsWith('91')
    ? `+91 ${COORDINATOR_PHONE.slice(2)}`
    : `+91 ${COORDINATOR_PHONE}`;

  const handleCopyUpi = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(STORE_UPI_ID);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } catch {
      setErrors((prev) => ({
        ...prev,
        utr: `Copy failed — manually copy UPI ID: ${STORE_UPI_ID}`,
      }));
    }
  };

  const compressReceiptDataUrl = (rawDataUrl: string): Promise<string> =>
    new Promise((resolve, reject) => {
      if (rawDataUrl.length <= 550_000 && /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(rawDataUrl)) {
        resolve(rawDataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let compressed = canvas.toDataURL('image/jpeg', 0.78);
        if (compressed.length > 550_000) {
          compressed = canvas.toDataURL('image/jpeg', 0.6);
        }
        if (compressed.length > 580_000) {
          compressed = canvas.toDataURL('image/jpeg', 0.45);
        }
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Could not decode selected image'));
      img.src = rawDataUrl;
    });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, receipt: 'Screenshot must be under 5MB' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const raw = event.target?.result;
      if (typeof raw !== 'string') {
        setErrors((prev) => ({ ...prev, receipt: 'Unable to read selected image file.' }));
        return;
      }
      try {
        const compressed = await compressReceiptDataUrl(raw);
        if (compressed.length > 580_000) {
          setErrors((prev) => ({
            ...prev,
            receipt: 'Screenshot is too large after compression. Please upload a smaller image.',
          }));
          return;
        }
        setReceiptImage(compressed);
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.receipt;
          return updated;
        });
        onResetVerification();
      } catch {
        setErrors((prev) => ({
          ...prev,
          receipt: 'Invalid or unsupported image format. Please use PNG, JPG, or WebP.',
        }));
      }
    };
    reader.onerror = () => {
      setErrors((prev) => ({ ...prev, receipt: 'Failed to read screenshot file.' }));
    };
    reader.readAsDataURL(file);
  };

  const handleUtrChange = (val: string) => {
    setUtrNumber(val.replace(/\s/g, ''));
    if (isPaymentVerified) {
      onResetVerification();
    }
  };

  return (
    <div className="bg-[var(--paper)] p-6 sm:p-7 rounded-[var(--r)] border border-[var(--line)] space-y-5 shadow-sm">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-[var(--r-in)] bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(252,76,2,0.2)] flex items-center justify-center font-mono font-bold text-xs">
            3
          </div>
          <div>
            <h2 className="text-base font-brand font-bold text-[var(--ink)]">Payment &amp; WhatsApp Verification</h2>
            <p className="text-xs text-[var(--muted)]">
              Direct coordinator desk review ({formattedCoordinatorPhone})
            </p>
          </div>
        </div>
        {isPaymentVerified && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok-soft)] border border-[var(--ok-border)] text-[var(--ok)] font-mono text-[11px] font-semibold">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>DISPATCHED</span>
          </span>
        )}
      </div>

      {/* Online UPI Details Box */}
      <div className="p-5 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] space-y-5">
        {/* QR Code and Payment Coordinates */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Visual QR Code Card */}
          <div className="flex flex-col items-center bg-[var(--paper)] p-3 rounded-[var(--r-in)] border border-[var(--line)] text-center shrink-0">
            <div className="p-1.5 bg-[var(--paper)] rounded-[var(--r-in)] border border-[var(--line)] mb-2">
              <svg
                className="w-28 h-28"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="100" height="100" fill="#FAFAF9" />
                <rect x="5" y="5" width="28" height="28" fill="#0F0F0E" rx="3" />
                <rect x="9" y="9" width="20" height="20" fill="#FAFAF9" rx="2" />
                <rect x="13" y="13" width="12" height="12" fill="#0F0F0E" rx="1" />

                <rect x="67" y="5" width="28" height="28" fill="#0F0F0E" rx="3" />
                <rect x="71" y="9" width="20" height="20" fill="#FAFAF9" rx="2" />
                <rect x="75" y="13" width="12" height="12" fill="#0F0F0E" rx="1" />

                <rect x="5" y="67" width="28" height="28" fill="#0F0F0E" rx="3" />
                <rect x="9" y="71" width="20" height="20" fill="#FAFAF9" rx="2" />
                <rect x="13" y="75" width="12" height="12" fill="#0F0F0E" rx="1" />

                <rect x="40" y="8" width="6" height="6" fill="#0F0F0E" />
                <rect x="50" y="8" width="6" height="6" fill="#0F0F0E" />
                <rect x="40" y="20" width="10" height="6" fill="#0F0F0E" />
                <rect x="54" y="20" width="6" height="6" fill="#0F0F0E" />
                <rect x="44" y="30" width="16" height="6" fill="#0F0F0E" />

                <rect x="8" y="40" width="6" height="10" fill="#0F0F0E" />
                <rect x="20" y="40" width="8" height="6" fill="#0F0F0E" />
                <rect x="32" y="40" width="14" height="6" fill="#0F0F0E" />
                <rect x="50" y="40" width="10" height="8" fill="#0F0F0E" />
                <rect x="64" y="40" width="8" height="16" fill="#0F0F0E" />
                <rect x="76" y="40" width="16" height="6" fill="#0F0F0E" />

                <rect x="10" y="54" width="16" height="6" fill="#0F0F0E" />
                <rect x="30" y="50" width="8" height="16" fill="#0F0F0E" />
                <rect x="42" y="52" width="18" height="8" fill="#0F0F0E" />
                <rect x="76" y="50" width="16" height="10" fill="#0F0F0E" />

                <rect x="40" y="66" width="8" height="16" fill="#0F0F0E" />
                <rect x="52" y="64" width="8" height="10" fill="#0F0F0E" />
                <rect x="64" y="66" width="12" height="8" fill="#0F0F0E" />
                <rect x="80" y="64" width="12" height="12" fill="#0F0F0E" />

                <rect x="40" y="84" width="18" height="8" fill="#0F0F0E" />
                <rect x="62" y="78" width="8" height="14" fill="#0F0F0E" />
                <rect x="74" y="80" width="18" height="12" fill="#0F0F0E" />

                <rect x="42" y="42" width="16" height="16" fill="#FAFAF9" rx="2" />
                <rect x="44" y="44" width="12" height="12" fill="#FC4C02" rx="1.5" />
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

            <div className="font-mono text-sm font-bold text-[var(--ink)] tabular-nums">
              {formatINR(totalAmount)}
            </div>
          </div>

          {/* VPA Coordinates */}
          <div className="flex-1 space-y-2.5 w-full">
            <span className="text-xs font-mono font-semibold text-[var(--ink-2)] block">
              Official Store UPI ID
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[var(--paper)] border border-[var(--line-2)] rounded-[var(--r-in)] px-3.5 py-2 font-mono text-xs font-bold text-[var(--ink)] truncate">
                {STORE_UPI_ID}
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="px-3.5 py-2 bg-[var(--ink)] hover:bg-[var(--accent-solid)] text-[var(--on-ink)] hover:text-white rounded-[var(--r-in)] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-[0.98]"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
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
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              Scan QR or copy UPI ID to transfer via GPay, PhonePe, Paytm, or BHIM.
            </p>
          </div>
        </div>

        {/* Verification Fields: UTR and Slip Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-3 border-t border-[var(--line)]">
          {/* UTR Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-[var(--ink-2)] block">
              12-Digit UPI Ref / UTR No. <span className="text-[var(--accent)]">*</span>
            </label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => handleUtrChange(e.target.value)}
              placeholder="Enter 12-digit UPI UTR / Ref No."
              maxLength={18}
              className="w-full px-3.5 py-2.5 rounded-[var(--r-in)] border border-[var(--line-2)] bg-[var(--paper)] font-mono text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 placeholder:text-[var(--muted)] text-[var(--ink)] transition-colors"
            />
            {errors.utr && (
              <p className="text-[11px] font-mono text-[var(--bad)]">{errors.utr}</p>
            )}
          </div>

          {/* Upload Screenshot */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-[var(--ink-2)] block">
              Payment Screenshot <span className="text-[var(--muted)] font-normal">(Optional)</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {receiptImage ? (
              <div className="flex items-center gap-3 bg-[var(--paper)] p-2 rounded-[var(--r-in)] border border-[var(--line-2)]">
                <img
                  src={receiptImage}
                  alt="Slip preview"
                  className="w-10 h-10 object-cover rounded-[var(--r-in)] border border-[var(--line)]"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono font-bold text-[var(--ink)] block truncate">
                    Screenshot Attached
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                    onResetVerification();
                  }}
                  className="text-xs text-[var(--bad)] hover:underline font-mono font-medium px-2 py-1 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3.5 bg-[var(--paper)] border border-dashed border-[var(--line-2)] hover:border-[var(--accent)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)]/40 rounded-[var(--r-in)] text-xs font-mono font-medium text-[var(--ink-2)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>Upload Screenshot</span>
              </button>
            )}
            {errors.receipt && (
              <p className="text-[11px] font-mono text-[var(--bad)]">{errors.receipt}</p>
            )}
          </div>
        </div>

        {/* WhatsApp Manual Verification Action Card */}
        <div className="pt-2">
          {!isPaymentVerified ? (
            <div className="p-4 bg-[var(--paper)] border border-[rgba(252,76,2,0.25)] rounded-[var(--r-in)] space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-[var(--r-in)] bg-[#15803D] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-3.5 h-3.5 fill-current" />
                </div>
                <div>
                  <h4 className="text-xs font-brand font-bold text-[var(--ink)]">
                    Step 1: WhatsApp Manual Verification
                  </h4>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
                    Click below to send your order details &amp; UTR directly to coordinator desk on WhatsApp (<span className="font-mono font-semibold">{formattedCoordinatorPhone}</span>). Place Order button will unlock once sent.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onVerifyPayment}
                className="w-full py-3 px-4 bg-[#168341] hover:bg-[#126B34] dark:bg-[#15803D] dark:hover:bg-[#166534] text-white font-mono text-xs font-bold uppercase tracking-wider rounded-[var(--r-in)] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:translate-y-px"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Verify on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          ) : (
            <div className="p-4 bg-[var(--ok-soft)] border border-[var(--ok-border)] rounded-[var(--r-in)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[var(--r-in)] bg-[#15803D] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-[var(--ink)] block">
                    WhatsApp Verification Dispatched
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Sent to coordinator desk ({formattedCoordinatorPhone}). Order pass is unlocked.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--ok)] hover:underline font-mono font-bold inline-flex items-center gap-1"
                  >
                    <span>Open WhatsApp Chat</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={onVerifyPayment}
                    className="text-xs text-[var(--ok)] hover:underline font-mono font-bold cursor-pointer"
                  >
                    Prepare WhatsApp
                  </button>
                )}
                <span className="text-[var(--line-2)]">•</span>
                <button
                  type="button"
                  onClick={onResetVerification}
                  className="text-xs text-[var(--muted)] hover:text-[var(--ink)] underline cursor-pointer"
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
