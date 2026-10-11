const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../hooks/useCareTasks", () => ({ usePlantCareTasks: jest.fn() }));
jest.mock("../careActions", () => ({
  completeCareTaskAndRefresh: jest.fn(),
  postponeCareTaskAndRefresh: jest.fn(),
}));
jest.mock("../schedule", () => ({
  ...jest.requireActual("../schedule"),
  todayIso: () => "2026-10-11",
}));

import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { CareTask } from "../api/careApi";
import {
    completeCareTaskAndRefresh,
    postponeCareTaskAndRefresh,
} from "../careActions";
import { usePlantCareTasks } from "../hooks/useCareTasks";
import { CareSection } from "../ui/CareSection";

const mockTasks = usePlantCareTasks as jest.Mock;
const mockComplete = completeCareTaskAndRefresh as jest.Mock;
const mockPostpone = postponeCareTaskAndRefresh as jest.Mock;

function task(overrides: Partial<CareTask> = {}): CareTask {
  return {
    id: "t1",
    plantId: "p1",
    type: "water",
    customLabel: null,
    intervalDays: 7,
    nextDueOn: "2026-10-11",
    enabled: true,
    createdAt: "2026-10-01T10:00:00Z",
    ...overrides,
  };
}

function setup(tasks: CareTask[], extra: Record<string, unknown> = {}) {
  mockTasks.mockReturnValue({
    gardenId: "g1",
    tasks,
    isLoading: false,
    isError: false,
    ...extra,
  });
  return render(<CareSection plantId="p1" />);
}

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

afterEach(() => jest.resetAllMocks());

describe("CareSection", () => {
  test("bez zadań: pokazuje informację", async () => {
    const utils = await setup([]);

    expect(utils.getByText("care.empty")).toBeTruthy();
  });

  test("błąd wczytywania: pokazuje komunikat", async () => {
    const utils = await setup([], { isError: true });

    expect(utils.getByText("care.error")).toBeTruthy();
  });

  test("pokazuje nazwę typu, własną nazwę i interwał", async () => {
    const utils = await setup([
      task(),
      task({
        id: "t2",
        type: "other",
        customLabel: "Zraszanie",
        intervalDays: 1,
      }),
    ]);

    expect(utils.getByText("care.types.water")).toBeTruthy();
    expect(utils.getByText('care.everyDays:{"count":7}')).toBeTruthy();
    expect(utils.getByText("Zraszanie")).toBeTruthy();
    expect(utils.getByText("care.everyDay")).toBeTruthy();
  });

  test("opisuje termin: po terminie, dziś, jutro, za kilka dni", async () => {
    const utils = await setup([
      task({ id: "a", nextDueOn: "2026-10-08" }),
      task({ id: "b", type: "fertilize", nextDueOn: "2026-10-10" }),
      task({ id: "c", type: "repot", nextDueOn: "2026-10-11" }),
      task({ id: "d", type: "other", customLabel: "A", nextDueOn: "2026-10-12" }),
      task({ id: "e", type: "other", customLabel: "B", nextDueOn: "2026-10-16" }),
    ]);
    const due = (id: string) =>
      utils.getByTestId(`care-task-due-${id}`).props.children;

    expect(due("a")).toBe('care.due.overdueMany:{"count":3}');
    expect(due("b")).toBe("care.due.overdueOne");
    expect(due("c")).toBe("care.due.today");
    expect(due("d")).toBe("care.due.tomorrow");
    expect(due("e")).toBe('care.due.inDays:{"count":5}');
  });

  test("Zrobione jest zawsze, Odłóż tylko na dziś lub po terminie", async () => {
    const utils = await setup([
      task({ id: "due" }),
      task({ id: "later", type: "fertilize", nextDueOn: "2026-10-20" }),
    ]);

    expect(utils.getByTestId("care-task-done-due")).toBeTruthy();
    expect(utils.getByTestId("care-task-postpone-due")).toBeTruthy();
    expect(utils.getByTestId("care-task-done-later")).toBeTruthy();
    expect(utils.queryByTestId("care-task-postpone-later")).toBeNull();
  });

  test("wyłączone zadanie nie ma przycisków", async () => {
    const utils = await setup([task({ enabled: false })]);

    expect(utils.getByText("care.disabled")).toBeTruthy();
    expect(utils.queryByTestId("care-task-done-t1")).toBeNull();
    expect(utils.queryByTestId("care-task-postpone-t1")).toBeNull();
  });

  test("Zrobione w terminie: wykonuje od razu, bez pytania", async () => {
    mockComplete.mockResolvedValue({ ok: true, data: null });
    const due = task();
    const utils = await setup([due]);
    await fireEvent.press(utils.getByTestId("care-task-done-t1"));

    await waitFor(() =>
      expect(mockComplete).toHaveBeenCalledWith("g1", due, "2026-10-11"),
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });

  test("Zrobione przed terminem: pyta i wykonuje dopiero po potwierdzeniu", async () => {
    mockComplete.mockResolvedValue({ ok: true, data: null });
    const later = task({ nextDueOn: "2026-10-20" });
    const utils = await setup([later]);
    await fireEvent.press(utils.getByTestId("care-task-done-t1"));

    expect(alertSpy.mock.calls[0][0]).toBe("care.early.water");
    expect(alertSpy.mock.calls[0][1]).toContain("20.10.2026");
    expect(alertSpy.mock.calls[0][1]).toContain("18.10.2026");
    expect(mockComplete).not.toHaveBeenCalled();

    await act(async () => {
      await alertSpy.mock.calls[0][2][1].onPress();
    });
    expect(mockComplete).toHaveBeenCalledWith("g1", later, "2026-10-11");
  });

  test("Odłóż: przesuwa zadanie", async () => {
    mockPostpone.mockResolvedValue({ ok: true, data: null });
    const due = task();
    const utils = await setup([due]);
    await fireEvent.press(utils.getByTestId("care-task-postpone-t1"));

    await waitFor(() =>
      expect(mockPostpone).toHaveBeenCalledWith("g1", due, "2026-10-11"),
    );
  });

  test("błąd akcji: pokazuje komunikat", async () => {
    mockComplete.mockResolvedValue({ ok: false, error: "notAllowed" });
    const utils = await setup([task()]);
    await fireEvent.press(utils.getByTestId("care-task-done-t1"));

    expect(await utils.findByText("care.errors.notAllowed")).toBeTruthy();
  });

  test("plus: otwiera formularz nowego zadania dla tej rośliny", async () => {
    const utils = await setup([]);
    await fireEvent.press(utils.getByTestId("care-add"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/care/new",
      params: { plantId: "p1" },
    });
  });

  test("ołówek: otwiera edycję zadania", async () => {
    const utils = await setup([task()]);
    await fireEvent.press(utils.getByTestId("care-task-edit-t1"));

    expect(mockPush).toHaveBeenCalledWith("/care/edit/t1");
  });
});
