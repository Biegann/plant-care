import { isValidIsoDate } from "./validation";

const pad = (value: number) => String(value).padStart(2, "0");

// Data z kalendarza -> RRRR-MM-DD według czasu telefonu (toISOString liczy w UTC i potrafi przesunąć dzień)
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromIsoDate(value: string): Date | null {
  if (!isValidIsoDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDisplayDate(value: string): string {
  if (!isValidIsoDate(value)) return value;
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}
