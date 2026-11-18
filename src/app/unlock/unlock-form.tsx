"use client";
import Link from "next/link";
import { useActionState } from "react";
import { unlock, type UnlockState } from "./actions";

export default function UnlockForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<UnlockState, FormData>(unlock, { error: null });
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <input
        name="key"
        type="password"
        autoComplete="off"
        required
        autoFocus
        placeholder="관리자 키"
        className="h-13 w-full rounded-2xl border border-line bg-surface px-4 outline-none focus:border-accent"
      />
      {state.error && <p className="px-1 text-sm text-accent">{state.error}</p>}
      <button
        disabled={pending}
        className="h-13 w-full rounded-2xl bg-accent font-bold text-accent-ink transition active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "확인 중…" : "열기"}
      </button>
      <Link href="/" className="block py-2 text-center text-sm text-muted">
        돌아가기
      </Link>
    </form>
  );
}
