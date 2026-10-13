import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const sid = req.cookies.get("sid")?.value;
  const path = req.nextUrl.pathname;
  if (path.startsWith("/dashboard") && !sid) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?next=" + encodeURIComponent(path);
    return NextResponse.redirect(url);
  }
  if ((path == "/login" || path == "/register") && sid) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
