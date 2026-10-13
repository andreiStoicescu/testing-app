"use client";
import { useState } from "react";
import { useUser } from "@/components/UserContext";
import { showToast } from "@/components/toast";

export default function ProfilePage() {
  const { user } = useUser();
  const [sending, setSending] = useState(false);

  async function resend() {
    setSending(true);
    const r = await fetch("/api/auth/verify", { method: "PUT" });
    const d = await r.json();
    setSending(false);
    if (r.ok) showToast("Confirmation email sent to " + user.email, "success");
    else showToast(d.error || "Could not send email", "error");
  }

  return (
    <div>
      <h1 className="page-title">My profile</h1>
      <div className="panel" style={{ maxWidth: 560 }}>
        <div className="panel-heading">Account details</div>
        <div className="panel-body">
          <table style={{ width: "100%" }}>
            <tbody>
              <tr><td className="text-muted" style={{ width: 140, padding: "6px 0" }}>Name</td><td>{user.name}</td></tr>
              <tr><td className="text-muted" style={{ padding: "6px 0" }}>Email</td><td>{user.email}</td></tr>
              <tr><td className="text-muted" style={{ padding: "6px 0" }}>Company</td><td>{user.company || "-"}</td></tr>
              <tr><td className="text-muted" style={{ padding: "6px 0" }}>Country</td><td>{user.country}</td></tr>
              <tr><td className="text-muted" style={{ padding: "6px 0" }}>Member since</td><td>{new Date(user.createdAt).toLocaleDateString()}</td></tr>
              <tr>
                <td className="text-muted" style={{ padding: "6px 0" }}>Email status</td>
                <td>
                  {user.verified ? (
                    <span className="badge badge-completed">Verified</span>
                  ) : (
                    <>
                      <span className="badge badge-pending">Not verified</span>{" "}
                      <button className="btn btn-link" onClick={resend} disabled={sending}>
                        {sending ? "sending..." : "Resend confirmation email"}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
