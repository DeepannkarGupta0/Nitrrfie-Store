export interface CatalogSyncEventPayload {
  type: 'catalog_updated';
  reason: string;
  productId?: string;
  updatedAt: string;
}

type CatalogEventListener = (event: CatalogSyncEventPayload) => void;

const catalogListeners = new Set<CatalogEventListener>();

export function subscribeToCatalogEvents(listener: CatalogEventListener): () => void {
  catalogListeners.add(listener);
  return () => {
    catalogListeners.delete(listener);
  };
}

export function broadcastCatalogEvent(event: CatalogSyncEventPayload) {
  if (catalogListeners.size === 0) return;
  for (const listener of catalogListeners) {
    try {
      listener(event);
    } catch {
      // Isolate individual listener errors
    }
  }
}
