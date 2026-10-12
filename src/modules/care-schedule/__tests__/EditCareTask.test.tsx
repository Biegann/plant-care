const mockBack = jest.fn();

// Stack.Screen w teście po prostu rysuje ikonę nagłówka, żeby dało się ją dotknąć
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  Stack: {
    Screen: ({ options }: { options: { headerRight: () => unknown } }) =>
      options.headerRight(),
  },
}));
jest.mock("expo-router/react-navigation", () => ({
  useHeaderHeight: () => 0,
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));
jest.mock("../hooks/useCareTasks", () => ({ useCareTask: jest.fn() }));
jest.mock("../careActions", () => ({
  updateCareTaskAndRefresh: jest.fn(),
  deleteCareTaskAndRefresh: jest.fn(),
}));

import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { CareTask } from "../api/careApi";
import {
    deleteCareTaskAndRefresh,
    updateCareTaskAndRefresh,
} from "../careActions";
import { useCareTask } from "../hooks/useCareTasks";
import { EditCareTask } from "../ui/EditCareTask";

const mockTask = useCareTask as jest.Mock;
const mockUpdate = updateCareTaskAndRefresh as jest.Mock;
const mockDelete = deleteCareTaskAndRefresh as jest.Mock;

let alertSpy: jest.SpyInstance;

// Wywołuje przycisk potwierdzenia (destructive) z pokazanego okna Alert
async function confirmAlert() {
  const buttons = alertSpy.mock.calls[0][2] ?? [];
  const confirm = buttons.find(
    (button: { style?: string }) => button.style === "destructive",
  );
  await act(async () => {
    await confirm?.onPress?.();
  });
}

beforeEach(() => {
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

const task: CareTask = {
  id: "t1",
  plantId: "p1",
  type: "water",
  customLabel: null,
  intervalDays: 7,
  nextDueOn: "2026-10-15",
  enabled: true,
  createdAt: "2026-10-01T10:00:00Z",
};

function setup(extra: Record<string, unknown> = {}) {
  mockTask.mockReturnValue({
    gardenId: "g1",
    task,
    isLoading: false,
    ...extra,
  });
  return render(<EditCareTask taskId="t1" />);
}

afterEach(() => jest.resetAllMocks());

describe("EditCareTask", () => {
  test("zapis: aktualizuje zadanie i wraca", async () => {
    mockUpdate.mockResolvedValue({ ok: true, data: null });
    const utils = await setup();
    await fireEvent.changeText(utils.getByTestId("care-interval-input"), "10");
    await fireEvent.press(utils.getByTestId("care-form-submit"));

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith("g1", "t1", {
        type: "water",
        customLabel: "",
        intervalDays: 10,
        nextDueOn: "2026-10-15",
        enabled: true,
      }),
    );
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  test("błąd zapisu: zostaje na ekranie z komunikatem", async () => {
    mockUpdate.mockResolvedValue({ ok: false, error: "notAllowed" });
    const utils = await setup();
    await fireEvent.press(utils.getByTestId("care-form-submit"));

    expect(await utils.findByText("care.errors.notAllowed")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("brak zadania: pokazuje informację", async () => {
    const utils = await setup({ task: null });

    expect(utils.getByText("care.notFound")).toBeTruthy();
    expect(utils.queryByTestId("care-form-submit")).toBeNull();
  });

  test("w trakcie wczytywania nie pokazuje formularza", async () => {
    const utils = await setup({ task: null, isLoading: true });

    expect(utils.queryByTestId("care-form-submit")).toBeNull();
    expect(utils.queryByText("care.notFound")).toBeNull();
    expect(utils.queryByTestId("care-delete")).toBeNull();
  });

  test("ikona kosza: pyta o potwierdzenie i nie usuwa bez niego", async () => {
    const utils = await setup();
    await fireEvent.press(utils.getByTestId("care-delete"));

    expect(alertSpy.mock.calls[0][0]).toBe("care.deleteTitle");
    expect(alertSpy.mock.calls[0][1]).toContain("care.types.water");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  test("zadanie 'inne': pytanie pokazuje własną nazwę", async () => {
    const utils = await setup({
      task: { ...task, type: "other", customLabel: "Zraszanie" },
    });
    await fireEvent.press(utils.getByTestId("care-delete"));

    expect(alertSpy.mock.calls[0][1]).toContain("Zraszanie");
  });

  test("potwierdzone usunięcie: usuwa zadanie i wraca", async () => {
    mockDelete.mockResolvedValue({ ok: true, data: null });
    const utils = await setup();
    await fireEvent.press(utils.getByTestId("care-delete"));
    await confirmAlert();

    expect(mockDelete).toHaveBeenCalledWith("g1", "t1");
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  test("błąd usuwania: zostaje na ekranie z komunikatem", async () => {
    mockDelete.mockResolvedValue({ ok: false, error: "notAllowed" });
    const utils = await setup();
    await fireEvent.press(utils.getByTestId("care-delete"));
    await confirmAlert();

    expect(await utils.findByText("care.errors.notAllowed")).toBeTruthy();
    expect(utils.getByTestId("care-form-submit")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("brak zadania: nie ma kosza w nagłówku", async () => {
    const utils = await setup({ task: null });

    expect(utils.queryByTestId("care-delete")).toBeNull();
  });
});
