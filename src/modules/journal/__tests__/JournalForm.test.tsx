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
jest.mock("../../plants/hooks/usePlantPhotoUrl", () => ({
  usePlantPhotoUrl: jest.fn(),
}));
// Pole zdjęcia zastępujemy dwoma przyciskami: "wybrano zdjęcie" i "usunięto"
jest.mock("../../plants/ui/PhotoField", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  return {
    PhotoField: (props: {
      previewUri: string | null;
      square?: boolean;
      onPicked: (photo: { uri: string; data: ArrayBuffer }) => void;
      onRemoved: () => void;
    }) => (
      <>
        <Text testID="photo-preview">{props.previewUri ?? "brak"}</Text>
        <Text testID="photo-square">{String(props.square)}</Text>
        <Pressable
          testID="photo-pick"
          onPress={() =>
            props.onPicked({ uri: "file:///nowe.jpg", data: mockBuffer })
          }
        />
        <Pressable testID="photo-remove" onPress={props.onRemoved} />
      </>
    ),
  };
});

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { usePlantPhotoUrl } from "../../plants/hooks/usePlantPhotoUrl";
import type { JournalEntry } from "../api/journalApi";
import { JournalForm } from "../ui/JournalForm";

const mockBuffer = new ArrayBuffer(4);
const mockPhotoUrl = usePlantPhotoUrl as jest.Mock;
const onSubmit = jest.fn();
const onSaved = jest.fn();

const entry: JournalEntry = {
  id: "j1",
  plantId: "p1",
  entryOn: "2026-10-12",
  note: "Nowy liść",
  photoPath: "g1/journal/a.jpg",
  createdByName: "Anna",
  createdAt: "2026-10-12T10:00:00Z",
};

beforeEach(() => {
  jest.useFakeTimers({
    now: new Date(2026, 9, 14, 12),
    doNotFake: ["nextTick", "setImmediate"],
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

describe("JournalForm", () => {
  test("nowy wpis: data dziś, zdjęcie bez kadrowania", async () => {
    await render(<JournalForm onSubmit={onSubmit} onSaved={onSaved} />);

    expect(screen.getByText("14.10.2026")).toBeTruthy();
    expect(screen.getByTestId("photo-square").props.children).toBe("false");
  });

  test("bez notatki i zdjęcia: błąd i nic nie zapisuje", async () => {
    await render(<JournalForm onSubmit={onSubmit} onSaved={onSaved} />);

    await fireEvent.press(screen.getByTestId("journal-form-submit"));

    expect(screen.getByText("journal.errors.empty")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("sama notatka: zapisuje i zgłasza sukces", async () => {
    onSubmit.mockResolvedValue({ ok: true, data: null });
    await render(<JournalForm onSubmit={onSubmit} onSaved={onSaved} />);

    await fireEvent.changeText(
      screen.getByTestId("journal-note-input"),
      "Nowy liść",
    );
    await fireEvent.press(screen.getByTestId("journal-form-submit"));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      { entryOn: "2026-10-14", note: "Nowy liść", hasPhoto: false },
      undefined,
    );
  });

  test("samo zdjęcie: wysyła wybrane dane zdjęcia", async () => {
    onSubmit.mockResolvedValue({ ok: true, data: null });
    await render(<JournalForm onSubmit={onSubmit} onSaved={onSaved} />);

    await fireEvent.press(screen.getByTestId("photo-pick"));
    await fireEvent.press(screen.getByTestId("journal-form-submit"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].hasPhoto).toBe(true);
    expect(onSubmit.mock.calls[0][1]).toBe(mockBuffer);
    expect(screen.getByTestId("photo-preview").props.children).toBe(
      "file:///nowe.jpg",
    );
  });

  test("błąd zapisu: pokazuje komunikat i nie zgłasza sukcesu", async () => {
    onSubmit.mockResolvedValue({ ok: false, error: "photoUpload" });
    await render(<JournalForm onSubmit={onSubmit} onSaved={onSaved} />);

    await fireEvent.changeText(screen.getByTestId("journal-note-input"), "x");
    await fireEvent.press(screen.getByTestId("journal-form-submit"));

    expect(await screen.findByText("journal.errors.photoUpload")).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });

  test("edycja: wypełnia pola i pokazuje zapisane zdjęcie", async () => {
    mockPhotoUrl.mockReturnValue("https://x/a.jpg");
    await render(
      <JournalForm initial={entry} onSubmit={onSubmit} onSaved={onSaved} />,
    );

    expect(screen.getByText("12.10.2026")).toBeTruthy();
    expect(screen.getByTestId("journal-note-input").props.value).toBe(
      "Nowy liść",
    );
    expect(screen.getByTestId("photo-preview").props.children).toBe(
      "https://x/a.jpg",
    );
  });

  test("edycja: usunięcie zdjęcia przy pustej notatce to pusty wpis", async () => {
    await render(
      <JournalForm initial={entry} onSubmit={onSubmit} onSaved={onSaved} />,
    );

    await fireEvent.changeText(screen.getByTestId("journal-note-input"), "");
    await fireEvent.press(screen.getByTestId("photo-remove"));
    await fireEvent.press(screen.getByTestId("journal-form-submit"));

    expect(screen.getByText("journal.errors.empty")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("edycja: usunięcie zdjęcia przy notatce wysyła remove", async () => {
    onSubmit.mockResolvedValue({ ok: true, data: null });
    await render(
      <JournalForm initial={entry} onSubmit={onSubmit} onSaved={onSaved} />,
    );

    await fireEvent.press(screen.getByTestId("photo-remove"));
    await fireEvent.press(screen.getByTestId("journal-form-submit"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][1]).toBe("remove");
  });
});
