jest.mock("../../../shared/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  },
}));
jest.mock("../api/notificationsApi", () => ({
  listNotifiableTasks: jest.fn(),
}));
jest.mock("../scheduler", () => ({
  cancelAllScheduled: jest.fn(),
  getPermissionState: jest.fn(),
  replaceScheduled: jest.fn(),
}));
jest.mock("../store/notificationStore", () => ({
  useNotificationStore: { getState: jest.fn() },
}));

import { listNotifiableTasks } from "../api/notificationsApi";
import {
    cancelAllScheduled,
    getPermissionState,
    replaceScheduled,
} from "../scheduler";
import { useNotificationStore } from "../store/notificationStore";
import { syncNotifications } from "../sync";

const mockState = useNotificationStore.getState as jest.Mock;
const mockList = listNotifiableTasks as jest.Mock;
const mockCancel = cancelAllScheduled as jest.Mock;
const mockPermission = getPermissionState as jest.Mock;
const mockReplace = replaceScheduled as jest.Mock;

const settings = (overrides: Record<string, unknown> = {}) =>
  mockState.mockReturnValue({
    hydrated: true,
    enabled: true,
    hour: 9,
    minute: 0,
    ...overrides,
  });

const water = {
  type: "water",
  customLabel: null,
  plantName: "Monstera",
  nextDueOn: "2026-10-13",
  enabled: true,
};

// 12.10.2026 o 8:00 według czasu telefonu
const morning = new Date(2026, 9, 12, 8, 0);

beforeEach(() => {
  mockPermission.mockResolvedValue("granted");
  mockList.mockResolvedValue({ ok: true, data: [water] });
  mockReplace.mockResolvedValue(true);
  mockCancel.mockResolvedValue(true);
});

afterEach(() => jest.resetAllMocks());

describe("syncNotifications", () => {
  test("ustawienia jeszcze niewczytane: niczego nie rusza", async () => {
    settings({ hydrated: false, enabled: false });

    expect(await syncNotifications(morning)).toBe("notReady");
    expect(mockCancel).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("wyłączone: kasuje zaplanowane powiadomienia", async () => {
    settings({ enabled: false });

    expect(await syncNotifications(morning)).toBe("disabled");
    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockList).not.toHaveBeenCalled();
  });

  test("brak zgody systemu: nie planuje", async () => {
    settings();
    mockPermission.mockResolvedValue("denied");

    expect(await syncNotifications(morning)).toBe("noPermission");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("błąd pobierania zadań: zostawia poprzedni plan", async () => {
    settings();
    mockList.mockResolvedValue({ ok: false, error: "unknown" });

    expect(await syncNotifications(morning)).toBe("failed");
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockCancel).not.toHaveBeenCalled();
  });

  test("planuje powiadomienia od dnia terminu o ustawionej godzinie", async () => {
    settings({ hour: 18, minute: 30 });

    expect(await syncNotifications(morning)).toBe("scheduled");

    const [items, channelName] = mockReplace.mock.calls[0];
    expect(channelName).toBe("notifications.channelName");
    expect(items).toHaveLength(29);
    expect(items[0]).toEqual({
      title: 'notifications.title:{"count":1}',
      body: "care.types.water (Monstera)",
      date: new Date(2026, 9, 13, 18, 30),
    });
  });

  test("gdy dzisiejsza godzina już minęła, plan zaczyna się jutro", async () => {
    settings({ hour: 7, minute: 0 });
    mockList.mockResolvedValue({
      ok: true,
      data: [{ ...water, nextDueOn: "2026-10-01" }],
    });

    await syncNotifications(morning);

    const [items] = mockReplace.mock.calls[0];
    expect(items[0].date).toEqual(new Date(2026, 9, 13, 7, 0));
    expect(items).toHaveLength(30);
  });

  test("brak zadań: zapisuje pusty plan (kasuje stare powiadomienia)", async () => {
    settings();
    mockList.mockResolvedValue({ ok: true, data: [] });

    expect(await syncNotifications(morning)).toBe("scheduled");
    expect(mockReplace).toHaveBeenCalledWith([], "notifications.channelName");
  });

  test("błąd systemu przy planowaniu: zgłasza niepowodzenie", async () => {
    settings();
    mockReplace.mockResolvedValue(false);

    expect(await syncNotifications(morning)).toBe("failed");
  });
});
