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

/** 오늘 기준 공개된 기록의 마지막 날짜 (이 날짜 이하만 보임) */
export function revealCutoff(today: string, days = REVEAL_DAYS) {
  return addDays(today, -days);
}

export function isRevealed(date: string, today: string, days = REVEAL_DAYS) {
  return date <= revealCutoff(today, days);
}

/** 공개일 (만난 날 + days) */
export function revealDate(date: string, days = REVEAL_DAYS) {
  return addDays(date, days);
}
