const mockPush = jest.fn();

jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../hooks/useActiveGarden", () => ({ useActiveGarden: jest.fn() }));

import { fireEvent, render } from "@testing-library/react-native";
import { useActiveGarden } from "../hooks/useActiveGarden";
import { GardensList } from "../ui/GardensList";

const mockHook = useActiveGarden as jest.Mock;

const gardens = [
  { id: "1", name: "Dom", role: "owner" },
  { id: "2", name: "Balkon", role: "member" },
];

function hookState(overrides: Record<string, unknown> = {}) {
  return {
    gardens: [],
    garden: null,
    setActiveGardenId: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    ...overrides,
  };
}

afterEach(() => jest.resetAllMocks());

describe("GardensList", () => {
  test("ładowanie: nie pokazuje listy ani przycisków", async () => {
    mockHook.mockReturnValue(hookState({ isLoading: true }));
    const utils = await render(<GardensList />);

    expect(utils.queryByText("gardens.title")).toBeNull();
    expect(utils.queryByTestId("new-garden-button")).toBeNull();
  });

  test("brak ogrodów: pokazuje stan pusty i przyciski prowadzą do formularzy", async () => {
    mockHook.mockReturnValue(hookState());
    const utils = await render(<GardensList />);

    expect(utils.getByText("gardens.empty")).toBeTruthy();
    await fireEvent.press(utils.getByTestId("new-garden-button"));
    await fireEvent.press(utils.getByTestId("join-garden-button"));

    expect(mockPush).toHaveBeenCalledWith("/garden/new");
    expect(mockPush).toHaveBeenCalledWith("/garden/join");
  });

  test("lista: pokazuje nazwy ogrodów i role", async () => {
    mockHook.mockReturnValue(hookState({ gardens, garden: gardens[0] }));
    const utils = await render(<GardensList />);

    expect(utils.getByText("Dom")).toBeTruthy();
    expect(utils.getByText("Balkon")).toBeTruthy();
    expect(utils.getByText("gardens.role.owner")).toBeTruthy();
    expect(utils.getByText("gardens.role.member")).toBeTruthy();
  });

  test("dotknięcie karty ustawia ogród jako aktywny", async () => {
    const state = hookState({ gardens, garden: gardens[0] });
    mockHook.mockReturnValue(state);
    const utils = await render(<GardensList />);

    await fireEvent.press(utils.getByTestId("garden-2"));

    expect(state.setActiveGardenId).toHaveBeenCalledWith("2");
  });

  test("strzałka otwiera szczegóły ogrodu", async () => {
    mockHook.mockReturnValue(hookState({ gardens, garden: gardens[0] }));
    const utils = await render(<GardensList />);

    await fireEvent.press(utils.getByTestId("garden-details-2"));

    expect(mockPush).toHaveBeenCalledWith("/garden/2");
  });

  test("błąd: pokazuje komunikat, a przycisk ponawia pobieranie", async () => {
    const state = hookState({ isError: true });
    mockHook.mockReturnValue(state);
    const utils = await render(<GardensList />);

    expect(utils.getByText("gardens.error")).toBeTruthy();
    await fireEvent.press(utils.getByTestId("retry-button"));

    expect(state.refetch).toHaveBeenCalledTimes(1);
  });
});
