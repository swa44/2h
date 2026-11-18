import Link from "next/link";
import { Suspense } from "react";
import { getAdminData } from "@/lib/data";
import { formatDate, todayKST } from "@/lib/date";
import { PageHeader } from "@/components/page-header";
import { BlockSkeleton } from "@/components/skeleton";
import { ChevronRight, PenIcon } from "@/components/icons";
import SettingsForm from "./settings-form";
import PlanManager from "./plan-manager";

export default function AdminPage() {
  return (
    <main>
      <PageHeader title="관리" back="/" />
      <Suspense fallback={<BlockSkeleton className="h-96" />}>
        <Admin />
      </Suspense>
    </main>
  );
}

async function Admin() {
  const { settings, meetings, plans } = await getAdminData();
  return (
    <div className="space-y-8 pb-6">
      <div className="px-4">
        <Link
          href="/admin/write"
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-accent font-bold text-accent-ink shadow-lg shadow-accent/20 active:scale-[0.99]"
        >
          <PenIcon className="h-5 w-5" /> 새 기록 쓰기
        </Link>
      </div>

      <section>
        <h2 className="mb-2 px-5 text-[13px] font-bold text-muted">기록 관리 · {meetings.length}개</h2>
        {meetings.length === 0 ? (
          <p className="mx-4 rounded-2xl bg-surface px-4 py-6 text-center text-sm text-muted">아직 기록이 없어요</p>
        ) : (
          <ul className="mx-4 divide-y divide-line overflow-hidden rounded-2xl bg-surface">
            {meetings.map((m) => (
              <li key={m.id}>
                <Link href={`/admin/m/${m.id}/edit`} className="flex items-center gap-3 px-4 py-3 active:bg-line/40">
                  <span className="w-28 shrink-0 text-xs text-muted">{formatDate(m.date)}</span>
                  <span className="flex-1 truncate text-sm">{m.title || m.place || "그날의 기록"}</span>
                  <span className="text-xs text-accent">수정</span>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 px-5 text-[13px] font-bold text-muted">약속 관리</h2>
        <PlanManager plans={plans} today={todayKST()} />
      </section>

      <section>
        <h2 className="mb-2 px-5 text-[13px] font-bold text-muted">설정</h2>
        <SettingsForm partnerName={settings.partner_name ?? ""} startDate={settings.start_date ?? ""} />
      </section>
    </div>
  );
}
