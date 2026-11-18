import { Suspense } from "react";
import MeetingForm from "@/components/meeting-form";
import { PageHeader } from "@/components/page-header";
import { BlockSkeleton } from "@/components/skeleton";
import { todayKST } from "@/lib/date";

export default function WritePage({ searchParams }: PageProps<"/write">) {
  return (
    <main>
      <PageHeader title="오늘의 기록" back="/" />
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/write">["searchParams"] }) {
  const sp = await searchParams;
  const d = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayKST();
  return <MeetingForm defaultDate={d} />;
}
