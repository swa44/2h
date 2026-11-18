// 브라우저에서 사진을 리사이즈·JPEG 압축한다. (원본은 폰/클라우드에 두는 전제)
export type Compressed = { full: Blob; thumb: Blob; width: number; height: number };

async function load(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function draw(src: ImageBitmap | HTMLImageElement, maxSide: number, quality: number) {
  const w0 = "naturalWidth" in src ? src.naturalWidth : src.width;
  const h0 = "naturalHeight" in src ? src.naturalHeight : src.height;
  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  const w = Math.round(w0 * scale);
  const h = Math.round(h0 * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, w, h);
  return new Promise<{ blob: Blob; w: number; h: number }>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve({ blob: b, w, h }) : reject(new Error("이미지 변환 실패"))),
      "image/jpeg",
      quality,
    ),
  );
}

export async function compressImage(file: File): Promise<Compressed> {
  const src = await load(file);
  const full = await draw(src, 2560, 0.88);
  const thumb = await draw(src, 900, 0.8);
  if ("close" in src) src.close();
  return { full: full.blob, thumb: thumb.blob, width: full.w, height: full.h };
}
