import { sendMail, layoutEmail, esc } from "./mailer";
import { formatMoney } from "./validators";

export async function sendClaimMail(p: any, sender: any, base: string) {
  const link = base + "/claim?code=" + p.otp;
  return sendMail(
    p.recipientEmail,
    "You received a payment of " + formatMoney(p.amount, p.currency) + " - claim code inside",
    layoutEmail(
      "You have a payment waiting",
      "<p>Hi " + esc(p.recipientName) + ",</p>" +
        "<p><b>" + esc(sender.name) + "</b>" + (sender.company ? " (" + esc(sender.company) + ")" : "") + " sent you a payment of <b>" + formatMoney(p.amount, p.currency) + "</b>.</p>" +
        "<p>Your one-time claim code is:</p>" +
        '<p style="font-size:30px;letter-spacing:8px;font-weight:bold;background:#f3f6fa;padding:12px;text-align:center" id="otp-code" class="otp">' + p.otp + "</p>" +
        "<p>Reference: <span class=\"ref\">" + p.id + "</span></p>" +
        '<p><a href="' + link + '" style="background:#2f855a;color:#fff;padding:10px 18px;text-decoration:none;border-radius:3px">Claim payment</a></p>' +
        '<p style="color:#888;font-size:12px">The code expires in 24 hours. Claim page: ' + base + "/claim</p>"
    )
  );
}
