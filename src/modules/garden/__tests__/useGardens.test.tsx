jest.mock("../../../shared/api/supabase", () => ({ supabase: { auth: {} } }));
jest.mock("../api/gardenApi", () => ({ listGardens: jest.fn() }));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { useAuthStore } from "../../auth/hooks/useSession";
import { listGardens } from "../api/gardenApi";
import { useGardens } from "../hooks/useGardens";

const mockList = listGardens as jest.Mock;
const garden = { id: "1", name: "Dom", role: "owner" };

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

afterEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ session: null });
});

describe("useGardens", () => {
  test("pobiera ogrody zalogowanego użytkownika", async () => {
    useAuthStore.setState({ session: { user: { id: "u1" } } as never });
    mockList.mockResolvedValue({ ok: true, data: [garden] });

    const { result } = await renderHook(() => useGardens(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual([garden]));
  });

  test("błąd z API kończy zapytanie błędem z naszym kodem", async () => {
    useAuthStore.setState({ session: { user: { id: "u1" } } as never });
    mockList.mockResolvedValue({ ok: false, error: "unknown" });

    const { result } = await renderHook(() => useGardens(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("unknown");
  });

  test("bez sesji nie wysyła zapytania", async () => {
    const { result } = await renderHook(() => useGardens(), {
      wrapper: createWrapper(),
    });

    expect(mockList).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });
});
