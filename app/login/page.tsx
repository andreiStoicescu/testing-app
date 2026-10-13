"use client";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const q = window.location.search;
    if (q.indexOf("registered=1") > -1) setInfo("Account created! Check your email to confirm your address, then log in.");
    if (q.indexOf("logout=1") > -1) setInfo("You have been logged out.");
    if (q.indexOf("next=") > -1) setInfo("Please log in to continue.");
  }, []);

  async function submit(e: any) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in both fields");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Login failed");
        setLoading(false);
        return;
      }
      const m = window.location.search.match(/next=([^&]+)/);
      window.location.href = m ? decodeURIComponent(m[1]) : "/dashboard";
    } catch (err) {
      setError("Network error, try again");
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="logo">
          Pay<span>Flow</span>
        </div>
        <div className="sub">Sign in to your account</div>
        {info && <div className="alert alert-info">{info}</div>}
        {error && (
          <div className="alert alert-danger" data-testid="login-error">
            {error}
          </div>
        )}
        <form onSubmit={submit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" data-testid="login-email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <input id="password" data-testid="login-password" type={showPw ? "text" : "password"} className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
              <span onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: 8, cursor: "pointer", fontSize: 12, color: "#2b6cb0" }}>
                {showPw ? "hide" : "show"}
              </span>
            </div>
          </div>
          <div className="form-group clearfix">
            <label className="chk" style={{ float: "left" }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
            </label>
            <a className="right" style={{ fontSize: 13 }} href="#" onClick={(e) => { e.preventDefault(); alert("Please contact your administrator to reset your password."); }}>
              Forgot password?
            </a>
          </div>
          <button id="btnLogin" type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading && <span className="spinner"></span>}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="auth-footer">
          Don&apos;t have an account? <a href="/register">Create one</a>
        </div>
      </div>
    </div>
  );
}
