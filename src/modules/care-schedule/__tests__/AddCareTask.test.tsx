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
jest.mock("../hooks/useCareTasks", () => ({ usePlantCareTasks: jest.fn() }));
jest.mock("../careActions", () => ({ createCareTaskAndRefresh: jest.fn() }));
jest.mock("../../plants/hooks/usePlant", () => ({ usePlant: jest.fn() }));
jest.mock("../schedule", () => ({
  ...jest.requireActual("../schedule"),
  todayIso: () => "2026-10-11",
}));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { usePlant } from "../../plants/hooks/usePlant";
import { createCareTaskAndRefresh } from "../careActions";
import { usePlantCareTasks } from "../hooks/useCareTasks";
import { AddCareTask } from "../ui/AddCareTask";

const mockTasks = usePlantCareTasks as jest.Mock;
const mockCreate = createCareTaskAndRefresh as jest.Mock;
const mockPlant = usePlant as jest.Mock;

function setup(extra: Record<string, unknown> = {}, speciesKey?: string) {
  mockPlant.mockReturnValue({
    plant: { id: "p1", speciesKey: speciesKey ?? null },
  });
  mockTasks.mockReturnValue({
    gardenId: "g1",
    tasks: [],
    isLoading: false,
    isError: false,
    ...extra,
  });
  return render(<AddCareTask plantId="p1" />);
}

afterEach(() => jest.resetAllMocks());

describe("AddCareTask", () => {
  test("zapis: tworzy zadanie dla rośliny i wraca", async () => {
    mockCreate.mockResolvedValue({ ok: true, data: "t9" });
    const utils = await setup();
    await fireEvent.press(utils.getByTestId("care-form-submit"));

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith("g1", "p1", {
        type: "water",
        customLabel: "",
        intervalDays: 7,
        nextDueOn: "2026-10-11",
        enabled: true,
      }),
    );
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  test("roślina ma już podlewanie: domyślnie proponuje nawożenie", async () => {
    mockCreate.mockResolvedValue({ ok: true, data: "t9" });
    const utils = await setup({ tasks: [{ id: "t1", type: "water" }] });
    await fireEvent.press(utils.getByTestId("care-form-submit"));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    expect(mockCreate.mock.calls[0][2]).toMatchObject({
      type: "fertilize",
      intervalDays: 30,
    });
  });

  test("roślina z gatunkiem z listy: interwały z gatunku", async () => {
    // Kaktus: podlewanie co 21 dni, nawożenie co 60
    const utils = await setup({}, "cactaceae");

    expect(utils.getByTestId("care-interval-input").props.value).toBe("21");
    await fireEvent.press(utils.getByTestId("care-type-fertilize"));
    expect(utils.getByTestId("care-interval-input").props.value).toBe("60");
  });

  test("błąd zapisu: zostaje na ekranie z komunikatem", async () => {
    mockCreate.mockResolvedValue({ ok: false, error: "notAllowed" });
    const utils = await setup();
    await fireEvent.press(utils.getByTestId("care-form-submit"));

    expect(await utils.findByText("care.errors.notAllowed")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("w trakcie wczytywania nie pokazuje formularza", async () => {
    const utils = await setup({ isLoading: true });

    expect(utils.queryByTestId("care-form-submit")).toBeNull();
  });

  test("błąd wczytywania zadań: komunikat zamiast formularza", async () => {
    const utils = await setup({ isError: true });

    expect(utils.getByText("care.error")).toBeTruthy();
    expect(utils.queryByTestId("care-form-submit")).toBeNull();
  });
});
