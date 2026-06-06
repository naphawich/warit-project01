import { NextResponse } from "next/server";
import { authenticateRequest, adminClient } from "@/lib/auth-server";
import { omise } from "@/lib/omise-server";
import { courses as staticCourses } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Each checkout creates a real Omise charge + DB rows, so cap how fast a single
// user can trigger it. 8 per minute is far above any legitimate flow.
const CHECKOUT_LIMIT = 8;
const CHECKOUT_WINDOW_MS = 60_000;

type Body = {
  items: Array<{
    id: number;
    title?: string;
    price?: number;
  }>;
};

type PricedItem = { id: number; title: string; price: number };

// Resolve price + title for every cart item server-side (never trust the
// client). Static courses (1-9) resolve with no network; all DB courses are
// fetched in ONE round-trip via .in(), and only PUBLISHED courses are
// sellable so a draft id can't be checked out.
async function priceItems(
  ids: number[]
): Promise<
  | { ok: true; items: PricedItem[] }
  | { ok: false; missingId: number }
> {
  const staticById = new Map(staticCourses.map((c) => [c.id, c]));
  const resolved = new Map<number, PricedItem>();
  const dbIds: number[] = [];

  for (const id of ids) {
    const s = staticById.get(id);
    if (s) {
      resolved.set(id, { id, title: s.title, price: s.price });
    } else if (id >= 100) {
      dbIds.push(id);
    } else {
      return { ok: false, missingId: id };
    }
  }

  if (dbIds.length > 0) {
    const { data } = await adminClient()
      .from("courses")
      .select("id, title, price")
      .in("id", dbIds)
      .eq("is_published", true);
    const dbById = new Map(
      (data ?? []).map((r) => [r.id as number, r])
    );
    for (const id of dbIds) {
      const row = dbById.get(id);
      if (!row || typeof row.price !== "number") {
        return { ok: false, missingId: id };
      }
      resolved.set(id, {
        id,
        title: (row.title as string) ?? "คอร์ส",
        price: row.price as number,
      });
    }
  }

  // Preserve cart order; resolved is keyed by unique id so duplicates collapse.
  const items: PricedItem[] = [];
  const seen = new Set<number>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    items.push(resolved.get(id)!);
  }
  return { ok: true, items };
}

export async function POST(req: Request) {
  const authed = await authenticateRequest(req);
  if (!authed) {
    return NextResponse.json(
      { error: "unauthorized", message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }
  const { user, supabase } = authed;

  // Throttle per authenticated user.
  const limit = rateLimit(`checkout:${user.id}`, CHECKOUT_LIMIT, CHECKOUT_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "ทำรายการถี่เกินไป กรุณารอสักครู่" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

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

  // Look up price and title server-side — never trust i.price / i.title from client
  const priced = await priceItems(body.items.map((i) => i.id));
  if (!priced.ok) {
    return NextResponse.json(
      { error: "course_not_found", message: `ไม่พบคอร์ส id ${priced.missingId}` },
      { status: 400 }
    );
  }
  const pricedItems = priced.items;

  const totalBaht = pricedItems.reduce((sum, p) => sum + p.price, 0);
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
      { error: "db_error", message: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 }
    );
  }

  // 2. Insert line items using server-verified prices
  const itemRows = pricedItems.map((p) => ({
    order_id: orderRow.id,
    course_id: p.id,
    course_title: p.title,
    price: p.price * 100,
  }));
  const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
  if (itemsErr) {
    console.error("[checkout] failed to insert items", itemsErr);
    // Best effort cleanup
    await supabase.from("orders").delete().eq("id", orderRow.id);
    return NextResponse.json(
      { error: "db_error", message: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
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
