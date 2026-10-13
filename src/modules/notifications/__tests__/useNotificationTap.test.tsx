const mockRouter = {
  canDismiss: jest.fn(),
  dismissAll: jest.fn(),
  navigate: jest.fn(),
};

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("expo-notifications", () => ({
  useLastNotificationResponse: jest.fn(),
  clearLastNotificationResponseAsync: jest.fn(),
  DEFAULT_ACTION_IDENTIFIER: "domyślna",
}));

import { renderHook } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import { useNotificationTap } from "../hooks/useNotificationTap";

const mockResponse = Notifications.useLastNotificationResponse as jest.Mock;
const mockClear = Notifications.clearLastNotificationResponseAsync as jest.Mock;

const tap = { actionIdentifier: "domyślna" };

afterEach(() => jest.resetAllMocks());

describe("useNotificationTap", () => {
  test("dotknięcie powiadomienia otwiera ekran „Dziś” i jest zapominane", async () => {
    mockResponse.mockReturnValue(tap);
    mockRouter.canDismiss.mockReturnValue(false);

    await renderHook(() => useNotificationTap());

    expect(mockRouter.navigate).toHaveBeenCalledWith("/");
    expect(mockRouter.dismissAll).not.toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  test("otwarte ekrany (np. karta rośliny) są najpierw zamykane", async () => {
    mockResponse.mockReturnValue(tap);
    mockRouter.canDismiss.mockReturnValue(true);

    await renderHook(() => useNotificationTap());

    expect(mockRouter.dismissAll).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith("/");
  });

  test("bez dotknięcia nic się nie dzieje", async () => {
    mockResponse.mockReturnValue(null);

    await renderHook(() => useNotificationTap());

    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(mockClear).not.toHaveBeenCalled();
  });

  test("odpowiedź jeszcze nieznana: czeka", async () => {
    mockResponse.mockReturnValue(undefined);

    await renderHook(() => useNotificationTap());

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  test("inna akcja niż zwykłe dotknięcie jest pomijana", async () => {
    mockResponse.mockReturnValue({ actionIdentifier: "inna" });

    await renderHook(() => useNotificationTap());

    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(mockClear).not.toHaveBeenCalled();
  });
});
