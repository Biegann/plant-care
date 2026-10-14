jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("expo-router/react-navigation", () => ({
  useHeaderHeight: () => 0,
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));
jest.mock("../hooks/usePlantPhotoUrl", () => ({
  usePlantPhotoUrl: (path: string | null) => (path ? `signed:${path}` : null),
}));
jest.mock("../pickPhoto", () => ({ pickPhoto: jest.fn() }));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { Plant } from "../api/plantsApi";
import { pickPhoto } from "../pickPhoto";
import { PlantForm } from "../ui/PlantForm";

const onSubmit = jest.fn();
const onSaved = jest.fn();
const mockPick = pickPhoto as jest.Mock;
const saved = { ok: true, data: { id: "p1", photoFailed: false } };

const plant: Plant = {
  id: "p1",
  gardenId: "g1",
  name: "Monstera",
  speciesName: "Monstera deliciosa",
  speciesKey: null,
  locationNote: "Salon",
  purchaseDate: "2025-05-20",
  notes: "Podlewać rzadko",
  photoPath: null,
  createdAt: "2026-10-11T10:00:00Z",
};

const renderForm = (initial?: Plant) =>
  render(<PlantForm initial={initial} onSubmit={onSubmit} onSaved={onSaved} />);

afterEach(() => jest.resetAllMocks());

describe("PlantForm", () => {
  test("pusta nazwa: pokazuje błąd pod polem i nie zapisuje", async () => {
    const utils = await renderForm();
    await fireEvent.press(utils.getByTestId("plant-form-submit"));

    expect(utils.getByText("plants.errors.invalidName")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("poprawne dane: przekazuje wpisane wartości i zgłasza zapis", async () => {
    onSubmit.mockResolvedValue({
      ok: true,
      data: { id: "p1", photoFailed: false },
    });
    const utils = await renderForm();
    await fireEvent.changeText(utils.getByTestId("plant-name-input"), "Fikus");
    await fireEvent.changeText(
      utils.getByTestId("plant-species-input"),
      "Ficus elastica",
    );
    await fireEvent.changeText(
      utils.getByTestId("plant-location-input"),
      "Biuro",
    );
    await fireEvent.changeText(utils.getByTestId("plant-notes-input"), "Od Ani");
    await fireEvent.press(utils.getByTestId("plant-form-submit"));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          name: "Fikus",
          speciesName: "Ficus elastica",
          speciesKey: null,
          locationNote: "Biuro",
          purchaseDate: "",
          notes: "Od Ani",
        },
        undefined,
      ),
    );
    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith({ id: "p1", photoFailed: false }),
    );
  });

  test("błąd zapisu: pokazuje komunikat i nie zgłasza zapisu", async () => {
    onSubmit.mockResolvedValue({ ok: false, error: "notAllowed" });
    const utils = await renderForm();
    await fireEvent.changeText(utils.getByTestId("plant-name-input"), "Fikus");
    await fireEvent.press(utils.getByTestId("plant-form-submit"));

    expect(await utils.findByText("plants.errors.notAllowed")).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });

  test("tryb edycji: pola są wypełnione danymi rośliny", async () => {
    const utils = await renderForm(plant);

    expect(utils.getByTestId("plant-name-input").props.value).toBe("Monstera");
    expect(utils.getByTestId("plant-species-input").props.value).toBe(
      "Monstera deliciosa",
    );
    expect(utils.getByTestId("plant-location-input").props.value).toBe("Salon");
    expect(utils.getByTestId("plant-notes-input").props.value).toBe(
      "Podlewać rzadko",
    );
    expect(utils.getByText("20.05.2025")).toBeTruthy();
  });

  test("wybrane zdjęcie: pokazuje podgląd i przekazuje dane do zapisu", async () => {
    const data = new ArrayBuffer(4);
    mockPick.mockResolvedValue({
      status: "picked",
      photo: { uri: "file:///nowe.jpg", data },
    });
    onSubmit.mockResolvedValue(saved);
    const utils = await renderForm();
    await fireEvent.changeText(utils.getByTestId("plant-name-input"), "Fikus");
    await fireEvent.press(utils.getByTestId("plant-photo-field"));
    await fireEvent.press(utils.getByTestId("sheet-action-choose"));

    const preview = await utils.findByTestId("plant-photo-preview");
    expect(preview.props.source).toEqual({ uri: "file:///nowe.jpg" });

    await fireEvent.press(utils.getByTestId("plant-form-submit"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][1]).toBe(data);
  });

  test("tryb edycji: pokazuje zapisane zdjęcie, a po usunięciu zgłasza usunięcie", async () => {
    onSubmit.mockResolvedValue(saved);
    const utils = await renderForm({ ...plant, photoPath: "g1/stare.jpg" });

    expect(utils.getByTestId("plant-photo-preview").props.source).toEqual({
      uri: "signed:g1/stare.jpg",
    });

    await fireEvent.press(utils.getByTestId("plant-photo-field"));
    await fireEvent.press(utils.getByTestId("sheet-action-remove"));
    expect(utils.queryByTestId("plant-photo-preview")).toBeNull();

    await fireEvent.press(utils.getByTestId("plant-form-submit"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][1]).toBe("remove");
  });

  test("usunięcie dopiero co wybranego zdjęcia: nic nie wysyła", async () => {
    mockPick.mockResolvedValue({
      status: "picked",
      photo: { uri: "file:///nowe.jpg", data: new ArrayBuffer(4) },
    });
    onSubmit.mockResolvedValue(saved);
    const utils = await renderForm();
    await fireEvent.changeText(utils.getByTestId("plant-name-input"), "Fikus");
    await fireEvent.press(utils.getByTestId("plant-photo-field"));
    await fireEvent.press(utils.getByTestId("sheet-action-choose"));
    await utils.findByTestId("plant-photo-preview");

    await fireEvent.press(utils.getByTestId("plant-photo-field"));
    await fireEvent.press(utils.getByTestId("sheet-action-remove"));
    await fireEvent.press(utils.getByTestId("plant-form-submit"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][1]).toBeUndefined();
  });
});
