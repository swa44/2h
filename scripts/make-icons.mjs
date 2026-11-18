// 앱 아이콘 생성: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const heart = (cx, cy, s, fill) => `
  <path transform="translate(${cx - s / 2} ${cy - s / 2}) scale(${s / 24})"
    d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"
    fill="${fill}"/>`;

const svg = (size, { rounded = true, scale = 0.5 } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#e48a7c"/><stop offset="1" stop-color="#c85f55"/>
  </linearGradient></defs>
  <rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="url(#g)"/>
  ${heart(size * 0.5, size * 0.52, size * scale, "#fffaf5")}
</svg>`;

mkdirSync("public/icons", { recursive: true });
const jobs = [
  ["icon-192.png", 192, {}],
  ["icon-512.png", 512, {}],
  ["apple-touch-icon.png", 180, { rounded: false }],
  ["maskable-512.png", 512, { rounded: false, scale: 0.38 }],
];
for (const [name, size, opt] of jobs) {
  const out = `public/icons/${name}`;
  await sharp(Buffer.from(svg(size, opt))).png().toFile(out);
}
console.log("icons done");
