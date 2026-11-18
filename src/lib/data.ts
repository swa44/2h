import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import { PHOTO_BUCKET } from "./supabase/env";
import type { MeetingWithPhotos, Plan, Settings } from "./types";
import { REVEAL_DAYS, addDays, revealCutoff, todayKST } from "./date";

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
  const full = await supabase.from("twoh_settings").select("partner_name,start_date,reveal_days").maybeSingle();
  if (!full.error) {
    const d = full.data as Partial<Settings> | null;
    return {
      partner_name: d?.partner_name ?? null,
      start_date: d?.start_date ?? null,
      reveal_days: d?.reveal_days ?? REVEAL_DAYS,
    };
  }
  const basic = await supabase.from("twoh_settings").select("partner_name,start_date").maybeSingle();
  return {
    partner_name: basic.data?.partner_name ?? null,
    start_date: basic.data?.start_date ?? null,
    reveal_days: REVEAL_DAYS,
  };
}

/** 공개 기준일: 이 날짜 이하의 기록만 공개 */
async function cutoffFor(supabase: Supa) {
  const { reveal_days } = await readSettings(supabase);
  return revealCutoff(todayKST(), reveal_days);
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
export type LockedItem = { id: string; date: string; title: string | null; revealOn: string };

export async function getTimeline(): Promise<{ items: TimelineItem[]; locked: LockedItem[] }> {
  const supabase = await authed();
  const settings = await readSettings(supabase);
  const last = revealCutoff(todayKST(), settings.reveal_days);
  const [open, hidden] = await Promise.all([
    supabase
      .from("twoh_meetings")
      .select(MEETING_COLS)
      .lte("date", last)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("twoh_meetings").select("id,date,title").gt("date", last).order("date", { ascending: false }),
  ]);
  if (open.error) throw open.error;
  const meetings = (open.data as MeetingWithPhotos[]).map(sortPhotos);
  const urls = await signMany(
    supabase,
    meetings.flatMap((m) => (m.photos[0] ? [m.photos[0].thumb_path] : [])),
  );
  return {
    items: meetings.map((m) => ({ ...m, cover: m.photos[0] ? urls.get(m.photos[0].thumb_path) ?? null : null })),
    locked: ((hidden.data ?? []) as { id: string; date: string; title: string | null }[]).map((h) => ({
      id: h.id,
      date: h.date,
      title: h.title,
      revealOn: addDays(h.date, settings.reveal_days),
    })),
  };
}

export type SignedPhoto = MeetingWithPhotos["photos"][number] & { url: string; thumbUrl: string };

export async function getMeeting(id: string, { includeHidden = false } = {}) {
  const supabase = await authed();
  const { data } = await supabase.from("twoh_meetings").select(MEETING_COLS).eq("id", id).maybeSingle();
  if (!data) return null;
  if (!includeHidden && (data as MeetingWithPhotos).date > (await cutoffFor(supabase))) return null;
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
  const settings = await readSettings(supabase);
  const last = revealCutoff(todayKST(), settings.reveal_days);
  const [meetings, hidden, plans] = await Promise.all([
    supabase.from("twoh_meetings").select("id,date,title,place").lte("date", last).order("date"),
    supabase.from("twoh_meetings").select("id,date,title").gt("date", last).order("date"),
    supabase.from("twoh_plans").select("id,date,memo").order("date"),
  ]);
  return {
    meetings: (meetings.data ?? []) as { id: string; date: string; title: string | null; place: string | null }[],
    locked: ((hidden.data ?? []) as { id: string; date: string; title: string | null }[]).map((h) => ({
      id: h.id,
      date: h.date,
      title: h.title,
      revealOn: addDays(h.date, settings.reveal_days),
    })) as LockedItem[],
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
  const last = await cutoffFor(supabase);
  const rows = (data as unknown as Row[]).filter((r) => r.meeting.date <= last).sort(
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
  const [settings, meetings, plans] = await Promise.all([
    readSettings(supabase),
    supabase
      .from("twoh_meetings")
      .select("id,date,title,place")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("twoh_plans").select("id,date,memo").order("date", { ascending: false }),
  ]);
  return {
    settings,
    meetings: (meetings.data ?? []) as { id: string; date: string; title: string | null; place: string | null }[],
    plans: (plans.data ?? []) as Plan[],
  };
}
