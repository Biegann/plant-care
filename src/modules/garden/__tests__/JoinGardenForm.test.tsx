const mockBack = jest.fn();

jest.mock("expo-router", () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../gardenActions", () => ({ joinAndActivate: jest.fn() }));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { joinAndActivate } from "../gardenActions";
import { JoinGardenForm } from "../ui/JoinGardenForm";

const mockJoin = joinAndActivate as jest.Mock;

afterEach(() => jest.resetAllMocks());

describe("JoinGardenForm", () => {
  test("zły format kodu: pokazuje błąd i nie wysyła zapytania", async () => {
    const utils = await render(<JoinGardenForm />);
    await fireEvent.changeText(utils.getByTestId("garden-code-input"), "abc");
    await fireEvent.press(utils.getByTestId("join-garden-submit"));

    expect(utils.getByText("gardens.errors.invalidCode")).toBeTruthy();
    expect(mockJoin).not.toHaveBeenCalled();
  });

  test("poprawny kod: dołącza i wraca do poprzedniego ekranu", async () => {
    mockJoin.mockResolvedValue({ ok: true, data: "g1" });
    const utils = await render(<JoinGardenForm />);
    await fireEvent.changeText(
      utils.getByTestId("garden-code-input"),
      "abcd-1234 ef",
    );
    await fireEvent.press(utils.getByTestId("join-garden-submit"));

    await waitFor(() => expect(mockJoin).toHaveBeenCalledWith("abcd-1234 ef"));
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  test("błąd serwera: pokazuje komunikat i nie wraca", async () => {
    mockJoin.mockResolvedValue({ ok: false, error: "alreadyMember" });
    const utils = await render(<JoinGardenForm />);
    await fireEvent.changeText(
      utils.getByTestId("garden-code-input"),
      "ABCD1234EF",
    );
    await fireEvent.press(utils.getByTestId("join-garden-submit"));

    expect(await utils.findByText("gardens.errors.alreadyMember")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("limit prób wyczerpany: komunikat o godzinie przerwy", async () => {
    mockJoin.mockResolvedValue({ ok: false, error: "tooManyAttempts" });
    const utils = await render(<JoinGardenForm />);
    await fireEvent.changeText(
      utils.getByTestId("garden-code-input"),
      "ABCD1234EF",
    );
    await fireEvent.press(utils.getByTestId("join-garden-submit"));

    expect(
      await utils.findByText("gardens.errors.tooManyAttempts"),
    ).toBeTruthy();
  });
});
