const mockOpen = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@react-native-community/datetimepicker", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: object) => <View {...props} />,
    DateTimePickerAndroid: { open: (options: object) => mockOpen(options) },
  };
});
jest.mock("../scheduler", () => ({
  getPermissionState: jest.fn(),
  requestPermission: jest.fn(),
}));
jest.mock("../sync", () => ({ syncNotifications: jest.fn() }));
jest.mock("../store/notificationStore", () => ({
  useNotificationStore: jest.fn(),
}));

import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { AppState, Linking, Platform } from "react-native";
import { getPermissionState, requestPermission } from "../scheduler";
import { useNotificationStore } from "../store/notificationStore";
import { syncNotifications } from "../sync";
import { NotificationSettings } from "../ui/NotificationSettings";

const mockStore = useNotificationStore as unknown as jest.Mock;
const mockPermission = getPermissionState as jest.Mock;
const mockRequest = requestPermission as jest.Mock;
const mockSync = syncNotifications as jest.Mock;

const setEnabled = jest.fn();
const setTime = jest.fn();
const originalOS = Platform.OS;

function setup(state: Record<string, unknown> = {}) {
  mockStore.mockReturnValue({
    enabled: false,
    hour: 9,
    minute: 0,
    hydrated: true,
    setEnabled,
    setTime,
    ...state,
  });
  return render(<NotificationSettings />);
}

let listen: jest.SpyInstance;

beforeEach(() => {
  Platform.OS = "android";
  // Nasłuch powrotu do aplikacji: atrapa, którą test może wywołać ręcznie
  listen = jest
    .spyOn(AppState, "addEventListener")
    .mockReturnValue({ remove: jest.fn() } as never);
  mockPermission.mockResolvedValue("granted");
  mockRequest.mockResolvedValue("granted");
  mockSync.mockResolvedValue("scheduled");
});

afterEach(() => {
  Platform.OS = originalOS;
  jest.resetAllMocks();
  // Przywraca prawdziwe AppState i Linking po testach, które je podmieniają
  jest.restoreAllMocks();
});

describe("NotificationSettings", () => {
  test("wyłączone: przełącznik bez godziny", async () => {
    const utils = await setup();

    expect(utils.getByTestId("notifications-switch")).toBeTruthy();
    expect(utils.queryByTestId("notifications-time")).toBeNull();
  });

  test("włączone: pokazuje godzinę z zerami wiodącymi", async () => {
    const utils = await setup({ enabled: true, hour: 7, minute: 5 });

    expect(utils.getByText("07:05")).toBeTruthy();
  });

  test("włączenie: pyta o zgodę, zapisuje ustawienie i przelicza plan", async () => {
    const utils = await setup();

    await fireEvent(
      utils.getByTestId("notifications-switch"),
      "valueChange",
      true,
    );

    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(1));
    expect(mockRequest).toHaveBeenCalledWith("notifications.channelName");
    expect(setEnabled).toHaveBeenCalledWith(true);
  });

  test("odmowa zgody: zostaje wyłączone i pokazuje wskazówkę", async () => {
    mockRequest.mockResolvedValue("denied");
    const openSettings = jest
      .spyOn(Linking, "openSettings")
      .mockResolvedValue(undefined);
    const utils = await setup();

    await fireEvent(
      utils.getByTestId("notifications-switch"),
      "valueChange",
      true,
    );

    await waitFor(() =>
      expect(utils.getByText("notifications.denied")).toBeTruthy(),
    );
    expect(setEnabled).not.toHaveBeenCalled();
    expect(mockSync).not.toHaveBeenCalled();

    await fireEvent.press(utils.getByTestId("notifications-open-settings"));
    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  test("po powrocie z ustawień telefonu ze zgodą: kończy włączanie", async () => {
    mockRequest.mockResolvedValue("denied");
    const utils = await setup();

    await fireEvent(
      utils.getByTestId("notifications-switch"),
      "valueChange",
      true,
    );
    await waitFor(() => expect(listen).toHaveBeenCalledTimes(1));
    const onChange = listen.mock.calls[0][1];

    // Powrót bez zgody niczego nie zmienia
    mockPermission.mockResolvedValue("denied");
    await act(async () => {
      await onChange("active");
    });
    expect(setEnabled).not.toHaveBeenCalled();

    mockPermission.mockResolvedValue("granted");
    await act(async () => {
      await onChange("active");
    });

    expect(setEnabled).toHaveBeenCalledWith(true);
    expect(mockSync).toHaveBeenCalledTimes(1);
    expect(utils.queryByText("notifications.denied")).toBeNull();
  });

  test("wyłączenie: nie pyta o zgodę, przelicza plan (kasuje powiadomienia)", async () => {
    const utils = await setup({ enabled: true });

    await fireEvent(
      utils.getByTestId("notifications-switch"),
      "valueChange",
      false,
    );

    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(1));
    expect(mockRequest).not.toHaveBeenCalled();
    expect(setEnabled).toHaveBeenCalledWith(false);
  });

  test("zmiana godziny na Androidzie: zapisuje ją i przelicza plan", async () => {
    const utils = await setup({ enabled: true });

    await fireEvent.press(utils.getByTestId("notifications-time"));
    const options = mockOpen.mock.calls[0][0];
    expect(options.mode).toBe("time");
    await act(async () => {
      await options.onValueChange({}, new Date(2026, 9, 12, 18, 45));
    });

    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(1));
    expect(setTime).toHaveBeenCalledWith(18, 45);
  });

  test("nieudane planowanie: pokazuje komunikat", async () => {
    mockSync.mockResolvedValue("failed");
    const utils = await setup({ enabled: true });

    await fireEvent(
      utils.getByTestId("notifications-switch"),
      "valueChange",
      false,
    );

    await waitFor(() =>
      expect(utils.getByText("notifications.failed")).toBeTruthy(),
    );
  });

  test("zgoda cofnięta w telefonie: pokazuje wskazówkę po wejściu", async () => {
    mockPermission.mockResolvedValue("denied");
    const utils = await setup({ enabled: true });

    await waitFor(() =>
      expect(utils.getByText("notifications.denied")).toBeTruthy(),
    );
  });
});
