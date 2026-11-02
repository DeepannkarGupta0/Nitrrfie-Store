import React, { useState } from 'react';
import {
  Printer,
  ArrowRight,
  BadgeCheck,
  Building,
  Truck,
  ShieldCheck,
  MessageSquare,
  Copy,
  Check,
  Package,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Order, ActiveView } from '../../types/store';
import { useCart } from '../../context/CartContext';
import { formatINR, buildWhatsAppVerificationUrl, COORDINATOR_PHONE } from '../checkoutLogic';

interface ClearancePassProps {
  order: Order;
  onNavigate: (view: ActiveView) => void;
  onClearOrder: () => void;
  whatsappDispatched: boolean;
  setWhatsappDispatched: (val: boolean) => void;
}

export const ClearancePass: React.FC<ClearancePassProps> = ({
  order,
  onNavigate,
  onClearOrder,
  whatsappDispatched,
  setWhatsappDispatched,
}) => {
  const { orders } = useCart();
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync with live state from orders in context
  const liveOrder = orders.find((o) => o.id === order.id) || order;
  const isApproved = liveOrder.verificationStatus === 'desk_verified';

  const formattedCoordinatorPhone = COORDINATOR_PHONE.startsWith('91')
    ? `+91 ${COORDINATOR_PHONE.slice(2)}`
    : `+91 ${COORDINATOR_PHONE}`;

  const waUrl = buildWhatsAppVerificationUrl({
    id: liveOrder.id,
    customerName: liveOrder.customerName,
    rollNumber: liveOrder.rollNumber,
    phone: liveOrder.phone,
    total: liveOrder.total,
    handoverType: liveOrder.handoverType,
    deliveryAddress: liveOrder.deliveryAddress,
    utrNumber: liveOrder.utrNumber,
    items: liveOrder.items,
  });

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8 animate-fade-in">
      {/* Pass Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF3EB] border border-[#FFE2D1] text-[#FA5B29] font-mono text-[11px] font-bold tracking-wider uppercase">
            <span>OFFICIAL NIT RAIPUR MERCHANDISE</span>
            <span className="text-slate-300">•</span>
            <span>{isApproved ? 'ORDER CONFIRMED & IN PROCESS' : 'AWAITING ADMIN APPROVAL'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mt-2">
            Order Clearance Pass
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isApproved
              ? liveOrder.handoverType === 'home_delivery'
                ? 'Your order is confirmed, verified, and now under process for home delivery.'
                : 'Your order is confirmed, verified, and now under preparation for Makerspace desk handover.'
              : 'Your WhatsApp verification slip was sent. Awaiting coordinator approval from the admin panel.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-[#EBE7DF] hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Pass</span>
          </button>
          <button
            onClick={() => {
              onClearOrder();
              onNavigate({ type: 'shop' });
            }}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-[#FA5B29] hover:bg-[#E54817] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <span>Back to Store</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Verification Banner Based on Admin Approval State */}
      {isApproved ? (
        /* Approved State: Yes, now it's confirmed, verified & under process */
        <div className="p-6 rounded-3xl border bg-emerald-50/90 border-emerald-400 text-emerald-950 transition-all shadow-xs animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-600 text-white shadow-emerald-200 shadow-md">
                <BadgeCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base sm:text-lg text-emerald-950">
                    Yes! Payment Confirmed & Verified
                  </span>
                  <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    CONFIRMED & IN PROCESS ✓
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
                  Your payment has been verified and approved by the coordinator! Your order is now under process. You will receive your merchandise via{' '}
                  <strong className="text-emerald-950">
                    {liveOrder.handoverType === 'home_delivery' ? 'Home Delivery' : 'Makerspace Desk Handover'}
                  </strong>
                  .
                </p>
                {liveOrder.verifiedBy && (
                  <p className="text-[11px] text-emerald-700 font-mono">
                    Approved by: {liveOrder.verifiedBy}
                  </p>
                )}
              </div>
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setWhatsappDispatched(true)}
              className="px-4 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
              title="Open WhatsApp chat with coordinator"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>
      ) : (
        /* Pending Admin Approval State: Awaiting Admin Review from Admin Panel */
        <div className="p-6 rounded-3xl border bg-amber-50/90 border-amber-300 text-amber-950 transition-all shadow-xs animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-amber-600 text-white shadow-amber-200 shadow-md">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base sm:text-lg text-amber-950">
                    Awaiting Coordinator Approval in Admin Panel
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                    PENDING APPROVAL ⏳
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                  Your WhatsApp verification slip with UPI Ref{' '}
                  <strong className="font-mono text-amber-950">#{liveOrder.utrNumber || 'N/A'}</strong> has been sent to the coordinator ({formattedCoordinatorPhone}). The coordinator will review your payment slip in the admin panel and approve it.
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-800">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>
                    Once approved in the admin panel, this clearance pass will automatically say <strong>&quot;Confirmed, Verified &amp; Under Process&quot;</strong>.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleManualRefresh}
                className="px-3.5 py-2.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Refresh order status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Check Status</span>
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setWhatsappDispatched(true)}
                className="px-4 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
                title="Send receipt or message coordinator on WhatsApp"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Open WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* The Printable Handover Pass Card */}
      <div className="bg-white rounded-3xl border border-[#EBE7DF] shadow-2xs overflow-hidden divide-y divide-slate-100">
        {/* Institute Header */}
        <div className="bg-slate-950 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-black text-[#FA5B29] text-xl border border-white/10">
              NIT
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                National Institute of Technology Raipur
              </h2>
              <p className="text-xs text-slate-400">
                Institutional Store & Merchandising Division • Raipur (C.G.) 492010
              </p>
            </div>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
              OFFICIAL ORDER TOKEN
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xl sm:text-2xl font-black text-white">
                {liveOrder.id}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(liveOrder.id);
                  setCopiedOrderId(true);
                  setTimeout(() => setCopiedOrderId(false), 2000);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
                title="Copy Order ID"
              >
                {copiedOrderId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Student & Handover Meta Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50">
          {/* Student Info */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
              Student Details
            </span>
            <div className="font-bold text-slate-900 text-base">{liveOrder.customerName}</div>
            <div className="font-mono text-xs font-bold text-[#FA5B29]">
              Roll No: {liveOrder.rollNumber}
            </div>
            <div className="text-xs text-slate-500">{liveOrder.email}</div>
            <div className="text-xs text-slate-500 font-mono">📱 {liveOrder.phone}</div>
          </div>

          {/* Delivery / Fulfillment Details */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
              {liveOrder.handoverType === 'home_delivery' ? 'Delivery Address' : 'Fulfillment Point'}
            </span>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              {liveOrder.handoverType === 'home_delivery' ? (
                <>
                  <Truck className="w-4 h-4 text-[#FA5B29] shrink-0" />
                  <span>Home Delivery</span>
                </>
              ) : (
                <>
                  <Building className="w-4 h-4 text-[#FA5B29] shrink-0" />
                  <span>Makerspace Desk Handover</span>
                </>
              )}
            </div>

            {liveOrder.handoverType === 'home_delivery' ? (
              <div className="text-xs text-slate-600 space-y-1">
                {liveOrder.deliveryAddress ? (
                  <>
                    <p className="leading-relaxed font-medium text-slate-800">
                      {liveOrder.deliveryAddress.addressLine}
                    </p>
                    <p>
                      {liveOrder.deliveryAddress.city}, {liveOrder.deliveryAddress.state} – {liveOrder.deliveryAddress.pincode}
                    </p>
                    {liveOrder.deliveryAddress.landmark && (
                      <p className="text-[11px] text-slate-500">
                        Landmark: {liveOrder.deliveryAddress.landmark}
                      </p>
                    )}
                  </>
                ) : (
                  <p>Standard Home Delivery</p>
                )}
                <div className={`text-[11px] font-mono px-2 py-0.5 rounded border inline-block font-semibold ${
                  isApproved
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : 'text-amber-800 bg-amber-50 border-amber-200'
                }`}>
                  {isApproved ? 'Order In Process: Dispatch Scheduled' : 'Dispatch on Admin Approval'}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600 space-y-1">
                <p className="leading-relaxed">
                  Innovation Cell / Makerspace Desk, Ground Floor, Main Building (Beside Architecture Dept)
                </p>
                <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block font-semibold">
                  Desk Hours: 4:00 PM – 7:30 PM (Mon-Sat)
                </div>
              </div>
            )}
          </div>

          {/* Payment & Verification Meta */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
              Payment Verification
            </span>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>{liveOrder.paymentMethod === 'upi_razorpay' ? 'Direct UPI' : 'Pay at Counter'}</span>
              {isApproved ? (
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                  CONFIRMED &amp; VERIFIED ✓
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                  AWAITING APPROVAL ⏳
                </span>
              )}
            </div>
            {liveOrder.utrNumber && (
              <div className="font-mono text-xs text-slate-700">
                UTR / Ref: <span className="font-bold">{liveOrder.utrNumber}</span>
              </div>
            )}
            <div className="text-xs text-slate-500">
              Date: {new Date(liveOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
            <div className="pt-1">
              <span className="font-mono text-lg font-black text-slate-950">
                Total: {formatINR(liveOrder.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Items Breakdown Table */}
        <div className="p-6 sm:p-8 space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            <span>Enclosed Official Garments ({liveOrder.items.reduce((s, i) => s + i.quantity, 0)})</span>
          </h3>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {liveOrder.items.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-4 bg-white">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg bg-slate-100 border border-slate-200"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{item.name}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                      <span>Color: {item.color}</span>
                      <span>•</span>
                      <span>Size: {item.size}</span>
                      <span>•</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Screenshot Preview if attached */}
        {liveOrder.paymentReceiptImage && (
          <div className="p-6 sm:p-8 bg-slate-50/50 space-y-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Attached Payment Slip
            </span>
            <div className="border border-slate-200 rounded-xl p-2 bg-white max-w-sm">
              <img
                src={liveOrder.paymentReceiptImage}
                alt="UPI Slip Proof"
                className="rounded-lg object-contain w-full max-h-60"
              />
            </div>
          </div>
        )}

        {/* Quality Guarantee & Customer Support */}
        <div className="p-6 sm:p-7 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#FA5B29]" />
            <span>Makerspace Quality Guarantee • Official campus verified apparel</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate({ type: 'support' })}
              className="px-4 py-2 border border-slate-300 hover:border-slate-400 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Need Support?
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setWhatsappDispatched(true)}
              className="px-4 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Verify Payment on WhatsApp with Coordinator"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp Coordinator ({formattedCoordinatorPhone})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
