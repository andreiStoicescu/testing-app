import { resetDb } from "@/lib/db";
import { json } from "@/lib/util";

export async function POST(req: Request) {
  const secret = process.env.RESET_SECRET;
  if (!secret || req.headers.get("x-reset-secret") != secret) return json({ error: "Forbidden" }, 403);
  await resetDb();
  return json({ ok: true });
}
