import { getTable, saveTable, randomOtp } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { baseUrl } from "@/lib/mailer";
import { sendClaimMail } from "@/lib/paymentMail";
import { validatePayment } from "@/lib/validators";
import { sleep, json } from "@/lib/util";

const EDITABLE = ["recipientName", "recipientEmail", "phone", "amount", "currency", "method", "category", "priority", "country", "address1", "address2", "city", "state", "zip", "dueDate", "description", "notify"];

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u) return json({ error: "Unauthorized" }, 401);
  const { id } = await ctx.params;
  await sleep(300, 900);
  const payments = await getTable("payments");
  const p = payments.find((x: any) => x.id == id && x.ownerId == u.id);
  if (!p) return json({ error: "Payment not found" }, 404);
  const { otp, ...rest } = p;
  return json({ data: rest });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u) return json({ error: "Unauthorized" }, 401);
  const { id } = await ctx.params;
  await sleep(500, 1200);
  const body: any = await req.json().catch(() => ({}));
  const payments = await getTable("payments");
  const p = payments.find((x: any) => x.id == id && x.ownerId == u.id);
  if (!p) return json({ error: "Payment not found" }, 404);
  if (p.status != "pending") return json({ error: "Only pending payments can be edited" }, 409);
  const errors: any = validatePayment(body);
  if (Object.keys(errors).length) return json({ errors }, 422);

  const oldEmail = p.recipientEmail;
  EDITABLE.forEach((f) => {
    if (body[f] !== undefined) p[f] = typeof body[f] == "string" ? body[f].trim() : body[f];
  });
  p.recipientEmail = p.recipientEmail.toLowerCase();
  p.amount = Number(p.amount);
  p.updatedAt = new Date().toISOString();

  let resent = false;
  if (oldEmail != p.recipientEmail) {
    p.otp = randomOtp();
    p.otpExpiresAt = new Date(Date.now() + 86400000).toISOString();
    resent = true;
  }
  await saveTable("payments", payments);
  if (resent) await sendClaimMail(p, u, baseUrl(req));
  return json({ ok: true, codeResent: resent });
}
