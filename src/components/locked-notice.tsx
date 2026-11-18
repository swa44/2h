"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { formatDateLong } from "@/lib/date";
import { HeartIcon } from "./icons";

type Ctx = (revealOn: string) => void;
const LockedCtx = createContext<Ctx>(() => {});
export const useLockedNotice = () => useContext(LockedCtx);

/** 공개 전 기록을 눌렀을 때 뜨는 안내창 */
export function LockedNoticeProvider({ children }: { children: ReactNode }) {
  const [revealOn, setRevealOn] = useState<string | null>(null);
  const show = useCallback((d: string) => setRevealOn(d), []);

  useEffect(() => {
    if (!revealOn) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setRevealOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealOn]);

  return (
    <LockedCtx value={show}>
      {children}
      {revealOn && (
        <div className="fixed inset-0 z-50 grid place-items-center px-8" role="dialog" aria-modal>
          <button aria-label="닫기" className="absolute inset-0 bg-black/30" onClick={() => setRevealOn(null)} />
          <div className="relative w-full max-w-xs rounded-3xl bg-surface px-6 py-7 text-center shadow-2xl">
            <HeartIcon filled className="mx-auto h-9 w-9 text-accent" />
            <p className="mt-3 font-serif text-lg font-bold">아직 볼 수 없어요</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              이 기록은
              <br />
              <b className="text-ink">{formatDateLong(revealOn)}</b>에 열려요
            </p>
            <button
              onClick={() => setRevealOn(null)}
              className="mt-5 h-11 w-full rounded-2xl bg-accent text-sm font-bold text-accent-ink"
            >
              기다릴게요
            </button>
          </div>
        </div>
      )}
    </LockedCtx>
  );
}

/** 흐리게 보이는 공개 전 기록 카드 (실제 내용은 서버가 보내지 않음) */
export function LockedCard({ date, revealOn, dateLabel, dday }: { date: string; revealOn: string; dateLabel: string; dday: number }) {
  const show = useLockedNotice();
  return (
    <button
      onClick={() => show(revealOn)}
      data-date={date}
      className="relative block w-full overflow-hidden rounded-3xl bg-surface text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.99]"
    >
      <div aria-hidden className="pointer-events-none select-none blur-md">
        <div className="aspect-[4/3] bg-gradient-to-br from-accent-soft via-[#efd9cf] to-plan-soft" />
        <div className="space-y-2 p-4">
          <div className="h-3 w-24 rounded bg-line" />
          <div className="h-4 w-2/3 rounded bg-ink/20" />
          <div className="h-3 w-full rounded bg-line" />
          <div className="h-3 w-5/6 rounded bg-line" />
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-surface/20">
        <span className="rounded-full bg-surface/90 px-3 py-1 text-xs text-muted shadow-sm">{dateLabel}</span>
        <span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-ink shadow-sm">D-{dday} 공개</span>
      </div>
    </button>
  );
}
