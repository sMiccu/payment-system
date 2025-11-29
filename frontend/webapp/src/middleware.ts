import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイルやAPIはスキップ
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // ログインページは常に許可
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // それ以外の画面はすべて「ログイン必須」とみなす
  const accessCookie = request.cookies.get("access")?.value;
  if (!accessCookie) {
    const loginUrl = new URL("/login", request.url);
    // 元の遷移先を保持しておく（任意）
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


