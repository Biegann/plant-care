jest.mock("../scheduler", () => ({ cancelAllScheduled: jest.fn() }));
jest.mock("../sync", () => ({ syncNotifications: jest.fn() }));
jest.mock("../store/notificationStore", () => ({
  useNotificationStore: jest.fn(),
}));

import { renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";
import { useNotificationSync } from "../hooks/useNotificationSync";
import { cancelAllScheduled } from "../scheduler";
import { useNotificationStore } from "../store/notificationStore";
import { syncNotifications } from "../sync";

const mockStore = useNotificationStore as unknown as jest.Mock;
const mockSync = syncNotifications as jest.Mock;
const mockCancel = cancelAllScheduled as jest.Mock;

let listen: jest.SpyInstance;
const remove = jest.fn();

const hydrated = (value: boolean) =>
  mockStore.mockImplementation(
    (selector: (state: { hydrated: boolean }) => unknown) =>
      selector({ hydrated: value }),
  );

beforeEach(() => {
  hydrated(true);
  listen = jest
    .spyOn(AppState, "addEventListener")
    .mockReturnValue({ remove } as never);
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

describe("useNotificationSync", () => {
  test("zalogowany: przelicza plan przy starcie", async () => {
    await renderHook(() => useNotificationSync(true, true));

    expect(mockSync).toHaveBeenCalledTimes(1);
    expect(mockCancel).not.toHaveBeenCalled();
  });

  test("przelicza plan po każdym powrocie do aplikacji", async () => {
    await renderHook(() => useNotificationSync(true, true));
    const onChange = listen.mock.calls[0][1];

    onChange("background");
    expect(mockSync).toHaveBeenCalledTimes(1);

    onChange("active");
    expect(mockSync).toHaveBeenCalledTimes(2);
  });

  test("wylogowany: kasuje zaplanowane powiadomienia", async () => {
    await renderHook(() => useNotificationSync(true, false));

    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockSync).not.toHaveBeenCalled();
    expect(listen).not.toHaveBeenCalled();
  });

  test("czeka na sesję i na wczytanie ustawień", async () => {
    await renderHook(() => useNotificationSync(false, false));
    expect(mockCancel).not.toHaveBeenCalled();

    hydrated(false);
    await renderHook(() => useNotificationSync(true, true));
    expect(mockSync).not.toHaveBeenCalled();
  });

  test("po odmontowaniu przestaje nasłuchiwać", async () => {
    const { unmount } = await renderHook(() => useNotificationSync(true, true));

    await unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
