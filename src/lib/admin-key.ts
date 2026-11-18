// 관리자 키 잠금: 서버 환경변수 ADMIN_KEY 로 /admin 접근을 막는다.
import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "twoh_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

/** 쿠키에 저장할 토큰 (키 자체는 저장하지 않고 해시만) */
export function adminToken(): string | null {
  const key = process.env.ADMIN_KEY;
  if (!key) return null;
  return createHash("sha256").update(`twoh-admin:${key}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function isAdminToken(value: string | undefined) {
  const t = adminToken();
  return Boolean(t && value && safeEqual(value, t));
}

export function isAdminKey(input: string) {
  const key = process.env.ADMIN_KEY;
  return Boolean(key && safeEqual(createHash("sha256").update(input).digest("hex"), createHash("sha256").update(key).digest("hex")));
}
