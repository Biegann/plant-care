import { toIsoDate } from "../plants/date";
import type { CareType } from "./validation";

// Podpowiadany interwał przy dodawaniu zadania (można go zmienić w formularzu)
export const DEFAULT_INTERVAL_DAYS: Record<CareType, number> = {
  water: 7,
  fertilize: 30,
  repot: 365,
  other: 7,
};

export type DueStatus = "overdue" | "today" | "upcoming";

const DAY_MS = 24 * 60 * 60 * 1000;

// Liczymy na datach bez godzin (w UTC), żeby zmiana czasu nie przesuwała dni
const toUtc = (iso: string): number => {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

// Dzisiejsza data według czasu telefonu
export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDays(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

// Ile dni zostało do terminu: 0 = dziś, liczba ujemna = po terminie
export function daysUntil(dueOn: string, today: string): number {
  return Math.round((toUtc(dueOn) - toUtc(today)) / DAY_MS);
}

export function dueStatus(dueOn: string, today: string): DueStatus {
  const days = daysUntil(dueOn, today);
  if (days < 0) return "overdue";
  return days === 0 ? "today" : "upcoming";
}

// Po wykonaniu liczymy od faktycznego dnia wykonania, także gdy zadanie było spóźnione
export function nextDueAfterDone(today: string, intervalDays: number): string {
  return addDays(today, intervalDays);
}

export function nextDueAfterPostpone(today: string): string {
  return addDays(today, 1);
}

type Schedulable = { plantId: string; nextDueOn: string; enabled: boolean };

// Zadanie wymaga uwagi, gdy jest włączone i ma termin dziś lub wcześniej
export function needsCare(task: Schedulable, today: string): boolean {
  return task.enabled && daysUntil(task.nextDueOn, today) <= 0;
}

// Id roślin, które mają coś do zrobienia (do znacznika na liście roślin)
export function plantIdsNeedingCare(
  tasks: Schedulable[],
  today: string,
): Set<string> {
  return new Set(
    tasks.filter((task) => needsCare(task, today)).map((task) => task.plantId),
  );
}
