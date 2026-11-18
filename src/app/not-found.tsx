import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-serif text-lg">찾는 기록이 없어요</p>
      <Link href="/" className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink">
        처음으로
      </Link>
    </main>
  );
}
