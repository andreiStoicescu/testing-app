import crypto from "crypto";
import { getTable, saveTable } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { sendMail, baseUrl, layoutEmail } from "@/lib/mailer";
import { sleep, json } from "@/lib/util";

export async function POST(req: Request) {
  await sleep(300, 800);
  const body: any = await req.json().catch(() => ({}));
  const users = await getTable("users");
  const u = users.find((x: any) => x.verifyToken && x.verifyToken == body.token);
  if (!u) return json({ error: "This verification link is invalid or has already been used" }, 400);
  u.verified = true;
  u.verifyToken = null;
  await saveTable("users", users);
  return json({ ok: true, email: u.email });
}

export async function PUT(req: Request) {
  const me = await currentUser();
  if (!me) return json({ error: "Unauthorized" }, 401);
  if (me.verified) return json({ error: "Email already verified" }, 400);
  const users = await getTable("users");
  const u = users.find((x: any) => x.id == me.id);
  u.verifyToken = crypto.randomBytes(16).toString("hex");
  await saveTable("users", users);
  const link = baseUrl(req) + "/verify?token=" + u.verifyToken;
  const mail = await sendMail(
    u.email,
    "PayFlow - confirm your email",
    layoutEmail("Confirm your email", '<p>Click to confirm your email:</p><p><a id="verify-link" href="' + link + '">' + link + "</a></p>")
  );
  return json({ ok: mail.ok });
}
