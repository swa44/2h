import { Suspense } from "react";
import { getCalendarData } from "@/lib/data";
import { todayKST } from "@/lib/date";
import { PageHeader } from "@/components/page-header";
import { BlockSkeleton } from "@/components/skeleton";
import Calendar from "./calendar";

export default function CalendarPage() {
  return (
    <main>
      <PageHeader title="캘린더" />
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <Data />
      </Suspense>
    </main>
  );
}

async function Data() {
  const { meetings, locked, plans } = await getCalendarData();
  return <Calendar today={todayKST()} meetings={meetings} locked={locked} plans={plans} />;
}
