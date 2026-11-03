"use client";

import { useState } from "react";
import BrutalButton from "@/components/ui/BrutalButton";
import type { Order } from "@/types";
import { formatPrice } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-brutal-black/10 text-brutal-black",
  paid:       "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  fulfilled:  "bg-toxic text-brutal-black",
  failed:     "bg-accent/20 text-accent",
  cancelled:  "bg-brutal-black/20 text-brutal-black/60",
};

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onRetry: (orderId: string) => void;
}

function OrderDetailModal({ order, onClose, onRetry }: OrderDetailModalProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await onRetry(order.id);
    setRetrying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brutal-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-cream border-brutal border-3 border-brutal-black max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "8px 8px 0 #0A0A0A" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b-3 border-brutal-black">
          <div>
            <h2 className="font-mono text-xl font-bold uppercase">{order.order_number}</h2>
            <span className={`inline-block mt-1 font-mono text-xs uppercase px-3 py-1 ${STATUS_COLORS[order.status] || ""}`}>
              {order.status}
            </span>
          </div>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="w-8 h-8 border-brutal border-3 font-mono hover:bg-accent hover:text-cream transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <section>
            <h3 className="font-mono text-sm uppercase font-bold mb-3 border-b border-brutal-black/20 pb-2">Customer & Delivery Details</h3>
            <div className="grid grid-cols-2 gap-2 font-sans text-sm">
              <span className="text-brutal-black/60">Name</span><span className="font-bold">{order.customer_name}</span>
              <span className="text-brutal-black/60">Roll Number / ID</span><span className="font-mono font-bold text-accent">{(order.shipping_address as any)?.roll_number || order.user_id || "N/A"}</span>
              <span className="text-brutal-black/60">WhatsApp / Phone</span><span>{order.customer_phone || "—"}</span>
              <span className="text-brutal-black/60">Email</span><span>{order.customer_email}</span>
              <span className="text-brutal-black/60">Delivery Mode</span>
              <span className="font-bold">
                {(order.shipping_address as any)?.delivery_type === "pan_india"
                  ? "PAN India Doorstep Delivery"
                  : (order.shipping_address as any)?.delivery_type === "hostel_delivery"
                  ? "NIT Raipur Hostel Handover"
                  : "NIT Raipur Portico Desk Pickup"}
              </span>
              <span className="text-brutal-black/60">Delivery Address</span>
              <span className="font-bold leading-relaxed">
                {(order.shipping_address as any)?.formatted_address ||
                 (order.shipping_address as any)?.address ||
                 "NIT Raipur Campus Handover"}
              </span>
            </div>
          </section>

          {/* Items */}
          <section>
            <h3 className="font-mono text-sm uppercase font-bold mb-3 border-b border-brutal-black/20 pb-2">Items Ordered</h3>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border-brutal border-2 border-brutal-black/30">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover border border-brutal-black/30" />
                  )}
                  <div className="flex-1">
                    <p className="font-mono text-sm font-bold">{item.name}</p>
                    <p className="font-sans text-xs text-brutal-black/60">
                      Size: {item.selectedSize || "Standard"} · Qty: {item.quantity} {item.selectedColorId ? `· ${item.selectedColorId}` : ""}
                    </p>
                  </div>
                  <p className="font-mono font-bold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-mono font-bold text-lg mt-3 pt-3 border-t-3 border-brutal-black">
              <span>Total Amount</span>
              <span className="text-accent">{formatPrice(order.total_amount / 100)}</span>
            </div>
          </section>

          {/* Payment */}
          <section>
            <h3 className="font-mono text-sm uppercase font-bold mb-3 border-b border-brutal-black/20 pb-2">Payment Verification</h3>
            <div className="grid grid-cols-2 gap-2 font-sans text-sm">
              <span className="text-brutal-black/60">Payment Mode</span>
              <span className="font-bold">
                {(order.shipping_address as any)?.payment_method === "upi_qr"
                  ? "UPI QR Code Transfer"
                  : "Pay at Campus Handover"}
              </span>
              <span className="text-brutal-black/60">Status</span>
              <span className={`font-bold ${order.status === "paid" ? "text-green-700" : "text-accent"}`}>
                {order.status.toUpperCase()}
              </span>
              <span className="text-brutal-black/60">12-Digit UTR Number</span>
              <span className="font-mono text-sm font-bold text-slate-900 bg-yellow-100 px-2 py-0.5 inline-block">
                {(order.shipping_address as any)?.upi_utr || order.payments?.gateway_payment_id || "—"}
              </span>
            </div>
          </section>

          {/* Qikink */}
          {order.qikink_order_id && (
            <section>
              <h3 className="font-mono text-sm uppercase font-bold mb-3 border-b border-brutal-black/20 pb-2">Qikink</h3>
              <div className="grid grid-cols-2 gap-2 font-sans text-sm">
                <span className="text-brutal-black/60">Order ID</span>
                <span className="font-mono">{order.qikink_order_id}</span>
              </div>
            </section>
          )}

          {/* Error */}
          {order.error_message && (
            <div className="border-brutal border-3 border-accent bg-accent/10 p-4">
              <p className="font-mono text-xs uppercase text-accent mb-1">Error (attempt {order.retry_count})</p>
              <p className="font-sans text-sm">{order.error_message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {order.status === "failed" && (
              <BrutalButton variant="accent" onClick={handleRetry} disabled={retrying}>
                {retrying ? "Retrying..." : "Retry Qikink"}
              </BrutalButton>
            )}
            <BrutalButton variant="ghost" onClick={onClose}>Close</BrutalButton>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AdminOrdersClientProps {
  initialOrders: Order[];
}

export default function AdminOrdersClient({ initialOrders }: AdminOrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [retryMsg, setRetryMsg] = useState<string | null>(null);

  const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  const handleRetry = async (orderId: string) => {
    setRetryMsg(null);
    const res = await fetch("/api/admin/orders/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });
    const data = await res.json();
    if (data.success) {
      setRetryMsg("Order submitted to Qikink successfully.");
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "fulfilled" as const } : o));
    } else {
      setRetryMsg(`Retry failed: ${data.error}`);
    }
    setSelectedOrder(null);
  };

  const statuses = ["all", "pending", "paid", "processing", "fulfilled", "failed", "cancelled"];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`font-mono text-xs uppercase px-3 py-2 border-brutal border-2 transition-colors ${
              statusFilter === s
                ? "bg-brutal-black text-cream border-brutal-black"
                : "bg-cream border-brutal-black/40 hover:border-brutal-black"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Feedback message */}
      {retryMsg && (
        <div className="border-brutal border-3 border-brutal-black p-4 mb-6 bg-toxic font-mono text-sm">
          {retryMsg}
        </div>
      )}

      {/* Orders table */}
      <div className="border-brutal border-3 border-brutal-black overflow-hidden" style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
        <div className="grid grid-cols-6 bg-brutal-black text-cream font-mono text-xs uppercase p-3 gap-2">
          <span>Order #</span>
          <span>Customer</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Date</span>
          <span>Action</span>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center font-mono text-sm text-brutal-black/40 uppercase">
            No orders found
          </div>
        )}

        {filtered.map((order) => (
          <div
            key={order.id}
            className="grid grid-cols-6 p-3 gap-2 border-t border-brutal-black/20 hover:bg-brutal-black/5 transition-colors items-center"
          >
            <span className="font-mono text-xs font-bold truncate">{order.order_number}</span>
            <span className="font-sans text-xs truncate">{order.customer_email}</span>
            <span className="font-mono text-xs font-bold">{formatPrice(order.total_amount / 100)}</span>
            <span className={`font-mono text-[10px] uppercase px-2 py-1 text-center ${STATUS_COLORS[order.status] || ""}`}>
              {order.status}
            </span>
            <span className="font-sans text-xs text-brutal-black/60">
              {new Date(order.created_at).toLocaleDateString("en-IN")}
            </span>
            <button
              onClick={() => setSelectedOrder(order)}
              className="font-mono text-xs uppercase underline hover:text-accent transition-colors text-left"
            >
              View
            </button>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
