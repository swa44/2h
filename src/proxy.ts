import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin-key";

function fail(message: string) {
  return new NextResponse(`설정 오류: ${message}`, {
    status: 500,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return fail(
      `환경변수가 없습니다 (URL: ${url ? "있음" : "없음"}, KEY: ${key ? "있음" : "없음"}). ` +
        "Vercel > Settings > Environment Variables에 추가한 뒤 Redeploy 하세요.",
    );
  }
  try {
    return await run(request, url, key);
  } catch (e) {
    console.error("[proxy]", e);
    return fail(e instanceof Error ? e.message : String(e));
  }
}

async function run(request: NextRequest, supabaseUrl: string, supabaseKey: string) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims?.sub);
  const isLogin = request.nextUrl.pathname.startsWith("/login");

  if (!loggedIn && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  // 관리 화면은 관리자 키 쿠키가 있어야 들어갈 수 있음
  if (loggedIn && request.nextUrl.pathname.startsWith("/admin") && !isAdminToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
    const url = request.nextUrl.clone();
    url.pathname = "/unlock";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  if (loggedIn && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|icons/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
