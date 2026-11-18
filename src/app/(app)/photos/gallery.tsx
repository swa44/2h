"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { GalleryPhoto } from "@/lib/data";
import { formatDate, parseYMD } from "@/lib/date";
import { ImageIcon, XIcon } from "@/components/icons";

export default function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const viewer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open === null) return;
    const el = viewer.current;
    if (el) el.scrollLeft = open * el.clientWidth;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (photos.length === 0) {
    return (
      <div className="mx-4 mt-4 rounded-3xl border border-dashed border-line px-6 py-14 text-center text-muted">
        <ImageIcon className="mx-auto h-8 w-8" />
        <p className="mt-3 text-sm">아직 사진이 없어요</p>
      </div>
    );
  }

  // 월별 묶음 (인덱스는 전체 기준 유지)
  const groups: { key: string; label: string; items: { p: GalleryPhoto; i: number }[] }[] = [];
  photos.forEach((p, i) => {
    const { y, m } = parseYMD(p.meeting.date);
    const key = `${y}-${m}`;
    let g = groups.at(-1);
    if (!g || g.key !== key) {
      g = { key, label: `${y}년 ${m}월`, items: [] };
      groups.push(g);
    }
    g.items.push({ p, i });
  });

  const cur = open !== null ? photos[current] : null;

  return (
    <>
      <p className="px-5 pb-3 text-xs text-muted">모든 사진 {photos.length}장 · 최신순</p>
      <div className="space-y-5">
        {groups.map((g) => (
          <section key={g.key}>
            <h2 className="mb-2 px-5 text-[13px] font-bold text-muted">{g.label}</h2>
            <div className="grid grid-cols-3 gap-0.5">
              {g.items.map(({ p, i }) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setCurrent(i);
                    setOpen(i);
                  }}
                  className="aspect-square bg-line/50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumbUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {open !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black" role="dialog" aria-modal>
          <div className="flex items-center gap-3 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3 text-white">
            <div className="min-w-0 flex-1">
              {cur && (
                <>
                  <p className="text-sm font-bold">{formatDate(cur.meeting.date)}</p>
                  <p className="truncate text-xs opacity-70">
                    {cur.meeting.title || cur.meeting.place || "그날의 기록"} · {current + 1}/{photos.length}
                  </p>
                </>
              )}
            </div>
            {cur && (
              <Link href={`/m/${cur.meeting.id}`} className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs">
                기록 보기
              </Link>
            )}
            <button onClick={() => setOpen(null)} aria-label="닫기" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15">
              <XIcon />
            </button>
          </div>
          <div
            ref={viewer}
            onScroll={(e) => setCurrent(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto"
          >
            {photos.map((p, i) => (
              <div key={p.id} className="grid h-full w-full shrink-0 snap-center place-items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={Math.abs(i - current) <= 2 ? p.url : p.thumbUrl}
                  alt=""
                  className="max-h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
          <div className="pb-safe" />
        </div>
      )}
    </>
  );
}
