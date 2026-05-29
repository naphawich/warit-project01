// Proxies the Omise QR image so the browser can show it without Omise auth.
import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-server";
import { omiseSecretKey } from "@/lib/omise-server";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const authed = await authenticateRequest(req);
  if (!authed) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const { orderId } = await params;

  const { data: order, error } = await authed.supabase
    .from("orders")
    .select("qr_image_url, user_id, status")
    .eq("id", orderId)
    .single();

  if (error || !order) return new NextResponse("not_found", { status: 404 });
  if (!order.qr_image_url) {
    return new NextResponse("no_qr_yet", { status: 425 });
  }

  // Fetch from Omise with the secret key
  const res = await fetch(order.qr_image_url, {
    headers: {
      Authorization: `Basic ${Buffer.from(omiseSecretKey + ":").toString("base64")}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return new NextResponse(`omise_fetch_failed_${res.status}`, {
      status: 502,
    });
  }

  const blob = await res.arrayBuffer();
  return new NextResponse(blob, {
    status: 200,
    headers: {
      "content-type": res.headers.get("content-type") ?? "image/png",
      "cache-control": "private, max-age=300",
    },
  });
}
