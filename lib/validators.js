var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export var COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "RO", name: "Romania" },
];

export var STATES = {
  US: [["CA", "California"], ["FL", "Florida"], ["IL", "Illinois"], ["NY", "New York"], ["TX", "Texas"], ["WA", "Washington"]],
  CA: [["AB", "Alberta"], ["BC", "British Columbia"], ["ON", "Ontario"], ["QC", "Quebec"]],
};

export var CURRENCIES = ["USD", "EUR", "GBP", "RON"];
export var METHODS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "check", label: "Check" },
  { value: "paypal", label: "PayPal" },
];
export var PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];
export var CATEGORIES = [
  { value: "invoice", label: "Invoice" },
  { value: "refund", label: "Refund" },
  { value: "payroll", label: "Payroll" },
  { value: "other", label: "Other" },
];

var ZIP_RULES = {
  US: [/^\d{5}(-\d{4})?$/, "ZIP code must be 5 digits (e.g. 10001)"],
  CA: [/^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/, "Postal code must look like A1A 1A1"],
  GB: [/^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/, "Invalid UK postcode"],
  DE: [/^\d{5}$/, "Postal code must be 5 digits"],
  FR: [/^\d{5}$/, "Postal code must be 5 digits"],
  RO: [/^\d{6}$/, "Postal code must be 6 digits"],
};

export function isEmail(v) {
  return EMAIL_RE.test(String(v || "").trim());
}

export function validateEmail(v) {
  if (!v || !String(v).trim()) return "Email is required";
  if (!isEmail(v)) return "Please enter a valid email address";
  return null;
}

export function validatePassword(v) {
  if (!v) return "Password is required";
  if (v.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(v)) return "Password must contain an uppercase letter";
  if (!/[0-9]/.test(v)) return "Password must contain a number";
  return null;
}

export function validateRegister(d) {
  var e = {};
  if (!d.name || d.name.trim().length < 2) e.name = "Full name is required";
  var em = validateEmail(d.email);
  if (em) e.email = em;
  var pw = validatePassword(d.password);
  if (pw) e.password = pw;
  if (!d.confirmPassword) e.confirmPassword = "Please confirm your password";
  else if (d.confirmPassword !== d.password) e.confirmPassword = "Passwords do not match";
  if (!d.country) e.country = "Select a country";
  if (!d.terms) e.terms = "You must accept the terms";
  return e;
}

export function validatePayment(d, opts) {
  opts = opts || {};
  var e = {};
  var name = (d.recipientName || "").trim();
  if (!name) e.recipientName = "Recipient name is required";
  else if (name.length < 2 || name.length > 60) e.recipientName = "Name must be between 2 and 60 characters";
  else if (!/^[\p{L} .'-]+$/u.test(name)) e.recipientName = "Name contains invalid characters";

  var em = validateEmail(d.recipientEmail);
  if (em) e.recipientEmail = em;

  if (d.phone && !/^\+?[0-9 ()-]{7,20}$/.test(d.phone)) e.phone = "Invalid phone number";

  if (d.amount === "" || d.amount === null || d.amount === undefined) {
    e.amount = "Amount is required";
  } else {
    var a = Number(d.amount);
    if (isNaN(a)) e.amount = "Amount must be a number";
    else if (a <= 0) e.amount = "Amount must be greater than 0";
    else if (a > 10000) e.amount = "Amount cannot exceed 10,000";
    else if (!/^\d+(\.\d{1,2})?$/.test(String(d.amount))) e.amount = "Amount can have at most 2 decimals";
  }

  if (CURRENCIES.indexOf(d.currency) == -1) e.currency = "Select a currency";
  if (!METHODS.some(function (m) { return m.value == d.method; })) e.method = "Select a payment method";
  if (!CATEGORIES.some(function (m) { return m.value == d.category; })) e.category = "Select a category";
  if (d.priority && !PRIORITIES.some(function (m) { return m.value == d.priority; })) e.priority = "Invalid priority";

  if (!d.country) e.country = "Country is required";
  if (!d.address1 || !d.address1.trim()) e.address1 = "Address is required";
  if (!d.city || !d.city.trim()) e.city = "City is required";
  if ((d.country == "US" || d.country == "CA") && !d.state) e.state = "State / province is required";

  if (!d.zip) e.zip = "Postal code is required";
  else if (d.country && ZIP_RULES[d.country] && !ZIP_RULES[d.country][0].test(d.zip.trim())) e.zip = ZIP_RULES[d.country][1];

  if (!d.dueDate) e.dueDate = "Due date is required";
  else {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var due = new Date(d.dueDate + "T00:00:00");
    if (isNaN(due.getTime())) e.dueDate = "Invalid date";
    else if (due < today) e.dueDate = "Due date cannot be in the past";
  }

  if (d.description && d.description.length > 250) e.description = "Description is too long (max 250)";
  if (d.category == "other" && (!d.description || !d.description.trim())) e.description = "Description is required when category is Other";

  if (opts.requireTerms && !d.terms) e.terms = "You must confirm the payment details";
  return e;
}

export function normalizeIban(v) {
  return String(v || "").replace(/\s+/g, "").toUpperCase();
}

export function validateIban(v) {
  var x = normalizeIban(v);
  if (!x) return "Bank account is required";
  if (x.length <= 8) return "Bank account must be more than 8 characters";
  return null;
}

export function formatMoney(amount, currency) {
  var sym = { USD: "$", EUR: "€", GBP: "£", RON: "lei " }[currency] || "";
  return sym + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
