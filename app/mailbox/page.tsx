"use client";
import { useEffect, useState } from "react";

export default function MailboxPage() {
  const [mails, setMails] = useState<any[] | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  function load() {
    fetch("/api/outbox").then(async (r) => {
      if (!r.ok) {
        setDisabled(true);
        return;
      }
      const d = await r.json();
      setMails(d.data);
    });
  }

  useEffect(load, []);

  return (
    <div style={{ maxWidth: 800, margin: "30px auto", padding: "0 16px" }}>
      <h1 className="page-title">Dev mailbox</h1>
      {disabled && <div className="alert alert-info">The dev mailbox is disabled because real SMTP is configured. Check the recipient inbox instead.</div>}
      {!disabled && (
        <>
          <p className="text-muted">
            Last 50 emails sent by the app. <span className="btn btn-sm" onClick={load}>Refresh</span>
          </p>
          {mails && mails.length == 0 && <div className="empty">No emails yet</div>}
          {mails &&
            mails.map((m) => (
              <div key={m.id} className="panel">
                <div className="panel-heading" style={{ cursor: "pointer" }} onClick={() => setOpen(open == m.id ? null : m.id)}>
                  <div style={{ flex: 1 }}>
                    <div>{m.subject}</div>
                    <div className="text-muted" style={{ fontSize: 12, fontWeight: "normal" }}>
                      to {m.to} · {new Date(m.sentAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                {open == m.id && <div className="panel-body" dangerouslySetInnerHTML={{ __html: m.html }} />}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
