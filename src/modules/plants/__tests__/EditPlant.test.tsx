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
jest.mock("../hooks/usePlant", () => ({ usePlant: jest.fn() }));
jest.mock("../hooks/usePlantPhotoUrl", () => ({
  usePlantPhotoUrl: (path: string | null) => (path ? `signed:${path}` : null),
}));
jest.mock("../pickPhoto", () => ({ pickPhoto: jest.fn() }));
jest.mock("../plantActions", () => ({ updatePlantAndRefresh: jest.fn() }));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { Plant } from "../api/plantsApi";
import { usePlant } from "../hooks/usePlant";
import { updatePlantAndRefresh } from "../plantActions";
import { EditPlant } from "../ui/EditPlant";

const mockPlant = usePlant as jest.Mock;
const mockUpdate = updatePlantAndRefresh as jest.Mock;

const plant: Plant = {
  id: "p1",
  gardenId: "g1",
  name: "Monstera",
  speciesName: null,
  locationNote: "Salon",
  purchaseDate: null,
  notes: null,
  photoPath: "g1/a.jpg",
  createdAt: "2026-10-11T10:00:00Z",
};

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  mockPlant.mockReturnValue({ plant, isLoading: false });
});

afterEach(() => jest.resetAllMocks());

describe("EditPlant", () => {
  test("brak rośliny: pokazuje komunikat zamiast formularza", async () => {
    mockPlant.mockReturnValue({ plant: null, isLoading: false });
    const utils = await render(<EditPlant plantId="p1" />);

    expect(utils.getByText("plants.notFound")).toBeTruthy();
    expect(utils.queryByTestId("plant-form-submit")).toBeNull();
  });

  test("zmiana nazwy bez ruszania zdjęcia: zapisuje i wraca", async () => {
    mockUpdate.mockResolvedValue({
      ok: true,
      data: { id: "p1", photoFailed: false },
    });
    const utils = await render(<EditPlant plantId="p1" />);
    expect(utils.getByTestId("plant-name-input").props.value).toBe("Monstera");

    await fireEvent.changeText(utils.getByTestId("plant-name-input"), "Fikus");
    await fireEvent.press(utils.getByTestId("plant-form-submit"));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(mockUpdate).toHaveBeenCalledWith(
      plant,
      expect.objectContaining({ name: "Fikus", locationNote: "Salon" }),
      undefined,
    );
  });

  test("usunięcie zdjęcia: przekazuje je do zapisu", async () => {
    mockUpdate.mockResolvedValue({
      ok: true,
      data: { id: "p1", photoFailed: false },
    });
    const utils = await render(<EditPlant plantId="p1" />);
    await fireEvent.press(utils.getByTestId("plant-photo-field"));
    await fireEvent.press(utils.getByTestId("sheet-action-remove"));
    await fireEvent.press(utils.getByTestId("plant-form-submit"));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(mockUpdate.mock.calls[0][2]).toBe("remove");
  });

  test("zdjęcie się nie zapisało: pokazuje komunikat i wraca dopiero po OK", async () => {
    mockUpdate.mockResolvedValue({
      ok: true,
      data: { id: "p1", photoFailed: true },
    });
    const utils = await render(<EditPlant plantId="p1" />);
    await fireEvent.press(utils.getByTestId("plant-form-submit"));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    expect(mockBack).not.toHaveBeenCalled();

    alertSpy.mock.calls[0][2][0].onPress();
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("błąd zapisu: zostaje na formularzu z komunikatem", async () => {
    mockUpdate.mockResolvedValue({ ok: false, error: "notAllowed" });
    const utils = await render(<EditPlant plantId="p1" />);
    await fireEvent.press(utils.getByTestId("plant-form-submit"));

    expect(await utils.findByText("plants.errors.notAllowed")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });
});
