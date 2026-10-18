// Generuje ikonę aplikacji i obrazki ekranu startowego z jednego znaku (kiełek).
// Uruchomienie: node scripts/generate-icons.mjs [katalog-podglądu]
// Bez argumentu zapisuje pliki do assets/images; z argumentem zapisuje tam tylko podgląd.
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const GREEN = '#2e7d32';
const GREEN_DARK = '#66bb6a';
const BG_LIGHT = '#f2f2f2';
const BG_DARK = '#121212';

// Znak w układzie 100x100, środek ramki znaku w punkcie (53, 50).
const glyph = (color) => `
  <path d="M50 88 C50 72 50 60 51 48" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
  <path d="M49 50 C50 26 66 14 88 12 C88 34 76 50 49 50 Z" fill="${color}"/>
  <path d="M49 63 C49 47 38 37 18 35 C18 53 30 63 49 63 Z" fill="${color}"/>`;

// Znak o boku `size` px, wyśrodkowany w kwadracie `canvas` px.
function placed(color, canvas, size) {
  const scale = size / 100;
  const tx = canvas / 2 - 53 * scale;
  const ty = canvas / 2 - 50 * scale;
  return `<g transform="translate(${tx} ${ty}) scale(${scale})">${glyph(color)}</g>`;
}

function svg(canvas, body, background) {
  const bg = background ? `<rect width="${canvas}" height="${canvas}" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">${bg}${body}</svg>`;
}

function png(svgText) {
  return new Resvg(svgText).render().asPng();
}

// Android przycina warstwę przednią do koła o średnicy 66/108 boku, więc znak jest mniejszy niż w icon.png.
const files = {
  'icon.png': svg(1024, placed(GREEN, 1024, 640), BG_LIGHT),
  'android-icon-foreground.png': svg(1024, placed(GREEN, 1024, 480)),
  'android-icon-monochrome.png': svg(1024, placed('#ffffff', 1024, 480)),
  'splash-icon.png': svg(512, placed(GREEN, 512, 480)),
  'splash-icon-dark.png': svg(512, placed(GREEN_DARK, 512, 480)),
  'favicon.png': svg(48, placed(GREEN, 48, 34), BG_LIGHT),
  // Ikona powiadomień na pasku stanu Androida: cała biała na przezroczystym tle, 96x96
  'notification-icon.png': svg(96, placed('#ffffff', 96, 84)),
};

const previewDir = process.argv[2];
if (previewDir) {
  // Podgląd: ikona, ikona Androida w kole, splash jasny i ciemny.
  const tile = 300;
  const parts = [
    `<rect x="0" y="0" width="${tile}" height="${tile}" fill="#ffffff"/><g transform="translate(25 25) scale(${250 / 1024})"><rect width="1024" height="1024" rx="180" fill="${BG_LIGHT}"/>${placed(GREEN, 1024, 640)}</g>`,
    `<rect x="${tile}" y="0" width="${tile}" height="${tile}" fill="#ffffff"/><g transform="translate(${tile + 25} 25) scale(${250 / 1024})"><circle cx="512" cy="512" r="512" fill="${BG_LIGHT}"/>${placed(GREEN, 1024, 480 * (1024 / 676))}</g>`,
    `<rect x="${tile * 2}" y="0" width="${tile}" height="${tile}" fill="${BG_LIGHT}"/><g transform="translate(${tile * 2 + 100} 100)">${placed(GREEN, 100, 100)}</g>`,
    `<rect x="${tile * 3}" y="0" width="${tile}" height="${tile}" fill="${BG_DARK}"/><g transform="translate(${tile * 3 + 100} 100)">${placed(GREEN_DARK, 100, 100)}</g>`,
  ];
  const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="${tile * 4}" height="${tile}">${parts.join('')}</svg>`;
  mkdirSync(previewDir, { recursive: true });
  writeFileSync(join(previewDir, 'icon-preview.png'), png(preview));
  console.log(`Podgląd: ${join(previewDir, 'icon-preview.png')}`);
} else {
  for (const [name, text] of Object.entries(files)) {
    writeFileSync(join('assets', 'images', name), png(text));
    console.log(`Zapisano assets/images/${name}`);
  }
}
