"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { daysBetween, formatDate, formatDateLong, parseYMD, ymd } from "@/lib/date";
import type { Plan } from "@/lib/types";
import type { LockedItem } from "@/lib/data";
import { ChevronLeft, ChevronRight, HeartIcon, XIcon } from "@/components/icons";

type M = { id: string; date: string; title: string | null; place: string | null };

export default function Calendar({
  today,
  meetings,
  locked,
  plans,
}: {
  today: string;
  meetings: M[];
  locked: LockedItem[];
  plans: Plan[];
}) {
  const t = parseYMD(today);
  const [view, setView] = useState({ y: t.y, m: t.m });
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const mm = new Map<string, M[]>();
    meetings.forEach((x) => mm.set(x.date, [...(mm.get(x.date) ?? []), x]));
    const pp = new Map<string, Plan[]>();
    plans.forEach((x) => pp.set(x.date, [...(pp.get(x.date) ?? []), x]));
    const ll = new Map<string, LockedItem[]>();
    locked.forEach((x) => ll.set(x.date, [...(ll.get(x.date) ?? []), x]));
    return { mm, pp, ll };
  }, [meetings, plans, locked]);

  const firstDow = new Date(Date.UTC(view.y, view.m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => ymd(view.y, view.m, i + 1)),
  ];
  const monthKey = ymd(view.y, view.m, 1).slice(0, 7);
  const monthCount = [...meetings, ...locked].filter((x) => x.date.startsWith(monthKey)).length;

  const move = (delta: number) =>
    setView(({ y, m }) => {
      const n = m + delta;
      return n < 1 ? { y: y - 1, m: 12 } : n > 12 ? { y: y + 1, m: 1 } : { y, m: n };
    });

  const upcoming = plans.filter((p) => p.date >= today).slice(0, 5);

  const selMeetings = selected ? byDate.mm.get(selected) ?? [] : [];
  const selPlans = selected ? byDate.pp.get(selected) ?? [] : [];
  const selLocked = selected ? byDate.ll.get(selected) ?? [] : [];

  return (
    <div className="px-4">
      <div className="rounded-3xl bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => move(-1)} aria-label="이전 달" className="grid h-9 w-9 place-items-center rounded-full active:bg-line">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => setView({ y: t.y, m: t.m })} className="text-center">
            <p className="font-serif text-lg font-bold">
              {view.y}년 {view.m}월
            </p>
            <p className="text-xs text-muted">이 달에 {monthCount}번 만났어요</p>
          </button>
          <button onClick={() => move(1)} aria-label="다음 달" className="grid h-9 w-9 place-items-center rounded-full active:bg-line">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] text-muted">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div key={d} className={`py-1 ${i === 0 ? "text-accent" : ""}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const met = byDate.mm.has(d);
            const lock = !met && byDate.ll.has(d);
            const plan = byDate.pp.has(d);
            const isToday = d === today;
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                className="relative flex aspect-square flex-col items-center justify-center rounded-2xl active:bg-line/60"
              >
                {met ? (
                  <span className="relative grid h-9 w-9 place-items-center">
                    <HeartIcon filled className="absolute inset-0 h-9 w-9 text-accent" />
                    <span className="relative text-[13px] font-bold text-accent-ink">{parseYMD(d).d}</span>
                  </span>
                ) : lock ? (
                  <span className="relative grid h-9 w-9 place-items-center">
                    <HeartIcon className="absolute inset-0 h-9 w-9 text-accent/60" />
                    <span className="relative text-[13px] font-bold text-accent/80">{parseYMD(d).d}</span>
                  </span>
                ) : (
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full text-[14px] ${
                      plan ? "bg-plan-soft font-bold text-plan" : ""
                    } ${isToday ? "ring-2 ring-accent/60" : ""}`}
                  >
                    {parseYMD(d).d}
                  </span>
                )}
                {met && plan && <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-plan" />}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex justify-center gap-4 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <HeartIcon filled className="h-3.5 w-3.5 text-accent" /> 만난 날
          </span>
          <span className="flex items-center gap-1">
            <HeartIcon className="h-3.5 w-3.5 text-accent/60" /> 공개 전
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-plan-soft ring-1 ring-plan" /> 약속
          </span>
        </div>
      </div>

      {upcoming.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-[13px] font-bold text-muted">다가오는 약속</h2>
          <ul className="space-y-2">
            {upcoming.map((p) => {
              const dd = daysBetween(today, p.date);
              return (
                <li key={p.id}>
                  <button
                    onClick={() => setSelected(p.date)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left"
                  >
                    <span className="w-12 shrink-0 rounded-full bg-plan-soft py-0.5 text-center text-xs font-bold text-plan">
                      {dd === 0 ? "오늘" : `D-${dd}`}
                    </span>
                    <span className="flex-1 truncate text-sm">{p.memo || "만나는 날"}</span>
                    <span className="text-xs text-muted">{formatDate(p.date)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 날짜 시트 */}
      {selected && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal>
          <button aria-label="닫기" className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-3xl bg-bg px-5 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">{formatDateLong(selected)}</h3>
              <button onClick={() => setSelected(null)} aria-label="닫기" className="grid h-9 w-9 place-items-center rounded-full active:bg-line">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {selMeetings.length > 0 && (
              <ul className="mt-3 space-y-2">
                {selMeetings.map((x) => (
                  <li key={x.id}>
                    <Link href={`/m/${x.id}`} className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-3">
                      <HeartIcon filled className="h-4 w-4 shrink-0 text-accent" />
                      <span className="flex-1 truncate text-sm font-bold">{x.title || x.place || "그날의 기록"}</span>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {selLocked.length > 0 && (
              <ul className="mt-3 space-y-2">
                {selLocked.map((x) => (
                  <li key={x.id} className="relative overflow-hidden rounded-2xl bg-surface px-4 py-3">
                    <div aria-hidden className="flex items-center gap-2 blur-[3px] select-none">
                      <HeartIcon filled className="h-4 w-4 text-accent" />
                      <span className="h-3 w-2/3 rounded bg-ink/20" />
                    </div>
                    <p className="absolute inset-0 flex items-center justify-center text-sm font-bold text-accent">
                      아직 볼 수 없어요 · {formatDate(x.revealOn)}에 열려요
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {selPlans.length > 0 && (
              <ul className="mt-3 space-y-2">
                {selPlans.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 rounded-2xl bg-plan-soft px-4 py-3 text-plan">
                    <span className="flex-1 truncate text-sm font-bold">약속 · {p.memo || "만나는 날"}</span>
                  </li>
                ))}
              </ul>
            )}

            {selMeetings.length === 0 && selPlans.length === 0 && selLocked.length === 0 && (
              <p className="mt-4 mb-2 text-center text-sm text-muted">이 날은 기록이 없어요</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
