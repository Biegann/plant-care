const mockPush = jest.fn();
const mockNavigate = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, navigate: mockNavigate }),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../garden/hooks/useActiveGarden", () => ({
  useActiveGarden: jest.fn(),
}));
jest.mock("../hooks/usePlants", () => ({ usePlants: jest.fn() }));
jest.mock("../../care-schedule/hooks/useCareTasks", () => ({
  useCareTasks: jest.fn(),
}));
jest.mock("../../care-schedule/schedule", () => ({
  ...jest.requireActual("../../care-schedule/schedule"),
  todayIso: () => "2026-10-11",
}));
jest.mock("../hooks/usePlantPhotoUrl", () => ({
  usePlantPhotoUrl: () => null,
}));

import { fireEvent, render } from "@testing-library/react-native";
import { useCareTasks } from "../../care-schedule/hooks/useCareTasks";
import { useActiveGarden } from "../../garden/hooks/useActiveGarden";
import type { Plant } from "../api/plantsApi";
import { usePlants } from "../hooks/usePlants";
import { PlantsList } from "../ui/PlantsList";

const mockGarden = useActiveGarden as jest.Mock;
const mockPlants = usePlants as jest.Mock;
const mockCare = useCareTasks as jest.Mock;

function plant(
  id: string,
  name: string,
  speciesName: string | null = null,
): Plant {
  return {
    id,
    gardenId: "g1",
    name,
    speciesName,
    speciesKey: null,
    locationNote: null,
    purchaseDate: null,
    notes: null,
    photoPath: null,
    createdAt: "2026-01-01",
  };
}

function setup(options: {
  garden?: unknown;
  gardenLoading?: boolean;
  plants?: Plant[];
  isPending?: boolean;
  isError?: boolean;
  refetch?: jest.Mock;
  careTasks?: unknown[];
}) {
  mockCare.mockReturnValue({ data: options.careTasks ?? [] });
  mockGarden.mockReturnValue({
    garden:
      "garden" in options
        ? options.garden
        : { id: "g1", name: "Dom", role: "owner" },
    isLoading: options.gardenLoading ?? false,
  });
  mockPlants.mockReturnValue({
    data: options.plants ?? [],
    isPending: options.isPending ?? false,
    isError: options.isError ?? false,
    refetch: options.refetch ?? jest.fn(),
  });
  return render(<PlantsList />);
}

afterEach(() => jest.resetAllMocks());

describe("PlantsList", () => {
  test("znacznik opieki jest tylko przy roślinach z zadaniem na dziś lub po terminie", async () => {
    const utils = await setup({
      plants: [plant("p1", "Aloes"), plant("p2", "Fikus"), plant("p3", "Hoya")],
      careTasks: [
        { plantId: "p1", nextDueOn: "2026-10-09", enabled: true },
        { plantId: "p2", nextDueOn: "2026-10-20", enabled: true },
        { plantId: "p3", nextDueOn: "2026-10-01", enabled: false },
      ],
    });

    expect(utils.getByTestId("plant-care-marker-p1")).toBeTruthy();
    expect(utils.queryByTestId("plant-care-marker-p2")).toBeNull();
    expect(utils.queryByTestId("plant-care-marker-p3")).toBeNull();
  });

  test("ładowanie ogrodu: nie pokazuje nagłówka ani przycisku dodawania", async () => {
    const utils = await setup({ gardenLoading: true });

    expect(utils.queryByText("plants.title")).toBeNull();
    expect(utils.queryByTestId("add-plant-button")).toBeNull();
  });

  test("brak ogrodu: podpowiedź i przejście do zakładki Ogrody", async () => {
    const utils = await setup({ garden: null });

    expect(utils.getByText("plants.needGarden")).toBeTruthy();
    await fireEvent.press(utils.getByTestId("go-to-gardens"));

    expect(mockNavigate).toHaveBeenCalledWith("/gardens");
  });

  test("pokazuje nazwę ogrodu i rośliny", async () => {
    const utils = await setup({
      plants: [plant("p1", "Monstera"), plant("p2", "Fikus")],
    });

    expect(utils.getByText("Dom")).toBeTruthy();
    expect(utils.getByText("Monstera")).toBeTruthy();
    expect(utils.getByText("Fikus")).toBeTruthy();
  });

  test("dotknięcie wiersza otwiera kartę rośliny", async () => {
    const utils = await setup({
      plants: [plant("p1", "Monstera"), plant("p2", "Fikus")],
    });

    await fireEvent.press(utils.getByTestId("plant-p2"));

    expect(mockPush).toHaveBeenCalledWith("/plant/p2");
  });

  test("przycisk plus otwiera formularz nowej rośliny", async () => {
    const utils = await setup({ plants: [plant("p1", "Monstera")] });

    await fireEvent.press(utils.getByTestId("add-plant-button"));

    expect(mockPush).toHaveBeenCalledWith("/plant/new");
  });

  test("pusty ogród: pokazuje komunikat i ukrywa wyszukiwarkę", async () => {
    const utils = await setup({ plants: [] });

    expect(utils.getByText("plants.empty")).toBeTruthy();
    expect(utils.queryByTestId("plant-search")).toBeNull();
  });

  test("wyszukiwarka filtruje listę", async () => {
    const utils = await setup({
      plants: [plant("p1", "Monstera"), plant("p2", "Fikus")],
    });

    await fireEvent.changeText(utils.getByTestId("plant-search"), "fik");

    expect(utils.getByText("Fikus")).toBeTruthy();
    expect(utils.queryByText("Monstera")).toBeNull();
  });

  test("wyszukiwarka bez wyników pokazuje komunikat z wpisanym tekstem", async () => {
    const utils = await setup({ plants: [plant("p1", "Monstera")] });

    await fireEvent.changeText(utils.getByTestId("plant-search"), "xyz");

    expect(utils.getByText(/plants\.noResults/)).toBeTruthy();
    expect(utils.queryByText("Monstera")).toBeNull();
  });

  test("błąd: pokazuje komunikat, a przycisk ponawia pobieranie", async () => {
    const refetch = jest.fn();
    const utils = await setup({ isError: true, refetch });

    expect(utils.getByText("plants.error")).toBeTruthy();
    await fireEvent.press(utils.getByTestId("retry-plants"));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
