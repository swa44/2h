import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import { PHOTO_BUCKET } from "./supabase/env";
import type { MeetingWithPhotos, Plan, Settings } from "./types";
import { REVEAL_DAYS, computeRevealOn, isOpenOn, todayKST } from "./date";

const SIGN_TTL = 60 * 60 * 6; // 6시간

async function authed() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");
  return supabase;
}

type Supa = Awaited<ReturnType<typeof supabaseServer>>;

/** 설정 읽기. reveal_days 컬럼이 아직 없으면(마이그레이션 전) 기본값으로 동작 */
async function readSettings(supabase: Supa): Promise<Settings> {
  const full = await supabase
    .from("twoh_settings")
    .select("partner_name,start_date,reveal_days,reveal_mode")
    .maybeSingle();
  if (!full.error) {
    const d = full.data as Partial<Settings> | null;
    return {
      partner_name: d?.partner_name ?? null,
      start_date: d?.start_date ?? null,
      reveal_days: d?.reveal_days ?? REVEAL_DAYS,
      reveal_mode: d?.reveal_mode === "next_plan" ? "next_plan" : "days",
    };
  }
  // reveal_mode 컬럼이 아직 없을 때(마이그레이션 전)
  const basic = await supabase.from("twoh_settings").select("partner_name,start_date,reveal_days").maybeSingle();
  const b = basic.data as Partial<Settings> | null;
  return {
    partner_name: b?.partner_name ?? null,
    start_date: b?.start_date ?? null,
    reveal_days: b?.reveal_days ?? REVEAL_DAYS,
    reveal_mode: "days",
  };
}

/** 공개 규칙: 설정에서 고른 방식(N일 뒤 / 다음 만남 전날)으로 공개일 계산 */
async function revealRule(supabase: Supa) {
  const [settings, plans, meetings] = await Promise.all([
    readSettings(supabase),
    supabase.from("twoh_plans").select("date"),
    supabase.from("twoh_meetings").select("date"),
  ]);
  const meetDates = [...(plans.data ?? []), ...(meetings.data ?? [])].map((r: { date: string }) => r.date);
  const today = todayKST();
  const revealOn = (date: string) => computeRevealOn(date, settings.reveal_mode, settings.reveal_days, meetDates);
  return { settings, today, meetDates, revealOn, isOpen: (date: string) => isOpenOn(revealOn(date), today) };
}

async function signMany(supabase: Supa, paths: string[]) {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, SIGN_TTL);
  data?.forEach((r) => {
    if (r.path && r.signedUrl) map.set(r.path, r.signedUrl);
  });
  return map;
}

const MEETING_COLS = "id,date,title,place,mood,letter,created_at,updated_at,photos:twoh_photos(id,path,thumb_path,width,height,position)";

function sortPhotos(m: MeetingWithPhotos) {
  m.photos.sort((a, b) => a.position - b.position);
  return m;
}

export async function getSettings(): Promise<Settings> {
  return readSettings(await authed());
}

export type TimelineItem = MeetingWithPhotos & { cover: string | null };
/** 공개 전 기록: 내용은 보내지 않고 날짜만 */
/** revealOn이 null이면 "다음 약속이 잡히면 공개" */
export type LockedItem = { id: string; date: string; title: string | null; revealOn: string | null };

