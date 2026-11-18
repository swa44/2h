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

export const MOODS = ["설렘", "행복", "편안", "고마움", "그리움", "애틋", "미안함", "벅참"] as const;
