export type Photo = {
  id: string;
  path: string;
  thumb_path: string;
  width: number | null;
  height: number | null;
  position: number;
};

export type Meeting = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string | null;
  place: string | null;
  mood: string | null;
  letter: string;
  created_at: string;
  updated_at: string;
};

export type MeetingWithPhotos = Meeting & { photos: Photo[] };

export type Plan = { id: string; date: string; memo: string | null };

export type Settings = { partner_name: string | null; start_date: string | null; reveal_days: number };

