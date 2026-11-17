'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
type InventoryMap = Record<string, number>;
const InventoryContext = createContext<InventoryMap>({});
export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<InventoryMap>({});
  useEffect(() => {
    let active = true;
    const load = () => fetch('/api/inventory', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (active && data?.inventory) setInventory(Object.fromEntries(data.inventory.map((item: { productId: string; quantity: number }) => [item.productId, item.quantity])));
      }).catch(() => {});
    const refresh = () => { void load(); };
    void load();
    window.addEventListener('focus', refresh);
    window.addEventListener('inventory:refresh', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); window.removeEventListener('inventory:refresh', refresh); };
  }, []);
  return <InventoryContext.Provider value={inventory}>{children}</InventoryContext.Provider>;
}
export function useInventory() { return useContext(InventoryContext); }
