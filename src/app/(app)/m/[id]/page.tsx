import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getMeeting } from "@/lib/data";
import { formatDateLong } from "@/lib/date";
import { PageHeader } from "@/components/page-header";
import { BlockSkeleton } from "@/components/skeleton";
import { PinIcon } from "@/components/icons";
import PhotoCarousel from "@/components/photo-carousel";

export default function MeetingPage({ params }: PageProps<"/m/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader back="/" />
          <BlockSkeleton className="aspect-[4/5]" />
        </>
      }
    >
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: PageProps<"/m/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const m = await getMeeting(id);
  if (!m) notFound();

  return (
    <main>
      <PageHeader
        back="/"
        right={
          <Link href={`/admin/m/${m.id}/edit`} className="rounded-full px-3 py-1.5 text-sm font-bold text-accent active:bg-accent-soft">
            수정
          </Link>
        }
      />

      {m.photos.length > 0 && <PhotoCarousel photos={m.photos.map((p) => ({ id: p.id, url: p.url, thumbUrl: p.thumbUrl, w: p.width, h: p.height }))} />}

      <article className="px-5 pt-5">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
          <span>{formatDateLong(m.date)}</span>
          {m.nth && <span>· {m.nth}번째 기록</span>}
          {m.mood && <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-accent">{m.mood}</span>}
        </div>
        {m.title && <h1 className="mt-2 font-serif text-2xl leading-snug font-bold">{m.title}</h1>}
        {m.place && (
          <p className="mt-1.5 flex items-center gap-1 text-sm text-muted">
            <PinIcon className="h-4 w-4" /> {m.place}
          </p>
        )}

        {m.letter && (
          <div className="mt-6 rounded-3xl bg-surface px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <p className="font-serif text-[16px] leading-[2] break-keep whitespace-pre-wrap">{m.letter}</p>
          </div>
        )}
        <div className="h-8" />
      </article>
    </main>
  );
}
