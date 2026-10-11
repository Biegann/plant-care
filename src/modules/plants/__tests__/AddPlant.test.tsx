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
jest.mock("../../garden/hooks/useActiveGarden", () => ({
  useActiveGarden: jest.fn(),
}));
jest.mock("../hooks/usePlantPhotoUrl", () => ({
  usePlantPhotoUrl: () => null,
}));
jest.mock("../pickPhoto", () => ({ pickPhoto: jest.fn() }));
jest.mock("../plantActions", () => ({ createPlantAndRefresh: jest.fn() }));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useActiveGarden } from "../../garden/hooks/useActiveGarden";
import { pickPhoto } from "../pickPhoto";
import { createPlantAndRefresh } from "../plantActions";
import { AddPlant } from "../ui/AddPlant";

const mockGarden = useActiveGarden as jest.Mock;
const mockCreate = createPlantAndRefresh as jest.Mock;
const mockPick = pickPhoto as jest.Mock;

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  mockGarden.mockReturnValue({
    garden: { id: "g1", name: "Dom" },
    isLoading: false,
  });
});

afterEach(() => jest.resetAllMocks());

describe("AddPlant", () => {
  test("brak ogrodu: pokazuje podpowiedź zamiast formularza", async () => {
    mockGarden.mockReturnValue({ garden: null, isLoading: false });
    const utils = await render(<AddPlant />);

    expect(utils.getByText("plants.needGarden")).toBeTruthy();
    expect(utils.queryByTestId("plant-form-submit")).toBeNull();
  });

  test("zapis bez zdjęcia: dodaje roślinę do aktywnego ogrodu i wraca do listy", async () => {
    mockCreate.mockResolvedValue({
      ok: true,
      data: { id: "p1", photoFailed: false },
    });
    const utils = await render(<AddPlant />);
    await fireEvent.changeText(utils.getByTestId("plant-name-input"), "Fikus");
    await fireEvent.press(utils.getByTestId("plant-form-submit"));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(mockCreate).toHaveBeenCalledWith(
      "g1",
      expect.objectContaining({ name: "Fikus" }),
      undefined,
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  test("zapis ze zdjęciem: przekazuje dane zdjęcia", async () => {
    const data = new ArrayBuffer(4);
    mockPick.mockResolvedValue({
      status: "picked",
      photo: { uri: "file:///a.jpg", data },
    });
    mockCreate.mockResolvedValue({
      ok: true,
      data: { id: "p1", photoFailed: false },
    });
    const utils = await render(<AddPlant />);
    await fireEvent.changeText(utils.getByTestId("plant-name-input"), "Fikus");
    await fireEvent.press(utils.getByTestId("plant-photo-field"));
    await fireEvent.press(utils.getByTestId("sheet-action-choose"));
    await utils.findByTestId("plant-photo-preview");
    await fireEvent.press(utils.getByTestId("plant-form-submit"));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(mockCreate.mock.calls[0][2]).toBe(data);
  });

  test("zdjęcie się nie wysłało: pokazuje komunikat i wraca dopiero po OK", async () => {
    mockCreate.mockResolvedValue({
      ok: true,
      data: { id: "p1", photoFailed: true },
    });
    const utils = await render(<AddPlant />);
    await fireEvent.changeText(utils.getByTestId("plant-name-input"), "Fikus");
    await fireEvent.press(utils.getByTestId("plant-form-submit"));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    expect(alertSpy.mock.calls[0][0]).toBe("plants.photo.notSavedTitle");
    expect(mockBack).not.toHaveBeenCalled();

    alertSpy.mock.calls[0][2][0].onPress();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test("błąd zapisu: zostaje na formularzu z komunikatem", async () => {
    mockCreate.mockResolvedValue({ ok: false, error: "unknown" });
    const utils = await render(<AddPlant />);
    await fireEvent.changeText(utils.getByTestId("plant-name-input"), "Fikus");
    await fireEvent.press(utils.getByTestId("plant-form-submit"));

    expect(await utils.findByText("plants.errors.unknown")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });
});
