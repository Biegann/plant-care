jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 5 },
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
    cancelAllScheduled,
    CHANNEL_ID,
    getPermissionState,
    replaceScheduled,
    requestPermission,
} from "../scheduler";

const mock = Notifications as unknown as Record<string, jest.Mock>;

const item = (day: number) => ({
  title: `tytuł ${day}`,
  body: `treść ${day}`,
  date: new Date(2026, 9, day, 9, 0),
});

beforeEach(() => {
  Platform.OS = "android";
});

afterEach(() => jest.resetAllMocks());

describe("getPermissionState", () => {
  test("zgoda udzielona", async () => {
    mock.getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });

    expect(await getPermissionState()).toBe("granted");
  });

  test("jeszcze nie pytano", async () => {
    mock.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    });

    expect(await getPermissionState()).toBe("undetermined");
  });

  test("odmowa bez możliwości ponownego pytania", async () => {
    mock.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    });

    expect(await getPermissionState()).toBe("denied");
  });

  test("błąd systemu traktujemy jak brak zgody", async () => {
    mock.getPermissionsAsync.mockRejectedValue(new Error("boom"));

    expect(await getPermissionState()).toBe("denied");
  });
});

describe("requestPermission", () => {
  test("na Androidzie najpierw tworzy kanał, potem pyta o zgodę", async () => {
    const order: string[] = [];
    mock.setNotificationChannelAsync.mockImplementation(async () => {
      order.push("kanał");
    });
    mock.requestPermissionsAsync.mockImplementation(async () => {
      order.push("zgoda");
      return { granted: true, canAskAgain: true };
    });

    expect(await requestPermission("Przypomnienie")).toBe("granted");
    expect(order).toEqual(["kanał", "zgoda"]);
    expect(mock.setNotificationChannelAsync).toHaveBeenCalledWith(CHANNEL_ID, {
      name: "Przypomnienie",
      importance: 5,
    });
  });

  test("na iOS nie tworzy kanału", async () => {
    Platform.OS = "ios";
    mock.requestPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    });

    expect(await requestPermission("Przypomnienie")).toBe("denied");
    expect(mock.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

describe("replaceScheduled", () => {
  test("kasuje stary plan i planuje każdą pozycję na jej datę", async () => {
    const result = await replaceScheduled([item(12), item(13)], "Kanał");

    expect(result).toBe(true);
    expect(mock.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(mock.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(mock.scheduleNotificationAsync).toHaveBeenNthCalledWith(1, {
      content: { title: "tytuł 12", body: "treść 12" },
      trigger: { type: "date", date: item(12).date, channelId: CHANNEL_ID },
    });
  });

  test("pusty plan: tylko kasuje", async () => {
    expect(await replaceScheduled([], "Kanał")).toBe(true);
    expect(mock.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(mock.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test("błąd systemu: zwraca false zamiast rzucać", async () => {
    mock.scheduleNotificationAsync.mockRejectedValue(new Error("boom"));

    expect(await replaceScheduled([item(12)], "Kanał")).toBe(false);
  });
});

describe("cancelAllScheduled", () => {
  test("kasuje wszystkie zaplanowane powiadomienia", async () => {
    expect(await cancelAllScheduled()).toBe(true);
    expect(mock.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });

  test("błąd systemu: zwraca false", async () => {
    mock.cancelAllScheduledNotificationsAsync.mockRejectedValue(
      new Error("boom"),
    );

    expect(await cancelAllScheduled()).toBe(false);
  });
});
