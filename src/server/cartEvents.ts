export interface CartSyncEventPayload {
  type: 'cart_updated';
  userId: string;
  version: number;
  updatedAt: string;
  sourceClientId?: string;
}

type CartEventListener = (event: CartSyncEventPayload) => void;

const subscribersByUser = new Map<string, Set<CartEventListener>>();

export function subscribeToUserCartEvents(
  userId: string,
  listener: CartEventListener
): () => void {
  let set = subscribersByUser.get(userId);
  if (!set) {
    set = new Set();
    subscribersByUser.set(userId, set);
  }
  set.add(listener);

  return () => {
    const current = subscribersByUser.get(userId);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      subscribersByUser.delete(userId);
    }
  };
}

export function broadcastUserCartEvent(event: CartSyncEventPayload) {
  const listeners = subscribersByUser.get(event.userId);
  if (!listeners || listeners.size === 0) return;
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Isolate individual listener errors
    }
  }
}
