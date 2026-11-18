import { Suspense } from "react";
import { APP_NAME } from "@/lib/config";
import UnlockForm from "./unlock-form";

export const metadata = { title: `관리자 · ${APP_NAME}` };

export default function UnlockPage({ searchParams }: PageProps<"/unlock">) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 pt-safe pb-safe">
      <div className="mb-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-[20px] bg-accent-soft text-accent">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
            <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h1 className="mt-5 font-serif text-xl font-bold">관리자 키</h1>
        <p className="mt-2 text-sm text-muted">관리 화면에 들어가려면 키를 입력해주세요</p>
      </div>
      <Suspense>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/unlock">["searchParams"] }) {
  const sp = await searchParams;
  return <UnlockForm next={typeof sp.next === "string" ? sp.next : "/admin"} />;
}
