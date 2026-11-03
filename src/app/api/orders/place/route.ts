import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { log } from "@/lib/logger";

interface PlaceOrderBody {
  customer: {
    name: string;
    phone: string;
    email: string;
    rollNumber?: string;
    deliveryType: "pan_india" | "campus_desk" | "hostel_delivery";
    // PAN India fields
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    // Campus fields
    hostelName?: string;
    roomNumber?: string;
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
  totalAmount: number; // in INR
  paymentMethod: "upi_qr";
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

    // ── 1. Validate Customer & Cart ─────────────────────────────────────────
    if (!customer?.name?.trim()) {
      return NextResponse.json({ error: "Please provide your full name." }, { status: 400 });
    }
    const cleanPhone = customer?.phone?.replace(/\D/g, "") || "";
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Please provide a valid 10-digit mobile number." }, { status: 400 });
    }
    if (!customer?.email?.trim() || !customer.email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address for your order confirmation." }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
    }
    if (!totalAmount || totalAmount < 1) {
      return NextResponse.json({ error: "Invalid order amount." }, { status: 400 });
    }

    // ── 2. Validate Delivery Address According to Delivery Type ────────────
    const deliveryType = customer.deliveryType || "pan_india";

    if (deliveryType === "pan_india") {
      if (!customer.addressLine1?.trim()) {
        return NextResponse.json(
          { error: "Please enter your flat / house / street address." },
          { status: 400 }
        );
      }
      if (!customer.city?.trim()) {
        return NextResponse.json({ error: "Please enter your city / district." }, { status: 400 });
      }
      if (!customer.state?.trim()) {
        return NextResponse.json({ error: "Please select your state / union territory." }, { status: 400 });
      }
      const cleanPincode = customer.pincode?.replace(/\D/g, "") || "";
      if (cleanPincode.length !== 6) {
        return NextResponse.json({ error: "Please enter a valid 6-digit postal PIN code." }, { status: 400 });
      }
    } else if (deliveryType === "hostel_delivery") {
      if (!customer.hostelName?.trim()) {
        return NextResponse.json({ error: "Please select your hostel." }, { status: 400 });
      }
      if (!customer.roomNumber?.trim()) {
        return NextResponse.json({ error: "Please enter your hostel room number." }, { status: 400 });
      }
    }

    // ── 3. Validate 12-Digit UTR for UPI QR Payments ────────────────────────
    const cleanUtr = upiUtr?.trim().replace(/\s+/g, "");
    if (!cleanUtr || cleanUtr.length < 8) {
      return NextResponse.json(
        { error: "Please enter the 12-digit UPI Transaction ID (UTR / Bank Ref Number) from your payment app." },
        { status: 400 }
      );
    }

    // Check for duplicate UTR to avoid double submission / fraud
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id, gateway_order_id")
      .eq("gateway_payment_id", cleanUtr)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json(
        {
          error: `This UPI Reference ID (${cleanUtr}) has already been recorded for order ${existingPayment.gateway_order_id}. If you made a new payment, please enter the corresponding UTR from your bank app.`,
        },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();
    const totalInPaise = Math.round(totalAmount * 100);

    // ── 4. Record Payment in Supabase ───────────────────────────────────────
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        gateway: "upi_qr",
        gateway_order_id: orderNumber,
        gateway_payment_id: cleanUtr,
        amount: totalInPaise,
        currency: "INR",
        status: "captured",
        verified: true,
      })
      .select()
      .single();

    if (paymentError) {
      await log("order_place_payment", `Payment record insertion failed: ${paymentError.message}`, {
        severity: "error",
        payload: { orderNumber, cleanUtr },
      });
      throw new Error(`Failed to initialize payment record: ${paymentError.message}`);
    }

    // ── 5. Structure Shipping Address Exactly As Entered ───────────────────
    let shippingDetails: Record<string, any>;

    if (deliveryType === "pan_india") {
      const fullAddr = [
        customer.addressLine1?.trim(),
        customer.addressLine2?.trim(),
        `${customer.city?.trim()}, ${customer.state?.trim()} - ${customer.pincode?.trim()}`,
      ]
        .filter(Boolean)
        .join(", ");

      shippingDetails = {
        delivery_type: "pan_india",
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim(),
        roll_number: customer.rollNumber?.trim() || "N/A",
        address_line1: customer.addressLine1?.trim() || "",
        address_line2: customer.addressLine2?.trim() || "",
        landmark: customer.addressLine2?.trim() || "",
        city: customer.city?.trim() || "",
        state: customer.state?.trim() || "",
        pincode: customer.pincode?.trim() || "",
        formatted_address: fullAddr,
        payment_method: "upi_qr",
        upi_utr: cleanUtr,
        store_upi_id: "7974766166@axl",
        store_phone: "7974766166",
      };
    } else if (deliveryType === "hostel_delivery") {
      const fullAddr = `${customer.hostelName}, Room ${customer.roomNumber?.trim()}, NIT Raipur Campus, Raipur, Chhattisgarh - 492010`;
      shippingDetails = {
        delivery_type: "hostel_delivery",
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim(),
        roll_number: customer.rollNumber?.trim() || "NITRR Student",
        hostel_name: customer.hostelName,
        room_number: customer.roomNumber?.trim(),
        address: `${customer.hostelName}, Room ${customer.roomNumber?.trim()}, NIT Raipur Campus`,
        city: "Raipur",
        state: "Chhattisgarh",
        pincode: "492010",
        formatted_address: fullAddr,
        payment_method: "upi_qr",
        upi_utr: cleanUtr,
        store_upi_id: "7974766166@axl",
        store_phone: "7974766166",
      };
    } else {
      // campus_desk
      const fullAddr = "Campus Handover Desk (Main Building Portico / Innovation Center), NIT Raipur, Raipur, Chhattisgarh - 492010";
      shippingDetails = {
        delivery_type: "campus_desk",
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim(),
        roll_number: customer.rollNumber?.trim() || "NITRR Student",
        address: "Campus Handover Desk (Main Building Portico / Innovation Center), NIT Raipur",
        city: "Raipur",
        state: "Chhattisgarh",
        pincode: "492010",
        formatted_address: fullAddr,
        payment_method: "upi_qr",
        upi_utr: cleanUtr,
        store_upi_id: "7974766166@axl",
        store_phone: "7974766166",
      };
    }

    // ── 6. Record Order in Supabase ─────────────────────────────────────────
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: customer.rollNumber?.trim().toUpperCase() || cleanPhone,
        status: "paid",
        customer_name: customer.name.trim(),
        customer_email: customer.email.toLowerCase().trim(),
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
      customer_name: customer.name.trim(),
      roll_number: customer.rollNumber?.trim().toUpperCase() || "",
      delivery_type: deliveryType,
      delivery_location: shippingDetails.formatted_address,
      shipping_address: shippingDetails,
      payment_method: "upi_qr",
      upi_utr: cleanUtr,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal order processing error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
