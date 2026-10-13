"use client";
import React from "react";
import { formatMoney } from "@/lib/validators";
import { showToast } from "./toast";

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function fmtDate(d) {
  if (!d) return "-";
  var x = new Date(d);
  return ("0" + (x.getMonth() + 1)).slice(-2) + "/" + ("0" + x.getDate()).slice(-2) + "/" + x.getFullYear();
}

var COLS = [
  ["id", "Ref"],
  ["recipientName", "Recipient"],
  ["recipientEmail", "Email"],
  ["amount", "Amount"],
  ["status", "Status"],
  ["dueDate", "Due"],
  ["createdAt", "Created"],
];

class PaymentsTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rows: [],
      loading: true,
      search: "",
      status: "",
      sortBy: "createdAt",
      sortDir: "desc",
      page: 1,
      perPage: 5,
      expanded: null,
      modal: null,
      busy: false,
    };
    this.tbody = React.createRef();
    this.timer = null;
    this.searchTimer = null;
    this.handleTableClick = this.handleTableClick.bind(this);
    this.load = this.load.bind(this);
  }

  componentDidMount() {
    this.load();
    var self = this;
    this.timer = setInterval(function () {
      self.load(true);
    }, 15000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  componentDidUpdate() {
    this.renderRows();
  }

  load(silent) {
    var self = this;
    if (!silent) this.setState({ loading: true });
    fetch("/api/payments")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        self.setState({ rows: d.data || [], loading: false });
      })
      .catch(function () {
        self.setState({ loading: false });
        showToast("Failed to load payments", "error");
      });
  }

  getFiltered() {
    var s = this.state;
    var q = s.search.toLowerCase();
    var out = s.rows.filter(function (r) {
      if (s.status && r.status != s.status) return false;
      if (q && (r.recipientName + " " + r.recipientEmail + " " + r.id).toLowerCase().indexOf(q) == -1) return false;
      return true;
    });
    out.sort(function (a, b) {
      var x = a[s.sortBy], y = b[s.sortBy];
      if (typeof x == "string") { x = x.toLowerCase(); y = (y || "").toLowerCase(); }
      if (x < y) return s.sortDir == "asc" ? -1 : 1;
      if (x > y) return s.sortDir == "asc" ? 1 : -1;
      return 0;
    });
    return out;
  }

  renderRows() {
    if (!this.tbody.current) return;
    var self = this;
    var all = this.getFiltered();
    var start = (this.state.page - 1) * this.state.perPage;
    var rows = all.slice(start, start + this.state.perPage);
    var html = "";
    if (rows.length == 0) {
      html = '<tr><td colspan="8" class="empty">No payments found</td></tr>';
    }
    rows.forEach(function (r, i) {
      var pending = r.status == "pending";
      var canComplete = r.status == "pending" || r.status == "claimed";
      html += '<tr id="row_' + i + '" class="' + (self.state.expanded == r.id ? "expanded" : "") + '">';
      html += "<td>" + esc(r.id) + "</td>";
      html += "<td>" + esc(r.recipientName) + "</td>";
      html += "<td>" + esc(r.recipientEmail) + "</td>";
      html += '<td style="text-align:right">' + esc(formatMoney(r.amount, r.currency)) + "</td>";
      html += '<td><span class="badge badge-' + r.status + '">' + esc(r.status) + "</span></td>";
      html += "<td>" + fmtDate(r.dueDate) + "</td>";
      html += "<td>" + fmtDate(r.createdAt) + "</td>";
      html += '<td class="acts">';
      html += '<a href="javascript:void(0)" data-act="view" data-id="' + r.id + '">' + (self.state.expanded == r.id ? "Hide" : "View") + "</a>";
      html += '<a href="javascript:void(0)" data-act="edit" data-id="' + r.id + '"' + (pending ? "" : ' class="dis"') + ">Edit</a>";
      html += '<a href="javascript:void(0)" data-act="complete" data-id="' + r.id + '"' + (canComplete ? "" : ' class="dis"') + ">Set complete</a>";
      html += '<a href="javascript:void(0)" data-act="cancel" data-id="' + r.id + '"' + (pending ? "" : ' class="dis"') + ' style="color:#c53030">Cancel</a>';
      if (pending) html += '<a href="javascript:void(0)" data-act="resend" data-id="' + r.id + '">Resend code</a>';
      html += "</td></tr>";
      if (self.state.expanded == r.id) {
        html += '<tr class="details-row"><td colspan="8"><div style="display:flex;gap:30px;flex-wrap:wrap">';
        html += "<div><b>Method:</b> " + esc(r.method) + "<br/><b>Category:</b> " + esc(r.category) + "<br/><b>Priority:</b> " + esc(r.priority) + "</div>";
        html += "<div><b>Address:</b> " + esc(r.address1) + " " + esc(r.address2) + "<br/>" + esc(r.city) + " " + esc(r.state) + " " + esc(r.zip) + ", " + esc(r.country) + "</div>";
        html += "<div><b>Phone:</b> " + esc(r.phone || "-") + "<br/><b>Description:</b> " + esc(r.description || "-") + "</div>";
        if (r.claimedBy) html += "<div><b>Claimed by:</b> " + esc(r.claimedBy.name) + "<br/><b>IBAN:</b> " + esc(r.claimedBy.iban) + "<br/><b>Claimed at:</b> " + esc(new Date(r.claimedAt).toLocaleString()) + "</div>";
        if (r.cancelReason) html += "<div><b>Cancel reason:</b> " + esc(r.cancelReason) + "</div>";
        html += "</div></td></tr>";
      }
    });
    this.tbody.current.innerHTML = html;
  }

  handleTableClick(e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var act = t.getAttribute("data-act");
    var id = t.getAttribute("data-id");
    if (!act) return;
    if (t.className.indexOf("dis") > -1) return;
    if (act == "view") {
      this.setState({ expanded: this.state.expanded == id ? null : id });
    } else if (act == "edit") {
      window.location.href = "/dashboard/payments/" + id + "/edit";
    } else if (act == "complete") {
      this.setState({ modal: { type: "complete", id: id } });
    } else if (act == "cancel") {
      if (!window.confirm("Are you sure you want to cancel payment " + id + "?")) return;
      var reason = window.prompt("Reason for cancellation (optional):", "");
      this.doAction(id, "cancel", { reason: reason || "" });
    } else if (act == "resend") {
      this.doAction(id, "resend");
    }
  }

  doAction(id, action, extra) {
    var self = this;
    this.setState({ busy: true });
    fetch("/api/payments/" + id + "/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ action: action }, extra || {})),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        self.setState({ busy: false, modal: null });
        if (!res.ok) {
          showToast(res.d.error || "Action failed", "error");
          return;
        }
        var msgs = { complete: "Payment " + id + " marked as completed", cancel: "Payment " + id + " cancelled", resend: "Claim code resent for " + id };
        showToast(msgs[action], "success");
        self.load(true);
      });
  }

  sort(col) {
    if (this.state.sortBy == col) this.setState({ sortDir: this.state.sortDir == "asc" ? "desc" : "asc" });
    else this.setState({ sortBy: col, sortDir: "asc" });
  }

  render() {
    var self = this;
    var s = this.state;
    var total = this.getFiltered().length;
    var pages = Math.max(1, Math.ceil(total / s.perPage));
    var pageLinks = [];
    for (var i = 1; i <= pages; i++) {
      (function (n) {
        pageLinks.push(
          <span key={n} className={"pg" + (n == s.page ? " cur" : "")} onClick={function () { self.setState({ page: n }); }}>
            {n}
          </span>
        );
      })(i);
    }
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="tbl-toolbar">
            <input
              type="text"
              placeholder="Search name, email or ref..."
              defaultValue=""
              onChange={function (e) {
                var v = e.target.value;
                clearTimeout(self.searchTimer);
                self.searchTimer = setTimeout(function () {
                  self.setState({ search: v, page: 1 });
                }, 400);
              }}
            />
            <select value={s.status} onChange={function (e) { self.setState({ status: e.target.value, page: 1 }); }}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="claimed">Claimed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <span style={{ marginLeft: "auto" }} className="text-muted">
              {s.loading ? <span><span className="spinner dark"></span>loading</span> : total + " record(s)"}
            </span>
            <button className="btn btn-sm" onClick={function () { self.load(); }}>
              ⟳ Refresh
            </button>
          </div>
          <div className="tbl-wrap">
            <table className="grid" onClick={this.handleTableClick}>
              <thead>
                <tr>
                  {COLS.map(function (c) {
                    return (
                      <th key={c[0]} onClick={function () { self.sort(c[0]); }}>
                        {c[1]} {s.sortBy == c[0] ? (s.sortDir == "asc" ? "▲" : "▼") : ""}
                      </th>
                    );
                  })}
                  <th style={{ cursor: "default" }}>Actions</th>
                </tr>
              </thead>
              <tbody ref={this.tbody}></tbody>
            </table>
          </div>
          <div className="pager">
            <span className="text-muted" style={{ marginRight: "auto" }}>
              Show{" "}
              <select value={s.perPage} onChange={function (e) { self.setState({ perPage: Number(e.target.value), page: 1 }); }}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
              </select>{" "}
              per page
            </span>
            <span className={"pg" + (s.page == 1 ? " off" : "")} onClick={function () { if (s.page > 1) self.setState({ page: s.page - 1 }); }}>
              «
            </span>
            {pageLinks}
            <span className={"pg" + (s.page == pages ? " off" : "")} onClick={function () { if (s.page < pages) self.setState({ page: s.page + 1 }); }}>
              »
            </span>
          </div>
        </div>
        {s.modal && s.modal.type == "complete" && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="mh">Complete payment</div>
              <div className="mb">
                Mark payment <b>{s.modal.id}</b> as completed? This cannot be undone.
              </div>
              <div className="mf">
                <span className="btn" onClick={function () { self.setState({ modal: null }); }}>
                  Close
                </span>
                <span className={"btn btn-success" + (s.busy ? " disabled" : "")} onClick={function () { if (!s.busy) self.doAction(s.modal.id, "complete"); }}>
                  {s.busy ? "Please wait..." : "Yes, complete"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default PaymentsTable;
