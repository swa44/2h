"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { daysBetween, formatDate } from "@/lib/date";
import type { Plan } from "@/lib/types";
import { PlusIcon, XIcon } from "@/components/icons";

export default function PlanManager({ plans, today }: { plans: Plan[]; today: string }) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const upcoming = plans.filter((p) => p.date >= today).reverse();
  const past = plans.filter((p) => p.date < today);

  async function add() {
    if (!date) return;
    setBusy(true);
    const { error } = await supabaseBrowser().from("twoh_plans").insert({ date, memo: memo.trim() || null });
    setBusy(false);
    if (error) return alert("약속을 저장하지 못했어요.");
    setMemo("");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("이 약속을 지울까요?")) return;
    const { error } = await supabaseBrowser().from("twoh_plans").delete().eq("id", id);
    if (error) return alert("지우지 못했어요.");
    router.refresh();
  }

  const Row = ({ p }: { p: Plan }) => {
    const dd = daysBetween(today, p.date);
    return (
      <li className="flex items-center gap-3 px-4 py-3">
        <span className="w-12 shrink-0 rounded-full bg-plan-soft py-0.5 text-center text-xs font-bold text-plan">
          {dd === 0 ? "오늘" : dd > 0 ? `D-${dd}` : `D+${-dd}`}
        </span>
        <span className="flex-1 truncate text-sm">{p.memo || "만나는 날"}</span>
        <span className="text-xs text-muted">{formatDate(p.date)}</span>
        <button onClick={() => remove(p.id)} aria-label="약속 지우기" className="grid h-7 w-7 place-items-center text-muted">
          <XIcon className="h-4 w-4" />
        </button>
      </li>
    );
  };

  return (
    <div className="mx-4 space-y-3">
      <div className="space-y-2 rounded-2xl bg-surface p-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 w-full rounded-xl border border-line bg-bg px-3 outline-none focus:border-plan"
        />
        <div className="flex gap-2">
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="약속 메모 (선택)"
            className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 outline-none focus:border-plan"
          />
          <button
            onClick={add}
            disabled={busy}
            className="flex h-11 shrink-0 items-center gap-1 rounded-xl bg-plan px-4 text-sm font-bold text-white disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" /> 추가
          </button>
        </div>
      </div>

      {upcoming.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
          {upcoming.map((p) => (
            <Row key={p.id} p={p} />
          ))}
        </ul>
      )}
      {past.length > 0 && (
        <>
          <button onClick={() => setShowPast((v) => !v)} className="px-1 text-xs text-muted underline underline-offset-2">
            지난 약속 {past.length}개 {showPast ? "접기" : "보기"}
          </button>
          {showPast && (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface opacity-80">
              {past.map((p) => (
                <Row key={p.id} p={p} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
