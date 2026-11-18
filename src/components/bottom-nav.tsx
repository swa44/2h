"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, GearIcon, HomeIcon, PenIcon } from "./icons";

const TABS = [
  { href: "/", label: "기록", Icon: HomeIcon },
  { href: "/calendar", label: "캘린더", Icon: CalendarIcon },
  { href: "/write", label: "쓰기", Icon: PenIcon },
  { href: "/settings", label: "설정", Icon: GearIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return <NavInner active={pathname} />;
}

export function NavInner({ active }: { active?: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 backdrop-blur-md pb-safe">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ href, label, Icon }) => {
          const on = active !== undefined && (href === "/" ? active === "/" || active.startsWith("/m/") : active.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex h-15 flex-col items-center justify-center gap-0.5 text-[11px] ${on ? "text-accent" : "text-muted"}`}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
