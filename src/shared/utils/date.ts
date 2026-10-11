export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

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
