import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { NotificationMessage } from "./message";

// Kanał Androida dla codziennego przypomnienia (użytkownik widzi go w ustawieniach systemu)
export const CHANNEL_ID = "daily-care";

export type PermissionState = "granted" | "denied" | "undetermined";

export type ScheduledItem = NotificationMessage & { date: Date };

// Bez tego powiadomienie nie pokaże się, gdy aplikacja jest otwarta
export function initNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Na Androidzie 13+ kanał musi istnieć, zanim system zapyta o zgodę
async function ensureChannel(channelName: string) {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: channelName,
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// Błędy systemu nie przerywają aplikacji, ale w trybie deweloperskim widać je w terminalu
const report = (where: string, error: unknown) => {
  if (__DEV__) console.warn(`[powiadomienia] ${where}:`, error);
};

const toState = (status: { granted: boolean; canAskAgain: boolean }) =>
  status.granted ? "granted" : status.canAskAgain ? "undetermined" : "denied";

export async function getPermissionState(): Promise<PermissionState> {
  try {
    return toState(await Notifications.getPermissionsAsync());
  } catch (error) {
    report("sprawdzenie zgody", error);
    return "denied";
  }
}

// Pokazuje systemowe pytanie o zgodę (o ile system jeszcze na to pozwala)
export async function requestPermission(
  channelName: string,
): Promise<PermissionState> {
  try {
    await ensureChannel(channelName);
    return toState(await Notifications.requestPermissionsAsync());
  } catch (error) {
    report("prośba o zgodę", error);
    return "denied";
  }
}

export async function cancelAllScheduled(): Promise<boolean> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    report("kasowanie", error);
    return false;
  }
}

// Kasuje tylko powiadomienia na później niż `since`. Te, których godzina już minęła,
// zostają: Android dostarcza je z kilkuminutowym opóźnieniem
async function cancelLaterThan(since: Date) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const { identifier, trigger } of all) {
    const time = (trigger as { value?: unknown } | null)?.value;
    // Nieznany format terminu: kasujemy, żeby nie zostawić śmieci
    if (typeof time === "number" && time <= since.getTime()) continue;
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }
}

// Zastępuje dotychczasowy plan nowym. Z `keepOverdueAt` zostawia powiadomienia,
// których godzina minęła przed tą chwilą, a które jeszcze nie dotarły
export async function replaceScheduled(
  items: ScheduledItem[],
  channelName: string,
  keepOverdueAt?: Date,
): Promise<boolean> {
  try {
    await ensureChannel(channelName);
    if (keepOverdueAt) await cancelLaterThan(keepOverdueAt);
    else await Notifications.cancelAllScheduledNotificationsAsync();
    for (const item of items) {
      await Notifications.scheduleNotificationAsync({
        content: { title: item.title, body: item.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.date,
          channelId: CHANNEL_ID,
        },
      });
    }
    return true;
  } catch (error) {
    report("planowanie", error);
    return false;
  }
}
