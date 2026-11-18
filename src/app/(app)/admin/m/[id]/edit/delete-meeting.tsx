"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/supabase/env";

export default function DeleteMeeting({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm("이 기록을 지울까요?\n사진과 글이 모두 사라지고 되돌릴 수 없어요.")) return;
    setBusy(true);
    const supabase = supabaseBrowser();
    const { data: photos } = await supabase.from("twoh_photos").select("path,thumb_path").eq("meeting_id", id);
    if (photos?.length) {
      await supabase.storage.from(PHOTO_BUCKET).remove(photos.flatMap((p: { path: string; thumb_path: string }) => [p.path, p.thumb_path]));
    }
    const { error } = await supabase.from("twoh_meetings").delete().eq("id", id);
    if (error) {
      alert("지우지 못했어요. 다시 시도해주세요.");
      setBusy(false);
      return;
    }
    setBusy(false);
    window.location.replace("/admin");
  }

  return (
    <button onClick={onDelete} disabled={busy} className="h-12 w-full rounded-2xl border border-line text-sm text-muted active:bg-line">
      {busy ? "지우는 중…" : "이 기록 삭제"}
    </button>
  );
}
