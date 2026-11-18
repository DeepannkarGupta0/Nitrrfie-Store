import React from 'react';
import Link from 'next/link';

export const EmptyOrders: React.FC = () => {
  return (
    <div className="border-brutal border-3 border-brutal-black p-12 text-center bg-cream" style={{ boxShadow: "8px 8px 0 #0A0A0A" }}>
      <p className="font-sans text-lg font-medium mb-6 text-brutal-black/60">You haven&apos;t placed any orders yet.</p>
      <Link href="/shop" className="inline-block border-brutal border-3 bg-accent text-cream px-8 py-3 font-sans text-sm font-bold hover:bg-brutal-black transition-colors">
        Start Shopping
      </Link>
    </div>
  );
};
