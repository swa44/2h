"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, adminToken, isAdminKey } from "@/lib/admin-key";
import { supabaseServer } from "@/lib/supabase/server";

export type UnlockState = { error: string | null };

export async function unlock(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  // 로그인한 사람만
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");

  if (!process.env.ADMIN_KEY) return { error: "서버에 ADMIN_KEY가 설정되지 않았어요." };

  // 무차별 대입을 늦추기 위한 짧은 지연
  await new Promise((r) => setTimeout(r, 600));
  if (!isAdminKey(String(formData.get("key") ?? ""))) return { error: "키가 맞지 않아요." };

  (await cookies()).set(ADMIN_COOKIE, adminToken()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function lock() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/");
}
