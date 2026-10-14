const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../hooks/useJournal", () => ({ useJournal: jest.fn() }));
jest.mock("../../plants/hooks/usePlantPhotoUrl", () => ({
  usePlantPhotoUrl: jest.fn(),
}));

import { fireEvent, render, screen } from "@testing-library/react-native";
import { usePlantPhotoUrl } from "../../plants/hooks/usePlantPhotoUrl";
import type { JournalEntry } from "../api/journalApi";
import { useJournal } from "../hooks/useJournal";
import { JournalSection } from "../ui/JournalSection";

const mockJournal = useJournal as jest.Mock;
const mockPhotoUrl = usePlantPhotoUrl as jest.Mock;

function entry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "j1",
    plantId: "p1",
    entryOn: "2026-10-12",
    note: "Nowy liść",
    photoPath: null,
    createdByName: "Anna",
    createdAt: "2026-10-12T10:00:00Z",
    ...overrides,
  };
}

function setup(data: JournalEntry[], extra: Record<string, unknown> = {}) {
  mockJournal.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    ...extra,
  });
  return render(<JournalSection plantId="p1" />);
}

afterEach(() => jest.resetAllMocks());

describe("JournalSection", () => {
  test("pusty dziennik: komunikat, dodawanie i brak linku do całości", async () => {
    await setup([]);

    expect(mockJournal).toHaveBeenCalledWith("p1");
    expect(screen.getByText("journal.empty")).toBeTruthy();
    expect(screen.getByTestId("journal-add")).toBeTruthy();
    expect(screen.queryByTestId("journal-all")).toBeNull();
  });

  test("pokazuje najwyżej 3 wpisy z datą, autorem i notatką", async () => {
    await setup([
      entry({ id: "a" }),
      entry({ id: "b" }),
      entry({ id: "c" }),
      entry({ id: "d" }),
    ]);

    expect(screen.getByTestId("journal-row-c")).toBeTruthy();
    expect(screen.queryByTestId("journal-row-d")).toBeNull();
    expect(screen.getAllByText("12.10.2026 · Anna")).toHaveLength(3);
    expect(screen.getAllByText("Nowy liść")).toHaveLength(3);
  });

  test("wpis z samym zdjęciem: miniatura i podpis zamiast notatki", async () => {
    mockPhotoUrl.mockReturnValue("https://x/a.jpg");
    await setup([entry({ note: null, photoPath: "g1/journal/a.jpg" })]);

    expect(screen.getByTestId("journal-thumb-j1")).toBeTruthy();
    expect(screen.getByText("journal.photoOnly")).toBeTruthy();
  });

  test("wpis bez autora: sama data", async () => {
    await setup([entry({ createdByName: null })]);

    expect(screen.getByText("12.10.2026")).toBeTruthy();
  });

  test("nawigacja: dodawanie, wpis i cały dziennik", async () => {
    await setup([entry()]);

    await fireEvent.press(screen.getByTestId("journal-add"));
    await fireEvent.press(screen.getByTestId("journal-row-j1"));
    await fireEvent.press(screen.getByTestId("journal-all"));

    expect(mockPush).toHaveBeenNthCalledWith(1, {
      pathname: "/journal/new",
      params: { plantId: "p1" },
    });
    expect(mockPush).toHaveBeenNthCalledWith(2, {
      pathname: "/journal/entry/[id]",
      params: { id: "j1", plantId: "p1" },
    });
    expect(mockPush).toHaveBeenNthCalledWith(3, {
      pathname: "/journal/all/[plantId]",
      params: { plantId: "p1" },
    });
  });

  test("błąd wczytania: komunikat", async () => {
    await setup([], { data: undefined, isError: true });

    expect(screen.getByText("journal.error")).toBeTruthy();
  });
});
