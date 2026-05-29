// Omise webhook handler.
// Verifies legitimacy by re-fetching the charge from Omise (source of truth).
// Idempotent: safe to receive the same event multiple times.
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/auth-server";
import { omise } from "@/lib/omise-server";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OmiseEvent = { key?: string; data?: any };

export async function POST(req: Request) {
  let event: OmiseEvent;
  try {
    event = (await req.json()) as OmiseEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // We only care about charge lifecycle events
  if (!event.key?.startsWith("charge.")) {
    return NextResponse.json({ ignored: true });
  }

  const eventChargeId: string | undefined = event.data?.id;
  if (!eventChargeId) {
    return NextResponse.json({ error: "missing_charge_id" }, { status: 400 });
  }

  // Verify by re-fetching the charge from Omise (source of truth)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let charge: any;
  try {
    charge = await omise.charges.retrieve(eventChargeId);
  } catch (e) {
    console.error("[webhook] failed to retrieve charge", e);
    return NextResponse.json(
      { error: "charge_retrieve_failed" },
      { status: 502 }
    );
  }

  const status: string = charge.status;
  const orderId: string | undefined = charge.metadata?.order_id;
  if (!orderId) {
    console.warn("[webhook] charge has no order_id metadata", eventChargeId);
    return NextResponse.json({ ignored: true });
  }

  let admin;
  try {
    admin = adminClient();
  } catch (e) {
    console.error("[webhook] SUPABASE_SERVICE_ROLE_KEY not configured", e);
    return NextResponse.json(
      { error: "server_misconfigured" },
      { status: 500 }
    );
  }

  // Load order (bypasses RLS via service role)
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, user_id, status, total_amount, omise_charge_id")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    console.error("[webhook] order not found", orderId, orderErr);
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  // Defensive: charge ID should match order's charge
  if (order.omise_charge_id && order.omise_charge_id !== eventChargeId) {
    console.error("[webhook] charge id mismatch", {
      order: order.omise_charge_id,
      event: eventChargeId,
    });
    return NextResponse.json({ error: "charge_mismatch" }, { status: 409 });
  }

  // Idempotency: already processed
  if (order.status === "paid") {
    return NextResponse.json({ ok: true, idempotent: true });
  }
  if (order.status === "failed" || order.status === "expired") {
    // Allow late "successful" to flip to paid (rare but possible)
    if (status !== "successful") {
      return NextResponse.json({ ok: true, no_change: true });
    }
  }

  if (status === "successful") {
    // 1. Mark order as paid
    const { error: updateErr } = await admin
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", orderId);
    if (updateErr) {
      console.error("[webhook] failed to mark paid", updateErr);
      return NextResponse.json({ error: "db_update_failed" }, { status: 500 });
    }

    // 2. Grant entitlements (one row per course)
    const { data: items } = await admin
      .from("order_items")
      .select("course_id")
      .eq("order_id", orderId);

    if (items && items.length > 0) {
      const rows = items.map((it) => ({
        user_id: order.user_id,
        course_id: it.course_id,
        order_id: orderId,
      }));
      // upsert so re-runs don't conflict
      const { error: grantErr } = await admin
        .from("user_courses")
        .upsert(rows, { onConflict: "user_id,course_id", ignoreDuplicates: true });
      if (grantErr) {
        console.error("[webhook] failed to grant courses", grantErr);
        return NextResponse.json(
          { error: "grant_failed" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, status: "paid" });
  }

  if (status === "failed") {
    await admin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);
    return NextResponse.json({ ok: true, status: "failed" });
  }

  if (status === "expired") {
    await admin
      .from("orders")
      .update({ status: "expired" })
      .eq("id", orderId);
    return NextResponse.json({ ok: true, status: "expired" });
  }

  // pending or other — no DB change
  return NextResponse.json({ ok: true, status });
}

// Allow Omise to ping the URL via GET to verify
export async function GET() {
  return NextResponse.json({ webhook: "omise", ok: true });
}
