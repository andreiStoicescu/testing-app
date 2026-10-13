import { getTable } from "@/lib/db";
import { mailConfigured } from "@/lib/mailer";
import { json } from "@/lib/util";

export async function GET() {
  if (mailConfigured && process.env.ENABLE_OUTBOX != "true") return json({ error: "Outbox disabled" }, 404);
  const outbox = await getTable("outbox");
  return json({ data: outbox });
}
