// 모든 날짜는 'YYYY-MM-DD' 문자열로 다루고, '오늘'은 한국 시간 기준으로 계산한다.
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function todayKST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

function toUTC(ymd: string) {
  const { y, m, d } = parseYMD(ymd);
  return Date.UTC(y, m - 1, d);
}

export function weekday(ymd: string) {
  return WEEKDAYS[new Date(toUTC(ymd)).getUTCDay()];
}

export function formatDate(ymd: string) {
  const { y, m, d } = parseYMD(ymd);
  return `${y}. ${m}. ${d}. (${weekday(ymd)})`;
}

export function formatDateLong(ymd: string) {
  const { y, m, d } = parseYMD(ymd);
  return `${y}년 ${m}월 ${d}일 ${weekday(ymd)}요일`;
}

/** b - a (일) */
export function daysBetween(a: string, b: string) {
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000);
}

export function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function addDays(ymdStr: string, n: number) {
  const d = new Date(toUTC(ymdStr) + n * 86_400_000);
  return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** 기본값: 기록은 만난 날로부터 이 일수가 지나야 공개된다. (/admin 설정에서 변경) */
export const REVEAL_DAYS = 7;

export type RevealMode = "days" | "next_plan";

/**
 * 기록 공개일 (선택한 방식 하나만 적용)
 *  - "days":      만난 날 + days
 *  - "next_plan": 다음 만남(그 기록 이후 가장 가까운 약속/기록 날짜) 전날. 없으면 null(약속이 잡힐 때까지 잠김)
 * meetDates: 약속·기록 날짜들 (정렬 불필요)
 */
export function computeRevealOn(date: string, mode: RevealMode, days: number, meetDates: string[]): string | null {
  if (mode === "days") return addDays(date, days);
  let next: string | null = null;
  for (const d of meetDates) if (d > date && (next === null || d < next)) next = d;
  if (!next) return null;
  const dayBefore = addDays(next, -1);
  return dayBefore < date ? date : dayBefore;
}

export function isOpenOn(revealOn: string | null, today: string) {
  return revealOn !== null && revealOn <= today;
}
