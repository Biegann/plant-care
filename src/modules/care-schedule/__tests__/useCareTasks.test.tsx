jest.mock("../../../shared/api/supabase", () => ({ supabase: { auth: {} } }));
jest.mock("../api/careApi", () => ({ listCareTasks: jest.fn() }));
jest.mock("../../garden/hooks/useActiveGarden", () => ({
  useActiveGarden: jest.fn(),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { useActiveGarden } from "../../garden/hooks/useActiveGarden";
import { listCareTasks } from "../api/careApi";
import {
    useCareTask,
    useCareTasks,
    usePlantCareTasks,
} from "../hooks/useCareTasks";

const mockList = listCareTasks as jest.Mock;
const mockGarden = useActiveGarden as jest.Mock;

const tasks = [
  { id: "t1", plantId: "p1", type: "water" },
  { id: "t2", plantId: "p2", type: "water" },
  { id: "t3", plantId: "p1", type: "fertilize" },
];

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

afterEach(() => jest.resetAllMocks());

describe("useCareTasks", () => {
  test("pobiera zadania ogrodu", async () => {
    mockList.mockResolvedValue({ ok: true, data: tasks });

    const { result } = await renderHook(() => useCareTasks("g1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(tasks));
    expect(mockList).toHaveBeenCalledWith("g1");
  });

  test("błąd z API kończy zapytanie błędem z naszym kodem", async () => {
    mockList.mockResolvedValue({ ok: false, error: "unknown" });

    const { result } = await renderHook(() => useCareTasks("g1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("unknown");
  });

  test("bez ogrodu nie wysyła zapytania", async () => {
    const { result } = await renderHook(() => useCareTasks(undefined), {
      wrapper: createWrapper(),
    });

    expect(mockList).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("usePlantCareTasks", () => {
  test("zwraca tylko zadania wskazanej rośliny z aktywnego ogrodu", async () => {
    mockGarden.mockReturnValue({ garden: { id: "g1" }, isLoading: false });
    mockList.mockResolvedValue({ ok: true, data: tasks });

    const { result } = await renderHook(() => usePlantCareTasks("p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks.map((task) => task.id)).toEqual(["t1", "t3"]);
    expect(result.current.gardenId).toBe("g1");
  });

  test("bez aktywnego ogrodu: pusta lista i brak ładowania", async () => {
    mockGarden.mockReturnValue({ garden: null, isLoading: false });

    const { result } = await renderHook(() => usePlantCareTasks("p1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockList).not.toHaveBeenCalled();
  });
});

describe("useCareTask", () => {
  test("zwraca zadanie o podanym id z aktywnego ogrodu", async () => {
    mockGarden.mockReturnValue({ garden: { id: "g1" }, isLoading: false });
    mockList.mockResolvedValue({ ok: true, data: tasks });

    const { result } = await renderHook(() => useCareTask("t3"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.task).toEqual(tasks[2]));
    expect(result.current.gardenId).toBe("g1");
  });

  test("nieznane id: brak zadania po wczytaniu", async () => {
    mockGarden.mockReturnValue({ garden: { id: "g1" }, isLoading: false });
    mockList.mockResolvedValue({ ok: true, data: tasks });

    const { result } = await renderHook(() => useCareTask("nie-ma"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.task).toBeNull();
  });
});
