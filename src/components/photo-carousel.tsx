"use client";
import { useEffect, useRef, useState } from "react";
import { XIcon } from "./icons";

type P = { id: string; url: string; thumbUrl: string; w: number | null; h: number | null };

export default function PhotoCarousel({ photos }: { photos: P[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  function onScroll() {
    const el = ref.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  useEffect(() => {
    if (open === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 첫 사진 비율에 맞춰 높이 결정 (세로 4:5 ~ 가로 4:3 사이)
  const first = photos[0];
  const ratio = first?.w && first?.h ? Math.min(Math.max(first.w / first.h, 0.8), 1.333) : 0.8;

  return (
    <div className="relative">
      <div ref={ref} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setOpen(i)}
            className="w-full shrink-0 snap-center bg-line/40"
            style={{ aspectRatio: ratio }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
              style={{ backgroundImage: `url(${p.thumbUrl})`, backgroundSize: "cover" }}
            />
          </button>
        ))}
      </div>
      {photos.length > 1 && (
        <span className="absolute top-3 right-3 rounded-full bg-black/45 px-2.5 py-0.5 text-xs text-white">
          {index + 1} / {photos.length}
        </span>
      )}

      {open !== null && (
        <div className="fixed inset-0 z-50 bg-black" role="dialog" aria-modal>
          <div
            className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
            ref={(el) => {
              if (el && open !== null) el.scrollLeft = open * el.clientWidth;
            }}
          >
            {photos.map((p) => (
              <div key={p.id} className="grid h-full w-full shrink-0 snap-center place-items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="max-h-full max-w-full object-contain" />
              </div>
            ))}
          </div>
          <button
            onClick={() => setOpen(null)}
            aria-label="닫기"
            className="absolute top-[calc(12px+env(safe-area-inset-top))] right-3 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white"
          >
            <XIcon />
          </button>
        </div>
      )}
    </div>
  );
}
