"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { idToEmail } from "@/lib/config";

export default function LoginForm() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    let error: { code?: string; message: string } | null = null;
    try {
      ({ error } = await supabaseBrowser().auth.signInWithPassword({ email: idToEmail(loginId), password }));
    } catch (e) {
      error = { code: "network", message: e instanceof Error ? e.message : String(e) };
    }
    if (error) {
      const msg =
        error.code === "invalid_credentials"
          ? `아이디 또는 비밀번호가 맞지 않아요. (${idToEmail(loginId)})`
          : error.code === "email_not_confirmed"
            ? "계정이 아직 확인되지 않았어요. Supabase에서 Auto Confirm으로 다시 만들어주세요."
            : `로그인 오류: ${error.message}${error.code ? ` [${error.code}]` : ""}`;
      setError(msg);
      setPending(false);
      return;
    }
    // 쿠키가 확실히 반영되도록 전체 새로고침으로 이동
    window.location.replace("/");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        placeholder="아이디"
        value={loginId}
        onChange={(e) => setLoginId(e.target.value)}
        className="h-13 w-full rounded-2xl border border-line bg-surface px-4 outline-none focus:border-accent"
      />
      <input
        type="password"
        autoComplete="current-password"
        required
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-13 w-full rounded-2xl border border-line bg-surface px-4 outline-none focus:border-accent"
      />
      {error && <p className="px-1 text-sm text-accent">{error}</p>}
      <button
        disabled={pending}
        className="h-13 w-full rounded-2xl bg-accent font-bold text-accent-ink transition active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "들어가는 중…" : "들어가기"}
      </button>
    </form>
  );
}
