import React, { useState, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { Order } from '../../types/store';
import { formatINR } from '../../utils/cartLogic';
import {
  Building,
  MapPin,
  Phone,
  Printer,
  Eye,
} from 'lucide-react';

interface HostelDeliveryLogisticsProps {
  onShowNotification: (msg: string) => void;
  onViewOrderDetails: (order: Order) => void;
}

export const HostelDeliveryLogistics: React.FC<HostelDeliveryLogisticsProps> = ({
  onShowNotification,
  onViewOrderDetails,
}) => {
  const { orders, updateOrderStatus } = useCart();
  const [selectedRoute, setSelectedRoute] = useState<'courier' | 'hostel' | 'desk'>('courier');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  // Pan-India Courier orders (exclude cancelled)
  const courierOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'cancelled' && o.handoverType === 'home_delivery');
  }, [orders]);

  // Group hostel orders by hostel name (exclude cancelled)
  const hostelGrouped = useMemo(() => {
    const map = new Map<string, Order[]>();
    orders
      .filter((o) => o.status !== 'cancelled' && o.handoverType === 'hostel_delivery')
      .forEach((o) => {
        const hostel = o.hostelDetails?.hostelName || 'General Campus Hostel';
        if (!map.has(hostel)) {
          map.set(hostel, []);
        }
        map.get(hostel)!.push(o);
      });
    return Array.from(map.entries());
  }, [orders]);

  const hostelCount = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled' && o.handoverType === 'hostel_delivery').length,
    [orders]
  );

  // Desk orders (exclude cancelled)
  const deskOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'cancelled' && o.handoverType === 'makerspace_desk');
  }, [orders]);

  const handlePrintManifest = () => {
    window.print();
    onShowNotification('Logistics fulfillment manifest sent to printer.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--paper)] p-5 rounded-[var(--r)] border border-[var(--line)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-brand font-bold text-[var(--ink)] tracking-tight">
              Pan-India &amp; Campus Logistics Routing
            </h2>
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 bg-[var(--paper-2)] text-[var(--accent)] rounded-[var(--r-pill)] border border-[var(--line)]">
              Express Courier &amp; Campus Runs
            </span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            Dispatch trackable packages to alumni across Indian states, coordinate campus hostel runners, and manage Makerspace desk handovers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintManifest}
            className="px-4 py-2 bg-[var(--ink)] hover:bg-[var(--accent-solid)] text-[var(--on-ink)] hover:text-white font-mono text-xs font-bold uppercase tracking-wider rounded-[var(--r-in)] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm active:translate-y-px"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Manifest</span>
          </button>
        </div>
      </div>

      {/* Route Switcher Tabs */}
      <div className="flex rounded-[var(--r-in)] bg-[var(--paper-2)] p-1 border border-[var(--line)] max-w-xl text-xs font-mono font-semibold">
        <button
          type="button"
          onClick={() => setSelectedRoute('courier')}
          className={`flex-1 py-2 rounded-[var(--r-in)] transition-all cursor-pointer flex items-center justify-center gap-2 ${
            selectedRoute === 'courier'
              ? 'bg-[var(--paper)] text-[var(--ink)] font-bold shadow-xs border border-[var(--line)]'
              : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)]/50'
          }`}
        >
          <Building className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Pan-India Courier ({courierOrders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedRoute('hostel')}
          className={`flex-1 py-2 rounded-[var(--r-in)] transition-all cursor-pointer flex items-center justify-center gap-2 ${
            selectedRoute === 'hostel'
              ? 'bg-[var(--paper)] text-[var(--ink)] font-bold shadow-xs border border-[var(--line)]'
              : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)]/50'
          }`}
        >
          <Building className="w-3.5 h-3.5 text-[var(--info)]" />
          <span>Hostel Drops ({hostelCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedRoute('desk')}
          className={`flex-1 py-2 rounded-[var(--r-in)] transition-all cursor-pointer flex items-center justify-center gap-2 ${
            selectedRoute === 'desk'
              ? 'bg-[var(--paper)] text-[var(--ink)] font-bold shadow-xs border border-[var(--line)]'
              : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-3)]/50'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-[var(--ok)]" />
          <span>Campus Desk ({deskOrders.length})</span>
        </button>
      </div>

      {/* Pan-India Express Courier Route */}
      {selectedRoute === 'courier' && (
        <div className="bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] overflow-hidden shadow-sm">
          <div className="bg-[var(--ink-paper)] text-white px-5 py-3 flex items-center justify-between border-b border-[var(--on-ink-line)]">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="font-brand font-bold text-xs uppercase tracking-wide">
                Pan-India Express Courier Queue (Alumni &amp; Nationwide Deliveries)
              </h3>
            </div>
            <span className="font-mono text-xs text-[var(--accent)]">
              {courierOrders.length} {courierOrders.length === 1 ? 'Consignment' : 'Consignments'}
            </span>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {courierOrders.length === 0 ? (
              <div className="p-12 text-center text-xs text-[var(--muted)] font-mono space-y-2">
                <Building className="w-8 h-8 text-[var(--muted)] mx-auto" />
                <p>No Pan-India courier orders queued currently.</p>
              </div>
            ) : (
              courierOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[var(--paper-2)] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-[var(--ink)] bg-[var(--paper-2)] border border-[var(--line)] px-2 py-0.5 rounded-[var(--r-in)]">
                        {order.id}
                      </span>
                      <span className="font-brand font-bold text-xs text-[var(--ink)]">
                        {order.customerName}
                      </span>
                      {order.rollNumber && order.rollNumber !== 'ALUMNI / DIRECT' && (
                        <span className="font-mono text-[11px] text-[var(--accent)] font-semibold">
                          ({order.rollNumber})
                        </span>
                      )}
                    </div>

                    {order.deliveryAddress ? (
                      <p className="text-xs text-[var(--ink-2)] font-mono flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        <span>
                          {order.deliveryAddress.addressLine}, {order.deliveryAddress.city}, {order.deliveryAddress.state} – <strong className="text-[var(--ink)]">{order.deliveryAddress.pincode}</strong>
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--muted)] font-mono">
                        Direct Express Courier (Address to be confirmed via phone)
                      </p>
                    )}

                    <p className="text-[11px] text-[var(--muted)] flex items-center gap-1.5 font-mono">
                      <Phone className="w-3 h-3 text-[var(--muted)]" />
                      <span>{order.phone}</span>
                      <span className="text-[var(--line-2)]">•</span>
                      <span>{order.items.map((i) => `${i.name} (${i.size}) x${i.quantity}`).join('; ')}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--ink)] tabular-nums mr-2">
                      {formatINR(order.total)}
                    </span>

                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-[var(--r-pill)] font-semibold ${
                        order.status === 'delivered'
                          ? 'bg-[var(--paper-2)] text-[var(--muted)] border border-[var(--line)]'
                          : order.status === 'ready_for_handover'
                          ? 'bg-[var(--ok-soft)] text-[var(--ok)] border border-[var(--ok-border)]'
                          : 'bg-[var(--warn-soft)] text-[var(--warn)] border border-[var(--warn-border)]'
                      }`}
                    >
                      {order.status === 'ready_for_handover' ? 'DISPATCHED' : order.status.replace('_', ' ')}
                    </span>

                    {order.status !== 'delivered' && (
                      <button
                        type="button"
                        disabled={busyOrderId === order.id}
                        onClick={async () => {
                          if (busyOrderId) return;
                          setBusyOrderId(order.id);
                          try {
                            const nextStatus = order.status === 'ready_for_handover' ? 'delivered' : 'ready_for_handover';
                            const res = await updateOrderStatus(order.id, nextStatus);
                            if (res.success) {
                              onShowNotification(`Order #${order.id} marked ${nextStatus === 'delivered' ? 'Delivered' : 'Dispatched via Courier'}`);
                            } else {
                              onShowNotification(res.error || `Unable to update Order #${order.id}.`);
                            }
                          } finally {
                            setBusyOrderId(null);
                          }
                        }}
                        className="px-3 py-1.5 bg-[var(--accent-solid)] enabled:hover:bg-[var(--accent-solid-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-[11px] font-bold uppercase tracking-wider rounded-[var(--r-in)] cursor-pointer transition-colors"
                      >
                        {busyOrderId === order.id
                          ? 'Updating...'
                          : order.status === 'ready_for_handover'
                          ? 'Mark Delivered'
                          : 'Dispatch Courier'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onViewOrderDetails(order)}
                      aria-label="View order pass"
                      className="p-1.5 bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-[var(--ink)] border border-[var(--line)] rounded-[var(--r-in)] cursor-pointer transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hostel Grouping View */}
      {selectedRoute === 'hostel' && (
        <div className="space-y-6">
          {hostelGrouped.length === 0 ? (
            <div className="p-12 text-center bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] space-y-2">
              <Building className="w-10 h-10 text-[var(--muted)] mx-auto mb-2" />
              <h3 className="text-sm font-brand font-bold text-[var(--ink)]">No hostel delivery orders queued</h3>
              <p className="text-xs text-[var(--muted)]">
                Orders with hostel delivery selection will be automatically grouped by hostel block here.
              </p>
            </div>
          ) : (
            hostelGrouped.map(([hostelName, groupOrders]) => (
              <div
                key={hostelName}
                className="bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] overflow-hidden shadow-sm"
              >
                <div className="bg-[var(--ink-paper)] text-white px-5 py-3 flex items-center justify-between border-b border-[var(--on-ink-line)]">
                  <div className="flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-[var(--accent)]" />
                    <h3 className="font-brand font-bold text-xs uppercase tracking-wide">
                      {hostelName}
                    </h3>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 bg-white/10 text-slate-200 rounded-[var(--r-pill)] border border-[var(--on-ink-line)]">
                    {groupOrders.length} {groupOrders.length === 1 ? 'Package' : 'Packages'}
                  </span>
                </div>

                <div className="divide-y divide-[var(--line)]">
                  {groupOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[var(--paper-2)] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[var(--ink)] bg-[var(--paper-2)] border border-[var(--line)] px-2 py-0.5 rounded-[var(--r-in)]">
                            Room {order.hostelDetails?.roomNumber || 'N/A'}
                          </span>
                          <span className="font-brand font-bold text-xs text-[var(--ink)]">
                            {order.customerName}
                          </span>
                          {order.rollNumber && order.rollNumber !== 'ALUMNI / DIRECT' && (
                            <span className="font-mono text-[11px] text-[var(--accent)] font-semibold">
                              ({order.rollNumber})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted)] flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 text-[var(--muted)]" />
                          <span>{order.phone}</span>
                          <span className="text-[var(--line-2)]">•</span>
                          <span>Order: {order.id}</span>
                        </p>
                        <p className="text-[11px] text-[var(--muted)]">
                          Items: {order.items.map((i) => `${i.name} (${i.size}) x${i.quantity}`).join('; ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-[var(--r-pill)] font-semibold ${
                            order.status === 'delivered'
                              ? 'bg-[var(--paper-2)] text-[var(--muted)] border border-[var(--line)]'
                              : order.status === 'ready_for_handover'
                              ? 'bg-[var(--ok-soft)] text-[var(--ok)] border border-[var(--ok-border)]'
                              : 'bg-[var(--warn-soft)] text-[var(--warn)] border border-[var(--warn-border)]'
                          }`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>

                        {order.status !== 'delivered' && (
                          <button
                            type="button"
                            disabled={busyOrderId === order.id}
                            onClick={async () => {
                              if (busyOrderId) return;
                              setBusyOrderId(order.id);
                              try {
                                const res = await updateOrderStatus(order.id, 'delivered');
                                if (res.success) {
                                  onShowNotification(`Order #${order.id} marked delivered at ${hostelName}`);
                                } else {
                                  onShowNotification(res.error || `Unable to update Order #${order.id}.`);
                                }
                              } finally {
                                setBusyOrderId(null);
                              }
                            }}
                            className="px-3 py-1.5 bg-[var(--accent-solid)] enabled:hover:bg-[var(--accent-solid-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-[11px] font-bold uppercase tracking-wider rounded-[var(--r-in)] cursor-pointer transition-colors"
                          >
                            {busyOrderId === order.id ? 'Updating...' : 'Mark Handed Over'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onViewOrderDetails(order)}
                          aria-label="View order pass"
                          className="p-1.5 bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-[var(--ink)] border border-[var(--line)] rounded-[var(--r-in)] cursor-pointer transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Makerspace Desk Queue */}
      {selectedRoute === 'desk' && (
        <div className="bg-[var(--paper)] rounded-[var(--r)] border border-[var(--line)] overflow-hidden shadow-sm">
          <div className="bg-[var(--ink-paper)] text-white px-5 py-3 flex items-center justify-between border-b border-[var(--on-ink-line)]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--ok)]" />
              <h3 className="font-brand font-bold text-xs uppercase tracking-wide">
                Innovation Cell / Makerspace Pickup Desk (Ground Floor, Main Building)
              </h3>
            </div>
            <span className="font-mono text-xs text-[var(--ok)]">
              4:00 PM – 7:30 PM (Mon-Sat)
            </span>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {deskOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--muted)] font-mono">
                No orders currently waiting at the Makerspace Desk.
              </div>
            ) : (
              deskOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[var(--paper-2)] transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[var(--ink)] tabular-nums">
                        {order.id}
                      </span>
                      <span className="font-brand font-bold text-xs text-[var(--ink)]">
                        {order.customerName}
                      </span>
                      {order.rollNumber && order.rollNumber !== 'ALUMNI / DIRECT' && (
                        <span className="font-mono text-[var(--accent)] font-semibold text-[11px]">
                          Roll: {order.rollNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {order.items.map((i) => `${i.name} (${i.size})`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--ink)] tabular-nums">
                      {formatINR(order.total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onViewOrderDetails(order)}
                      className="px-3 py-1.5 bg-[var(--paper-2)] hover:bg-[var(--paper-3)] border border-[var(--line)] text-[var(--ink)] font-mono text-xs rounded-[var(--r-in)] cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
