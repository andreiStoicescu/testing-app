import Link from "next/link";
import PaymentsTable from "@/components/PaymentsTable";

export default function PaymentsPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
        <h1 className="page-title mb-0">Payments</h1>
        <Link href="/dashboard/payments/new" className="btn btn-primary" style={{ marginLeft: "auto" }}>
          + New payment
        </Link>
      </div>
      <PaymentsTable />
    </div>
  );
}
