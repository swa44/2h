"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, HomeIcon, ImageIcon } from "./icons";

const TABS = [
  { href: "/", label: "기록", Icon: HomeIcon },
  { href: "/calendar", label: "캘린더", Icon: CalendarIcon },
  { href: "/photos", label: "사진", Icon: ImageIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return <NavInner active={pathname} />;
}

export function NavInner({ active }: { active?: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 backdrop-blur-md pb-nav">
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {TABS.map(({ href, label, Icon }) => {
          const on = active !== undefined && (href === "/" ? active === "/" || active.startsWith("/m/") : active.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${on ? "text-accent" : "text-muted"}`}
              >
                <Icon className="h-[22px] w-[22px]" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
