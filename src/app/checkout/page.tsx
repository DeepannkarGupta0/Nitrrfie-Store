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
  Copy,
  Check,
  Building,
  Smartphone,
  ExternalLink,
  AlertCircle,
  Clock,
  Printer,
  Truck,
  PhoneCall,
  Info,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUser } from "@clerk/nextjs";

type DeliveryMode = "pan_india" | "campus_pickup";
type CampusDeliveryOption = "campus_desk" | "hostel_delivery";

interface OrderConfirmationData {
  order_number: string;
  order_id: string;
  total_amount: number;
  customer_name: string;
  roll_number?: string;
  delivery_type: string;
  delivery_location: string;
  payment_method: string;
  upi_utr: string;
  shipping_address?: Record<string, any>;
  items: Array<{
    name: string;
    selectedSize?: string;
    selectedColorId?: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
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

const INDIAN_STATES_AND_UTS = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi (NCT)",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useUser();

  // Delivery Mode Selection
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("pan_india");
  const [campusOption, setCampusOption] = useState<CampusDeliveryOption>("campus_desk");

  // Customer Contact Fields
  const [name, setName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || "");
  const [rollNumber, setRollNumber] = useState("");

  // PAN India Address Fields
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Chhattisgarh");
  const [pincode, setPincode] = useState("");

  // Campus Delivery Fields
  const [hostelName, setHostelName] = useState(NIT_HOSTELS[0]);
  const [roomNumber, setRoomNumber] = useState("");

  // UPI State
  const [upiUtr, setUpiUtr] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmationData | null>(null);

  const storeUpiId = process.env.NEXT_PUBLIC_STORE_UPI_ID || "7974766166@axl";
  const storePhone = process.env.NEXT_PUBLIC_STORE_PHONE || "7974766166";
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "NIT Raipur Store";

  // Construct UPI Deep Link for scanning and mobile app one-tap pay
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
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit WhatsApp / mobile number.");
      setLoading(false);
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address for order notifications.");
      setLoading(false);
      return;
    }

    if (deliveryMode === "pan_india") {
      if (!addressLine1.trim()) {
        setError("Please enter your flat / house / street address.");
        setLoading(false);
        return;
      }
      if (!city.trim()) {
        setError("Please enter your city / town.");
        setLoading(false);
        return;
      }
      if (!state.trim()) {
        setError("Please select your state or union territory.");
        setLoading(false);
        return;
      }
      const cleanPin = pincode.replace(/\D/g, "");
      if (cleanPin.length !== 6) {
        setError("Please enter a valid 6-digit postal PIN code.");
        setLoading(false);
        return;
      }
    } else {
      // campus_pickup
      if (campusOption === "hostel_delivery" && !roomNumber.trim()) {
        setError("Please enter your hostel room number.");
        setLoading(false);
        return;
      }
    }

    const cleanUtr = upiUtr.trim().replace(/\s+/g, "");
    if (!cleanUtr || cleanUtr.length < 8) {
      setError(
        "Please enter the 12-digit UPI Transaction ID (UTR / Bank Ref Number) after completing the payment."
      );
      setLoading(false);
      return;
    }

    const effectiveDeliveryType =
      deliveryMode === "pan_india"
        ? "pan_india"
        : campusOption === "hostel_delivery"
        ? "hostel_delivery"
        : "campus_desk";

