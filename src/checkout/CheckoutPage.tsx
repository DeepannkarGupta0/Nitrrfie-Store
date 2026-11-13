import React, { useState, useEffect, useRef } from 'react';
import { useSafeClerkAuth } from '../context/SafeClerkContext';
import { AuthModal } from '../components/AuthModal';
import { useCart } from '../context/CartContext';
import {
  formatINR,
  isValidIndianPhone,
  isValidUtrNumber,
  buildWhatsAppVerificationUrl,
  COORDINATOR_PHONE,
} from './checkoutLogic';
import { CheckoutPageProps, CheckoutErrors } from './types';
import { StudentDetailsSection } from './components/StudentDetailsSection';
import { CampusHandoverSection } from './components/CampusHandoverSection';
import { PaymentVerificationSection } from './components/PaymentVerificationSection';
import { ClearancePass } from './components/ClearancePass';
import { HandoverType } from '../types/store';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
  CheckCircle2,
  MapPin,
  MessageSquare,
  ExternalLink,
  Tag,
  AlertTriangle,
} from 'lucide-react';

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const {
    items,
    totals,
    submitOrder,
    validateCartForCheckout,
    hasStockIssues,
    cartWarnings,
    lastCreatedOrder,
    setLastCreatedOrder,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const generateIdempotencyKey = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `chk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey());
  const cartFingerprint = items.map((i) => `${i.cartItemId}:${i.quantity}`).join('|');

  useEffect(() => {
    idempotencyKeyRef.current = generateIdempotencyKey();
  }, [cartFingerprint]);

  const { isClerkEnabled, isSignedIn, user } = useSafeClerkAuth();


  // Form State
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Auto-fill from authenticated Clerk profile if fields are empty
  useEffect(() => {
    if (isSignedIn && user) {
      if (!customerName) {
        const fullName = user.fullName || user.firstName || '';
        if (fullName) setCustomerName(fullName);
      }
      if (!email) {
        const primaryEmail = user.primaryEmailAddress?.emailAddress || '';
        if (primaryEmail) setEmail(primaryEmail);
      }
    }
  }, [isSignedIn, user]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [handoverType, setHandoverType] = useState<HandoverType>('makerspace_desk');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'upi_razorpay' | 'cash_at_desk'>('upi_razorpay');
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // WhatsApp Manual Verification State
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappDispatched, setWhatsappDispatched] = useState(false);

  // Validate live catalog inventory on checkout entry
  useEffect(() => {
    if (items.length > 0 && !lastCreatedOrder) {
      validateCartForCheckout().catch(() => {});
    }
  }, []);

  // Reset verification whenever key payment data changes
  const handleResetVerification = () => {
    setIsPaymentVerified(false);
    setWhatsappUrl(null);
    setWhatsappDispatched(false);
    setCheckoutError(null);
  };

  // Step 1: Validate fields and Trigger WhatsApp Manual Verification
  const handleVerifyPaymentOnWhatsApp = async () => {
    setCheckoutError(null);
    const validation = await validateCartForCheckout();
    if (!validation.valid) {
      setCheckoutError(
        validation.warnings[0] ||
          'One or more items in your bag are out of stock or unavailable. Update your bag before verifying payment.'
      );
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    const newErrors: CheckoutErrors = {};

    if (!customerName.trim()) {
      newErrors.customerName = 'Please enter your full name';
    }
    if (!email.trim() || !email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!isValidIndianPhone(phone)) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (handoverType === 'home_delivery' || handoverType === 'hostel_delivery') {
      if (!addressLine.trim()) {
        newErrors.addressLine = 'Please enter your delivery address';
      }
      if (!city.trim()) {
        newErrors.city = 'Please enter your city';
      }
      if (!state.trim()) {
        newErrors.state = 'Please enter your state';
      }
      if (!pincode.trim() || pincode.trim().length !== 6) {
        newErrors.pincode = 'Enter a valid 6-digit PIN code';
      }
    }

    if (paymentMethod === 'upi_razorpay') {
      if (!utrNumber.trim() && !receiptImage) {
        newErrors.utr = 'Enter a valid UPI UTR / Ref No. (12-digit or 10–18 chars) or attach payment screenshot';
      } else if (utrNumber.trim() && !isValidUtrNumber(utrNumber)) {
        newErrors.utr = 'UPI Ref / UTR must be a 12-digit or 10–18 character alphanumeric transaction ID';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    setErrors({});

    // Build the manual WhatsApp verification message with coordinator
    const draftToken = `NITRR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const waUrl = buildWhatsAppVerificationUrl({
      id: draftToken,
      customerName: customerName.trim(),
      phone: phone.trim(),
      total: totals.total,
      handoverType,
      deliveryAddress:
        handoverType === 'home_delivery' || handoverType === 'hostel_delivery'
          ? {
              addressLine: addressLine.trim(),
              city: city.trim(),
              state: state.trim(),
              pincode: pincode.trim(),
            }
          : undefined,
      utrNumber: utrNumber.trim() || (receiptImage ? 'Screenshot attached' : 'Pay at counter'),
      items: items.map((i) => ({
        name: `${i.product.name} (${i.selectedSize}, ${i.selectedColor.name})`,
        quantity: i.quantity,
      })),
    });

    setWhatsappUrl(waUrl);
    setIsPaymentVerified(true);
    setWhatsappDispatched(true);
  };

  // Step 2: Submit order once WhatsApp manual verification is done
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPaymentVerified) {
      await handleVerifyPaymentOnWhatsApp();
      return;
    }

    setCheckoutError(null);
    setIsSubmitting(true);

    try {
      const result = await submitOrder({
        idempotencyKey: idempotencyKeyRef.current,
        customerName: customerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        handoverType: handoverType === 'hostel_delivery' ? 'home_delivery' : handoverType,
        deliveryAddress:
          handoverType === 'home_delivery' || handoverType === 'hostel_delivery'
            ? {
                addressLine: addressLine.trim(),
                city: city.trim(),
                state: state.trim(),
                pincode: pincode.trim(),
                landmark: landmark.trim() || undefined,
              }
            : undefined,
        paymentMethod,
        utrNumber: utrNumber.trim() || undefined,
        paymentReceiptImage: receiptImage || undefined,
        whatsappVerified: true,
        verificationStatus: 'whatsapp_verified',
      });

      if (!result.success) {
        setCheckoutError(
          result.error || 'Unable to place order due to inventory or verification issue.'
        );
        window.scrollTo({ top: 120, behavior: 'smooth' });
      } else {
        idempotencyKeyRef.current = generateIdempotencyKey();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (lastCreatedOrder) {
    return (
      <ClearancePass
        order={lastCreatedOrder}
        onNavigate={onNavigate}
        onClearOrder={() => setLastCreatedOrder(null)}
        whatsappDispatched={whatsappDispatched}
        setWhatsappDispatched={setWhatsappDispatched}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 animate-fade-in">
        <div className="border-b border-[var(--line)] pb-6">
          <span className="font-mono text-xs font-semibold text-[var(--accent)] uppercase tracking-wider block">
            INSTITUTIONAL MERCHANDISE STORE
          </span>
          <h1 className="text-3xl sm:text-4xl font-brand font-black text-[var(--ink)] tracking-tight mt-1">
            Store Checkout &amp; Verification
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Complete WhatsApp manual verification to obtain your official clearance pass.
          </p>
        </div>

        <div className="text-center py-20 bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] max-w-2xl mx-auto space-y-4 shadow-sm p-8">
          <div className="w-14 h-14 bg-[var(--paper-2)] border border-[var(--line)] text-[var(--muted)] rounded-[var(--r-in)] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-xl font-brand font-bold text-[var(--ink)]">Your bag is empty</h2>
            <p className="text-xs text-[var(--muted)] mt-1 max-w-sm mx-auto leading-relaxed">
              Please add apparel or club drops to your bag before proceeding with checkout.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onNavigate({ type: 'shop' })}
              className="px-6 py-3 bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white font-mono text-xs font-bold uppercase tracking-wider rounded-[var(--r-in)] transition-colors cursor-pointer shadow-sm active:translate-y-px inline-flex items-center gap-2"
            >
              <span>Explore Campus Drops</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="space-y-2 border-b border-[var(--line)] pb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--ok-soft)] border border-[var(--ok-border)] text-[var(--ok)] font-mono text-[11px] font-semibold tracking-wider uppercase">
          <MessageSquare className="w-3.5 h-3.5 fill-current" />
          <span>WHATSAPP MANUAL VERIFICATION CHECKOUT</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-brand font-black text-[var(--ink)] tracking-tight">
          Checkout &amp; Clearance Pass
        </h1>
        <p className="text-sm text-[var(--muted)] max-w-xl">
          Provide your details and complete WhatsApp manual verification with the coordinator to unlock your official order pass.
        </p>
      </div>

      {(checkoutError || hasStockIssues) && (
        <div className="p-4 bg-[var(--bad-soft)] border border-[var(--bad-border)] rounded-[var(--r)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[var(--ink)]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--bad)]" />
            <div className="space-y-1">
              <p className="font-bold uppercase tracking-wider text-[var(--bad)]">
                Inventory / Order Verification Notice
              </p>
              <p className="text-[var(--ink-2)]">{checkoutError || cartWarnings[0] || 'Please resolve stock issues in your bag before placing your order.'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ type: 'cart' })}
            className="px-3 py-1.5 rounded-[var(--r-in)] border border-[var(--bad-border)] text-[var(--bad)] hover:bg-[var(--bad-soft)] font-bold uppercase tracking-wider shrink-0 cursor-pointer"
          >
            Review Bag →
          </button>
        </div>
      )}

      <form onSubmit={handleCheckoutSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Details & Payment (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Clerk Account Status Card */}
            {isSignedIn && user ? (
              <div className="p-3.5 bg-[var(--ok-soft)] border border-[var(--ok-border)] rounded-[var(--r)] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--ok-border)] shrink-0">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[var(--paper)] flex items-center justify-center font-bold text-[var(--ok)]">
                        {(user.firstName || 'U').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-brand font-bold text-[var(--ink)] block truncate">
                      {user.fullName || user.firstName || 'Authenticated Member'}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--muted)] truncate block">
                      {user.primaryEmailAddress?.emailAddress} • Verified with Clerk
                    </span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--ok)] bg-[var(--paper)] px-2 py-1 rounded-[var(--r-pill)] border border-[var(--ok-border)] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Auto-filled</span>
                </div>
              </div>
            ) : isClerkEnabled ? (
              <div className="p-3.5 bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r)] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[var(--ink)]">
                  <ShieldCheck className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="text-xs">Have a registered account?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="font-mono text-xs font-bold text-[var(--accent)] hover:underline cursor-pointer"
                >
                  Sign in with Clerk →
                </button>
              </div>
            ) : null}

            {/* 1. Customer Details */}
            <StudentDetailsSection
              customerName={customerName}
              setCustomerName={setCustomerName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              errors={errors}
            />

            {/* 2. Delivery Method */}
            <CampusHandoverSection
              handoverType={handoverType}
              setHandoverType={(val) => {
                setHandoverType(val);
                handleResetVerification();
              }}
              addressLine={addressLine}
              setAddressLine={setAddressLine}
              city={city}
              setCity={setCity}
              state={state}
              setState={setState}
              pincode={pincode}
              setPincode={setPincode}
              landmark={landmark}
              setLandmark={setLandmark}
              errors={errors}
            />

            {/* 3. WhatsApp Manual Verification Section */}
            <PaymentVerificationSection
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              utrNumber={utrNumber}
              setUtrNumber={setUtrNumber}
              receiptImage={receiptImage}
              setReceiptImage={setReceiptImage}
              totalAmount={totals.total}
              customerName={customerName}
              errors={errors}
              setErrors={setErrors}
              isPaymentVerified={isPaymentVerified}
              whatsappUrl={whatsappUrl}
              onVerifyPayment={handleVerifyPaymentOnWhatsApp}
              onResetVerification={handleResetVerification}
            />
          </div>

          {/* Right Column: Sticky Summary & Verify Action (4 Cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="bg-[var(--paper)] p-6 sm:p-7 rounded-[var(--r)] border border-[var(--line)] shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <h3 className="text-lg font-brand font-bold text-[var(--ink)] tracking-tight">Order Summary</h3>
                <span className="bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ok)] text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-[var(--r-pill)] flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 fill-current" />
                  <span>WhatsApp Desk</span>
                </span>
              </div>

              {/* Items Preview List */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-[var(--line)]">
                {items.map((it) => (
                  <div key={it.cartItemId} className="pt-3 first:pt-0 flex items-center gap-3">
                    <img
                      src={it.product.image}
                      alt={it.product.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallbackApplied) {
                          img.dataset.fallbackApplied = '1';
                          img.src = '/assets/aistudio/nitrr_new_logo_new_155e66c7.png';
                        }
                      }}
                      className="w-12 h-12 object-cover rounded-[var(--r-in)] border border-[var(--line)] bg-[var(--paper-2)] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-brand font-bold text-[var(--ink)] truncate">
                        {it.product.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] font-mono mt-0.5">
                        <span className="text-[var(--accent)] font-semibold">{it.selectedColor.name}</span>
                        <span>•</span>
                        <span>Size {it.selectedSize}</span>
                        <span>•</span>
                        <span>×{it.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs font-bold text-[var(--ink)] tabular-nums">
                      {formatINR(it.product.price * it.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon / Promo Code Redemption */}
              <div className="border-t border-[var(--line)] pt-4 space-y-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold">
                  Coupon / Promo Code
                </label>
                {appliedCoupon ? (
                  <div className="p-2.5 rounded-[var(--r-in)] bg-[var(--ok-soft)] border border-[var(--ok-border)] flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Tag className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                      <span className="font-mono font-bold text-[var(--ok)]">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-[11px] text-[var(--ink-2)] truncate">
                        ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% off` : `₹${appliedCoupon.discountValue} off`})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeCoupon();
                        setCouponFeedback(null);
                        handleResetVerification();
                      }}
                      className="text-[11px] font-mono font-bold text-[var(--bad)] hover:underline shrink-0 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono uppercase bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-in)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
                      />
                      <button
                        type="button"
                        disabled={isApplyingCoupon}
                        onClick={async () => {
                          if (!couponCodeInput.trim() || isApplyingCoupon) return;
                          setIsApplyingCoupon(true);
                          try {
                            const res = await applyCoupon(couponCodeInput);
                            if (res.success) {
                              setCouponFeedback({ type: 'ok', text: res.message });
                              setCouponCodeInput('');
                              handleResetVerification();
                            } else {
                              setCouponFeedback({ type: 'err', text: res.message });
                            }
                          } finally {
                            setIsApplyingCoupon(false);
                          }
                        }}
                        className="px-3.5 py-1.5 bg-[var(--ink)] enabled:hover:bg-[var(--accent-solid)] enabled:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-[var(--on-ink)] text-xs font-mono font-bold rounded-[var(--r-in)] transition-colors cursor-pointer shrink-0"
                      >
                        {isApplyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponFeedback && (
                      <p
                        className={`text-[11px] font-mono ${
                          couponFeedback.type === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--bad)]'
                        }`}
                      >
                        {couponFeedback.text}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="border-t border-[var(--line)] pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-[var(--ink)] text-sm tabular-nums">
                    {formatINR(totals.subtotal)}
                  </span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-[var(--ok)] font-medium bg-[var(--ok-soft)] p-2 rounded-[var(--r-in)] border border-[var(--ok-border)]">
                    <span>Voucher Concession ({appliedCoupon?.code})</span>
                    <span className="font-mono tabular-nums">-{formatINR(totals.discountAmount)}</span>
                  </div>
                )}
                {totals.totalSavings > totals.discountAmount && (
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>Standard Archive Privilege</span>
                    <span className="font-mono tabular-nums">-{formatINR(totals.totalSavings - totals.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[var(--muted)]">
                  <span>
                    {handoverType === 'home_delivery' || handoverType === 'hostel_delivery'
                      ? 'Pan-India Express Courier'
                      : 'Makerspace Campus Pickup'}
                  </span>
                  <span className="font-mono font-bold text-[var(--ok)] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> FREE
                  </span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Verification &amp; Dispatch Fee</span>
                  <span className="text-[var(--ok)] font-mono font-semibold">Included</span>
                </div>
              </div>

              <div className="border-t border-[var(--line)] pt-4 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-[var(--ink-2)]">Total Payable</span>
                  <span className="text-2xl sm:text-3xl font-brand font-black font-mono text-[var(--ink)] tabular-nums">
                    {formatINR(totals.total)}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)] font-mono">
                  Coordinator: <strong className="text-[var(--ink-2)]">
                    {COORDINATOR_PHONE.startsWith('91') ? `+91 ${COORDINATOR_PHONE.slice(2)}` : `+91 ${COORDINATOR_PHONE}`}
                  </strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {!isPaymentVerified ? (
                  <>
                    <button
                      type="button"
                      disabled={hasStockIssues}
                      onClick={handleVerifyPaymentOnWhatsApp}
                      className="w-full py-3.5 px-6 bg-[#168341] enabled:hover:bg-[#126B34] dark:bg-[#15803D] dark:enabled:hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[var(--r-in)] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm enabled:active:translate-y-px"
                      title="Open WhatsApp with coordinator to verify your payment"
                    >
                      <MessageSquare className="w-4 h-4 fill-current" />
                      <span>{hasStockIssues ? 'Resolve Bag Stock First' : 'Verify on WhatsApp'}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </button>

                    <button
                      type="button"
                      disabled
                      className="w-full py-3.5 px-6 bg-[var(--paper-2)] text-[var(--muted)] rounded-[var(--r-in)] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed border border-[var(--line)] opacity-75"
                    >
                      <Lock className="w-3.5 h-3.5 text-[var(--muted)]" />
                      <span>Place Order &amp; Get Pass (Locked)</span>
                    </button>

                    <p className="text-[11px] text-[var(--muted)] text-center leading-relaxed">
                      Click <span className="font-semibold text-[var(--ink)]">Verify on WhatsApp</span> first. Once dispatched, order pass generation will unlock.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-[var(--ok-soft)] border border-[var(--ok-border)] rounded-[var(--r-in)] flex items-center gap-2 text-xs font-mono font-semibold text-[var(--ink)] animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
                      <span>WhatsApp verification dispatched! Place Order unlocked.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || hasStockIssues}
                      className="w-full py-3.5 px-6 bg-[var(--accent-solid)] enabled:hover:bg-[var(--accent-solid-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[var(--r-in)] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm enabled:active:translate-y-px"
                    >
                      {isSubmitting ? (
                        <span>Generating Official Pass...</span>
                      ) : (
                        <>
                          <span>Place Order &amp; Get Pass</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-3 text-xs">
                      {whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--ok)] hover:underline font-mono font-bold inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3 fill-current" />
                          <span>Open WhatsApp Chat</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifyPaymentOnWhatsApp}
                          className="text-[var(--ok)] hover:underline font-mono font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3 fill-current" />
                          <span>Prepare WhatsApp</span>
                        </button>
                      )}
                      <span className="text-[var(--line-2)]">•</span>
                      <button
                        type="button"
                        onClick={handleResetVerification}
                        className="text-[var(--muted)] hover:text-[var(--ink)] underline cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Feature Notices */}
              <div className="space-y-2.5 pt-4 text-xs text-[var(--muted)] border-t border-[var(--line)]">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span>
                    {handoverType === 'home_delivery' || handoverType === 'hostel_delivery'
                      ? 'Direct shipping to your delivery address'
                      : 'Makerspace Desk Handover (Ground Floor, Main Bldg)'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span>Official NIT Raipur Store verified fulfillment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
