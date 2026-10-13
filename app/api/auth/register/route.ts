import crypto from "crypto";
import { getTable, saveTable } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendMail, baseUrl, layoutEmail, esc } from "@/lib/mailer";
import { validateRegister } from "@/lib/validators";
import { sleep, json } from "@/lib/util";

export async function POST(req: Request) {
  await sleep(400, 1200);
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return json({ error: "Bad request" }, 400);
  }
  const errors: any = validateRegister(body);
  if (Object.keys(errors).length) return json({ errors }, 422);

  const users = await getTable("users");
  const email = body.email.trim().toLowerCase();
  if (users.find((u: any) => u.email == email)) {
    return json({ errors: { email: "This email is already registered" } }, 409);
  }
  const user = {
    id: "u_" + crypto.randomBytes(6).toString("hex"),
    name: body.name.trim(),
    email,
    company: (body.company || "").trim(),
    country: body.country,
    password: hashPassword(body.password),
    verified: false,
    verifyToken: crypto.randomBytes(16).toString("hex"),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await saveTable("users", users);

  const link = baseUrl(req) + "/verify?token=" + user.verifyToken;
  const mail = await sendMail(
    email,
    "Welcome to PayFlow - confirm your email",
    layoutEmail(
      "Welcome, " + esc(user.name) + "!",
      "<p>Thanks for registering at PayFlow.</p><p>Please confirm your email address by clicking the button below:</p>" +
        '<p><a id="verify-link" href="' + link + '" style="background:#2b6cb0;color:#fff;padding:10px 18px;text-decoration:none;border-radius:3px">Confirm email</a></p>' +
        '<p style="color:#888;font-size:12px">Or copy this link: ' + link + "</p>"
    )
  );
  return json({ ok: true, mailSent: mail.ok });
}
