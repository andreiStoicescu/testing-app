"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@/components/UserContext";
import { formatMoney } from "@/lib/validators";

export default function DashboardHome() {
  const { user } = useUser();
  const [payments, setPayments] = useState<any[] | null>(null);

  useEffect(() => {
    fetch("/api/payments")
      .then((r) => r.json())
      .then((d) => setPayments(d.data || []));
  }, []);

  const count = (s: string) => (payments || []).filter((p) => p.status == s).length;
  const totals: any = {};
  (payments || []).forEach((p) => {
    if (p.status != "cancelled") totals[p.currency] = (totals[p.currency] || 0) + p.amount;
  });
  const recent = (payments || []).slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);

  return (
    <div>
      <h1 className="page-title">Welcome back, {user.name.split(" ")[0]}</h1>
      {!user.verified && (
        <div className="alert alert-warning">
          Your email address is not confirmed yet. <Link href="/dashboard/profile">Resend confirmation</Link>
        </div>
      )}
      {payments == null ? (
        <div className="loading-overlay">
          <span className="spinner dark"></span> Loading stats...
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="stat">
              <div className="num">{payments.length}</div>
              <div className="lab">Total payments</div>
            </div>
            <div className="stat s-pending">
              <div className="num">{count("pending")}</div>
              <div className="lab">Pending</div>
            </div>
            <div className="stat s-claimed">
              <div className="num">{count("claimed")}</div>
              <div className="lab">Claimed</div>
            </div>
            <div className="stat s-completed">
              <div className="num">{count("completed")}</div>
              <div className="lab">Completed</div>
            </div>
            <div className="stat s-cancelled">
              <div className="num">{count("cancelled")}</div>
              <div className="lab">Cancelled</div>
            </div>
          </div>
          <div className="row2">
            <div className="panel">
              <div className="panel-heading">Recent payments</div>
              <div className="panel-body" style={{ padding: 0 }}>
                {recent.length == 0 && <div className="empty">No payments yet</div>}
                {recent.map((p) => (
                  <div key={p.id} style={{ display: "flex", padding: "10px 18px", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ flex: 1 }}>
                      <div>{p.recipientName}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{p.id}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div>{formatMoney(p.amount, p.currency)}</div>
                      <span className={"badge badge-" + p.status}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel">
              <div className="panel-heading">Volume by currency</div>
              <div className="panel-body">
                {Object.keys(totals).length == 0 && <div className="text-muted">Nothing to show</div>}
                {Object.keys(totals).map((c) => (
                  <div key={c} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>{c}</span>
                    <b>{formatMoney(totals[c], c)}</b>
                  </div>
                ))}
                <div className="mt-2">
                  <Link href="/dashboard/payments/new" className="btn btn-primary btn-sm">
                    + New payment
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
