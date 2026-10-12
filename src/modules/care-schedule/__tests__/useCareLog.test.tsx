jest.mock("../../../shared/api/supabase", () => ({ supabase: { auth: {} } }));
jest.mock("../api/careLogApi", () => ({ listCareLog: jest.fn() }));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { listCareLog } from "../api/careLogApi";
import { useCareLog } from "../hooks/useCareLog";

const mockList = listCareLog as jest.Mock;

const entries = [
  { id: "e1", plantId: "p1", type: "water", doneOn: "2026-10-12" },
  { id: "e2", plantId: "p1", type: "fertilize", doneOn: "2026-10-01" },
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

describe("useCareLog", () => {
  test("pobiera historię rośliny", async () => {
    mockList.mockResolvedValue({ ok: true, data: entries });

    const { result } = await renderHook(() => useCareLog("p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(entries));
    expect(mockList).toHaveBeenCalledWith("p1");
  });

  test("błąd z API kończy zapytanie błędem z naszym kodem", async () => {
    mockList.mockResolvedValue({ ok: false, error: "unknown" });

    const { result } = await renderHook(() => useCareLog("p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("unknown");
  });
});
