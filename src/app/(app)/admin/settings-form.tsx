"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SettingsForm({
  partnerName,
  startDate,
  revealDays,
  revealMode,
}: {
  partnerName: string;
  startDate: string;
  revealDays: number;
  revealMode: "days" | "next_plan";
}) {
  const router = useRouter();
  const [name, setName] = useState(partnerName);
  const [start, setStart] = useState(startDate);
  const [days, setDays] = useState(String(revealDays));
  const [mode, setMode] = useState(revealMode);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg(null);
    const supabase = supabaseBrowser();
    const n = Math.round(Number(days));
    if (!Number.isFinite(n) || n < 0 || n > 365) {
      setBusy(false);
      return setMsg("기다리는 날은 0~365 사이로 입력해주세요.");
    }
    const { data } = await supabase.auth.getUser();
    const { error } = await supabase.from("twoh_settings").upsert({
      user_id: data.user?.id,
      partner_name: name.trim() || null,
      start_date: start || null,
      reveal_days: n,
      reveal_mode: mode,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    setMsg(
      error
        ? error.message.includes("reveal_mode")
          ? "Supabase에서 supabase/migrations_reveal_mode.sql 을 먼저 실행해주세요."
          : error.message.includes("reveal_days")
          ? "Supabase에서 supabase/migrations_reveal_days.sql 을 먼저 실행해주세요."
          : "저장하지 못했어요."
        : "저장했어요.",
    );
    if (!error) router.refresh();
  }

  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6 px-4">
      <section className="space-y-4 rounded-3xl bg-surface p-5">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-muted">그 사람의 이름 (애칭)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 지은"
            className="h-12 w-full rounded-2xl border border-line bg-bg px-4 outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-muted">사귄 날 (1일)</span>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-12 w-full rounded-2xl border border-line bg-bg px-4 outline-none focus:border-accent"
          />
        </label>
        <div>
          <span className="mb-1.5 block text-[13px] font-bold text-muted">기록 공개 방식</span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["days", "N일 뒤 공개"],
                ["next_plan", "다음 만남 전날"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setMode(v)}
                className={`h-11 rounded-2xl border text-sm font-bold ${
                  mode === v ? "border-accent bg-accent text-accent-ink" : "border-line bg-bg text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === "days" ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={365}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="h-12 w-24 rounded-2xl border border-line bg-bg px-4 text-center outline-none focus:border-accent"
              />
              <span className="text-sm text-muted">일 뒤에 공개 (만난 날 기준, 0이면 바로)</span>
            </div>
          ) : (
            <p className="mt-2 px-1 text-sm text-muted">
              기록 다음에 잡힌 가장 가까운 약속의 전날 공개돼요. 약속이 없으면 잡힐 때까지 잠겨 있어요.
            </p>
          )}
        </div>
        <button
          onClick={save}
          disabled={busy}
          className="h-12 w-full rounded-2xl bg-accent font-bold text-accent-ink disabled:opacity-60"
        >
          {busy ? "저장 중…" : "저장"}
        </button>
        {msg && <p className="text-center text-sm text-muted">{msg}</p>}
      </section>

      <section className="rounded-3xl bg-surface p-5 text-sm leading-relaxed">
        <h2 className="mb-2 font-bold">홈 화면에 앱으로 추가하기</h2>
        <p className="text-muted">
          <b className="text-ink">아이폰</b> Safari에서 공유 버튼 → &lsquo;홈 화면에 추가&rsquo;
          <br />
          <b className="text-ink">안드로이드</b> Chrome 메뉴(⋮) → &lsquo;앱 설치&rsquo; 또는 &lsquo;홈 화면에 추가&rsquo;
        </p>
      </section>

      <button onClick={logout} className="h-12 w-full rounded-2xl border border-line text-sm text-muted">
        로그아웃
      </button>
    </div>
  );
}
