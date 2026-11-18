import { APP_NAME } from "@/lib/config";
import LoginForm from "./login-form";

export const metadata = { title: `로그인 · ${APP_NAME}` };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 pt-safe pb-safe">
      <div className="mb-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={72} height={72} className="mx-auto rounded-[22px] shadow-sm" />
        <h1 className="mt-5 font-serif text-2xl font-bold">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-muted">만날 때마다, 그날의 마음을 남겨요</p>
      </div>
      <LoginForm />
    </main>
  );
}
