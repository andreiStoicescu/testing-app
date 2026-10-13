import { NextResponse } from "next/server";
import { getTable } from "@/lib/db";
import { checkPassword, signSession, publicUser } from "@/lib/auth";
import { sleep } from "@/lib/util";

export async function POST(req: Request) {
  await sleep(300, 900);
  const body: any = await req.json().catch(() => ({}));
  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  const users = await getTable("users");
  const u = users.find((x: any) => x.email == String(body.email).trim().toLowerCase());
  if (!u || !checkPassword(body.password, u.password)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, user: publicUser(u) });
  res.cookies.set("sid", signSession(u.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV == "production",
    maxAge: body.remember ? 60 * 60 * 24 * 30 : undefined,
  });
  return res;
}
