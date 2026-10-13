"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserCtx } from "@/components/UserContext";

async function doLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login?logout=1";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  function load() {
    fetch("/api/auth/me").then(async (r) => {
      if (r.status == 401) {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
        return;
      }
      const d = await r.json();
      setUser(d.user);
    });
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (p: string, exact?: boolean) => (exact ? pathname == p : pathname.startsWith(p));
  const crumbs = pathname.split("/").filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ");

  if (!user) {
    return (
      <div className="loading-overlay" style={{ paddingTop: 120 }}>
        <span className="spinner dark"></span> Loading...
      </div>
    );
  }

  return (
    <UserCtx.Provider value={{ user, refresh: load }}>
      <div className="app">
        <div id="sidebar" className={collapsed ? "collapsed" : ""}>
          <div className="brand">
            P<span className="full">ay</span>
            <span className="full" style={{ color: "#48bb78" }}>Flow</span>
          </div>
          <ul>
            <li className="nav-section">Main</li>
            <li className={"nav-item" + (isActive("/dashboard", true) ? " active" : "")}>
              <Link href="/dashboard">
                <span className="ico">▦</span>
                <span className="txt">Dashboard</span>
              </Link>
            </li>
            <li className="nav-section">Payments</li>
            <li className={"nav-item" + (isActive("/dashboard/payments", true) || pathname.indexOf("/edit") > -1 ? " active" : "")}>
              <a href="/dashboard/payments">
                <span className="ico">☰</span>
                <span className="txt">All payments</span>
              </a>
            </li>
            <li className={"nav-item" + (isActive("/dashboard/payments/new") ? " active" : "")} data-testid="nav-new-payment">
              <Link href="/dashboard/payments/new">
                <span className="ico">＋</span>
                <span className="txt">Create payment</span>
              </Link>
            </li>
            <li className="nav-section">Account</li>
            <li className={"nav-item" + (isActive("/dashboard/profile") ? " active" : "")}>
              <div onClick={() => router.push("/dashboard/profile")}>
                <span className="ico">☺</span>
                <span className="txt">Profile</span>
                {!user.verified && <span className="badge-count txt">!</span>}
              </div>
            </li>
            <li className="nav-item">
              <div onClick={doLogout}>
                <span className="ico">⎋</span>
                <span className="txt">Logout</span>
              </div>
            </li>
          </ul>
        </div>
        <div className="main">
          <div className="topbar">
            <span className="toggle" onClick={() => setCollapsed(!collapsed)}>
              ☰
            </span>
            <span className="crumbs">{crumbs}</span>
            <div className="user-menu">
              <div className="avatar" title={user.name} onClick={() => setMenuOpen(!menuOpen)}>
                {user.name
                  .split(" ")
                  .map((x: string) => x[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              {menuOpen && (
                <div className="menu">
                  <div className="head">
                    Signed in as
                    <br />
                    <b>{user.email}</b>
                  </div>
                  <Link href="/dashboard/profile">My profile</Link>
                  <span className="mi" onClick={doLogout}>
                    Sign out
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="content">{children}</div>
        </div>
      </div>
    </UserCtx.Provider>
  );
}
