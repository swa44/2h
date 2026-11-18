"use client";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/supabase/env";
import { compressImage } from "@/lib/image";
import { computeRevealOn, formatDate, isOpenOn, todayKST, type RevealMode } from "@/lib/date";
import { ImageIcon, PinIcon, XIcon } from "./icons";
import { PageHeader } from "./page-header";

type Existing = { kind: "existing"; key: string; id: string; path: string; thumb_path: string; preview: string; orig: number };
type Added = { kind: "new"; key: string; file: File; preview: string };
type Item = Existing | Added;

export type MeetingFormInitial = {
  id: string;
  date: string;
  title: string | null;
  place: string | null;
  mood: string | null;
  letter: string;
  photos: { id: string; path: string; thumb_path: string; thumbUrl: string }[];
};

const DRAFT_KEY = "twoh:draft:new-meeting";
type Draft = { date: string; title: string; place: string; mood: string | null; letter: string };

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export default function MeetingForm({
  initial,
  defaultDate,
  title: headerTitle,
  back,
  footer,
  reveal,
}: {
  initial?: MeetingFormInitial;
  defaultDate: string;
  title: string;
  back: string;
  footer?: ReactNode;
  /** 공개일 안내용: 공개 방식, N일, 약속·다른 기록 날짜 */
  reveal: { revealMode: RevealMode; revealDays: number; meetDates: string[] };
}) {
  const leavingRef = useRef(false);
  const isEdit = Boolean(initial);

  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [place, setPlace] = useState(initial?.place ?? "");
  // "그날의 마음"은 화면에서 뺐지만, 기존 값은 수정 시 그대로 유지
  const [mood, setMood] = useState<string | null>(initial?.mood ?? null);
  const [letter, setLetter] = useState(initial?.letter ?? "");
  const [items, setItems] = useState<Item[]>(
    () =>
      initial?.photos.map((p, i) => ({
        kind: "existing" as const,
        orig: i,
        key: p.id,
        id: p.id,
        path: p.path,
        thumb_path: p.thumb_path,
        preview: p.thumbUrl,
      })) ?? [],
  );
  const [removed, setRemoved] = useState<Existing[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const letterRef = useRef<HTMLTextAreaElement>(null);
  const saving = status !== null;

  // 새 글: 임시저장 불러오기
  useEffect(() => {
    if (isEdit) return;
    const d = readDraft();
    if (d && (d.letter || d.title || d.place)) {
      /* eslint-disable react-hooks/set-state-in-effect -- 마운트 시 1회 localStorage 복원 */
      setDate(d.date || defaultDate);
      setTitle(d.title);
      setPlace(d.place);
      setMood(d.mood);
      setLetter(d.letter);
      setRestored(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isEdit, defaultDate]);

  // 새 글: 입력할 때마다 임시저장
  useEffect(() => {
    if (isEdit || !dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ date, title, place, mood, letter } satisfies Draft));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [isEdit, dirty, date, title, place, mood, letter]);

  // 저장 안 하고 나가려 할 때 경고
  useEffect(() => {
    if (!dirty || saving) return;
    const h = (e: BeforeUnloadEvent) => {
      if (!leavingRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty, saving]);

  // 편지 입력창 자동 높이
  useLayoutEffect(() => {
    const el = letterRef.current;
    if (!el) return;
    // 높이를 잠깐 auto로 바꾸면 페이지가 짧아져 스크롤이 위로 튄다 → 위치를 저장했다가 복원
    const y = window.scrollY;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 280)}px`;
    if (window.scrollY !== y) window.scrollTo(0, y);
  }, [letter]);

  // 새로 고른 사진 미리보기 URL 정리
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(
    () => () => itemsRef.current.forEach((i) => i.kind === "new" && URL.revokeObjectURL(i.preview)),
    [],
  );

  const touch = () => setDirty(true);

  const revealOnOf = (d: string) => computeRevealOn(d, reveal.revealMode, reveal.revealDays, reveal.meetDates);
  function revealNote(d: string) {
    const on = revealOnOf(d);
    if (on === null) return "다음 약속이 잡히면 그 전날 공개돼요";
    return isOpenOn(on, todayKST()) ? "바로 공개돼요" : `${formatDate(on)}에 공개돼요`;
  }

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const added: Added[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name))
      .map((file) => ({ kind: "new", key: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }));
    setItems((prev) => [...prev, ...added]);
    touch();
  }

  function removeItem(key: string) {
    setItems((prev) => {
      const it = prev.find((i) => i.key === key);
      if (it?.kind === "existing") setRemoved((r) => [...r, it]);
      if (it?.kind === "new") URL.revokeObjectURL(it.preview);
      return prev.filter((i) => i.key !== key);
    });
    touch();
  }

  function makeCover(key: string) {
    setItems((prev) => {
      const it = prev.find((i) => i.key === key);
      return it ? [it, ...prev.filter((i) => i.key !== key)] : prev;
    });
    touch();
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setTitle("");
    setPlace("");
    setMood(null);
    setLetter("");
    setDate(defaultDate);
    setRestored(false);
    setDirty(false);
  }

  async function onSave() {
    if (!date) return setError("날짜를 선택해주세요.");
    if (!letter.trim() && items.length === 0) return setError("사진이나 글을 하나는 남겨주세요.");
    setError(null);
    setStatus("저장 중…");

    const supabase = supabaseBrowser();
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("로그인이 필요해요.");

      const id = initial?.id ?? crypto.randomUUID();
      const fields = {
        date,
        title: title.trim() || null,
        place: place.trim() || null,
        mood,
        letter,
      };

      const { error: mErr } = isEdit
        ? await supabase.from("twoh_meetings").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id)
        : await supabase.from("twoh_meetings").insert({ id, ...fields });
      if (mErr) throw mErr;

      // 사진 업로드
      const newItems = items.filter((i): i is Added => i.kind === "new");
      const uploaded = new Map<string, { path: string; thumb_path: string; width: number; height: number }>();
      for (const [n, it] of newItems.entries()) {
        setStatus(`사진 올리는 중 ${n + 1}/${newItems.length}`);
        const c = await compressImage(it.file);
        const name = crypto.randomUUID();
        const path = `${uid}/${id}/${name}.jpg`;
        const thumb_path = `${uid}/${id}/${name}_t.jpg`;
        const bucket = supabase.storage.from(PHOTO_BUCKET);
        const [a, b] = await Promise.all([
          bucket.upload(path, c.full, { contentType: "image/jpeg", cacheControl: "31536000" }),
          bucket.upload(thumb_path, c.thumb, { contentType: "image/jpeg", cacheControl: "31536000" }),
        ]);
        if (a.error) throw a.error;
        if (b.error) throw b.error;
        uploaded.set(it.key, { path, thumb_path, width: c.width, height: c.height });
      }

      setStatus("마무리 중…");

      // 지운 사진 정리
      if (removed.length) {
        await supabase.storage.from(PHOTO_BUCKET).remove(removed.flatMap((r) => [r.path, r.thumb_path]));
        const { error } = await supabase.from("twoh_photos").delete().in("id", removed.map((r) => r.id));
        if (error) throw error;
      }

      // 순서 반영 + 새 사진 행 추가
      const inserts = [];
      const moves = [];
      for (const [position, it] of items.entries()) {
        if (it.kind === "existing") {
          if (it.orig !== position) moves.push(supabase.from("twoh_photos").update({ position }).eq("id", it.id));
        } else {
          inserts.push({ meeting_id: id, position, ...uploaded.get(it.key)! });
        }
      }
      const results = await Promise.all([
        ...moves,
        ...(inserts.length ? [supabase.from("twoh_photos").insert(inserts)] : []),
      ]);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;

      if (!isEdit) {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
      }
      leavingRef.current = true;
      setDirty(false);
      setStatus(null);
      window.location.replace(isEdit ? "/admin" : isOpenOn(revealOnOf(date), todayKST()) ? `/m/${id}` : "/admin");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "저장하지 못했어요. 다시 시도해주세요.");
      setStatus(null);
    }
  }

  const saveLabel = status ?? (isEdit ? "수정 완료" : "기록 남기기");

  return (
    <>
      <PageHeader
        title={headerTitle}
        back={back}
        right={
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-ink disabled:opacity-70"
          >
            {status ?? "저장"}
          </button>
        }
      />
      {error && (
        <p className="sticky top-[calc(52px+env(safe-area-inset-top))] z-10 mx-4 mb-3 rounded-xl bg-accent-soft px-3 py-2 text-center text-sm text-accent">
          {error}
        </p>
      )}
    <div className="px-4 pb-8">
      {restored && (
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent">
          <span>쓰던 글을 불러왔어요</span>
          <button type="button" onClick={clearDraft} className="font-bold underline underline-offset-2">
            새로 쓰기
          </button>
        </div>
      )}

      {/* 날짜 */}
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-muted">만난 날</span>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            touch();
          }}
          className="h-12 w-full rounded-2xl border border-line bg-surface px-4 outline-none focus:border-accent"
        />
        {date && (
          <span className="mt-1.5 block px-1 text-xs text-muted">
            {revealNote(date)}
          </span>
        )}
      </label>

      {/* 제목·장소 */}
      <div className="mt-4 grid gap-3">
        <input
          placeholder="제목 (예: 첫 바다 여행)"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            touch();
          }}
          className="h-12 w-full rounded-2xl border border-line bg-surface px-4 outline-none focus:border-accent"
        />
        <div className="relative">
          <PinIcon className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            placeholder="어디서 만났나요?"
            value={place}
            onChange={(e) => {
              setPlace(e.target.value);
              touch();
            }}
            className="h-12 w-full rounded-2xl border border-line bg-surface pr-4 pl-10 outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* 사진 */}
      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[13px] font-bold text-muted">사진 {items.length > 0 && `${items.length}장`}</span>
          <span className="text-xs text-muted">1000×1000 정사각형으로 저장{items.length > 1 ? " · 누르면 대표 사진" : ""}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {items.map((it, i) => (
            <div key={it.key} className="relative aspect-square overflow-hidden rounded-2xl bg-line/50">
              <button type="button" onClick={() => makeCover(it.key)} className="h-full w-full" aria-label="대표 사진으로">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.preview} alt="" className="h-full w-full object-cover" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-ink">
                  대표
                </span>
              )}
              <button
                type="button"
                onClick={() => removeItem(it.key)}
                aria-label="사진 빼기"
                className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line bg-surface text-muted active:bg-line/40"
          >
            <ImageIcon className="h-7 w-7" />
            <span className="text-xs">사진 추가</span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* 편지 */}
      <div className="mt-6">
        <span className="mb-2 block text-[13px] font-bold text-muted">그 사람에게</span>
        <textarea
          ref={letterRef}
          value={letter}
          onChange={(e) => {
            setLetter(e.target.value);
            touch();
          }}
          placeholder={"오늘 너를 만나러 가는 길에…"}
          className="block w-full resize-none rounded-3xl border border-line bg-surface px-5 py-5 font-serif text-[16px] leading-[2] outline-none focus:border-accent"
          style={{
            backgroundImage: "repeating-linear-gradient(transparent, transparent calc(2em - 1px), var(--line) calc(2em - 1px), var(--line) 2em)",
            backgroundPositionY: "1.25rem",
            backgroundAttachment: "local",
          }}
        />
        <p className="mt-1.5 px-1 text-right text-xs text-muted">
          {letter.length.toLocaleString()}자{!isEdit && dirty ? " · 자동 임시저장 중" : ""}
        </p>
      </div>

      {/* 맨 아래 저장 버튼 (화면에 고정하지 않음 → 글을 가리지 않음) */}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="mt-6 h-13 w-full rounded-2xl bg-accent font-bold text-accent-ink transition active:scale-[0.99] disabled:opacity-70"
      >
        {saveLabel}
      </button>
      {footer && <div className="mt-6">{footer}</div>}
    </div>
    </>
  );
}
