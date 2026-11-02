import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import {
  formatINR,
  isValidRollNumber,
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
} from 'lucide-react';

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const {
    items,
    totals,
    placeOrder,
    lastCreatedOrder,
    setLastCreatedOrder,
  } = useCart();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [handoverType, setHandoverType] = useState<HandoverType>('makerspace_desk');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Raipur');
  const [state, setState] = useState('Chhattisgarh');
  const [pincode, setPincode] = useState('492010');
  const [landmark, setLandmark] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'upi_razorpay' | 'cash_at_desk'>('upi_razorpay');
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // WhatsApp Manual Verification State
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappDispatched, setWhatsappDispatched] = useState(false);

  // Reset verification whenever key payment data changes
  const handleResetVerification = () => {
    setIsPaymentVerified(false);
    setWhatsappDispatched(false);
  };

  // Step 1: Validate fields and Trigger WhatsApp Manual Verification
  const handleVerifyPaymentOnWhatsApp = () => {
    const newErrors: CheckoutErrors = {};

    if (!customerName.trim()) {
      newErrors.customerName = 'Please enter your full name';
    }
    if (!isValidRollNumber(rollNumber)) {
      newErrors.rollNumber = 'Please enter your roll number or student ID';
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
        newErrors.utr = 'Enter 12-digit UPI UTR / Ref No. or attach payment screenshot to verify payment';
      } else if (utrNumber.trim() && !isValidUtrNumber(utrNumber)) {
        newErrors.utr = 'UPI Ref / UTR must be a 12-digit transaction ID (e.g. 408219384910)';
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
      rollNumber: rollNumber.trim().toUpperCase(),
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

    // Open WhatsApp URL directly for manual verification
    try {
      window.open(waUrl, '_blank');
    } catch {
      window.location.href = waUrl;
    }

    // Mark WhatsApp manual verification initiated
    setIsPaymentVerified(true);
    setWhatsappDispatched(true);
  };

  // Step 2: Submit order once WhatsApp manual verification is done
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPaymentVerified) {
      handleVerifyPaymentOnWhatsApp();
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      placeOrder({
        customerName: customerName.trim(),
        rollNumber: rollNumber.trim().toUpperCase(),
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

      setIsSubmitting(false);
    }, 600);
  };

  // If student has an active created order, render the Official Clearance Pass
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

  // If cart is empty, show empty checkout state
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8 animate-fade-in">
        <div className="border-b border-slate-200 pb-6">
          <span className="font-mono text-xs font-bold text-[#FA5B29] uppercase tracking-wider block">
            INSTITUTIONAL MERCHANDISE STORE
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mt-1">
            Store Checkout & Verification
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete WhatsApp manual verification to obtain your official clearance pass.
          </p>
        </div>

        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your bag is empty</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Please add apparel or club drops to your bag before proceeding with checkout.
            </p>
          </div>
          <div>
            <button
              onClick={() => onNavigate({ type: 'shop' })}
              className="px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
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
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F8ED] border border-[#B3E8C8] text-[#1EBE5D] font-mono text-[11px] font-bold tracking-wider uppercase">
          <MessageSquare className="w-3.5 h-3.5 fill-current" />
          <span>WHATSAPP MANUAL VERIFICATION CHECKOUT</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mt-2">
          Checkout & Clearance Pass
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Provide your details and complete WhatsApp manual verification with the coordinator to unlock your order pass.
        </p>
      </div>

      <form onSubmit={handleCheckoutSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Form Details & Payment (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Student Details (Without auto-branch assumption) */}
            <StudentDetailsSection
              customerName={customerName}
              setCustomerName={setCustomerName}
              rollNumber={rollNumber}
              setRollNumber={setRollNumber}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              errors={errors}
            />

            {/* 2. Delivery Method (Home Delivery or Makerspace Desk) */}
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
              onVerifyPayment={handleVerifyPaymentOnWhatsApp}
              onResetVerification={handleResetVerification}
            />
          </div>

          {/* Right Column: Sticky Summary & Verify Action (4 Cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white p-7 rounded-3xl border border-[#EBE7DF] shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-950 tracking-tight">Order Summary</h3>
                <span className="bg-[#E7F8ED] text-[#1EBE5D] border border-[#B3E8C8] text-xs font-semibold px-3 py-1 rounded-full font-mono flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 fill-current" />
                  <span>WhatsApp Verified</span>
                </span>
              </div>

              {/* Items Preview List */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100">
                {items.map((it) => (
                  <div key={it.cartItemId} className="pt-3 first:pt-0 flex items-center gap-3">
                    <img
                      src={it.product.image}
                      alt={it.product.name}
                      className="w-12 h-12 object-cover rounded-xl border border-slate-200/80 bg-slate-50 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {it.product.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span className="text-[#FA5B29] font-semibold">{it.selectedColor.name}</span>
                        <span>•</span>
                        <span>Size {it.selectedSize}</span>
                        <span>•</span>
                        <span>×{it.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs font-bold text-slate-900">
                      {formatINR(it.product.price * it.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatINR(totals.subtotal)}
                  </span>
                </div>
                {totals.totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <span>Batch Subsidy & Savings</span>
                    <span className="font-mono font-bold">-{formatINR(totals.totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600">
                  <span>
                    {handoverType === 'home_delivery' || handoverType === 'hostel_delivery'
                      ? 'Home Delivery Shipping'
                      : 'Makerspace Handover'}
                  </span>
                  <span className="font-mono font-bold text-emerald-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> FREE
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Verification Fee</span>
                  <span className="text-emerald-600 font-semibold">Free via WhatsApp</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-slate-900">Total Payable</span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-slate-950">
                    {formatINR(totals.total)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Coordinator WhatsApp: <strong className="text-slate-800 font-mono">
                    {COORDINATOR_PHONE.startsWith('91') ? `+91 ${COORDINATOR_PHONE.slice(2)}` : `+91 ${COORDINATOR_PHONE}`}
                  </strong>
                </p>
              </div>

              {/* Action Buttons: WhatsApp Manual Verification First, then Place Order */}
              <div className="space-y-3 pt-2">
                {!isPaymentVerified ? (
                  <>
                    {/* Primary Step 1 Button: Verify on WhatsApp */}
                    <button
                      type="button"
                      onClick={handleVerifyPaymentOnWhatsApp}
                      className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg"
                      title="Open WhatsApp with coordinator to verify your payment"
                    >
                      <MessageSquare className="w-4 h-4 fill-current" />
                      <span>Verify on WhatsApp</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </button>

                    {/* Locked Step 2 Button */}
                    <button
                      type="button"
                      disabled
                      className="w-full py-3.5 px-6 bg-slate-100 text-slate-400 rounded-2xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200"
                      title="Verify on WhatsApp first to unlock order submission"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Place Order & Get Pass (Locked)</span>
                    </button>

                    <p className="text-[11px] text-slate-500 text-center">
                      Step 1: Click <span className="font-semibold text-slate-800">Verify on WhatsApp</span>. Once dispatched to the coordinator desk, Step 2 unlocks immediately.
                    </p>
                  </>
                ) : (
                  <>
                    {/* WhatsApp Dispatched Confirmation Banner */}
                    <div className="p-3 bg-[#E7F8ED] border border-[#B3E8C8] rounded-2xl flex items-center gap-2 text-xs font-semibold text-slate-900 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                      <span>WhatsApp Verification Sent! Place Order is now unlocked.</span>
                    </div>

                    {/* Unlocked Active Step 2 Submit CTA Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 px-6 bg-[#FA5B29] hover:bg-[#E54817] disabled:opacity-50 text-white rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg animate-pulse hover:animate-none"
                    >
                      {isSubmitting ? (
                        <span>Generating Official Pass...</span>
                      ) : (
                        <>
                          <span>Place Order & Get Pass</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={handleVerifyPaymentOnWhatsApp}
                        className="text-[#25D366] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 fill-current" />
                        <span>Resend WhatsApp</span>
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={handleResetVerification}
                        className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Feature Notices */}
              <div className="space-y-2.5 pt-4 text-xs text-slate-600 border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FA5B29] shrink-0" />
                  <span>
                    {handoverType === 'home_delivery' || handoverType === 'hostel_delivery'
                      ? 'Direct shipping to your delivery address'
                      : 'Makerspace Desk Handover (Ground Floor, Main Bldg)'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#FA5B29] shrink-0" />
                  <span>Official NIT Raipur Store verified fulfillment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
