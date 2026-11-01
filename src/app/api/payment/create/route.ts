import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { log } from "@/lib/logger";
import type { ShippingAddress, OrderItem } from "@/types";

interface CreatePaymentBody {
  customer: ShippingAddress;
  items: OrderItem[];
  totalAmount: number; // in paise (₹1 = 100 paise)
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `NITRR-${ts}-${rand}`.substring(0, 18);
}

export async function POST(request: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in to checkout." }, { status: 401 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Payment gateway not configured." }, { status: 503 });
  }

  try {
    const body: CreatePaymentBody = await request.json();
    const { customer, items, totalAmount } = body;

    // ── Validate ──────────────────────────────────────────────────────────
    if (!customer || !items?.length || !totalAmount) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (totalAmount < 100) {
      return NextResponse.json({ error: "Minimum order amount is ₹1." }, { status: 400 });
    }

    // ── Create Razorpay order ─────────────────────────────────────────────
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const orderNumber = generateOrderNumber();

    const rzOrder = await razorpay.orders.create({
      amount: totalAmount,
      currency: "INR",
      receipt: orderNumber,
    });

    // ── Save payment record ───────────────────────────────────────────────
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        gateway: "razorpay",
        gateway_order_id: rzOrder.id,
        amount: totalAmount,
        currency: "INR",
        status: "created",
        verified: false,
      })
      .select()
      .single();

    if (paymentError) throw new Error(`DB payment insert failed: ${paymentError.message}`);

    // ── Save pending order record ─────────────────────────────────────────
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        status: "pending",
        customer_name: customer.name,
        customer_email: customer.email.toLowerCase().trim(),
        customer_phone: customer.phone,
        shipping_address: customer,
        items,
        subtotal: totalAmount,
        total_amount: totalAmount,
        payment_id: payment.id,
      })
      .select()
      .single();

    if (orderError) throw new Error(`DB order insert failed: ${orderError.message}`);

    return NextResponse.json({
      rz_order_id: rzOrder.id,
      rz_key: keyId,
      order_id: order.id,
      order_number: orderNumber,
      amount: totalAmount,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await log("payment_create", msg, { severity: "error", user_id: userId });
    return NextResponse.json({ error: "Failed to create payment.", details: msg }, { status: 500 });
  }
}
