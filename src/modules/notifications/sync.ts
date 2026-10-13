import i18n from "../../shared/i18n";
import { toIsoDate } from "../../shared/utils/date";
import { listNotifiableTasks } from "./api/notificationsApi";
import { buildMessage } from "./message";
import {
    buildNotificationPlan,
    firstPlanDay,
    notificationDate,
} from "./plan";
import {
    cancelAllScheduled,
    getPermissionState,
    replaceScheduled,
} from "./scheduler";
import { useNotificationStore } from "./store/notificationStore";

export type SyncOutcome =
  | "notReady"
  | "disabled"
  | "noPermission"
  | "scheduled"
  | "failed";

// Przelicza plan powiadomień od nowa: wołane przy starcie aplikacji,
// po zmianie zadań i po zmianie ustawień
export async function syncNotifications(now = new Date()): Promise<SyncOutcome> {
  const { hydrated, enabled, hour, minute } = useNotificationStore.getState();
  // Ustawienia jeszcze niewczytane z pamięci telefonu: niczego nie ruszamy
  if (!hydrated) return "notReady";

  if (!enabled) {
    await cancelAllScheduled();
    return "disabled";
  }
  if ((await getPermissionState()) !== "granted") return "noPermission";

  // Przy błędzie (np. brak sieci) zostaje poprzedni plan
  const tasks = await listNotifiableTasks();
  if (!tasks.ok) return "failed";

  const time = { hour, minute };
  const t = (key: string, options?: Record<string, unknown>) =>
    i18n.t(key, options);
  const today = toIsoDate(now);
  const firstDay = firstPlanDay(now, time);
  const items = buildNotificationPlan(tasks.data, firstDay).map((planned) => ({
    ...buildMessage(planned, t),
    date: notificationDate(planned.date, time),
  }));

  // Dzisiejsza godzina minęła, a na dziś nadal jest coś do zrobienia: dzisiejsze
  // powiadomienie mogło jeszcze nie dotrzeć (Android się spóźnia), więc go nie kasujemy
  const keepOverdue =
    firstDay !== today && buildNotificationPlan(tasks.data, today, 1).length > 0;
  const channelName = t("notifications.channelName");
  const saved = keepOverdue
    ? await replaceScheduled(items, channelName, now)
    : await replaceScheduled(items, channelName);
  return saved ? "scheduled" : "failed";
}
