const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../hooks/useCareLog", () => ({ useCareLog: jest.fn() }));

import { fireEvent, render } from "@testing-library/react-native";
import type { CareLogEntry } from "../api/careLogApi";
import { useCareLog } from "../hooks/useCareLog";
import { CareHistorySection } from "../ui/CareHistorySection";

const mockLog = useCareLog as jest.Mock;

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

function setup(data: CareLogEntry[], extra: Record<string, unknown> = {}) {
  mockLog.mockReturnValue({ data, isLoading: false, isError: false, ...extra });
  return render(<CareHistorySection plantId="p1" />);
}

afterEach(() => jest.resetAllMocks());

describe("CareHistorySection", () => {
  test("pyta o historię właściwej rośliny", async () => {
    await setup([]);

    expect(mockLog).toHaveBeenCalledWith("p1");
  });

  test("bez wpisów: pokazuje informację", async () => {
    const utils = await setup([]);

    expect(utils.getByText("care.history.empty")).toBeTruthy();
    expect(utils.queryByTestId("care-history-all")).toBeNull();
  });

  test("link przy co najmniej jednym wpisie otwiera pełną historię", async () => {
    const utils = await setup([entry()]);

    await fireEvent.press(utils.getByTestId("care-history-all"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/care/history/[plantId]",
      params: { plantId: "p1" },
    });
  });

  test("błąd wczytywania: pokazuje komunikat", async () => {
    const utils = await setup([], { isError: true });

    expect(utils.getByText("care.history.error")).toBeTruthy();
  });

  test("wpis: rodzaj, data i osoba", async () => {
    const utils = await setup([entry()]);

    expect(utils.getByText("care.types.water")).toBeTruthy();
    expect(utils.getByTestId("care-log-meta-e1").props.children).toBe(
      "12.10.2026 · Ania",
    );
  });

  test("wpis bez nazwy osoby: sama data", async () => {
    const utils = await setup([entry({ doneByName: null })]);

    expect(utils.getByTestId("care-log-meta-e1").props.children).toBe(
      "12.10.2026",
    );
  });

  test("zadanie 'inne': pokazuje własną nazwę", async () => {
    const utils = await setup([
      entry({ type: "other", customLabel: "Zraszanie" }),
    ]);

    expect(utils.getByText("Zraszanie")).toBeTruthy();
  });

  test("pokazuje tylko 3 najnowsze wpisy", async () => {
    const utils = await setup(
      ["e1", "e2", "e3", "e4"].map((id) => entry({ id })),
    );

    expect(utils.getByTestId("care-log-e3")).toBeTruthy();
    expect(utils.queryByTestId("care-log-e4")).toBeNull();
  });
});
