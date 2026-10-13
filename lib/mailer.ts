import { getTable, saveTable } from "./db";

export const mailConfigured = !!process.env.RESEND_API_KEY;

export async function sendMail(to: string, subject: string, html: string) {
  const outbox = await getTable("outbox");
  outbox.unshift({ id: Date.now() + "_" + Math.floor(Math.random() * 1000), to, subject, html, sentAt: new Date().toISOString(), real: mailConfigured });
  await saveTable("outbox", outbox.slice(0, 50));

  if (!mailConfigured) {
    console.log("[MAIL - no RESEND_API_KEY] to=" + to + " subject=" + subject);
    return { ok: true, dev: true };
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "PayFlow <onboarding@resend.dev>", to: [to], subject, html }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("mail failed", r.status, t);
      return { ok: false, error: t };
    }
    return { ok: true };
  } catch (e: any) {
    console.error("mail failed", e);
    return { ok: false, error: e && e.message };
  }
}

export function baseUrl(req: Request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = req.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  return proto + "://" + host;
}

export function layoutEmail(title: string, body: string) {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #ddd">' +
    '<div style="background:#1f3a5f;color:#fff;padding:14px 20px;font-size:18px"><b>PayFlow</b></div>' +
    '<div style="padding:20px"><h2 style="margin-top:0">' + title + "</h2>" + body + "</div>" +
    '<div style="background:#f3f3f3;color:#888;padding:10px 20px;font-size:11px">This is an automated email from the PayFlow QA sandbox. Do not reply.</div></div>';
}

export function esc(s: any) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]);
}
