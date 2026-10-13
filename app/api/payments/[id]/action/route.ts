import { getTable, saveTable, randomOtp } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { baseUrl } from "@/lib/mailer";
import { sendClaimMail } from "@/lib/paymentMail";
import { sleep, json } from "@/lib/util";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u) return json({ error: "Unauthorized" }, 401);
  const { id } = await ctx.params;
  await sleep(400, 1400);
  const body: any = await req.json().catch(() => ({}));
  const payments = await getTable("payments");
  const p = payments.find((x: any) => x.id == id && x.ownerId == u.id);
  if (!p) return json({ error: "Payment not found" }, 404);

  const now = new Date().toISOString();
  switch (body.action) {
    case "complete":
      if (p.status != "pending" && p.status != "claimed") return json({ error: "Payment cannot be completed in status " + p.status }, 409);
      p.status = "completed";
      p.completedAt = now;
      break;
    case "cancel":
      if (p.status != "pending") return json({ error: "Only pending payments can be cancelled" }, 409);
      p.status = "cancelled";
      p.cancelledAt = now;
      p.cancelReason = body.reason || "";
      break;
    case "resend":
      if (p.status != "pending") return json({ error: "Code can only be resent for pending payments" }, 409);
      p.otp = randomOtp();
      p.otpExpiresAt = new Date(Date.now() + 86400000).toISOString();
      break;
    default:
      return json({ error: "Unknown action" }, 400);
  }
  p.updatedAt = now;
  await saveTable("payments", payments);
  if (body.action == "resend") await sendClaimMail(p, u, baseUrl(req));
  return json({ ok: true, status: p.status });
}
