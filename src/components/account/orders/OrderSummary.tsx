import React from 'react';
import { Order } from '@/types';
import { formatPrice } from '@/lib/utils';

interface OrderSummaryProps {
  order: Order;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => {
  return (
    <div className="p-4 md:p-6 border-t-2 border-brutal-black flex justify-end">
      <div>
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-brutal-black/55">Total</p>
        <p className="font-sans font-bold text-accent">
          {formatPrice(order.total_amount / 100)}
        </p>
      </div>
    </div>
  );
};
