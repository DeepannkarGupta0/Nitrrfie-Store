import React from "react";
import { auth } from "@clerk/nextjs/server";
import CartClient from "./CartClient";
import RecentOrders from "@/components/account/RecentOrders";

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
          
          <RecentOrders userId={userId} />
        </div>
      )}
    </div>
  );
}
