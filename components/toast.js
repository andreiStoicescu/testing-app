export function showToast(msg, type) {
  if (typeof document == "undefined") return;
  var c = document.getElementById("toast-container");
  if (!c) {
    c = document.createElement("div");
    c.id = "toast-container";
    document.body.appendChild(c);
  }
  var t = document.createElement("div");
  t.className = "toast " + (type || "info");
  t.setAttribute("role", "status");
  t.innerHTML = msg;
  c.appendChild(t);
  setTimeout(function () {
    t.style.opacity = "0";
    t.style.transition = "opacity .4s";
    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 400);
  }, 3000);
}
