const mockBack = jest.fn();

jest.mock("expo-router", () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../gardenActions", () => ({ createAndActivate: jest.fn() }));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { createAndActivate } from "../gardenActions";
import { CreateGardenForm } from "../ui/CreateGardenForm";

const mockCreate = createAndActivate as jest.Mock;

afterEach(() => jest.resetAllMocks());

describe("CreateGardenForm", () => {
  test("pusta nazwa: pokazuje błąd i nie tworzy ogrodu", async () => {
    const utils = await render(<CreateGardenForm />);
    await fireEvent.press(utils.getByTestId("create-garden-submit"));

    expect(utils.getByText("gardens.errors.invalidName")).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("poprawna nazwa: tworzy ogród i wraca do poprzedniego ekranu", async () => {
    mockCreate.mockResolvedValue({ ok: true, data: "g1" });
    const utils = await render(<CreateGardenForm />);
    await fireEvent.changeText(
      utils.getByTestId("garden-name-input"),
      "Balkon",
    );
    await fireEvent.press(utils.getByTestId("create-garden-submit"));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith("Balkon"));
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  test("błąd serwera: pokazuje komunikat i nie wraca", async () => {
    mockCreate.mockResolvedValue({ ok: false, error: "unknown" });
    const utils = await render(<CreateGardenForm />);
    await fireEvent.changeText(
      utils.getByTestId("garden-name-input"),
      "Balkon",
    );
    await fireEvent.press(utils.getByTestId("create-garden-submit"));

    expect(await utils.findByText("gardens.errors.unknown")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });
});
