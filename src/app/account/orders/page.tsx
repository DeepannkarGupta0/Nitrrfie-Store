
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Order } from "@/types";
import { OrderList } from "@/components/account/orders";
import { ErrorState } from "@/components/account/state/ErrorState";
import { EmptyState } from "@/components/account/state/EmptyState";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const { userId } = await auth();

  // Redirect unauthenticated users
  if (!userId) {
    redirect("/sign-in");
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch orders:", error);

      return (
        <ErrorState
          title="Failed to load orders"
          message="We couldn't load your orders. Please try again later."
        />
      );
    }

    const myOrders = (data ?? []) as Order[];

    return (
      <main className="min-h-screen bg-cream px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-brutal-black sm:text-3xl">
              My Orders
            </h1>

            <p className="mt-2 text-sm text-brutal-black/60">
              Track your purchases and order history.
            </p>
          </div>

          {/* Orders */}
          {myOrders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="Your purchases will appear here once you place an order."
            />
          ) : (
            <OrderList orders={myOrders} />
          )}

        </div>
      </main>
    );

  } catch (error) {
    console.error("Unexpected error loading orders:", error);

    return (
      <ErrorState
        title="Something went wrong"
        message="We couldn't load your orders. Please refresh the page and try again."
      />
    );
  }
}
