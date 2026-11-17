'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import CatalogManager from './CatalogManager';

type Tab = 'orders' | 'inventory' | 'products' | 'recent';
type Order = {
  id: string; order_number: string; status: string; customer_name: string;
  customer_email: string; customer_phone?: string; total_amount: number;
  items: Array<{ name: string; quantity: number; selectedSize?: string; selectedColorId?: string }>;
  created_at: string; updated_at: string;
  shipping_address?: { formatted_address?: string; address?: string; upi_utr?: string; payment_screenshot_url?: string };
};
type Stock = { productId: string; name: string; image: string; quantity: number };
const money = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;
const finished = (status: string) => ['fulfilled', 'cancelled'].includes(status);

export default function AdminDashboard({ canManageTeam = false }: { canManageTeam?: boolean }) {
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const orderPageSize = 50;
  const [stock, setStock] = useState<Stock[]>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [admins, setAdmins] = useState<{ id: string; email: string; role: string }[]>([]);
  const [teamOpen, setTeamOpen] = useState(false);
  const [recentWork, setRecentWork] = useState<any[]>([]);
  const [recentBusy, setRecentBusy] = useState(false);

  async function load() {
    setError('');
    try {
      const [ordersResponse, inventoryResponse] = await Promise.all([
        fetch(`/api/admin/orders?page=${orderPage}&pageSize=${orderPageSize}`, { cache: 'no-store' }),
        fetch('/api/inventory', { cache: 'no-store' }),
      ]);
      const [ordersJson, inventoryJson] = await Promise.all([
        ordersResponse.json().catch(() => ({})),
        inventoryResponse.json().catch(() => ({})),
      ]);
    if (!ordersResponse.ok) setError(ordersJson.error || 'Unable to load orders');
    else { setOrders(ordersJson.orders || []); setOrderTotal(ordersJson.total || 0); }
      if (!inventoryResponse.ok) setError(inventoryJson.error || 'Unable to load inventory');
      else setStock(inventoryJson.inventory || []);
    } catch {
      setError('Unable to connect to the admin APIs. Check your server and Supabase configuration.');
    }
  }
  useEffect(() => { void load(); }, [orderPage]);

  async function updateOrder(orderId: string, status: string) {
    setBusy(orderId); setError('');
    const response = await fetch('/api/admin/orders', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || 'Order update failed');
    else setOrders((old) => old.map((order) => order.id === orderId ? { ...order, ...result.order } : order));
    setBusy('');
  }

  async function updateStock(productId: string, quantity: number) {
    setBusy(productId); setError('');
    const response = await fetch('/api/inventory', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || 'Inventory update failed');
    else { setStock((old) => old.map((item) => item.productId === productId ? { ...item, quantity } : item)); window.dispatchEvent(new Event('inventory:refresh')); }
    setBusy('');
  }

  async function loadRecentWork() {
    setRecentBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/recent-work?limit=150', {cache:'no-store'});
      const result = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(result.error || 'Unable to load recent work');
      setRecentWork(result.activities || []);
      setTab('recent');
    } catch(e) { setError(e instanceof Error ? e.message : 'Unable to load recent work'); }
    finally { setRecentBusy(false); }
  }

  async function loadAdmins() {
    const response = await fetch('/api/admin/team');
    const result = await response.json();
    if (response.ok) setAdmins(result.admins || []);
    else setError(result.error || 'Unable to load admins');
    setTeamOpen(true);
  }

  async function removeAdmin(admin: { id: string; email: string; role: string }) {
    if (admin.role.toLowerCase() !== 'admin') return;
    const confirmed = window.confirm(`Remove admin access from ${admin.email}? They will become a normal store customer. Their account and order history will not be deleted.`);
    if (!confirmed) return;

    setBusy(`remove:${admin.id}`);
    setError('');
    try {
      const response = await fetch('/api/admin/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: admin.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || 'Could not remove admin access.');
      } else {
        setAdmins((current) => current.filter((item) => item.id !== admin.id));
      }
    } catch {
      setError('Unable to connect to the admin team API.');
    } finally {
      setBusy('');
    }
  }

  async function addAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy('team'); setError('');
    const response = await fetch('/api/admin/team', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || 'Could not add admin');
    else { setEmail(''); await loadAdmins(); }
    setBusy('');
  }

  const active = orders.filter((order) => !finished(order.status));
  const previous = useMemo(() => orders.filter((order) => finished(order.status)).reduce<Record<string, Order[]>>((groups, order) => {
    const date = new Date(order.created_at);
    const month = date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    (groups[month] ??= []).push(order);
    return groups;
  }, {}), [orders]);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#ff782e]">NITRRFIE Store / Operations</p>
            <h1 className="mt-1 text-3xl font-black sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Manage customer orders and store inventory.</p>
          </div>
          {canManageTeam && <div className="flex gap-2"><button onClick={loadRecentWork} disabled={recentBusy} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold hover:border-[#ff782e]">{recentBusy?'Loading…':'Recent work'}</button><button onClick={loadAdmins} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold hover:border-[#ff782e]">Manage team</button></div>}
        </div>

        <div
          role="tablist"
          aria-label="Admin sections"
          className="mb-6 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm min-[520px]:grid-cols-3"
        >
          {(['orders', 'inventory', 'products'] as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-lg px-3 py-3 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff782e] focus-visible:ring-offset-2 ${
                tab === key
                  ? 'bg-orange-50 text-[#ff782e] shadow-sm ring-1 ring-orange-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {key === 'orders' ? 'Orders' : key === 'inventory' ? 'Inventory' : key === 'products' ? 'Products & Categories' : 'Recent Work'}
            </button>
          ))}
        </div>

        {tab === 'products' && <CatalogManager />}

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {tab === 'orders' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="mb-4 text-lg font-extrabold">Previous orders</h2>
              <div className="space-y-5">
                {Object.entries(previous).map(([month, monthOrders]) => (
                  <div key={month}>
                    <h3 className="mb-2 border-b border-slate-100 pb-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">{month} · {monthOrders.length} orders</h3>
                    <div className="space-y-2">
                      {monthOrders.map((order, index) => (
                        <div key={order.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                          <div className="min-w-0"><p className="truncate text-xs font-bold">#{index + 1} · {order.order_number}</p><p className="truncate text-xs text-slate-500">{order.customer_name} · {new Date(order.created_at).toLocaleDateString('en-IN')}</p></div>
                          <div className="text-right"><p className="text-sm font-bold">{money(order.total_amount)}</p><p className="text-[10px] font-bold uppercase text-emerald-700">{order.status}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(previous).length === 0 && <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Completed orders will be archived here month-wise.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Current active orders</h2><span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{active.length}</span></div>
              <div className="space-y-3">
                {active.map((order, index) => (
                  <article key={order.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-[#ff782e]">#{index + 1} · {order.order_number}</p><p className="mt-1 font-bold">{order.customer_name}</p><p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('en-IN')} · {order.customer_phone || order.customer_email}</p></div><p className="font-extrabold">{money(order.total_amount)}</p></div>
                    <div className="my-3 space-y-1 text-sm">{(order.items || []).map((item, itemIndex) => <p key={itemIndex}>{item.name} × {item.quantity} {item.selectedSize ? `· ${item.selectedSize}` : ''}</p>)}</div>
                    <p className="mb-2 text-xs text-slate-500">{order.shipping_address?.formatted_address || order.shipping_address?.address || 'Address not available'} · Status: <b className="uppercase">{order.status}</b></p><div className="mb-3 flex flex-wrap gap-3 text-xs"><span>UPI reference: <b>{order.shipping_address?.upi_utr || 'Not supplied'}</b></span>{order.shipping_address?.payment_screenshot_url && <a className="font-bold text-[#ff782e] underline" href={order.shipping_address.payment_screenshot_url} target="_blank" rel="noreferrer">View payment proof</a>}</div>
                    <div className="flex flex-wrap gap-2">
                      <select aria-label="Update order status" value={order.status} onChange={(event) => updateOrder(order.id, event.target.value)} disabled={busy === order.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
                        <option value="pending">Payment pending / review</option><option value="paid">Payment verified</option><option value="processing">Processing</option><option value="fulfilled">Completed / Delivered</option><option value="cancelled">Cancelled</option>
                      </select>
                      <button onClick={() => updateOrder(order.id, 'fulfilled')} disabled={busy === order.id} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Mark completed</button>
                    </div>
                  </article>
                ))}
                {active.length === 0 && <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No active orders.</p>}
              </div>
            </section>
          </div>
        )}
        {tab === 'recent' && canManageTeam && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-extrabold">Recent admin activity</h2><p className="text-xs text-slate-500">Audit trail of catalogue and category changes by administrators.</p></div><button onClick={loadRecentWork} disabled={recentBusy} className="rounded-lg border px-3 py-2 text-xs font-bold">Refresh</button></div>
            <div className="divide-y divide-slate-100">
              {recentWork.map((entry)=>(
                <article key={entry.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0"><p className="text-sm font-bold text-slate-900">{entry.actor_name || entry.actor_email} <span className="font-medium text-slate-500">{entry.action}</span> {entry.entity_type}: {entry.entity_name}</p><p className="mt-1 text-xs text-slate-500">{entry.actor_email} · {entry.entity_id || '—'}</p>{entry.details && <p className="mt-1 break-words text-xs text-slate-500">{JSON.stringify(entry.details)}</p>}</div>
                  <time className="shrink-0 text-xs text-slate-500">{new Date(entry.created_at).toLocaleString('en-IN')}</time>
                </article>
              ))}
              {recentWork.length===0&&<p className="py-10 text-center text-sm text-slate-500">No admin activity has been recorded yet. New actions will appear here after the audit migration is applied.</p>}
            </div>
          </section>
        )}

        {tab === 'orders' && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">Showing page {orderPage} · {orderTotal.toLocaleString('en-IN')} total orders</p>
            <div className="flex gap-2">
              <button type="button" disabled={orderPage===1} onClick={()=>setOrderPage(p=>Math.max(1,p-1))} className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40">Previous</button>
              <button type="button" disabled={orderPage*orderPageSize>=orderTotal} onClick={()=>setOrderPage(p=>p+1)} className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40">Next</button>
            </div>
          </div>
        )}

        {tab === 'inventory' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4"><h2 className="text-lg font-extrabold">Inventory</h2><p className="text-xs text-slate-500">Update available quantities. Zero quantity marks the product out of stock across the storefront.</p></div>
            <div className="divide-y divide-slate-100">
              {stock.map((item) => (
                <div key={item.productId} className="flex flex-wrap items-center gap-3 py-3">
                  <img src={item.image} alt="" className="h-14 w-14 rounded-lg bg-slate-100 object-cover" />
                  <div className="min-w-0 flex-1"><p className="text-sm font-bold">{item.name}</p><p className={`text-xs font-extrabold ${item.quantity === 0 ? 'text-red-600' : 'text-emerald-700'}`}>{item.quantity === 0 ? 'OUT OF STOCK' : `${item.quantity} available`}</p></div>
                  <form className="flex items-center gap-2" onSubmit={(event) => { event.preventDefault(); const quantity = Number(new FormData(event.currentTarget).get('quantity')); void updateStock(item.productId, quantity); }}>
                    <input name="quantity" type="number" min="0" step="1" defaultValue={item.quantity} className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-sm" />
                    <button disabled={busy === item.productId} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Save</button>
                  </form>
                </div>
              ))}
              {stock.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No inventory records. Run the inventory SQL migration first.</p>}
            </div>
          </section>
        )}


        {teamOpen && canManageTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">Manage admins</h2><button onClick={() => setTeamOpen(false)} className="text-2xl">×</button></div>
              <form onSubmit={addAdmin} className="flex gap-2"><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Existing account email" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button disabled={busy === 'team'} className="rounded-lg bg-[#ff782e] px-4 py-2 text-sm font-bold text-white">Add admin</button></form>
              <p className="mt-2 text-xs text-slate-500">The person must first register normally and verify their email. Only a Super Admin can promote them.</p>
              <div className="mt-5 space-y-2">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{admin.email || 'Email unavailable'}</p>
                      <b className="text-[10px] uppercase tracking-wide text-slate-500">{admin.role.replace('_', ' ')}</b>
                    </div>
                    {admin.role.toLowerCase() === 'admin' ? (
                      <button
                        type="button"
                        onClick={() => void removeAdmin(admin)}
                        disabled={busy === `remove:${admin.id}`}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
                      >
                        {busy === `remove:${admin.id}` ? 'Removing…' : 'Remove admin'}
                      </button>
                    ) : (
                      <span className="rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase text-emerald-700">Protected</span>
                    )}
                  </div>
                ))}
                {admins.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">No administrators found.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
