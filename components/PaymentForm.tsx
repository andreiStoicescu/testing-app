"use client";
import { useId, useState } from "react";
import Dropdown from "./Dropdown";
import { showToast } from "./toast";
import { validatePayment, COUNTRIES, STATES, CURRENCIES, METHODS, PRIORITIES, CATEGORIES } from "@/lib/validators";

const EMPTY: any = {
  recipientName: "",
  recipientEmail: "",
  phone: "",
  amount: "",
  currency: "USD",
  method: "",
  category: "",
  priority: "normal",
  country: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  dueDate: "",
  description: "",
  notify: true,
  terms: false,
};

export default function PaymentForm({ initial, paymentId }: { initial?: any; paymentId?: string }) {
  const isEdit = !!paymentId;
  const [form, setForm] = useState<any>(() => (initial ? { ...EMPTY, ...initial, amount: String(initial.amount) } : { ...EMPTY }));
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [created, setCreated] = useState<any>(null);
  const uid = useId();

  function set(k: string, v: any) {
    const f = { ...form, [k]: v };
    if (k == "country") f.state = "";
    setForm(f);
    if (errors[k]) {
      const e = { ...errors };
      delete e[k];
      setErrors(e);
    }
  }

  function blur(k: string) {
    setTouched({ ...touched, [k]: true });
    if (k == "recipientEmail" || k == "amount" || k == "zip") {
      const all: any = validatePayment(form);
      const e = { ...errors };
      if (all[k]) e[k] = all[k];
      else delete e[k];
      setErrors(e);
    }
  }

  async function submit(ev: any) {
    ev.preventDefault();
    setServerError("");
    const e: any = validatePayment(form, { requireTerms: !isEdit });
    setErrors(e);
    if (Object.keys(e).length) {
      window.scrollTo(0, 0);
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(isEdit ? "/api/payments/" + paymentId : "/api/payments", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      setSubmitting(false);
      if (!r.ok) {
        if (d.errors) setErrors(d.errors);
        setServerError(d.error || "Please correct the errors below");
        window.scrollTo(0, 0);
        return;
      }
      if (isEdit) {
        showToast("Payment " + paymentId + " updated" + (d.codeResent ? " - new claim code sent" : ""), "success");
        setTimeout(() => (window.location.href = "/dashboard/payments"), 800);
      } else {
        setCreated({ id: d.id, mailSent: d.mailSent, email: form.recipientEmail });
        showToast("Payment created successfully", "success");
      }
    } catch (err) {
      setSubmitting(false);
      setServerError("Unexpected error. Please try again.");
    }
  }

  if (created) {
    return (
      <div className="panel" style={{ maxWidth: 600 }}>
        <div className="panel-body">
          <div className="alert alert-success" data-testid="payment-success">
            Payment <b className="new-payment-id">{created.id}</b> was created.
          </div>
          {created.mailSent ? (
            <p>
              A claim code was emailed to <b>{created.email}</b>.
            </p>
          ) : (
            <div className="alert alert-warning">The claim email could not be sent. You can resend it from the payments list.</div>
          )}
          <a href="/dashboard/payments" className="btn btn-primary">
            Go to payments
          </a>{" "}
          <span
            className="btn"
            onClick={() => {
              setCreated(null);
              setForm({ ...EMPTY });
              setErrors({});
              setTouched({});
            }}
          >
            Create another
          </span>
        </div>
      </div>
    );
  }

  const errCount = Object.keys(errors).length;
  const states = (STATES as any)[form.country];

  return (
    <form onSubmit={submit} noValidate className="payment-form" style={{ maxWidth: 820 }}>
      {(serverError || errCount > 0) && (
        <div className="alert alert-danger" id="form-errors">
          <b>{serverError || "Please fix " + errCount + " error" + (errCount > 1 ? "s" : "") + " before submitting"}</b>
          {errCount > 0 && (
            <ul>
              {Object.keys(errors).map((k) => (
                <li key={k}>{errors[k]}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="panel">
        <div className="panel-body">
          <fieldset className="fs">
            <legend>Recipient</legend>
            <div className="row2">
              <div className={"form-group" + (errors.recipientName ? " has-error" : "")}>
                <label htmlFor={uid + "rn"}>Full name *</label>
                <input id={uid + "rn"} data-testid="recipient-name" className="form-control" value={form.recipientName} onChange={(e) => set("recipientName", e.target.value)} onBlur={() => blur("recipientName")} />
                {errors.recipientName && <span className="err">{errors.recipientName}</span>}
              </div>
              <div className={"form-group" + (errors.recipientEmail ? " has-error" : "")}>
                <label>Email *</label>
                <input name="recipientEmail" type="text" className="form-control" value={form.recipientEmail} onChange={(e) => set("recipientEmail", e.target.value)} onBlur={() => blur("recipientEmail")} />
                {errors.recipientEmail && <div className="help-block">{errors.recipientEmail}</div>}
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: "50%" }}>
              <label>Phone</label>
              <input className={"form-control" + (errors.phone ? " invalid" : "")} placeholder="+1 555 123 4567" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              {errors.phone && <small className="error-msg">{errors.phone}</small>}
            </div>
          </fieldset>

          <fieldset className="fs">
            <legend>Payment details</legend>
            <div className="row3">
              <div className={"form-group" + (errors.amount ? " has-error" : "")}>
                <label htmlFor="amt">Amount *</label>
                <input id="amt" data-testid="amount-input" className="form-control" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={(e) => set("amount", e.target.value)} onBlur={() => blur("amount")} />
                {errors.amount && (
                  <div className="err" data-testid="error-amount">
                    {errors.amount}
                  </div>
                )}
              </div>
              <div className={"form-group" + (errors.currency ? " has-error" : "")}>
                <label htmlFor="currency">Currency *</label>
                <select id="currency" className="form-control" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                {errors.currency && <span className="err">{errors.currency}</span>}
              </div>
              <div className="form-group">
                <div className="lbl">Payment method *</div>
                <Dropdown name="method" options={METHODS} value={form.method} invalid={!!errors.method} placeholder="Select method" onChange={(v: string) => set("method", v)} />
                {errors.method && <span className="err">{errors.method}</span>}
              </div>
            </div>
            <div className={"form-group" + (errors.category ? " has-error" : "")}>
              <div className="lbl">Category *</div>
              {CATEGORIES.map((c) => (
                <label key={c.value} className="radio-inline">
                  <input type="radio" name="category" value={c.value} checked={form.category == c.value} onChange={() => set("category", c.value)} /> {c.label}
                </label>
              ))}
              {errors.category && <span className="err">{errors.category}</span>}
            </div>
            <div className="row2">
              <div className="form-group">
                <div className="lbl">Priority</div>
                <Dropdown name="priority" options={PRIORITIES} value={form.priority} onChange={(v: string) => set("priority", v)} />
              </div>
              <div className={"form-group" + (errors.dueDate ? " has-error" : "")}>
                <label>Due date *</label>
                <input type="date" data-testid="due-date" className="form-control" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
                {errors.dueDate && <span className="err">{errors.dueDate}</span>}
              </div>
            </div>
            <div className={"form-group" + (errors.description ? " has-error" : "")}>
              <label>Description {form.category == "other" ? "*" : ""}</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
              <div className={"counter" + (form.description.length > 250 ? " over" : "")}>{form.description.length}/250</div>
              {errors.description && <span className="err">{errors.description}</span>}
            </div>
          </fieldset>

          <fieldset className="fs">
            <legend>Billing address</legend>
            <div className="row2">
              <div className={"form-group" + (errors.country ? " has-error" : "")}>
                <label>Country *</label>
                <select name="country" className="form-control" value={form.country} onChange={(e) => set("country", e.target.value)}>
                  <option value="">-- Select country --</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.country && <span className="err">{errors.country}</span>}
              </div>
              {states ? (
                <div className={"form-group" + (errors.state ? " has-error" : "")}>
                  <label>{form.country == "CA" ? "Province" : "State"} *</label>
                  <select className="form-control" value={form.state} onChange={(e) => set("state", e.target.value)}>
                    <option value="">-- Select --</option>
                    {states.map((s: any) => (
                      <option key={s[0]} value={s[0]}>
                        {s[1]}
                      </option>
                    ))}
                  </select>
                  {errors.state && <span className="err">{errors.state}</span>}
                </div>
              ) : (
                <div></div>
              )}
            </div>
            <div className={"form-group" + (errors.address1 ? " has-error" : "")}>
              <label htmlFor={uid + "a1"}>Address line 1 *</label>
              <input id={uid + "a1"} className="form-control" value={form.address1} onChange={(e) => set("address1", e.target.value)} />
              {errors.address1 && <span className="err">{errors.address1}</span>}
            </div>
            <div className="form-group">
              <label htmlFor={uid + "a2"}>Address line 2</label>
              <input id={uid + "a2"} className="form-control" placeholder="Apartment, suite, etc." value={form.address2} onChange={(e) => set("address2", e.target.value)} />
            </div>
            <div className="row2">
              <div className={"form-group" + (errors.city ? " has-error" : "")}>
                <label htmlFor={uid + "c"}>City *</label>
                <input id={uid + "c"} className="form-control" value={form.city} onChange={(e) => set("city", e.target.value)} />
                {errors.city && <span className="err">{errors.city}</span>}
              </div>
              <div className={"form-group" + (errors.zip ? " has-error" : "")}>
                <label htmlFor={uid + "z"}>ZIP / Postal code *</label>
                <input id={uid + "z"} className="form-control" value={form.zip} onChange={(e) => set("zip", e.target.value)} onBlur={() => blur("zip")} />
                {errors.zip && <span className="err">{errors.zip}</span>}
              </div>
            </div>
          </fieldset>

          <div className="form-group">
            <label className="chk">
              <input type="checkbox" checked={form.notify} onChange={(e) => set("notify", e.target.checked)} /> Send notification to recipient when status changes
            </label>
          </div>
          {!isEdit && (
            <div className={"form-group" + (errors.terms ? " has-error" : "")}>
              <label className="chk">
                <input type="checkbox" id="chkTerms" checked={form.terms} onChange={(e) => set("terms", e.target.checked)} /> I confirm the payment details are correct *
              </label>
              {errors.terms && <span className="err">{errors.terms}</span>}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting && <span className="spinner"></span>}
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create payment"}
            </button>
            {isEdit ? (
              <a className="btn" href="/dashboard/payments">
                Cancel
              </a>
            ) : (
              <input
                type="button"
                className="btn"
                value="Clear form"
                onClick={() => {
                  if (window.confirm("Clear all fields?")) {
                    setForm({ ...EMPTY });
                    setErrors({});
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