export async function getTimeline(): Promise<{ items: TimelineItem[]; locked: LockedItem[] }> {
  const supabase = await authed();
  const [rule, all] = await Promise.all([
    revealRule(supabase),
    supabase
      .from("twoh_meetings")
      .select(MEETING_COLS)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (all.error) throw all.error;
  const rows = all.data as MeetingWithPhotos[];
  const meetings = rows.filter((m) => rule.isOpen(m.date)).map(sortPhotos);
  const urls = await signMany(
    supabase,
    meetings.flatMap((m) => (m.photos[0] ? [m.photos[0].thumb_path] : [])),
  );
  return {
    items: meetings.map((m) => ({ ...m, cover: m.photos[0] ? urls.get(m.photos[0].thumb_path) ?? null : null })),
    // 공개 전 기록은 날짜·제목만 내보낸다
    locked: rows
      .filter((m) => !rule.isOpen(m.date))
      .map((m) => ({ id: m.id, date: m.date, title: m.title, revealOn: rule.revealOn(m.date) })),
  };
}

export type SignedPhoto = MeetingWithPhotos["photos"][number] & { url: string; thumbUrl: string };

export async function getMeeting(id: string, { includeHidden = false } = {}) {
  const supabase = await authed();
  const { data } = await supabase.from("twoh_meetings").select(MEETING_COLS).eq("id", id).maybeSingle();
  if (!data) return null;
  if (!includeHidden && !(await revealRule(supabase)).isOpen((data as MeetingWithPhotos).date)) return null;
  const m = sortPhotos(data as MeetingWithPhotos);
  const urls = await signMany(supabase, m.photos.flatMap((p) => [p.path, p.thumb_path]));
  const photos: SignedPhoto[] = m.photos.map((p) => ({
    ...p,
    url: urls.get(p.path) ?? "",
    thumbUrl: urls.get(p.thumb_path) ?? "",
  }));

  // 같은 회차 계산용: 이 기록이 몇 번째 만남인지
  const { count } = await supabase
    .from("twoh_meetings")
    .select("id", { count: "exact", head: true })
    .lte("date", m.date);

  return { ...m, photos, nth: count ?? null };
}

export async function getCalendarData() {
  const supabase = await authed();
  const [rule, meetings, plans] = await Promise.all([
    revealRule(supabase),
    supabase.from("twoh_meetings").select("id,date,title,place").order("date"),
    supabase.from("twoh_plans").select("id,date,memo").order("date"),
  ]);
  const rows = (meetings.data ?? []) as { id: string; date: string; title: string | null; place: string | null }[];
  return {
    meetings: rows.filter((m) => rule.isOpen(m.date)),
    locked: rows
      .filter((m) => !rule.isOpen(m.date))
      .map((m) => ({ id: m.id, date: m.date, title: m.title, revealOn: rule.revealOn(m.date) })) as LockedItem[],
    plans: (plans.data ?? []) as Plan[],
  };
}

export async function getNextPlan(today: string) {
  const supabase = await authed();
  const { data } = await supabase
    .from("twoh_plans")
    .select("id,date,memo")
    .gte("date", today)
    .order("date")
    .limit(1)
    .maybeSingle();
  return data as Plan | null;
}

export type GalleryPhoto = {
  id: string;
  url: string;
  thumbUrl: string;
  meeting: { id: string; date: string; title: string | null; place: string | null };
};

/** 모든 사진: 만난 날 최신순 → 같은 기록 안에서는 사진 순서대로 */
export async function getAllPhotos(): Promise<GalleryPhoto[]> {
  const supabase = await authed();
  const { data, error } = await supabase
    .from("twoh_photos")
    .select("id,path,thumb_path,position,created_at,meeting:twoh_meetings!inner(id,date,title,place)");
  if (error) throw error;
  type Row = {
    id: string;
    path: string;
    thumb_path: string;
    position: number;
    created_at: string;
    meeting: GalleryPhoto["meeting"];
  };
  const rule = await revealRule(supabase);
  const rows = (data as unknown as Row[]).filter((r) => rule.isOpen(r.meeting.date)).sort(
    (a, b) =>
      b.meeting.date.localeCompare(a.meeting.date) ||
      a.meeting.id.localeCompare(b.meeting.id) ||
      a.position - b.position,
  );
  const urls = await signMany(supabase, rows.flatMap((r) => [r.path, r.thumb_path]));
  return rows.map((r) => ({
    id: r.id,
    url: urls.get(r.path) ?? "",
    thumbUrl: urls.get(r.thumb_path) ?? "",
    meeting: r.meeting,
  }));
}

export async function getAdminData() {
  const supabase = await authed();
  const [rule, meetings, plans] = await Promise.all([
    revealRule(supabase),
    supabase
      .from("twoh_meetings")
      .select("id,date,title,place")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("twoh_plans").select("id,date,memo").order("date", { ascending: false }),
  ]);
  const rows = (meetings.data ?? []) as { id: string; date: string; title: string | null; place: string | null }[];
  return {
    settings: rule.settings,
    meetings: rows.map((m) => ({ ...m, revealOn: rule.revealOn(m.date), open: rule.isOpen(m.date) })),
    plans: (plans.data ?? []) as Plan[],
  };
}

/** 쓰기/수정 화면에서 공개일 안내용: 설정 + 약속·기록 날짜 (수정 중인 기록 제외) */
export async function getRevealContext(excludeMeetingId?: string) {
  const supabase = await authed();
  const [settings, plans, meetings] = await Promise.all([
    readSettings(supabase),
    supabase.from("twoh_plans").select("date"),
    supabase.from("twoh_meetings").select("id,date"),
  ]);
  return {
    revealMode: settings.reveal_mode,
    revealDays: settings.reveal_days,
    meetDates: [
      ...(plans.data ?? []).map((r: { date: string }) => r.date),
      ...((meetings.data ?? []) as { id: string; date: string }[]).filter((m) => m.id !== excludeMeetingId).map((m) => m.date),
    ],
  };
}
