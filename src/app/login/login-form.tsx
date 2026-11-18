"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { idToEmail } from "@/lib/config";

export default function LoginForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: idToEmail(loginId), password });
    if (error) {
      setError("아이디 또는 비밀번호가 맞지 않아요.");
      setPending(false);
      return;
    }
    router.replace("/");
    router.refresh();
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
