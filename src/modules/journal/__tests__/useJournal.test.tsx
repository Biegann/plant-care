jest.mock("../../../shared/api/supabase", () => ({ supabase: { auth: {} } }));
jest.mock("../api/journalApi", () => ({ listJournal: jest.fn() }));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { listJournal } from "../api/journalApi";
import { useJournal } from "../hooks/useJournal";

const mockList = listJournal as jest.Mock;

const entries = [
  { id: "j1", plantId: "p1", entryOn: "2026-10-12", note: "Liść" },
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

describe("useJournal", () => {
  test("pobiera dziennik rośliny", async () => {
    mockList.mockResolvedValue({ ok: true, data: entries });

    const { result } = await renderHook(() => useJournal("p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(entries));
    expect(mockList).toHaveBeenCalledWith("p1");
  });

  test("błąd z API kończy zapytanie błędem z naszym kodem", async () => {
    mockList.mockResolvedValue({ ok: false, error: "unknown" });

    const { result } = await renderHook(() => useJournal("p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("unknown");
  });
});
