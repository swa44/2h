"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SettingsForm({ partnerName, startDate }: { partnerName: string; startDate: string }) {
  const router = useRouter();
  const [name, setName] = useState(partnerName);
  const [start, setStart] = useState(startDate);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg(null);
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getUser();
    const { error } = await supabase.from("twoh_settings").upsert({
      user_id: data.user?.id,
      partner_name: name.trim() || null,
      start_date: start || null,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    setMsg(error ? "저장하지 못했어요." : "저장했어요.");
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
