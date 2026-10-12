import { toIsoDate } from "../../shared/utils/date";
import { addDays, daysUntil } from "../care-schedule/schedule";
import type { CareType } from "../care-schedule/validation";

// Na tyle dni do przodu planujemy powiadomienia przy każdym przeliczeniu
export const PLAN_DAYS = 30;
// Tyle zadań wymieniamy z nazwy w treści, reszta to "i N innych"
export const LISTED_TASKS = 2;

export type NotifiableTask = {
  type: CareType;
  customLabel: string | null;
  plantName: string;
  nextDueOn: string;
  enabled: boolean;
};

export type PlannedNotification = {
  // Dzień powiadomienia jako RRRR-MM-DD
  date: string;
  // Liczba wszystkich zadań do zrobienia tego dnia
  count: number;
  // Pierwsze zadania do wymienienia z nazwy
  listed: NotifiableTask[];
  // Ile zadań nie zmieściło się na liście
  rest: number;
};

// Godzina codziennego powiadomienia według czasu telefonu
export type NotificationTime = { hour: number; minute: number };

// Chwila powiadomienia w danym dniu, według czasu telefonu
export function notificationDate(date: string, time: NotificationTime): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, time.hour, time.minute);
}

// Pierwszy dzień planu: dziś, a gdy dzisiejsza godzina już minęła, to jutro
export function firstPlanDay(now: Date, time: NotificationTime): string {
  const today = toIsoDate(now);
  return notificationDate(today, time).getTime() > now.getTime()
    ? today
    : addDays(today, 1);
}

// Najpierw najdłużej zaległe, potem alfabetycznie po roślinie
const byUrgency = (a: NotifiableTask, b: NotifiableTask) =>
  a.nextDueOn.localeCompare(b.nextDueOn) ||
  a.plantName.localeCompare(b.plantName);

// Plan powiadomień od dnia firstDay: po jednym na każdy dzień, w którym jest coś
// do zrobienia. Zadanie po terminie liczy się codziennie, dopóki nie zmieni terminu.
export function buildNotificationPlan(
  tasks: NotifiableTask[],
  firstDay: string,
  days = PLAN_DAYS,
): PlannedNotification[] {
  const active = tasks.filter((task) => task.enabled).sort(byUrgency);
  const plan: PlannedNotification[] = [];

  for (let offset = 0; offset < days; offset++) {
    const date = addDays(firstDay, offset);
    const due = active.filter((task) => daysUntil(task.nextDueOn, date) <= 0);
    if (due.length === 0) continue;

    plan.push({
      date,
      count: due.length,
      listed: due.slice(0, LISTED_TASKS),
      rest: Math.max(0, due.length - LISTED_TASKS),
    });
  }

  return plan;
}
