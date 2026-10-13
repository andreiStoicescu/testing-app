"use client";
import React from "react";
import { validateRegister, COUNTRIES } from "@/lib/validators";

export default class RegisterPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      form: { name: "", email: "", company: "", country: "", password: "", confirmPassword: "", terms: false },
      errors: {},
      submitting: false,
      success: false,
      serverError: "",
    };
    this.handleChange = this.handleChange.bind(this);
    this.submit = this.submit.bind(this);
  }

  handleChange(e) {
    var f = Object.assign({}, this.state.form);
    f[e.target.name] = e.target.type == "checkbox" ? e.target.checked : e.target.value;
    var errs = Object.assign({}, this.state.errors);
    delete errs[e.target.name];
    this.setState({ form: f, errors: errs });
  }

  submit() {
    var self = this;
    if (this.state.submitting) return;
    var errs = validateRegister(this.state.form);
    if (Object.keys(errs).length > 0) {
      this.setState({ errors: errs, serverError: "" });
      return;
    }
    this.setState({ submitting: true, serverError: "" });
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.state.form),
    })
      .then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, d: d }; });
      })
      .then(function (res) {
        if (!res.ok) {
          self.setState({ submitting: false, errors: res.d.errors || {}, serverError: res.d.error || (res.d.errors ? "" : "Registration failed") });
          return;
        }
        self.setState({ submitting: false, success: true });
        setTimeout(function () {
          window.location.href = "/login?registered=1";
        }, 2500);
      })
      .catch(function () {
        self.setState({ submitting: false, serverError: "Something went wrong" });
      });
  }

  renderField(label, name, type, placeholder) {
    var err = this.state.errors[name];
    return (
      <div className={"form-group" + (err ? " has-error" : "")}>
        <div className="lbl">{label}</div>
        <input name={name} type={type} className="frm-input" placeholder={placeholder} value={this.state.form[name]} onChange={this.handleChange} />
        {err && <span className="err">{err}</span>}
      </div>
    );
  }

  render() {
    var e = this.state.errors;
    if (this.state.success) {
      return (
        <div className="auth-wrap">
          <div className="auth-box">
            <div className="logo">Pay<span>Flow</span></div>
            <div className="alert alert-success" style={{ marginTop: 20 }}>
              <b>Registration successful!</b>
              <br />
              We sent a confirmation email to <b>{this.state.form.email}</b>. Redirecting to login...
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="auth-wrap">
        <div className="auth-box wide">
          <div className="logo">Pay<span>Flow</span></div>
          <div className="sub">Create your account</div>
          {this.state.serverError ? <div className="alert alert-danger">{this.state.serverError}</div> : null}
          <div className="register-form">
            {this.renderField("Full name *", "name", "text", "John Doe")}
            {this.renderField("Email *", "email", "text", "john@company.com")}
            <div className="row2">
              {this.renderField("Company", "company", "text", "")}
              <div className={"form-group" + (e.country ? " has-error" : "")}>
                <div className="lbl">Country *</div>
                <select name="country" className="frm-input" value={this.state.form.country} onChange={this.handleChange}>
                  <option value="">Choose...</option>
                  {COUNTRIES.map(function (c) {
                    return <option key={c.code} value={c.code}>{c.name}</option>;
                  })}
                </select>
                {e.country && <span className="err">{e.country}</span>}
              </div>
            </div>
            <div className="row2">
              {this.renderField("Password *", "password", "password", "")}
              {this.renderField("Confirm password *", "confirmPassword", "password", "")}
            </div>
            <div className="text-muted" style={{ fontSize: 11, marginTop: -8, marginBottom: 12 }}>Min. 8 characters, one uppercase letter and one number.</div>
            <div className={"form-group" + (e.terms ? " has-error" : "")}>
              <label className="chk">
                <input type="checkbox" name="terms" checked={this.state.form.terms} onChange={this.handleChange} />
                <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
              </label>
              {e.terms && <span className="err">{e.terms}</span>}
            </div>
            <div className={"btn btn-primary btn-block" + (this.state.submitting ? " disabled" : "")} onClick={this.submit}>
              {this.state.submitting ? <span><span className="spinner"></span>Creating account...</span> : "Register"}
            </div>
          </div>
          <div className="auth-footer">
            Already registered? <a href="/login">Sign in</a>
          </div>
        </div>
      </div>
    );
  }
}
