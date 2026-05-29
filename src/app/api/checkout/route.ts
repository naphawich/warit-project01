import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-server";
import { omise } from "@/lib/omise-server";

export const runtime = "nodejs";

type Body = {
  items: Array<{
    id: number;
    title: string;
    price: number; // baht
  }>;
};

export async function POST(req: Request) {
  const authed = await authenticateRequest(req);
  if (!authed) {
    return NextResponse.json(
      { error: "unauthorized", message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }
  const { user, supabase } = authed;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      { error: "empty_cart", message: "ตะกร้าว่างเปล่า" },
      { status: 400 }
    );
  }

  // Compute total (server-trusted from request — in a real app, look up prices in DB)
  const totalBaht = body.items.reduce((sum, i) => sum + i.price, 0);
  const totalSatang = totalBaht * 100;

  if (totalSatang < 2000) {
    // Omise minimum: 20 THB
    return NextResponse.json(
      { error: "amount_too_low", message: "ยอดชำระต่ำกว่าขั้นต่ำ (20 บาท)" },
      { status: 400 }
    );
  }

  // 1. Insert order (status=pending). RLS allows because user_id = auth.uid()
  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total_amount: totalSatang,
      currency: "THB",
      status: "pending",
      payment_method: "promptpay",
    })
    .select()
    .single();

  if (orderErr || !orderRow) {
    console.error("[checkout] failed to insert order", orderErr);
    return NextResponse.json(
      { error: "db_error", detail: orderErr?.message },
      { status: 500 }
    );
  }

  // 2. Insert line items
  const itemRows = body.items.map((i) => ({
    order_id: orderRow.id,
    course_id: i.id,
    course_title: i.title,
    price: i.price * 100,
  }));
  const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
  if (itemsErr) {
    console.error("[checkout] failed to insert items", itemsErr);
    // Best effort cleanup
    await supabase.from("orders").delete().eq("id", orderRow.id);
    return NextResponse.json(
      { error: "db_error", detail: itemsErr.message },
      { status: 500 }
    );
  }

  // 3. Create Omise PromptPay charge.
  // (omise SDK types are outdated and don't model the inline `source` field, so we cast.)
  try {
    const chargeRequest = {
      amount: totalSatang,
      currency: "thb",
      source: { type: "promptpay" },
      metadata: {
        order_id: orderRow.id,
        user_id: user.id,
      },
    };
    const charge = await omise.charges.create(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chargeRequest as any
    );

    // Surface QR + expiry back to the client
    const qrImageUrl =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (charge as any)?.source?.scannable_code?.image?.download_uri ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chargeExpiresAt = (charge as any)?.expires_at ?? null;

    await supabase
      .from("orders")
      .update({
        omise_charge_id: charge.id,
        qr_image_url: qrImageUrl,
        expires_at: chargeExpiresAt,
      })
      .eq("id", orderRow.id);

    return NextResponse.json({
      orderId: orderRow.id,
      chargeId: charge.id,
      amount: totalSatang,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    console.error("[checkout] omise error", message);
    // Mark order as failed so user sees the right state
    await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderRow.id);
    return NextResponse.json(
      { error: "omise_error", message },
      { status: 502 }
    );
  }
}