    try {
      const orderPayloadItems = items.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize || "Standard",
        selectedColorId: item.selectedColorId || "Standard",
        image: item.image,
      }));

      const response = await fetch("/api/orders/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            phone: cleanPhone,
            email: email.trim(),
            rollNumber: rollNumber.trim().toUpperCase() || undefined,
            deliveryType: effectiveDeliveryType,
            addressLine1: deliveryMode === "pan_india" ? addressLine1.trim() : undefined,
            addressLine2: deliveryMode === "pan_india" ? addressLine2.trim() : undefined,
            city: deliveryMode === "pan_india" ? city.trim() : "Raipur",
            state: deliveryMode === "pan_india" ? state.trim() : "Chhattisgarh",
            pincode: deliveryMode === "pan_india" ? pincode.replace(/\D/g, "") : "492010",
            hostelName: effectiveDeliveryType === "hostel_delivery" ? hostelName : undefined,
            roomNumber: effectiveDeliveryType === "hostel_delivery" ? roomNumber.trim() : undefined,
          },
          items: orderPayloadItems,
          totalAmount: totalPrice,
          paymentMethod: "upi_qr",
          upiUtr: cleanUtr,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to place order.");
      }

      setConfirmation({
        ...data,
        items: orderPayloadItems,
      });
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
          Add official NIT Raipur campus merchandise to your bag before checking out.
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
              Order Confirmed & Payment Recorded!
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-md mx-auto">
              Your official order has been placed with a unique tracking reference. Details are saved in the system.
            </p>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Order Reference Box */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-1">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Unique Order ID
                  </span>
                  <span className="text-xl font-mono font-black text-[#ff782e]">
                    {confirmation.order_number}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Paid
                  </span>
                  <span className="text-xl font-sans font-black text-slate-900">
                    ₹{confirmation.total_amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 block">Customer Name:</span>
                  <strong className="text-slate-900">{confirmation.customer_name}</strong>
                </div>
                {confirmation.roll_number && (
                  <div>
                    <span className="text-slate-400 block">Student Roll No / ID:</span>
                    <strong className="text-slate-900 font-mono">{confirmation.roll_number}</strong>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block">Payment Mode:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Prepaid UPI (Captured)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">UPI Transaction UTR:</span>
                  <span className="font-mono font-bold text-slate-900 bg-yellow-100 px-2 py-0.5 rounded">
                    {confirmation.upi_utr}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-400 block">
                  {confirmation.delivery_type === "pan_india" ? "Shipping Address (PAN India):" : "Handover Location:"}
                </span>
                <strong className="text-slate-800 leading-relaxed block mt-0.5">
                  {confirmation.delivery_location}
                </strong>
              </div>
            </div>

            {/* Exactly What Was Ordered (Item Breakdown with Size & Color) */}
            <div className="rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="font-sans font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                Items In This Order
              </h3>
              <div className="divide-y divide-slate-100">
                {confirmation.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <div className="relative w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200">
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                        </div>
                      )}
                      <div>
                        <strong className="block text-slate-900">{item.name}</strong>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-sans">
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold text-[10px]">
                            Size: {item.selectedSize || "Standard"}
                          </span>
                          {item.selectedColorId && item.selectedColorId !== "Standard" && (
                            <span className="bg-orange-50 text-[#ff782e] px-1.5 py-0.5 rounded font-bold text-[10px]">
                              Shade: {item.selectedColorId}
                            </span>
                          )}
                          <span>• Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 font-sans text-sm">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispatch & Delivery Notice */}
            <div className="rounded-2xl bg-orange-50 border border-orange-200/80 p-5 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-[#ff782e] text-sm font-sans">
                {confirmation.delivery_type === "pan_india" ? (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>PAN India Doorstep Shipping Notice</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Campus Handover Desk Collection</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed">
                {confirmation.delivery_type === "pan_india" ? (
                  <>
                    Your package is queued for order packing and courier dispatch. You will receive tracking alerts on your mobile phone and email. For any delivery queries, reach out on WhatsApp/Call: <strong>+91 {storePhone}</strong>.
                  </>
                ) : (
                  <>
                    Please show your <strong>Order ID ({confirmation.order_number})</strong> at the <strong>Campus Handover Desk (NIT Raipur Main Building Portico)</strong> between <strong>5:00 PM – 7:30 PM</strong> to collect your merchandise.
                  </>
                )}
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
          Secure Store Checkout
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          PAN India Delivery • Official NIT Raipur Merchandise • 100% Prepaid UPI
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

            {/* 1. Customer Identity Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-orange-100 text-[#ff782e] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h2 className="font-extrabold text-base text-slate-900 font-sans">
                  Contact & Customer Details
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
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none"
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
                    placeholder="10-digit mobile number"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Roll No / Student ID <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 22115042 (if student)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 2. Delivery Address: PAN India & Campus Handover */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-orange-100 text-[#ff782e] flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h2 className="font-extrabold text-base text-slate-900 font-sans">
                    Delivery Destination
                  </h2>
                </div>
                <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                  PAN India Serviceable
                </span>
              </div>

              {/* Delivery Mode Tabs: PAN India vs NIT Campus */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setDeliveryMode("pan_india")}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    deliveryMode === "pan_india"
                      ? "bg-white text-[#ff782e] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Doorstep Delivery (PAN India)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMode("campus_pickup")}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    deliveryMode === "campus_pickup"
                      ? "bg-white text-[#ff782e] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>NIT Raipur Campus Handover</span>
                </button>
              </div>

              {/* PAN India Address Inputs */}
              {deliveryMode === "pan_india" ? (
                <div className="space-y-4 pt-1">
                  <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200/60 text-xs text-slate-700 flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#ff782e] shrink-0 mt-0.5" />
                    <span>
                      We deliver across all 28 States and 8 Union Territories in India. Enter your exact address for smooth courier delivery.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Flat / House No. / Building / Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={deliveryMode === "pan_india"}
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="e.g. Flat 302, Royal Palms, 5th Cross Road"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Area / Sector / Landmark <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="e.g. Near City Center Mall, Indiranagar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        City / District <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={deliveryMode === "pan_india"}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Bengaluru / Raipur"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        State / Union Territory <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none bg-white"
                      >
                        {INDIAN_STATES_AND_UTS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        6-Digit PIN Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={deliveryMode === "pan_india"}
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="e.g. 560038"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* NIT Campus Delivery Options */
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCampusOption("campus_desk")}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        campusOption === "campus_desk"
                          ? "border-[#ff782e] bg-orange-50/50 text-[#ff782e]"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <Building className="w-4 h-4 mb-1" />
                      <div>Main Building Portico</div>
                      <span className="text-[10px] text-slate-500 font-normal">Free Desk Handover</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCampusOption("hostel_delivery")}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        campusOption === "hostel_delivery"
                          ? "border-[#ff782e] bg-orange-50/50 text-[#ff782e]"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <MapPin className="w-4 h-4 mb-1" />
                      <div>NIT Hostel Delivery</div>
                      <span className="text-[10px] text-slate-500 font-normal">Delivered to Hostel</span>
                    </button>
                  </div>

                  {campusOption === "campus_desk" ? (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Free Campus Pickup Desk</span>
                      </div>
                      <p>
                        Location: <strong>NIT Raipur Main Building Portico / Innovation Center Handover Point</strong>.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Handover Window: Daily 5:00 PM – 7:30 PM.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Select Hostel <span className="text-red-500">*</span>
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
                          required={deliveryMode === "campus_pickup" && campusOption === "hostel_delivery"}
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          placeholder="e.g. 214"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-xs text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. 100% Prepaid UPI Payment Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-orange-100 text-[#ff782e] flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h2 className="font-extrabold text-base text-slate-900 font-sans">
                    Prepaid UPI QR Payment
                  </h2>
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                  100% Prepaid • Instant Recording
                </span>
              </div>

              {/* UPI QR Display Container */}
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
                    <div className="mt-2 text-xs font-mono font-bold text-slate-900">
                      Amount: ₹{totalPrice.toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* QR Payment Guidance */}
                  <div className="space-y-3 flex-1 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 text-sm font-sans block">
                        Scan & Pay Exactly ₹{totalPrice}
                      </span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">
                        Open Google Pay, PhonePe, Paytm, or BHIM and scan this QR code. The exact payable amount of ₹{totalPrice} is pre-filled.
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

                    {/* Store Support Helpline Phone */}
                    <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Payment / Order Support: <strong className="text-slate-900 font-mono">+91 {storePhone}</strong>
                      </span>
                    </div>

                    {/* Mobile One-Tap Link */}
                    <div className="pt-1">
                      <a
                        href={upiDeepLink}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-[#ff782e]" />
                        <span>Pay via UPI App (Mobile One-Tap)</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* 12-Digit UTR Input */}
                <div className="pt-3 border-t border-orange-200/60">
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Enter 12-Digit UPI Transaction ID / UTR Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={upiUtr}
                    onChange={(e) => setUpiUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="e.g. 431289567123"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-[#ff782e] focus:ring-1 focus:ring-[#ff782e] text-sm text-slate-900 outline-none font-mono tracking-wider bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Found on your Google Pay / PhonePe / Paytm receipt under &quot;UPI Ref No.&quot; or &quot;UTR&quot;.
                  </p>
                </div>
              </div>
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
                    Pay ₹{totalPrice.toLocaleString("en-IN")} & Place Order
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Right Column: Order Bag Summary with Explicit Size & Color */}
          <div className="lg:col-span-5 sticky top-28 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900 font-sans">
                  Order Summary ({items.length})
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-[#ff782e]">
                  Official Merchandise
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
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
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-bold text-[10px]">
                          Size: {item.selectedSize || "Standard"}
                        </span>
                        {item.selectedColorId && item.selectedColorId !== "Standard" && (
                          <span className="bg-orange-50 text-[#ff782e] px-1.5 py-0.5 rounded border border-orange-200 font-bold text-[10px]">
                            {item.selectedColorId}
                          </span>
                        )}
                        <span className="text-slate-500 text-[10px]">Qty: {item.quantity}</span>
                      </div>
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
                  <span className="font-bold text-slate-900 font-sans">₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping & Delivery</span>
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
                <span>100% Authentic NIT Raipur Merchandise</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
