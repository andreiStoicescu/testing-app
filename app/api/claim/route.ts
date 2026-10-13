import { getTable, saveTable } from "@/lib/db";
import { validateIban, normalizeIban } from "@/lib/validators";
import { sleep, json } from "@/lib/util";

async function findByCode(code: string) {
  const payments = await getTable("payments");
  const p = payments.find((x: any) => x.otp && x.otp == String(code || "").trim());
  return { payments, p };
}

function checkClaimable(p: any) {
  if (!p) return "Invalid claim code";
  if (p.status == "claimed" || p.status == "completed") return "This payment has already been claimed";
  if (p.status == "cancelled") return "This payment was cancelled by the sender";
  if (new Date(p.otpExpiresAt).getTime() < Date.now()) return "This claim code has expired";
  return null;
}

export async function PUT(req: Request) {
  await sleep(500, 1300);
  const body: any = await req.json().catch(() => ({}));
  if (!/^\d{6}$/.test(String(body.code || ""))) return json({ error: "Code must be 6 digits" }, 400);
  const { p } = await findByCode(body.code);
  const err = checkClaimable(p);
  if (err) return json({ error: err }, p ? 409 : 404);
  const users = await getTable("users");
  const sender = users.find((u: any) => u.id == p.ownerId);
  return json({
    data: {
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      senderName: sender ? sender.name : "Unknown",
      senderCompany: sender ? sender.company : "",
      description: p.description,
      dueDate: p.dueDate,
      recipientEmail: p.recipientEmail.replace(/^(.)(.*)(@.*)$/, (_m: string, a: string, b: string, c: string) => a + b.replace(/./g, "*") + c),
    },
  });
}

export async function POST(req: Request) {
  await sleep(700, 1600);
  const body: any = await req.json().catch(() => ({}));
  const { payments, p } = await findByCode(body.code);
  const err = checkClaimable(p);
  if (err) return json({ error: err }, p ? 409 : 404);

  const errors: any = {};
  if (!body.fullName || !body.fullName.trim()) errors.fullName = "Full name is required";
  else if (body.fullName.trim().toLowerCase() != p.recipientName.trim().toLowerCase()) errors.fullName = "Name does not match the payment recipient";
  const ib = validateIban(body.iban);
  if (ib) errors.iban = ib;
  if (!body.agree) errors.agree = "You must accept the terms to claim";
  if (Object.keys(errors).length) return json({ errors }, 422);

  p.status = "claimed";
  p.claimedAt = new Date().toISOString();
  p.claimedBy = { name: body.fullName.trim(), iban: normalizeIban(body.iban) };
  p.updatedAt = p.claimedAt;
  p.otp = null;
  await saveTable("payments", payments);
  return json({ ok: true, confirmation: "CLM-" + p.id.replace("PAY-", "") + "-" + Date.now().toString().slice(-4) });
}
