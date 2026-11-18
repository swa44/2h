import { Suspense } from "react";
import { BottomNav, NavInner } from "@/components/bottom-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="mx-auto min-h-dvh max-w-md pb-[calc(64px+env(safe-area-inset-bottom))]">{children}</div>
      <Suspense fallback={<NavInner />}>
        <BottomNav />
      </Suspense>
    </>
  );
}
