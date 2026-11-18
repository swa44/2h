import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getMeeting, getSettings } from "@/lib/data";
import MeetingForm from "@/components/meeting-form";
import { PageHeader } from "@/components/page-header";
import { BlockSkeleton } from "@/components/skeleton";
import DeleteMeeting from "./delete-meeting";

export default function EditPage({ params }: PageProps<"/admin/m/[id]/edit">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="기록 수정" />
          <BlockSkeleton className="h-96" />
        </>
      }
    >
      <Edit params={params} />
    </Suspense>
  );
}

async function Edit({ params }: { params: PageProps<"/admin/m/[id]/edit">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [m, settings] = await Promise.all([getMeeting(id, { includeHidden: true }), getSettings()]);
  if (!m) notFound();
  return (
    <main>
      <MeetingForm
        title="기록 수정"
        back={`/m/${m.id}`}
        footer={<DeleteMeeting id={m.id} />}
        revealDays={settings.reveal_days}
        defaultDate={m.date}
        initial={{
          id: m.id,
          date: m.date,
          title: m.title,
          place: m.place,
          mood: m.mood,
          letter: m.letter,
          photos: m.photos.map((p) => ({ id: p.id, path: p.path, thumb_path: p.thumb_path, thumbUrl: p.thumbUrl })),
        }}
      />
    </main>
  );
}
