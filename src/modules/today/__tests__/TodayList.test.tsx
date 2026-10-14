const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("../../care-schedule/careActions", () => ({
  completeCareTaskAndRefresh: jest.fn(),
  postponeCareTaskAndRefresh: jest.fn(),
}));
jest.mock("../../garden/store/gardenStore", () => ({
  useGardenStore: { getState: jest.fn() },
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../hooks/useTodayTasks", () => ({ useTodayTasks: jest.fn() }));
jest.mock("../../garden/hooks/useGardens", () => ({ useGardens: jest.fn() }));
jest.mock("../../care-schedule/schedule", () => ({
  ...jest.requireActual("../../care-schedule/schedule"),
  todayIso: () => "2026-10-14",
}));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";
import {
    completeCareTaskAndRefresh,
    postponeCareTaskAndRefresh,
} from "../../care-schedule/careActions";
import { useGardens } from "../../garden/hooks/useGardens";
import { useGardenStore } from "../../garden/store/gardenStore";
import type { TodayTask } from "../api/todayApi";
import { useTodayTasks } from "../hooks/useTodayTasks";
import { TodayList } from "../ui/TodayList";

const mockTasks = useTodayTasks as jest.Mock;
const mockFocus = useFocusEffect as jest.Mock;
const mockComplete = completeCareTaskAndRefresh as jest.Mock;
const mockPostpone = postponeCareTaskAndRefresh as jest.Mock;
const mockStore = useGardenStore.getState as jest.Mock;
const mockSetActive = jest.fn();
const mockGardens = useGardens as jest.Mock;

const item = (
  id: string,
  nextDueOn: string,
  plantName: string,
  gardenId = "g1",
  gardenName = "Dom",
  type = "water",
  customLabel: string | null = null,
) =>
  ({
    task: { id, type, customLabel, nextDueOn, plantId: "p1", enabled: true },
    plantName,
    gardenId,
    gardenName,
  }) as TodayTask;

function setup(options: {
  data?: TodayTask[];
  isPending?: boolean;
  isError?: boolean;
  refetch?: jest.Mock;
}) {
  mockTasks.mockReturnValue({
    data: options.data,
    isPending: options.isPending ?? false,
    isError: options.isError ?? false,
    refetch: options.refetch ?? jest.fn(),
  });
}

let listen: jest.SpyInstance;

beforeEach(() => {
  listen = jest
    .spyOn(AppState, "addEventListener")
    .mockReturnValue({ remove: jest.fn() } as never);
  mockStore.mockReturnValue({ setActiveGardenId: mockSetActive });
  mockGardens.mockReturnValue({ data: [{ id: "g1", name: "Dom" }] });
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

describe("TodayList", () => {
  test("pokazuje zadania z rośliną i opisem terminu oraz ich liczbę", async () => {
    setup({
      data: [
        item("t1", "2026-10-14", "Monstera"),
        item("t2", "2026-10-12", "Fikus", "g1", "Dom", "other", "Zraszanie"),
      ],
    });

    const screen = await render(<TodayList />);

    expect(screen.getByTestId("today-count").props.children).toBe(
      'today.count:{"count":2}',
    );
    expect(screen.getByText(/care\.types\.water/)).toBeTruthy();
    expect(screen.getByText(/Zraszanie/)).toBeTruthy();
    expect(screen.getByText(/Monstera/)).toBeTruthy();
    expect(screen.getByTestId("today-task-due-t1").props.children).toBe(
      "care.due.today",
    );
    expect(screen.getByTestId("today-task-due-t2").props.children).toBe(
      'care.due.overdueMany:{"count":2}',
    );
  });

  test("zadania z jednego ogrodu: bez nagłówka ogrodu", async () => {
    setup({ data: [item("t1", "2026-10-14", "Monstera")] });

    const screen = await render(<TodayList />);

    expect(screen.queryByTestId("today-garden-g1")).toBeNull();
  });

  test("zadania z kilku ogrodów: nagłówek przy każdym ogrodzie", async () => {
    setup({
      data: [
        item("t1", "2026-10-14", "Monstera", "g1", "Dom"),
        item("t2", "2026-10-14", "Pelargonia", "g2", "Balkon"),
      ],
    });

    const screen = await render(<TodayList />);

    expect(screen.getByTestId("today-garden-g1").props.children).toBe("Dom");
    expect(screen.getByTestId("today-garden-g2").props.children).toBe("Balkon");
  });

  test("brak zadań: komunikat, że wszystko zrobione, bez licznika", async () => {
    setup({ data: [] });

    const screen = await render(<TodayList />);

    expect(screen.getByTestId("today-empty")).toBeTruthy();
    expect(screen.getByText("today.empty")).toBeTruthy();
    expect(screen.queryByTestId("today-count")).toBeNull();
  });

  test("błąd wczytywania: komunikat i ponowienie", async () => {
    const refetch = jest.fn();
    setup({ isError: true, refetch });

    const screen = await render(<TodayList />);
    await fireEvent.press(screen.getByTestId("retry-today"));

    expect(screen.getByText("today.error")).toBeTruthy();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  test("wejście na zakładkę odświeża listę", async () => {
    const refetch = jest.fn();
    setup({ data: [], refetch });

    await render(<TodayList />);
    mockFocus.mock.calls[0][0]();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  test("„Zrobione” wykonuje zadanie w ogrodzie rośliny z dzisiejszą datą", async () => {
    const task = item("t1", "2026-10-12", "Pelargonia", "g2", "Balkon");
    mockComplete.mockResolvedValue({ ok: true, data: "2026-10-21" });
    setup({ data: [task] });

    const screen = await render(<TodayList />);
    await fireEvent.press(screen.getByTestId("today-task-done-t1"));

    expect(mockComplete).toHaveBeenCalledWith("g2", task.task, "2026-10-14");
    expect(screen.queryByTestId("today-action-error")).toBeNull();
  });

  test("„Odłóż” przesuwa zadanie o 1 dzień", async () => {
    const task = item("t1", "2026-10-14", "Monstera");
    mockPostpone.mockResolvedValue({ ok: true, data: null });
    setup({ data: [task] });

    const screen = await render(<TodayList />);
    await fireEvent.press(screen.getByTestId("today-task-postpone-t1"));

    expect(mockPostpone).toHaveBeenCalledWith("g1", task.task, "2026-10-14");
    expect(mockComplete).not.toHaveBeenCalled();
  });

  test("nieudana akcja pokazuje komunikat błędu", async () => {
    mockComplete.mockResolvedValue({ ok: false, error: "notAllowed" });
    setup({ data: [item("t1", "2026-10-14", "Monstera")] });

    const screen = await render(<TodayList />);
    await fireEvent.press(screen.getByTestId("today-task-done-t1"));

    expect(screen.getByTestId("today-action-error").props.children).toBe(
      "care.errors.notAllowed",
    );
  });

  test("w trakcie akcji przyciski wszystkich wierszy są zablokowane", async () => {
    // Pierwsza akcja trwa, dopóki test sam jej nie zakończy
    let finish: (result: unknown) => void = () => undefined;
    mockComplete.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    setup({
      data: [
        item("t1", "2026-10-14", "Monstera"),
        item("t2", "2026-10-14", "Fikus"),
      ],
    });

    const screen = await render(<TodayList />);
    const first = fireEvent.press(screen.getByTestId("today-task-done-t1"));
    await waitFor(() =>
      expect(
        screen.getByTestId("today-task-done-t2").props.accessibilityState,
      ).toMatchObject({ disabled: true }),
    );
    await fireEvent.press(screen.getByTestId("today-task-done-t2"));
    await fireEvent.press(screen.getByTestId("today-task-postpone-t2"));

    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(mockPostpone).not.toHaveBeenCalled();

    finish({ ok: true, data: "2026-10-21" });
    await first;
  });

  test("dotknięcie wiersza przełącza aktywny ogród i otwiera kartę rośliny", async () => {
    setup({ data: [item("t1", "2026-10-14", "Pelargonia", "g2", "Balkon")] });

    const screen = await render(<TodayList />);
    await fireEvent.press(screen.getByTestId("today-task-t1"));

    expect(mockSetActive).toHaveBeenCalledWith("g2");
    expect(mockPush).toHaveBeenCalledWith("/plant/p1");
  });

  test("powrót do aplikacji odświeża listę", async () => {
    const refetch = jest.fn();
    setup({ data: [], refetch });

    await render(<TodayList />);
    const onChange = listen.mock.calls[0][1];
    onChange("background");
    onChange("active");

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  test("bez ogrodu pokazuje pierwsze kroki zamiast pustej listy", async () => {
    mockGardens.mockReturnValue({ data: [] });
    setup({ data: [] });

    const screen = await render(<TodayList />);

    expect(screen.getByTestId("today-first-steps")).toBeTruthy();
    expect(screen.queryByTestId("today-empty")).toBeNull();
  });

  test("podczas wczytywania ogrodów nie pokazuje pierwszych kroków", async () => {
    mockGardens.mockReturnValue({ data: undefined });
    setup({ data: [] });

    const screen = await render(<TodayList />);

    expect(screen.queryByTestId("today-first-steps")).toBeNull();
    expect(screen.getByTestId("today-empty")).toBeTruthy();
  });
});
