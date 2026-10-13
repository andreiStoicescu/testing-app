import nodemailer from "nodemailer";
import { getTable, saveTable } from "./db";

export const smtpConfigured = !!process.env.SMTP_HOST;

export async function sendMail(to: string, subject: string, html: string) {
  const outbox = await getTable("outbox");
  outbox.unshift({ id: Date.now() + "_" + Math.floor(Math.random() * 1000), to, subject, html, sentAt: new Date().toISOString(), smtp: smtpConfigured });
  await saveTable("outbox", outbox.slice(0, 50));

  if (!smtpConfigured) {
    console.log("[MAIL - no SMTP configured] to=" + to + " subject=" + subject);
    return { ok: true, dev: true };
  }
  try {
    const port = Number(process.env.SMTP_PORT || 587);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port == 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
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
