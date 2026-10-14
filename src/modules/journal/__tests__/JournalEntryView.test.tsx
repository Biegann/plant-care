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
jest.mock("../hooks/useJournal", () => ({ useJournalEntry: jest.fn() }));
jest.mock("../journalActions", () => ({
  deleteJournalEntryAndRefresh: jest.fn(),
}));
jest.mock("../../plants/hooks/usePlantPhotoUrl", () => ({
  usePlantPhotoUrl: jest.fn(),
}));

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import { usePlantPhotoUrl } from "../../plants/hooks/usePlantPhotoUrl";
import type { JournalEntry } from "../api/journalApi";
import { useJournalEntry } from "../hooks/useJournal";
import { deleteJournalEntryAndRefresh } from "../journalActions";
import { JournalEntryView } from "../ui/JournalEntryView";

const mockEntry = useJournalEntry as jest.Mock;
const mockDelete = deleteJournalEntryAndRefresh as jest.Mock;
const mockPhotoUrl = usePlantPhotoUrl as jest.Mock;

const entry: JournalEntry = {
  id: "j1",
  plantId: "p1",
  entryOn: "2026-10-12",
  note: "Nowy liść",
  photoPath: "g1/journal/a.jpg",
  createdByName: "Anna",
  createdAt: "2026-10-12T10:00:00Z",
};

let alertSpy: jest.SpyInstance;

async function confirmAlert() {
  const buttons = alertSpy.mock.calls[0][2] ?? [];
  const confirm = buttons.find(
    (button: { style?: string }) => button.style === "destructive",
  );
  await act(async () => {
    await confirm?.onPress?.();
  });
}

function setup(extra: Record<string, unknown> = {}) {
  mockEntry.mockReturnValue({ entry, isLoading: false, ...extra });
  return render(<JournalEntryView plantId="p1" entryId="j1" />);
}

beforeEach(() => {
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  mockPhotoUrl.mockReturnValue("https://x/a.jpg");
});

afterEach(() => {
  alertSpy.mockRestore();
  jest.resetAllMocks();
});

describe("JournalEntryView", () => {
  test("pokazuje zdjęcie, datę z autorem i notatkę", async () => {
    await setup();

    expect(mockEntry).toHaveBeenCalledWith("p1", "j1");
    expect(screen.getByTestId("journal-entry-photo")).toBeTruthy();
    expect(screen.getByTestId("journal-entry-meta").props.children).toBe(
      "12.10.2026 · Anna",
    );
    expect(screen.getByText("Nowy liść")).toBeTruthy();
  });

  test("wpis bez zdjęcia: nie rysuje miejsca na zdjęcie", async () => {
    mockPhotoUrl.mockReturnValue(null);
    await setup({ entry: { ...entry, photoPath: null } });

    expect(screen.queryByTestId("journal-entry-photo")).toBeNull();
  });

  test("ołówek otwiera edycję wpisu", async () => {
    await setup();

    await fireEvent.press(screen.getByTestId("journal-edit"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/journal/edit/[id]",
      params: { id: "j1", plantId: "p1" },
    });
  });

  test("usunięcie po potwierdzeniu: usuwa i wraca", async () => {
    mockDelete.mockResolvedValue({ ok: true, data: null });
    await setup();

    await fireEvent.press(screen.getByTestId("journal-delete"));
    await confirmAlert();

    expect(mockDelete).toHaveBeenCalledWith(entry);
    expect(mockBack).toHaveBeenCalled();
  });

  test("nieudane usunięcie: komunikat i zostaje na ekranie", async () => {
    mockDelete.mockResolvedValue({ ok: false, error: "notAllowed" });
    await setup();

    await fireEvent.press(screen.getByTestId("journal-delete"));
    await confirmAlert();

    expect(screen.getByText("journal.errors.notAllowed")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("brak wpisu: komunikat i brak ikon", async () => {
    await setup({ entry: null });

    expect(screen.getByText("journal.notFound")).toBeTruthy();
    expect(screen.queryByTestId("journal-delete")).toBeNull();
  });
});
