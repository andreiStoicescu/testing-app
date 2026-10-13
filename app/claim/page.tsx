"use client";
import { useEffect, useRef, useState } from "react";
import { formatMoney, validateIban } from "@/lib/validators";

export default function ClaimPage() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [iban, setIban] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [confirmation, setConfirmation] = useState("");
  const refs = useRef<any[]>([]);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code && /^\d{6}$/.test(code)) setDigits(code.split(""));
  }, []);

  function onDigit(i: number, v: string) {
    v = v.replace(/\D/g, "");
    if (v.length > 1) {
      const arr = digits.slice();
      v.split("").slice(0, 6 - i).forEach((c, k) => (arr[i + k] = c));
      setDigits(arr);
      const next = Math.min(5, i + v.length);
      refs.current[next] && refs.current[next].focus();
      return;
    }
    const arr = digits.slice();
    arr[i] = v;
    setDigits(arr);
    if (v && i < 5) refs.current[i + 1].focus();
  }

  function onKey(i: number, e: any) {
    if (e.key == "Backspace" && !digits[i] && i > 0) refs.current[i - 1].focus();
  }

  async function verify() {
    setError("");
    const code = digits.join("");
    if (code.length != 6) {
      setError("Please enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    const r = await fetch("/api/claim", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const d = await r.json();
    setLoading(false);
    if (!r.ok) {
      setError(d.error || "Invalid code");
      return;
    }
    setPayment(d.data);
    setStep(2);
  }

  async function claim() {
    const e: any = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    const ib = validateIban(iban);
    if (ib) e.iban = ib;
    if (!agree) e.agree = "You must accept the terms to claim";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setError("");
    const r = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: digits.join(""), fullName, iban, agree }),
    });
    const d = await r.json();
    setLoading(false);
    if (!r.ok) {
      if (d.errors) setErrors(d.errors);
      else setError(d.error);
      return;
    }
    setConfirmation(d.confirmation);
    setStep(3);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box wide">
        <div className="logo">
          Pay<span>Flow</span>
        </div>
        <div className="sub">Claim your payment</div>
        <div className="steps">
          <span className={"st" + (step == 1 ? " on" : "")}>1. Enter code</span> ›<span className={"st" + (step == 2 ? " on" : "")}>2. Your details</span> ›
          <span className={"st" + (step == 3 ? " on" : "")}>3. Done</span>
        </div>
        {error && <div className="alert alert-danger claim-error">{error}</div>}

        {step == 1 && (
          <div>
            <p style={{ textAlign: "center", color: "#666" }}>Enter the 6-digit claim code you received by email.</p>
            <div className="otp-boxes">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={i == 0 ? 6 : 1}
                  value={d}
                  onChange={(e) => onDigit(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                  aria-label={"Digit " + (i + 1)}
                />
              ))}
            </div>
            <button className="btn btn-primary btn-block" onClick={verify} disabled={loading}>
              {loading && <span className="spinner"></span>}
              {loading ? "Checking..." : "Continue"}
            </button>
          </div>
        )}

        {step == 2 && payment && (
          <div>
            <div className="claim-summary">
              <div className="text-muted" style={{ fontSize: 12 }}>
                From {payment.senderName}
                {payment.senderCompany ? " · " + payment.senderCompany : ""}
              </div>
              <div className="amt">{formatMoney(payment.amount, payment.currency)}</div>
              <div style={{ fontSize: 12 }}>
                Ref: <span>{payment.id}</span> · Sent to {payment.recipientEmail}
              </div>
              {payment.description && <div style={{ marginTop: 8, fontStyle: "italic" }}>&quot;{payment.description}&quot;</div>}
            </div>
            <div className={"form-group" + (errors.fullName ? " has-error" : "")}>
              <label htmlFor="claim-name">Full name (as on the payment)</label>
              <input id="claim-name" className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              {errors.fullName && <span className="err">{errors.fullName}</span>}
            </div>
            <div className={"form-group" + (errors.iban ? " has-error" : "")}>
              <label htmlFor="claim-iban">Bank account (IBAN or account number)</label>
              <input id="claim-iban" className="form-control" placeholder="GB82 WEST 1234 5698 7654 32" value={iban} onChange={(e) => setIban(e.target.value)} />
              {errors.iban && <span className="err">{errors.iban}</span>}
            </div>
            <div className={"form-group" + (errors.agree ? " has-error" : "")}>
              <label className="chk">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I confirm I am the intended recipient of this payment
              </label>
              {errors.agree && <span className="err">{errors.agree}</span>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <span
                className="btn"
                onClick={() => {
                  setStep(1);
                  setPayment(null);
                  setErrors({});
                }}
              >
                Back
              </span>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={claim} disabled={loading}>
                {loading && <span className="spinner"></span>}
                {loading ? "Processing..." : "Claim payment"}
              </button>
            </div>
          </div>
        )}

        {step == 3 && (
          <div className="alert alert-success" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>✓</div>
            <b>Payment claimed!</b>
            <p>
              Confirmation number: <span className="conf-no">{confirmation}</span>
            </p>
            <p className="mb-0">Funds will arrive in your account within 1-3 business days.</p>
          </div>
        )}
      </div>
    </div>
  );
}
