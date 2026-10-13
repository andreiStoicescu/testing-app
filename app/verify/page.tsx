"use client";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState("error");
      setMsg("Missing verification token");
      return;
    }
    fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (ok) {
          setState("ok");
          setMsg("Your email " + d.email + " has been confirmed.");
        } else {
          setState("error");
          setMsg(d.error);
        }
      });
  }, []);

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="logo">
          Pay<span>Flow</span>
        </div>
        <div className="sub">Email confirmation</div>
        {state == "loading" && (
          <div className="loading-overlay">
            <span className="spinner dark"></span> Verifying...
          </div>
        )}
        {state == "ok" && <div className="alert alert-success" id="verify-result">{msg}</div>}
        {state == "error" && <div className="alert alert-danger" id="verify-result">{msg}</div>}
        <div className="auth-footer">
          <a href="/login">Go to login</a>
        </div>
      </div>
    </div>
  );
}
