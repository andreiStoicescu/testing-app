import { currentUser, publicUser } from "@/lib/auth";
import { json } from "@/lib/util";

export async function GET() {
  const u = await currentUser();
  if (!u) return json({ error: "Unauthorized" }, 401);
  return json({ user: publicUser(u) });
}
