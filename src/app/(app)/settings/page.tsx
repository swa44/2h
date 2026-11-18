import { Suspense } from "react";
import { getSettings } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { BlockSkeleton } from "@/components/skeleton";
import SettingsForm from "./settings-form";

export default function SettingsPage() {
  return (
    <main>
      <PageHeader title="설정" />
      <Suspense fallback={<BlockSkeleton className="h-64" />}>
        <Data />
      </Suspense>
    </main>
  );
}

async function Data() {
  const s = await getSettings();
  return <SettingsForm partnerName={s.partner_name ?? ""} startDate={s.start_date ?? ""} />;
}
