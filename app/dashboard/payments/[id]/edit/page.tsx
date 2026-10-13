"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PaymentForm from "@/components/PaymentForm";

export default function EditPaymentPage() {
  const params: any = useParams();
  const [p, setP] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/payments/" + params.id)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) setErr(d.error);
        else if (d.data.status != "pending") setErr("This payment is " + d.data.status + " and can no longer be edited.");
        else setP(d.data);
      });
  }, [params.id]);

  return (
    <div>
      <h1 className="page-title">Edit payment {params.id}</h1>
      {err && (
        <div className="alert alert-danger">
          {err} <a href="/dashboard/payments">Back to list</a>
        </div>
      )}
      {!p && !err && (
        <div className="loading-overlay">
          <span className="spinner dark"></span> Loading payment...
        </div>
      )}
      {p && <PaymentForm initial={p} paymentId={p.id} />}
    </div>
  );
}
