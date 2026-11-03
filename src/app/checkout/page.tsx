"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  ShieldCheck,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  QrCode,
  Copy,
  Check,
  Building,
  Smartphone,
  ExternalLink,
  AlertCircle,
  Clock,
  Printer,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUser } from "@clerk/nextjs";

type DeliveryType = "campus_desk" | "hostel_delivery" | "home_delivery";
type PaymentMethod = "upi_qr" | "cash_on_handover";

interface OrderConfirmationData {
  order_number: string;
  order_id: string;
  total_amount: number;
  customer_name: string;
  delivery_type: DeliveryType;
  delivery_location: string;
  payment_method: PaymentMethod;
  upi_utr?: string | null;
}

const NIT_HOSTELS = [
  "Hostel H (Sir M. Visvesvaraya Hall)",
  "Hostel D (Swami Vivekananda Hall)",
  "Hostel F (Dr. C.V. Raman Hall)",
  "Hostel B (Shri B.G. Shirke Hall)",
  "Hostel A (Rabindranath Tagore Hall)",
  "PG Hostel",
  "Mahanadi Girls Hostel",
  "Indravati Girls Hostel",
  "Senior Girls Hostel",
];

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useUser();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("campus_desk");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi_qr");

  // Form Fields
  const [name, setName] = useState(user?.fullName || "");
  const [rollNumber, setRollNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || "");
  const [branch, setBranch] = useState("Computer Science & Engineering");
  const [hostelName, setHostelName] = useState(NIT_HOSTELS[0]);
  const [roomNumber, setRoomNumber] = useState("");
  const [outsideAddress, setOutsideAddress] = useState("");

  // UPI State
  const [upiUtr, setUpiUtr] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmationData | null>(null);

  const storeUpiId = process.env.NEXT_PUBLIC_STORE_UPI_ID || "nitrrfie@sbi";
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "NIT Raipur Store";

  // Construct UPI Deep Link URL for scanning and mobile app one-tap pay
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(storeUpiId)}&pn=${encodeURIComponent(
    storeName
  )}&am=${totalPrice}&cu=INR&tn=${encodeURIComponent(`NITRR-Store`)}`;

  // Public QR Generator API for clean, instantaneous QR rendering
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    upiDeepLink
  )}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Client Validations
    if (!name.trim()) {
      setError("Please enter your full name.");
      setLoading(false);
      return;
    }
    if (!rollNumber.trim()) {
      setError("Please enter your Student Roll Number / College ID.");
      setLoading(false);
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit WhatsApp / mobile number.");
      setLoading(false);
      return;
    }
    if (deliveryType === "hostel_delivery" && !roomNumber.trim()) {
      setError("Please enter your hostel room number.");
      setLoading(false);
      return;
    }
    if (paymentMethod === "upi_qr") {
      const cleanUtr = upiUtr.trim().replace(/\s+/g, "");
      if (!cleanUtr || cleanUtr.length < 8) {
        setError(
          "Please enter the 12-digit UPI Reference Number (UTR / Bank Ref) shown in your payment app after completing the transfer."
        );
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/orders/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            rollNumber: rollNumber.trim(),
            email: email.trim(),
            phone: phone.trim(),
            branch,
            deliveryType,
            hostelName: deliveryType === "hostel_delivery" ? hostelName : undefined,
            roomNumber: deliveryType === "hostel_delivery" ? roomNumber.trim() : undefined,
            address: deliveryType === "home_delivery" ? outsideAddress.trim() : undefined,
          },
          items: items.map((item) => ({
            id: item.id,
            slug: item.slug,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColorId: item.selectedColorId,
            image: item.image,
          })),
          totalAmount: totalPrice,
          paymentMethod,
          upiUtr: paymentMethod === "upi_qr" ? upiUtr.trim() : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to place order.");
      }

      setConfirmation(data);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error placing order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Empty Bag State ──
  if (items.length === 0 && !confirmation) {
    return (
      <div className="px-4 py-20 max-w-xl mx-auto text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-[#ff782e] mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 font-sans">Your bag is empty</h1>
        <p className="text-sm text-slate-500">
          Add some official NIT Raipur campus merchandise to your bag before checking out.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#ff782e] text-white font-bold text-xs hover:bg-[#e05b12] transition-colors"
        >
          <span>Explore Campus Drops</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // ── Order Confirmed State ──
  if (confirmation) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center text-white mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-tight">
              Order Confirmed!
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-md mx-auto">
              Your official NIT Raipur merchandise order has been recorded in the campus store inventory.
            </p>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Order Reference Box */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Official Order Number
                </span>
                <span className="text-lg font-mono font-black text-[#ff782e]">
                  {confirmation.order_number}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 block">Student Name:</span>
                  <strong className="text-slate-900">{confirmation.customer_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Payable:</span>
                  <strong className="text-slate-900 font-sans text-sm">
                    ₹{confirmation.total_amount.toLocaleString("en-IN")}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Mode:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {confirmation.payment_method === "upi_qr"
                      ? "UPI QR Payment (Verified)"
                      : "Pay at Campus Handover"}
                  </span>
                </div>
                {confirmation.upi_utr && (
                  <div>
                    <span className="text-slate-400 block">Bank Reference (UTR):</span>
                    <span className="font-mono font-bold text-slate-900">{confirmation.upi_utr}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-400 block">Delivery / Handover Destination:</span>
                <strong className="text-slate-800">{confirmation.delivery_location}</strong>
              </div>
            </div>

            {/* Campus Handover Instructions */}
            <div className="rounded-2xl bg-orange-50 border border-orange-200/80 p-5 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-[#ff782e] text-sm font-sans">
                <Clock className="w-4 h-4" />
                <span>Collection & Handover Timings</span>
              </div>
              <p className="leading-relaxed">
                Please present this <strong>Order Number ({confirmation.order_number})</strong> and your <strong>Student ID</strong> at the <strong>Campus Handover Desk (NIT Raipur Main Building Portico)</strong> between <strong>5:00 PM – 7:30 PM</strong> to collect your merchandise.
              </p>
              <p className="text-[11px] text-slate-500">
                For hostel delivery, coordinators will arrive at your hostel gate during the evening slot.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-1/2 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Order Receipt</span>
              </button>

              <Link
                href="/shop"
                className="w-full sm:w-1/2 py-3.5 rounded-2xl bg-[#ff782e] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#e05b12] transition-colors shadow-lg shadow-[#ff782e]/25 text-center"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Checkout Form ──
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Page Header */}
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#ff782e] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Bag</span>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
          NIT Raipur Store Checkout
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Fast campus checkout • No passwords required • Official NIT Raipur inventory
        </p>
      </div>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Form & Payment Controls */}
          <div className="lg:col-span-7 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Please check your details</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* 1. Student Identity Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-orange-100 text-[#ff782e] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h2 className="font-extrabold text-base text-slate-900 font-sans">
                  Student & Contact Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student Roll Number / College ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 22115042"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit number for pickup alerts"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Receipt)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul@nitrr.ac.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Campus Delivery Location */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-orange-100 text-[#ff782e] flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h2 className="font-extrabold text-base text-slate-900 font-sans">
                  Select Handover Point
                </h2>
              </div>

              {/* Delivery Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setDeliveryType("campus_desk")}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    deliveryType === "campus_desk"
                      ? "bg-white text-[#ff782e] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Main Building Portico Desk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType("hostel_delivery")}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    deliveryType === "hostel_delivery"
                      ? "bg-white text-[#ff782e] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Hostel Delivery</span>
                </button>
              </div>

              {deliveryType === "campus_desk" ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Free Campus Pickup Desk</span>
                  </div>
                  <p>
                    Handover Location: <strong>NIT Raipur Main Building Portico / Innovation Center Desk</strong>.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Pickup Window: Daily 5:00 PM – 7:30 PM. Instant size trials available at the desk.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Choose Hostel <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={hostelName}
                      onChange={(e) => setHostelName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none bg-white"
                    >
                      {NIT_HOSTELS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Room Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. 214"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Payment Method Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-orange-100 text-[#ff782e] flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h2 className="font-extrabold text-base text-slate-900 font-sans">
                  Choose Payment Method
                </h2>
              </div>

              {/* Payment Tabs */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setPaymentMethod("upi_qr")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    paymentMethod === "upi_qr"
                      ? "border-[#ff782e] bg-orange-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 font-sans flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#ff782e]" />
                      Scan UPI QR Code
                    </span>
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                      Instant
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Google Pay, PhonePe, Paytm, BHIM, Cred
                  </p>
                </div>

                <div
                  onClick={() => setPaymentMethod("cash_on_handover")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    paymentMethod === "cash_on_handover"
                      ? "border-[#ff782e] bg-orange-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 font-sans flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-[#ff782e]" />
                      Pay at Handover
                    </span>
                    <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Desk / Cash
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pay via cash or UPI scan when collecting
                  </p>
                </div>
              </div>

              {/* UPI QR Display Container */}
              {paymentMethod === "upi_qr" && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50/30 p-5 space-y-4">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* The QR Code Card */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md shrink-0 text-center">
                      <Image
                        src={qrCodeUrl}
                        alt="NIT Raipur Store UPI QR Code"
                        width={210}
                        height={210}
                        className="rounded-xl mx-auto"
                        unoptimized
                      />
                      <div className="mt-2 text-[11px] font-mono font-bold text-slate-700">
                        Amount: ₹{totalPrice}
                      </div>
                    </div>

                    {/* QR Payment Guidance */}
                    <div className="space-y-3 flex-1 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 text-sm font-sans block">
                          Scan & Pay Exactly ₹{totalPrice}
                        </span>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">
                          Open any UPI app (**Google Pay, PhonePe, Paytm, BHIM**) and scan the code. The amount is pre-filled.
                        </p>
                      </div>

                      {/* Store UPI ID Pill */}
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 max-w-sm">
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">
                            Store UPI ID
                          </span>
                          <span className="font-mono font-bold text-xs text-slate-900 truncate block">
                            {storeUpiId}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUpi ? "Copied" : "Copy"}</span>
                        </button>
                      </div>

                      {/* Mobile Deep Link */}
                      <div className="pt-1">
                        <a
                          href={upiDeepLink}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-[#ff782e]" />
                          <span>Pay via UPI App (Mobile)</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* 12-Digit UTR Input */}
                  <div className="pt-3 border-t border-orange-200/60">
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                      12-Digit UPI Transaction ID / UTR Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={paymentMethod === "upi_qr"}
                      value={upiUtr}
                      onChange={(e) => setUpiUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                      placeholder="e.g. 431289567123"
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-sm text-slate-900 outline-none font-mono tracking-wider bg-white"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Found in your GPay / PhonePe / Paytm receipt under &quot;UPI Ref No.&quot; or &quot;UTR&quot;.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold font-sans text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                loading
                  ? "bg-slate-400 text-white cursor-not-allowed"
                  : "bg-[#ff782e] hover:bg-[#e05b12] text-white shadow-[#ff782e]/25 hover:shadow-2xl"
              }`}
            >
              {loading ? (
                <span>Recording Order...</span>
              ) : (
                <>
                  <span>
                    {paymentMethod === "upi_qr"
                      ? `Confirm & Place Order (₹${totalPrice.toLocaleString("en-IN")})`
                      : `Place Order • Pay at Campus Handover (₹${totalPrice.toLocaleString("en-IN")})`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Right Column: Order Bag Summary */}
          <div className="lg:col-span-5 sticky top-28 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900 font-sans">
                  Order Summary
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-[#ff782e]">
                  {items.length} {items.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <div className="relative w-14 h-14 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-200">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="block text-slate-900 truncate">{item.name}</strong>
                      <span className="text-[11px] text-slate-500">
                        Size: {item.selectedSize || "L"} • Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="text-right font-bold text-slate-900 font-sans">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="pt-3 border-t border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 font-sans">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Campus Pickup / Handover</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-sm">Total Amount</span>
                <span className="text-2xl font-black text-slate-900 font-sans">
                  ₹{totalPrice.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#ff782e] shrink-0" />
                <span>Direct Handover Desk at NIT Raipur Main Building</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
