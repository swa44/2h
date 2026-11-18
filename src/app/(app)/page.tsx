import Link from "next/link";
import { Suspense } from "react";
import { getNextPlan, getSettings, getTimeline, type TimelineItem } from "@/lib/data";
import { daysBetween, formatDate, parseYMD, todayKST } from "@/lib/date";
import { APP_NAME } from "@/lib/config";
import { josa } from "@/lib/text";
import { HeartIcon, ImageIcon, PenIcon, PinIcon } from "@/components/icons";
import { BlockSkeleton, CardSkeleton } from "@/components/skeleton";

export default function HomePage() {
  return (
    <main className="pt-safe">
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="font-serif text-xl font-bold">{APP_NAME}</h1>
      </header>
      <Suspense fallback={<><BlockSkeleton className="h-36" /><div className="h-6" /><CardSkeleton /></>}>
        <Home />
      </Suspense>
    </main>
  );
}

async function Home() {
  const [settings, timeline] = await Promise.all([getSettings(), getTimeline()]);
  const today = todayKST();
  const next = await getNextPlan(today);
  return (
    <>
      <Hero
        partner={settings.partner_name}
        start={settings.start_date}
        today={today}
        count={timeline.length}
        next={next ? { date: next.date, memo: next.memo, dday: daysBetween(today, next.date) } : null}
      />
      <Timeline items={timeline} />
    </>
  );
}

function Hero({
  partner,
  start,
  today,
  count,
  next,
}: {
  partner: string | null;
  start: string | null;
  today: string;
  count: number;
  next: { date: string; memo: string | null; dday: number } | null;
}) {
  const days = start ? daysBetween(start, today) + 1 : null;
  return (
    <section className="mx-4 rounded-3xl bg-gradient-to-br from-accent to-[#c25a50] p-5 text-white shadow-sm">
      <p className="text-sm opacity-90">{partner ? `${josa(partner, "와", "과")} 함께한 지` : "함께한 지"}</p>
      {days !== null ? (
        <p className="mt-1 font-serif text-4xl font-bold tracking-tight">
          {days.toLocaleString()}<span className="ml-1 text-2xl">일</span>
        </p>
      ) : (
        <Link href="/settings" className="mt-2 inline-block text-sm underline underline-offset-4">
          설정에서 사귄 날을 입력해주세요
        </Link>
      )}
      <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
        <span className="rounded-full bg-white/20 px-3 py-1">기록 {count}번</span>
        {next && (
          <Link href="/calendar" className="rounded-full bg-white/20 px-3 py-1">
            다음 만남 {next.dday === 0 ? "오늘!" : `D-${next.dday}`}
            {next.memo ? ` · ${next.memo}` : ""}
          </Link>
        )}
      </div>
    </section>
  );
}

function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mx-4 mt-6 rounded-3xl border border-dashed border-line px-6 py-14 text-center">
        <HeartIcon className="mx-auto h-8 w-8 text-accent" />
        <p className="mt-3 font-serif text-lg">첫 번째 기록을 남겨볼까요?</p>
        <p className="mt-1 text-sm text-muted">만난 날의 사진과 그날의 마음을 적어두세요.</p>
        <Link href="/write" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink">
          <PenIcon className="h-4 w-4" /> 기록하기
        </Link>
      </div>
    );
  }

  // 연·월로 묶기
  const groups: { key: string; label: string; items: TimelineItem[] }[] = [];
  for (const it of items) {
    const { y, m } = parseYMD(it.date);
    const key = `${y}-${m}`;
    let g = groups.at(-1);
    if (!g || g.key !== key) {
      g = { key, label: `${y}년 ${m}월`, items: [] };
      groups.push(g);
    }
    g.items.push(it);
  }

  return (
    <div className="mt-6 space-y-7">
      {groups.map((g) => (
        <section key={g.key}>
          <h2 className="mb-3 px-5 text-[13px] font-bold text-muted">{g.label}</h2>
          <ul className="space-y-4 px-4">
            {g.items.map((m) => (
              <li key={m.id}>
                <MeetingCard m={m} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MeetingCard({ m }: { m: TimelineItem }) {
  const heading = m.title || m.place || "그날의 기록";
  return (
    <Link href={`/m/${m.id}`} className="block overflow-hidden rounded-3xl bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition active:scale-[0.99]">
      {m.cover && (
        <div className="relative aspect-[4/3] bg-line/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
          {m.photos.length > 1 && (
            <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-xs text-white">
              <ImageIcon className="h-3.5 w-3.5" /> {m.photos.length}
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{formatDate(m.date)}</span>
          {m.mood && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">{m.mood}</span>}
        </div>
        <h3 className="mt-1.5 font-serif text-[17px] font-bold">{heading}</h3>
        {m.place && m.title && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <PinIcon className="h-3.5 w-3.5" /> {m.place}
          </p>
        )}
        {m.letter && <p className="mt-2 line-clamp-2 font-serif text-[14px] leading-relaxed text-ink/80">{m.letter}</p>}
      </div>
    </Link>
  );
}
