import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "./icons";

export function PageHeader({ title, back, right }: { title?: ReactNode; back?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur-md pt-safe">
      <div className="flex h-13 items-center gap-1 px-2">
        {back ? (
          <Link href={back} aria-label="뒤로" className="grid h-10 w-10 place-items-center rounded-full text-ink active:bg-line">
            <ChevronLeft />
          </Link>
        ) : (
          <span className="w-2" />
        )}
        <h1 className="flex-1 truncate text-[17px] font-bold">{title}</h1>
        <div className="flex items-center gap-1 pr-2">{right}</div>
      </div>
    </header>
  );
}
