const mockBack = jest.fn();

jest.mock("expo-router", () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock("expo-router/react-navigation", () => ({
  useHeaderHeight: () => 0,
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));
jest.mock("../hooks/useCareTasks", () => ({ useCareTask: jest.fn() }));
jest.mock("../careActions", () => ({ updateCareTaskAndRefresh: jest.fn() }));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { CareTask } from "../api/careApi";
import { updateCareTaskAndRefresh } from "../careActions";
import { useCareTask } from "../hooks/useCareTasks";
import { EditCareTask } from "../ui/EditCareTask";

const mockTask = useCareTask as jest.Mock;
const mockUpdate = updateCareTaskAndRefresh as jest.Mock;

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
  });
});
