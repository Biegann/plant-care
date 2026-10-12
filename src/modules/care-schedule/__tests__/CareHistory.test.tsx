const mockScreen = jest.fn();

// Stack.Screen w teście tylko zapamiętuje opcje, żeby dało się sprawdzić tytuł
jest.mock("expo-router", () => ({
  Stack: {
    Screen: (props: { options: { title: string } }) => {
      mockScreen(props.options);
      return null;
    },
  },
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../plants/hooks/usePlant", () => ({ usePlant: jest.fn() }));
jest.mock("../hooks/useCareLog", () => ({ useCareLog: jest.fn() }));
jest.mock("../careActions", () => ({
  deleteCareLogEntryAndRefresh: jest.fn(),
}));

import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { usePlant } from "../../plants/hooks/usePlant";
import type { CareLogEntry } from "../api/careLogApi";
import { deleteCareLogEntryAndRefresh } from "../careActions";
import { useCareLog } from "../hooks/useCareLog";
import { CareHistory, shortenName } from "../ui/CareHistory";

const mockPlant = usePlant as jest.Mock;
const mockLog = useCareLog as jest.Mock;
const mockDelete = deleteCareLogEntryAndRefresh as jest.Mock;

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

function entry(overrides: Partial<CareLogEntry> = {}): CareLogEntry {
  return {
    id: "e1",
    plantId: "p1",
    type: "water",
    customLabel: null,
    doneOn: "2026-10-12",
    doneByName: "Ania",
    ...overrides,
  };
}

function setup(
  data: CareLogEntry[],
  extra: Record<string, unknown> = {},
  plantName: string | null = "Monstera",
) {
  mockPlant.mockReturnValue({
    plant: plantName ? { id: "p1", name: plantName } : undefined,
    isLoading: false,
  });
  mockLog.mockReturnValue({ data, isLoading: false, isError: false, ...extra });
  return render(<CareHistory plantId="p1" />);
}

const lastTitle = () => mockScreen.mock.calls.at(-1)?.[0].title;

beforeEach(() => {
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

afterEach(() => jest.resetAllMocks());

describe("shortenName", () => {
  test("krótką nazwę zostawia bez zmian", () => {
    expect(shortenName("Monstera")).toBe("Monstera");
    expect(shortenName("1234567890123456")).toBe("1234567890123456");
  });

  test("długą nazwę ucina i dodaje wielokropek", () => {
    expect(shortenName("12345678901234567")).toBe("123456789012345…");
    expect(shortenName("Monstera deliciosa variegata")).toBe(
      "Monstera delici…",
    );
  });
});

describe("CareHistory", () => {
  test("tytuł zawiera nazwę rośliny", async () => {
    await setup([]);

    expect(lastTitle()).toBe(
      'care.history.titleWithName:{"name":"Monstera"}',
    );
  });

  test("tytuł: długa nazwa rośliny jest wykropkowana", async () => {
    await setup([], {}, "Monstera deliciosa variegata");

    expect(lastTitle()).toBe(
      'care.history.titleWithName:{"name":"Monstera delici…"}',
    );
  });

  test("tytuł bez nazwy, dopóki roślina się nie wczyta", async () => {
    await setup([], {}, null);

    expect(lastTitle()).toBe("care.history.screenTitle");
  });

  test("bez wpisów: pokazuje informację", async () => {
    const utils = await setup([]);

    expect(utils.getByText("care.history.empty")).toBeTruthy();
  });

  test("błąd wczytywania: pokazuje komunikat", async () => {
    const utils = await setup([], { isError: true });

    expect(utils.getByText("care.history.error")).toBeTruthy();
  });

  test("pokazuje wszystkie wpisy z datą i osobą", async () => {
    const utils = await setup([
      entry(),
      entry({ id: "e2", type: "other", customLabel: "Zraszanie" }),
      entry({ id: "e3", doneByName: null }),
      entry({ id: "e4" }),
    ]);

    expect(utils.getByText("Zraszanie")).toBeTruthy();
    expect(utils.getByTestId("care-history-e4")).toBeTruthy();
    expect(utils.getByTestId("care-history-meta-e1").props.children).toBe(
      "12.10.2026 · Ania",
    );
    expect(utils.getByTestId("care-history-meta-e3").props.children).toBe(
      "12.10.2026",
    );
  });

  test("kosz najpierw pyta, a anulowanie niczego nie usuwa", async () => {
    const utils = await setup([entry()]);

    await fireEvent.press(utils.getByTestId("care-history-delete-e1"));

    expect(alertSpy.mock.calls[0][0]).toBe("care.history.deleteTitle");
    expect(alertSpy.mock.calls[0][1]).toBe(
      'care.history.deleteMessage:{"name":"care.types.water","date":"12.10.2026"}',
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  test("potwierdzenie usuwa wpis", async () => {
    mockDelete.mockResolvedValue({ ok: true, data: null });
    const utils = await setup([entry()]);

    await fireEvent.press(utils.getByTestId("care-history-delete-e1"));
    await confirmAlert();

    expect(mockDelete).toHaveBeenCalledWith("p1", "e1");
  });

  test("błąd usuwania: pokazuje komunikat", async () => {
    mockDelete.mockResolvedValue({ ok: false, error: "notAllowed" });
    const utils = await setup([entry()]);

    await fireEvent.press(utils.getByTestId("care-history-delete-e1"));
    await confirmAlert();

    await waitFor(() =>
      expect(utils.getByText("care.errors.notAllowed")).toBeTruthy(),
    );
  });
});
