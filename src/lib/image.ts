// 브라우저에서 사진을 가운데 기준 정사각형(1000×1000) JPEG로 만든다. (원본은 폰/클라우드에 두는 전제)
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

/** 가운데 기준 정사각형으로 잘라 size×size로 그린다. */
function drawSquare(src: ImageBitmap | HTMLImageElement, size: number, quality: number) {
  const w0 = "naturalWidth" in src ? src.naturalWidth : src.width;
  const h0 = "naturalHeight" in src ? src.naturalHeight : src.height;
  const side = Math.min(w0, h0);
  const sx = (w0 - side) / 2;
  const sy = (h0 - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, sx, sy, side, side, 0, 0, size, size);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("이미지 변환 실패"))), "image/jpeg", quality),
  );
}

export const PHOTO_SIZE = 1000;
const THUMB_SIZE = 400;

export async function compressImage(file: File): Promise<Compressed> {
  const src = await load(file);
  const full = await drawSquare(src, PHOTO_SIZE, 0.88);
  const thumb = await drawSquare(src, THUMB_SIZE, 0.8);
  if ("close" in src) src.close();
  return { full, thumb, width: PHOTO_SIZE, height: PHOTO_SIZE };
}
