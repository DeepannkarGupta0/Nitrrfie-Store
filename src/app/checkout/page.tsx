"use client";

import { useState } from "react";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ShieldCheck, MapPin, ArrowRight, ArrowLeft, ShoppingBag, Lock } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUser } from "@clerk/nextjs";

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useUser();
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckoutForm>({
    firstName: "",
    lastName: "",
    email: user?.primaryEmailAddress?.emailAddress ?? "",
    phone: "",
    address: "",
    city: "Raipur",
    state: "Chhattisgarh",
    pincode: "492010",
  });

  if (items.length === 0 && !submitted) {
    return (
      <div className="px-4 py-20 max-w-xl mx-auto text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-[#ff782e] mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Your bag is empty</h1>
        <p className="text-sm text-slate-500">
          Add some official campus drops to your bag before checking out.
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ── Step 1: Create Razorpay order + save pending order in DB ──────────
      const createRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
          items: items.map((item) => ({
            slug: item.slug,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            selectedSize: item.selectedSize,
            selectedColorId: item.selectedColorId,
            designId: item.designId,
            designImageUrl: item.designImageUrl,
          })),
          totalAmount: Math.round(totalPrice * 100), // convert ₹ to paise
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Failed to create payment order.");

      const { rz_order_id, rz_key, order_id, order_number } = createData;

      // ── Step 2: Open Razorpay checkout modal ──────────────────────────────
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: rz_key,
          amount: Math.round(totalPrice * 100),
          currency: "INR",
          name: "NITRRFIE Store",
          description: `NIT Raipur Merch — Order ${order_number}`,
          order_id: rz_order_id,
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            contact: formData.phone,
          },
          theme: { color: "#ff782e" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // ── Step 3: Verify payment HMAC signature on server ────────────
              const verifyRes = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  rz_order_id: response.razorpay_order_id,
                  rz_payment_id: response.razorpay_payment_id,
                  rz_signature: response.razorpay_signature,
                  order_id,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || "Payment verification failed.");
              }

              setOrderId(order_id);
              setOrderNumber(order_number);
              setSubmitted(true);
              clearCart();
              resolve();
            } catch (vErr) {
              reject(vErr);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled by user."));
            },
          },
        });

        rzp.open();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment processing error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="px-4 py-16 sm:py-24 max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Order Confirmed!
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              Your official NIT Raipur merchandise order has been received and verified.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-left space-y-2.5 text-xs text-slate-700">
            {orderNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Order Number:</span>
                <span className="font-bold text-slate-900">{orderNumber}</span>
              </div>
            )}
            {orderId && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Order ID:</span>
                <span className="font-mono text-slate-800">{orderId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Total Paid:</span>
              <span className="font-bold text-slate-900">₹{totalPrice.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Campus Handover:</span>
              <span className="font-bold text-[#ff782e]">NIT Raipur Handover Desk</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            A confirmation email will be sent to <strong>{formData.email}</strong> with pickup instructions.
          </p>

          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Back to Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Checkout & Handover
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Provide student recipient details for verified campus delivery.
            </p>
          </div>

          <Link
            href="/cart"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#ff782e]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Bag
          </Link>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Customer Details Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-[#ff782e] text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base font-bold text-slate-900 font-sans">
                  Student & Contact Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Varun"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ff782e] bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Gupta"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ff782e] bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="student@nitrr.ac.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ff782e] bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Phone (10 digits) *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ff782e] bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            {/* Campus Handover / Delivery */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-[#ff782e] text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base font-bold text-slate-900 font-sans">
                  Campus Handover Location / Hostel Address
                </h2>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Hostel / Department / Handover Desk *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Hostel H, Room 214 or E-Cell Desk Pickup"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ff782e] bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-100 cursor-not-allowed"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-100 cursor-not-allowed"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">PIN Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-100 cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/60 flex items-start gap-3 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-[#ff782e] shrink-0 mt-0.5" />
                <span>
                  All orders are fulfilled directly inside the National Institute of Technology Raipur campus. You will receive an SMS/Email notification with your exact handover desk slot.
                </span>
              </div>
            </div>

            {/* Payment Trigger */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  256-Bit Encrypted Razorpay Checkout
                </span>
                <span className="font-bold text-slate-700">UPI • Cards • NetBanking</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#ff782e] hover:bg-[#e05b12] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#ff782e]/25 hover:shadow-xl transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <span>Connecting to Razorpay...</span>
                ) : (
                  <>
                    <span>Pay ₹{totalPrice.toLocaleString("en-IN")} via Razorpay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Column: Order Review */}
          <div className="lg:col-span-5 sticky top-28 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                Order Review ({items.length} items)
              </h3>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="py-3 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-100">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        Size: <span className="font-bold text-slate-800">{item.selectedSize || "L"}</span> • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-sans">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Campus Pickup</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 text-sm font-bold text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-xl font-black text-slate-900">₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#ff782e] shrink-0" />
              <span>Official NITRRFIE merchandise fulfillment guarantee with on-campus size verification.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}