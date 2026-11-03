import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { log } from "@/lib/logger";

interface PlaceOrderBody {
  customer: {
    name: string;
    rollNumber: string;
    email: string;
    phone: string;
    branch?: string;
    deliveryType: "campus_desk" | "hostel_delivery" | "home_delivery";
    hostelName?: string;
    roomNumber?: string;
    address?: string;
  };
  items: Array<{
    id?: string;
    slug: string;
    name: string;
    price: number;
    quantity: number;
    selectedSize?: string;
    selectedColorId?: string;
    image?: string;
  }>;
  totalAmount: number; // in Rupees
  paymentMethod: "upi_qr" | "cash_on_handover";
  upiUtr?: string;
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NITRR-${ts}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: PlaceOrderBody = await request.json();
    const { customer, items, totalAmount, paymentMethod, upiUtr } = body;

    // ── 1. Validate Core Fields ─────────────────────────────────────────────
    if (!customer?.name?.trim()) {
      return NextResponse.json({ error: "Please provide your full name." }, { status: 400 });
    }
    if (!customer?.phone?.trim() || customer.phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Please provide a valid 10-digit WhatsApp/mobile number." }, { status: 400 });
    }
    if (!customer?.rollNumber?.trim()) {
      return NextResponse.json({ error: "Please provide your Student Roll Number / ID." }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
    }
    if (!totalAmount || totalAmount < 1) {
      return NextResponse.json({ error: "Invalid order amount." }, { status: 400 });
    }

    // ── 2. UTR Validation for UPI QR Payments ──────────────────────────────
    const cleanUtr = upiUtr?.trim().replace(/\s+/g, "");
    if (paymentMethod === "upi_qr") {
      if (!cleanUtr || cleanUtr.length < 8) {
        return NextResponse.json(
          { error: "Please enter a valid 12-digit UPI Reference Number (UTR) from your payment app." },
          { status: 400 }
        );
      }

      // Check for duplicate UTR to prevent reuse
      const { data: existingPayment } = await supabaseAdmin
        .from("payments")
        .select("id, gateway_order_id")
        .eq("gateway_payment_id", cleanUtr)
        .maybeSingle();

      if (existingPayment) {
        return NextResponse.json(
          {
            error: `This UPI Reference ID (${cleanUtr}) has already been recorded for order ${existingPayment.gateway_order_id}. If you made a new payment, please enter the new UTR from your bank app.`,
          },
          { status: 400 }
        );
      }
    }

    const orderNumber = generateOrderNumber();
    const totalInPaise = Math.round(totalAmount * 100);

    // ── 3. Record Payment in Supabase ───────────────────────────────────────
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        gateway: paymentMethod === "upi_qr" ? "upi_qr" : "campus_handover",
        gateway_order_id: orderNumber,
        gateway_payment_id: paymentMethod === "upi_qr" ? cleanUtr : `HANDOVER-${orderNumber}`,
        amount: totalInPaise,
        currency: "INR",
        status: paymentMethod === "upi_qr" ? "captured" : "created",
        verified: paymentMethod === "upi_qr",
      })
      .select()
      .single();

    if (paymentError) {
      await log("order_place_payment", `Payment record insertion failed: ${paymentError.message}`, {
        severity: "error",
        payload: { orderNumber, paymentMethod },
      });
      throw new Error(`Failed to initialize payment record: ${paymentError.message}`);
    }

    // ── 4. Record Order in Supabase ─────────────────────────────────────────
    const shippingDetails = {
      name: customer.name.trim(),
      roll_number: customer.rollNumber.trim().toUpperCase(),
      email: customer.email?.trim() || "",
      phone: customer.phone.trim(),
      branch: customer.branch?.trim() || "NIT Raipur Student",
      delivery_type: customer.deliveryType,
      hostel_name: customer.hostelName || "",
      room_number: customer.roomNumber || "",
      address:
        customer.deliveryType === "hostel_delivery"
          ? `${customer.hostelName}, Room ${customer.roomNumber}, NIT Raipur Campus`
          : customer.deliveryType === "campus_desk"
          ? "Campus Handover Desk (Main Building / Innovation Center), NIT Raipur"
          : customer.address || "NIT Raipur Campus, G.E. Road, Raipur",
      city: "Raipur",
      state: "Chhattisgarh",
      pincode: "492010",
      payment_method: paymentMethod,
      upi_utr: cleanUtr || null,
    };

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: customer.rollNumber.trim().toUpperCase(),
        status: paymentMethod === "upi_qr" ? "paid" : "pending",
        customer_name: customer.name.trim(),
        customer_email: customer.email?.toLowerCase().trim() || `${customer.rollNumber.toLowerCase()}@nitrr.ac.in`,
        customer_phone: customer.phone.trim(),
        shipping_address: shippingDetails,
        items,
        subtotal: totalInPaise,
        total_amount: totalInPaise,
        payment_id: payment.id,
      })
      .select()
      .single();

    if (orderError) {
      await log("order_place_order", `Order record insertion failed: ${orderError.message}`, {
        severity: "error",
        payload: { orderNumber },
      });
      throw new Error(`Failed to place order in database: ${orderError.message}`);
    }

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      order_id: order.id,
      payment_id: payment.id,
      total_amount: totalAmount,
      customer_name: customer.name,
      delivery_type: customer.deliveryType,
      delivery_location: shippingDetails.address,
      payment_method: paymentMethod,
      upi_utr: cleanUtr || null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal order processing error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

