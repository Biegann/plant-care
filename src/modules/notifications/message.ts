import type { NotifiableTask, PlannedNotification } from "./plan";

// Funkcja tłumacząca (i18next), przekazywana z zewnątrz, żeby treść dało się testować
type Translate = (key: string, options?: Record<string, unknown>) => string;

export type NotificationMessage = { title: string; body: string };

const taskLabel = (task: NotifiableTask, t: Translate) => {
  const name =
    task.type === "other"
      ? (task.customLabel ?? t("care.types.other"))
      : t(`care.types.${task.type}`);
  return `${name} (${task.plantName})`;
};

// Tytuł z liczbą zadań i treść z krótką listą, np. "Podlewanie (Monstera) i 2 inne"
export function buildMessage(
  planned: PlannedNotification,
  t: Translate,
): NotificationMessage {
  const list = planned.listed.map((task) => taskLabel(task, t)).join(", ");

  return {
    title: t("notifications.title", { count: planned.count }),
    body:
      planned.rest > 0
        ? t("notifications.bodyWithRest", { list, count: planned.rest })
        : list,
  };
}
