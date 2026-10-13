jest.mock("../../../shared/api/supabase", () => ({ supabase: { auth: {} } }));
jest.mock("../api/todayApi", () => ({ listDueTasks: jest.fn() }));
jest.mock("../../care-schedule/schedule", () => ({ todayIso: jest.fn() }));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { todayIso } from "../../care-schedule/schedule";
import { listDueTasks } from "../api/todayApi";
import { useTodayTasks } from "../hooks/useTodayTasks";

const mockList = listDueTasks as jest.Mock;
const mockToday = todayIso as jest.Mock;

const tasks = [{ task: { id: "t1" }, plantName: "Monstera" }];

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => mockToday.mockReturnValue("2026-10-14"));

afterEach(() => jest.resetAllMocks());

describe("useTodayTasks", () => {
  test("pobiera zadania z terminem do dzisiejszej daty telefonu", async () => {
    mockList.mockResolvedValue({ ok: true, data: tasks });

    const { result } = await renderHook(() => useTodayTasks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(tasks));
    expect(mockList).toHaveBeenCalledWith("2026-10-14");
  });

  test("błąd z API kończy zapytanie błędem z naszym kodem", async () => {
    mockList.mockResolvedValue({ ok: false, error: "unknown" });

    const { result } = await renderHook(() => useTodayTasks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("unknown");
  });
});
