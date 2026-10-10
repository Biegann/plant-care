jest.mock("expo-router", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Link: ({ children }: { children?: unknown }) =>
      React.createElement(Text, null, children),
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../api/authApi", () => ({
  requestPasswordReset: jest.fn(),
  resetPasswordWithCode: jest.fn(),
}));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { requestPasswordReset, resetPasswordWithCode } from "../api/authApi";
import { ForgotPasswordForm } from "../ui/ForgotPasswordForm";

const mockRequest = requestPasswordReset as jest.Mock;
const mockReset = resetPasswordWithCode as jest.Mock;

async function goToConfirmStep() {
  mockRequest.mockResolvedValue({ ok: true });
  const utils = await render(<ForgotPasswordForm />);
  await fireEvent.changeText(
    utils.getByTestId("forgot-email-input"),
    "anna@example.com",
  );
  await fireEvent.press(utils.getByTestId("forgot-submit-button"));
  await utils.findByTestId("forgot-code-input");
  return utils;
}

afterEach(() => jest.resetAllMocks());

describe("ForgotPasswordForm", () => {
  test("pusty e-mail: pokazuje błąd i nie wysyła kodu", async () => {
    const utils = await render(<ForgotPasswordForm />);
    await fireEvent.press(utils.getByTestId("forgot-submit-button"));

    expect(utils.getByText("auth.errors.invalidEmail")).toBeTruthy();
    expect(mockRequest).not.toHaveBeenCalled();
  });

  test("poprawny e-mail: wysyła kod i przechodzi do kroku z kodem", async () => {
    const utils = await goToConfirmStep();

    expect(mockRequest).toHaveBeenCalledWith("anna@example.com");
    expect(utils.getByTestId("forgot-password-input")).toBeTruthy();
  });

  test("błąd serwera przy wysyłce kodu: pokazuje komunikat", async () => {
    mockRequest.mockResolvedValue({ ok: false, error: "rateLimited" });
    const utils = await render(<ForgotPasswordForm />);
    await fireEvent.changeText(
      utils.getByTestId("forgot-email-input"),
      "anna@example.com",
    );
    await fireEvent.press(utils.getByTestId("forgot-submit-button"));

    expect(await utils.findByText("auth.errors.rateLimited")).toBeTruthy();
  });

  test("zły format kodu: pokazuje błąd i nie wywołuje resetu", async () => {
    const utils = await goToConfirmStep();
    await fireEvent.changeText(utils.getByTestId("forgot-code-input"), "abc");
    await fireEvent.changeText(
      utils.getByTestId("forgot-password-input"),
      "noweHaslo1",
    );
    await fireEvent.press(utils.getByTestId("forgot-submit-button"));

    expect(utils.getByText("auth.errors.invalidCode")).toBeTruthy();
    expect(mockReset).not.toHaveBeenCalled();
  });

  test("poprawne dane: wywołuje reset z e-mailem, kodem i nowym hasłem", async () => {
    mockReset.mockResolvedValue({ ok: true });
    const utils = await goToConfirmStep();
    await fireEvent.changeText(
      utils.getByTestId("forgot-code-input"),
      "123456",
    );
    await fireEvent.changeText(
      utils.getByTestId("forgot-password-input"),
      "noweHaslo1",
    );
    await fireEvent.press(utils.getByTestId("forgot-submit-button"));

    await waitFor(() =>
      expect(mockReset).toHaveBeenCalledWith(
        "anna@example.com",
        "123456",
        "noweHaslo1",
      ),
    );
  });

  test("błąd serwera przy zmianie hasła: pokazuje komunikat", async () => {
    mockReset.mockResolvedValue({ ok: false, error: "samePassword" });
    const utils = await goToConfirmStep();
    await fireEvent.changeText(
      utils.getByTestId("forgot-code-input"),
      "123456",
    );
    await fireEvent.changeText(
      utils.getByTestId("forgot-password-input"),
      "stareHaslo1",
    );
    await fireEvent.press(utils.getByTestId("forgot-submit-button"));

    expect(await utils.findByText("auth.errors.samePassword")).toBeTruthy();
  });
});
