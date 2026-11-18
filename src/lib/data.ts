import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import { PHOTO_BUCKET } from "./supabase/env";
import type { MeetingWithPhotos, Plan, Settings } from "./types";

const SIGN_TTL = 60 * 60 * 6; // 6시간

async function authed() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");
  return supabase;
}

type Supa = Awaited<ReturnType<typeof supabaseServer>>;

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
  const supabase = await authed();
  const { data } = await supabase.from("twoh_settings").select("partner_name,start_date").maybeSingle();
  return data ?? { partner_name: null, start_date: null };
}

export type TimelineItem = MeetingWithPhotos & { cover: string | null };

export async function getTimeline(): Promise<TimelineItem[]> {
  const supabase = await authed();
  const { data, error } = await supabase
    .from("twoh_meetings")
    .select(MEETING_COLS)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const meetings = (data as MeetingWithPhotos[]).map(sortPhotos);
  const urls = await signMany(
    supabase,
    meetings.flatMap((m) => (m.photos[0] ? [m.photos[0].thumb_path] : [])),
  );
  return meetings.map((m) => ({ ...m, cover: m.photos[0] ? urls.get(m.photos[0].thumb_path) ?? null : null }));
}

export type SignedPhoto = MeetingWithPhotos["photos"][number] & { url: string; thumbUrl: string };

export async function getMeeting(id: string) {
  const supabase = await authed();
  const { data } = await supabase.from("twoh_meetings").select(MEETING_COLS).eq("id", id).maybeSingle();
  if (!data) return null;
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
  const [meetings, plans] = await Promise.all([
    supabase.from("twoh_meetings").select("id,date,title,place").order("date"),
    supabase.from("twoh_plans").select("id,date,memo").order("date"),
  ]);
  return {
    meetings: (meetings.data ?? []) as { id: string; date: string; title: string | null; place: string | null }[],
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
