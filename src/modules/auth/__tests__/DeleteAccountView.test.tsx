jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../api/accountApi", () => ({
  getDeletionPlan: jest.fn(),
  deleteAccount: jest.fn(),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render } from "@testing-library/react-native";
import { deleteAccount, getDeletionPlan } from "../api/accountApi";
import { DeleteAccountView } from "../ui/DeleteAccountView";

const mockPlan = getDeletionPlan as jest.Mock;
const mockDelete = deleteAccount as jest.Mock;

function renderView() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={client}>
      <DeleteAccountView />
    </QueryClientProvider>,
  );
}

afterEach(() => jest.resetAllMocks());

describe("DeleteAccountView", () => {
  test("wspólny ogród: komunikat blokady i brak przycisku", async () => {
    mockPlan.mockResolvedValue({
      ok: true,
      data: { blocking: [{ id: "g1", name: "Dom" }], removed: [] },
    });
    const utils = await renderView();
    expect(await utils.findByTestId("delete-account-blocked")).toBeTruthy();
    expect(utils.queryByTestId("delete-account-submit")).toBeNull();
  });

  test("bez hasła nie wywołuje usuwania", async () => {
    mockPlan.mockResolvedValue({ ok: true, data: { blocking: [], removed: [] } });
    const utils = await renderView();
    await fireEvent.press(await utils.findByTestId("delete-account-submit"));
    expect(utils.getByText("account.errors.passwordRequired")).toBeTruthy();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  test("pokazuje ogrody do usunięcia i błąd złego hasła", async () => {
    mockPlan.mockResolvedValue({
      ok: true,
      data: { blocking: [], removed: [{ id: "g2", name: "Balkon" }] },
    });
    mockDelete.mockResolvedValue({ ok: false, error: "invalidPassword" });
    const utils = await renderView();
    expect(await utils.findByTestId("delete-account-removed")).toBeTruthy();
    await fireEvent.changeText(
      utils.getByTestId("delete-account-password"),
      "zle",
    );
    await fireEvent.press(utils.getByTestId("delete-account-submit"));
    expect(mockDelete).toHaveBeenCalledWith("zle");
    expect(
      await utils.findByText("account.errors.invalidPassword"),
    ).toBeTruthy();
  });
});
