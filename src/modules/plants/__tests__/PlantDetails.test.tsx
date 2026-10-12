const mockBack = jest.fn();
const mockPush = jest.fn();

// Stack.Screen w teście po prostu rysuje ikony nagłówka, żeby dało się je dotknąć
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  Stack: {
    Screen: ({ options }: { options: { headerRight: () => unknown } }) =>
      options.headerRight(),
  },
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../care-schedule/ui/CareHistorySection", () => ({
  CareHistorySection: () => null,
}));
jest.mock("../../care-schedule/ui/CareSection", () => ({
  CareSection: () => null,
}));
jest.mock("../hooks/usePlant", () => ({ usePlant: jest.fn() }));
jest.mock("../hooks/usePlantPhotoUrl", () => ({
  usePlantPhotoUrl: (path: string | null) => (path ? `signed:${path}` : null),
}));
jest.mock("../plantActions", () => ({ deletePlantAndRefresh: jest.fn() }));

import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { Plant } from "../api/plantsApi";
import { usePlant } from "../hooks/usePlant";
import { deletePlantAndRefresh } from "../plantActions";
import { PlantDetails } from "../ui/PlantDetails";

const mockPlant = usePlant as jest.Mock;
const mockDelete = deletePlantAndRefresh as jest.Mock;

const plant: Plant = {
  id: "p1",
  gardenId: "g1",
  name: "Monstera",
  speciesName: "Monstera deliciosa",
  locationNote: "Salon",
  purchaseDate: "2025-05-20",
  notes: "Podlewać rzadko",
  photoPath: "g1/a.jpg",
  createdAt: "2026-10-11T10:00:00Z",
};

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
  mockPlant.mockReturnValue({ plant, isLoading: false });
});

afterEach(() => jest.resetAllMocks());

describe("PlantDetails", () => {
  test("pokazuje zdjęcie i wszystkie dane rośliny", async () => {
    const utils = await render(<PlantDetails plantId="p1" />);

    expect(utils.getByTestId("plant-details-photo").props.source).toEqual({
      uri: "signed:g1/a.jpg",
    });
    expect(utils.getByText("Monstera")).toBeTruthy();
    expect(utils.getByText("Monstera deliciosa")).toBeTruthy();
    expect(utils.getByText("Salon")).toBeTruthy();
    expect(utils.getByText("20.05.2025")).toBeTruthy();
    expect(utils.getByText("Podlewać rzadko")).toBeTruthy();
  });

  test("puste pola są ukryte razem z etykietami", async () => {
    mockPlant.mockReturnValue({
      plant: {
        ...plant,
        speciesName: null,
        locationNote: null,
        purchaseDate: null,
        notes: null,
        photoPath: null,
      },
      isLoading: false,
    });
    const utils = await render(<PlantDetails plantId="p1" />);

    expect(utils.getByText("Monstera")).toBeTruthy();
    expect(utils.queryByTestId("plant-details-photo")).toBeNull();
    expect(utils.queryByText("plants.form.location")).toBeNull();
    expect(utils.queryByText("plants.form.purchaseDate")).toBeNull();
    expect(utils.queryByText("plants.form.notes")).toBeNull();
  });

  test("brak rośliny: pokazuje komunikat i nie ma ikon w nagłówku", async () => {
    mockPlant.mockReturnValue({ plant: null, isLoading: false });
    const utils = await render(<PlantDetails plantId="p1" />);

    expect(utils.getByText("plants.notFound")).toBeTruthy();
    expect(utils.queryByTestId("plant-edit")).toBeNull();
    expect(utils.queryByTestId("plant-delete")).toBeNull();
  });

  test("ikona edycji: otwiera ekran edycji tej rośliny", async () => {
    const utils = await render(<PlantDetails plantId="p1" />);
    await fireEvent.press(utils.getByTestId("plant-edit"));

    expect(mockPush).toHaveBeenCalledWith("/plant/edit/p1");
  });

  test("ikona kosza: pyta o potwierdzenie i nie usuwa bez niego", async () => {
    const utils = await render(<PlantDetails plantId="p1" />);
    await fireEvent.press(utils.getByTestId("plant-delete"));

    expect(alertSpy.mock.calls[0][0]).toBe("plants.deleteTitle");
    expect(alertSpy.mock.calls[0][1]).toContain("Monstera");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  test("potwierdzone usunięcie: usuwa roślinę i wraca do listy", async () => {
    mockDelete.mockResolvedValue({ ok: true, data: null });
    const utils = await render(<PlantDetails plantId="p1" />);
    await fireEvent.press(utils.getByTestId("plant-delete"));
    await confirmAlert();

    expect(mockDelete).toHaveBeenCalledWith(plant);
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  test("błąd usuwania: zostaje na karcie z komunikatem", async () => {
    mockDelete.mockResolvedValue({ ok: false, error: "notAllowed" });
    const utils = await render(<PlantDetails plantId="p1" />);
    await fireEvent.press(utils.getByTestId("plant-delete"));
    await confirmAlert();

    expect(await utils.findByText("plants.errors.notAllowed")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });
});
