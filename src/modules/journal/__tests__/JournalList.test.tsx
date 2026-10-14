const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  Stack: {
    Screen: ({
      options,
    }: {
      options: { title: string; headerRight: () => unknown };
    }) => {
      const { Text } = jest.requireActual("react-native");
      return (
        <>
          <Text testID="screen-title">{options.title}</Text>
          {options.headerRight()}
        </>
      );
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
jest.mock("../hooks/useJournal", () => ({ useJournal: jest.fn() }));
jest.mock("../../plants/hooks/usePlant", () => ({ usePlant: jest.fn() }));
jest.mock("../../plants/hooks/usePlantPhotoUrl", () => ({
  usePlantPhotoUrl: jest.fn(),
}));

import { fireEvent, render, screen } from "@testing-library/react-native";
import { usePlant } from "../../plants/hooks/usePlant";
import { useJournal } from "../hooks/useJournal";
import { JournalList } from "../ui/JournalList";

const mockJournal = useJournal as jest.Mock;
const mockPlant = usePlant as jest.Mock;

const entries = ["a", "b", "c", "d"].map((id) => ({
  id,
  plantId: "p1",
  entryOn: "2026-10-12",
  note: `Wpis ${id}`,
  photoPath: null,
  createdByName: null,
  createdAt: "2026-10-12T10:00:00Z",
}));

beforeEach(() => {
  mockPlant.mockReturnValue({ plant: { id: "p1", name: "Monstera" } });
});

afterEach(() => jest.resetAllMocks());

describe("JournalList", () => {
  test("pokazuje wszystkie wpisy i nazwę rośliny w tytule", async () => {
    mockJournal.mockReturnValue({ data: entries, isLoading: false });
    await render(<JournalList plantId="p1" />);

    expect(screen.getByTestId("journal-row-d")).toBeTruthy();
    expect(screen.getByTestId("screen-title").props.children).toBe(
      'journal.titleWithName:{"name":"Monstera"}',
    );
  });

  test("plus w nagłówku otwiera nowy wpis", async () => {
    mockJournal.mockReturnValue({ data: [], isLoading: false });
    await render(<JournalList plantId="p1" />);

    expect(screen.getByText("journal.empty")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("journal-list-add"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/journal/new",
      params: { plantId: "p1" },
    });
  });

  test("błąd wczytania: komunikat", async () => {
    mockJournal.mockReturnValue({ data: undefined, isError: true });
    await render(<JournalList plantId="p1" />);

    expect(screen.getByText("journal.error")).toBeTruthy();
  });
});
