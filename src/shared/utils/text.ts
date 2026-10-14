// Tyle znaków nazwy rośliny mieści się w tytule ekranu, reszta to wielokropek
export const TITLE_NAME_MAX = 16;

export function shortenName(name: string, max = TITLE_NAME_MAX): string {
  const chars = Array.from(name);
  if (chars.length <= max) return name;
  return `${chars
    .slice(0, max - 1)
    .join("")
    .trimEnd()}…`;
}
