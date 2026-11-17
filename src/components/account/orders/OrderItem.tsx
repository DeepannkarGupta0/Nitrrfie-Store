import React from 'react';
import { Order } from '@/types';
import { formatPrice } from '@/lib/utils';

interface OrderItemProps {
  item: Order['items'][number];
}

export const OrderItem: React.FC<OrderItemProps> = ({ item }) => {
  return (
    <div className="flex items-center gap-4" key={item.designId ?? item.name}> {/* key handled by parent */}
      {item.designImageUrl ? (
        <img
          src={item.designImageUrl}
          alt={`${item.name} design`}
          className="w-16 h-16 object-cover border-2 border-brutal-black/20"
        />
      ) : (
        <div className="w-16 h-16 bg-brutal-black/5 border-2 border-brutal-black/20 flex items-center justify-center text-xs text-brutal-black/40 font-mono">
          No Image
        </div>
      )}
      <div className="flex-1">
        <p className="font-sans text-sm font-semibold">{item.name}</p>
        <p className="font-sans text-xs text-brutal-black/60">
          Size: {item.selectedSize} · Qty: {item.quantity}
          {item.designId && <span className="ml-2 text-accent">✦ Custom Design</span>}
        </p>
      </div>
    </div>
  );
};
