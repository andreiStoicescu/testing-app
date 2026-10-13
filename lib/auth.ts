import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.SESSION_SECRET || "super-secret-dont-tell-anyone";

export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(8).toString("hex");
  const h = crypto.scryptSync(pw, salt, 32).toString("hex");
  return salt + ":" + h;
}

export function checkPassword(pw: string, stored: string) {
  if (!stored) return false;
  const [salt, h] = stored.split(":");
  const h2 = crypto.scryptSync(pw, salt, 32).toString("hex");
  return h == h2;
}

export function signSession(userId: string) {
  const sig = crypto.createHmac("sha256", SECRET).update(userId).digest("hex").substring(0, 32);
  return userId + "." + sig;
}

export function readSession(val: string | undefined) {
  if (!val) return null;
  const idx = val.lastIndexOf(".");
  if (idx < 0) return null;
  const id = val.substring(0, idx);
  if (signSession(id) !== val) return null;
  return id;
}

export async function currentUser() {
  const { getTable } = await import("./db");
  const c = await cookies();
  const id = readSession(c.get("sid")?.value);
  if (!id) return null;
  const users = await getTable("users");
  const u = users.find((x: any) => x.id == id);
  if (!u) return null;
  return u;
}

export function publicUser(u: any) {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, company: u.company, country: u.country, verified: u.verified, createdAt: u.createdAt };
}
