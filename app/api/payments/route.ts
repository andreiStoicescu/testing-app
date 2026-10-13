import { getTable, saveTable, genId, randomOtp } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { baseUrl } from "@/lib/mailer";
import { sendClaimMail } from "@/lib/paymentMail";
import { validatePayment } from "@/lib/validators";
import { sleep, json } from "@/lib/util";

const FIELDS = ["recipientName", "recipientEmail", "phone", "amount", "currency", "method", "category", "priority", "country", "address1", "address2", "city", "state", "zip", "dueDate", "description", "notify"];

export async function GET() {
  const u = await currentUser();
  if (!u) return json({ error: "Unauthorized" }, 401);
  await sleep(500, 1800);
  const payments = await getTable("payments");
  const mine = payments.filter((p: any) => p.ownerId == u.id).map((p: any) => {
    const { otp, ...rest } = p;
    return rest;
  });
  return json({ data: mine, total: mine.length });
}

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return json({ error: "Unauthorized" }, 401);
  await sleep(600, 1500);
  const body: any = await req.json().catch(() => ({}));
  const errors: any = validatePayment(body, { requireTerms: true });
  if (Object.keys(errors).length) return json({ errors }, 422);

  const p: any = { id: genId(), ownerId: u.id };
  FIELDS.forEach((f) => (p[f] = typeof body[f] == "string" ? body[f].trim() : body[f]));
  p.recipientEmail = p.recipientEmail.toLowerCase();
  p.amount = Number(body.amount);
  p.priority = p.priority || "normal";
  p.notify = body.notify !== false;
  p.status = "pending";
  p.otp = randomOtp();
  p.otpExpiresAt = new Date(Date.now() + 86400000).toISOString();
  p.createdAt = new Date().toISOString();
  p.updatedAt = p.createdAt;
  p.claimedAt = null;
  p.claimedBy = null;

  const payments = await getTable("payments");
  payments.push(p);
  await saveTable("payments", payments);

  const mail = await sendClaimMail(p, u, baseUrl(req));
  return json({ ok: true, id: p.id, mailSent: mail.ok }, 201);
}
