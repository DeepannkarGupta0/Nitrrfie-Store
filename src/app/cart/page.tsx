import React from "react";
import { auth } from "@clerk/nextjs/server";
import CartClient from "./CartClient";
import RecentOrders from "@/components/account/RecentOrders";
import FeatureCard from "@/components/account/FeatureCard";
import { ShoppingBag, Heart } from "lucide-react";

export default async function CartPage() {
  const { userId } = await auth();

  return (
    <div className="flex flex-col gap-12">
      <CartClient />

      {userId && (
        <div className="px-4 py-8 max-w-4xl mx-auto w-full border-t border-slate-200 pt-12">
          <h2 className="font-sans text-2xl font-bold mb-6 text-slate-900">
            Your Orders & History
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <FeatureCard
              title="Saved Designs"
              description="Create and manage your own designs."
              icon={<ShoppingBag className="h-6 w-6" />}
            />
            <FeatureCard
              title="Wishlist"
              description="Save items you love for later."
              icon={<Heart className="h-6 w-6" />}
            />
          </div>

          <RecentOrders userId={userId} />
        </div>
      )}
    </div>
  );
}
