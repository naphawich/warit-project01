// Omise webhook handler.
// Verifies legitimacy by re-fetching the charge from Omise (source of truth).
// Idempotent: safe to receive the same event multiple times.
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/auth-server";
import { omise } from "@/lib/omise-server";
import { sendReceiptEmail } from "@/lib/email-server";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OmiseEvent = { key?: string; data?: any };

export async function POST(req: Request) {
  // Optional shared-secret gate. Omise has no built-in webhook signature, so a
  // secret in the URL (https://<domain>/api/webhooks/omise?secret=YOUR_SECRET)
  // is a lightweight way to reject forged requests.
  //
  // It is OPT-IN: if OMISE_WEBHOOK_SECRET isn't configured we skip the check
  // rather than 401 every event — otherwise forgetting the env var on Vercel
  // would silently break every payment. Even without it, the charge is still
  // re-fetched from Omise and the amount is verified below, so a forged event
  // can't grant a course.
  const expected = process.env.OMISE_WEBHOOK_SECRET;
  if (expected) {
    const provided = new URL(req.url).searchParams.get("secret");
    if (provided !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

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

  // Verify the paid amount. Fail closed: if Omise didn't return an amount we
  // refuse to grant rather than silently skipping the check (M5).
  if (typeof charge.amount !== "number") {
    console.error("[webhook] charge has no amount", eventChargeId);
    return NextResponse.json({ error: "amount_missing" }, { status: 400 });
  }
  if (charge.amount !== order.total_amount) {
    console.warn("[webhook] amount mismatch", {
      orderId,
      chargeAmount: charge.amount,
      orderAmount: order.total_amount,
    });
    return NextResponse.json({ error: "amount_mismatch" }, { status: 400 });
  }

  // Defensive: charge ID should match order's charge
  if (order.omise_charge_id && order.omise_charge_id !== eventChargeId) {
    console.error("[webhook] charge id mismatch", {
      order: order.omise_charge_id,
      event: eventChargeId,
    });
    return NextResponse.json({ error: "charge_mismatch" }, { status: 409 });
  }

  if (status === "successful") {
    // Mark paid + grant entitlements ATOMICALLY in a single DB transaction.
    // Idempotent: a retry re-grants if a previous attempt marked the order
    // paid but failed to grant (fixes the "paid but 0 courses" bug, C1/CQ#1),
    // and reports whether the order was already paid so we don't double-send
    // the receipt.
    const { data: rows, error: rpcErr } = await admin.rpc("fulfill_paid_order", {
      p_order_id: orderId,
    });
    if (rpcErr) {
      console.error("[webhook] fulfill_paid_order failed", rpcErr);
      // 500 → Omise retries the webhook until fulfillment succeeds.
      return NextResponse.json({ error: "fulfill_failed" }, { status: 500 });
    }

    const items =
      (rows as
        | {
            course_id: number;
            course_title: string;
            price: number;
            was_already_paid: boolean;
          }[]
        | null) ?? [];
    const alreadyPaid = items[0]?.was_already_paid ?? false;

    // Send receipt only on the first successful fulfillment.
    if (!alreadyPaid) {
      try {
        const { data: profile } = await admin
          .from("profiles")
          .select("full_name, email")
          .eq("id", order.user_id)
          .maybeSingle();
        const recipient = profile?.email;
        if (recipient) {
          const siteUrl =
            process.env.NEXT_PUBLIC_SITE_URL ??
            (process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : "https://warit-project01.vercel.app");
          await sendReceiptEmail({
            to: recipient,
            customerName: profile?.full_name ?? "",
            orderId,
            totalAmount: order.total_amount,
            paidAt: new Date().toISOString(),
            items: items.map((i) => ({
              course_id: i.course_id,
              course_title: i.course_title,
              price: i.price,
            })),
            siteUrl,
          });
        } else {
          console.warn("[webhook] no email for user, skipping receipt", order.user_id);
        }
      } catch (e) {
        console.error("[webhook] receipt email error (non-fatal)", e);
      }
    }

    return NextResponse.json({ ok: true, status: "paid", idempotent: alreadyPaid });
  }

  // Non-success events must NEVER downgrade an already-paid order. The `neq`
  // guard makes this safe even if Omise delivers events out of order (C3).
  if (status === "failed") {
    await admin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId)
      .neq("status", "paid");
    return NextResponse.json({ ok: true, status: "failed" });
  }

  if (status === "expired") {
    await admin
      .from("orders")
      .update({ status: "expired" })
      .eq("id", orderId)
      .neq("status", "paid");
    return NextResponse.json({ ok: true, status: "expired" });
  }

  // pending or other — no DB change
  return NextResponse.json({ ok: true, status });
}

// Allow Omise to ping the URL via GET to verify
export async function GET() {
  return NextResponse.json({ webhook: "omise", ok: true });
}
