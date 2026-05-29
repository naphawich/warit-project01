// Server-only email service via Resend.
// Failures are logged but never thrown to the caller — payment processing
// must not depend on email delivery.
import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  ReceiptEmail,
  type ReceiptEmailProps,
} from "@/emails/ReceiptEmail";

const apiKey = process.env.RESEND_API_KEY;

// Default sender. Once you verify a custom domain in Resend, set
// EMAIL_FROM in the environment to e.g. "Warit Academy <noreply@your-domain.com>".
const fromAddress =
  process.env.EMAIL_FROM ?? "Warit Academy <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient(): Resend | null {
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

export type SendReceiptArgs = ReceiptEmailProps & {
  to: string;
};

export async function sendReceiptEmail(args: SendReceiptArgs): Promise<void> {
  const resend = getClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipping receipt email");
    return;
  }
  try {
    const html = await render(ReceiptEmail(args));
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: args.to,
      subject: `ใบเสร็จคำสั่งซื้อ #${args.orderId.slice(0, 8)} — Warit Academy`,
      html,
    });
    if (error) {
      console.error("[email] resend returned error", error);
    }
  } catch (e) {
    console.error("[email] failed to send receipt", e);
  }
}
