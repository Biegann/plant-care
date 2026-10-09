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
  signIn: jest.fn(),
  signUp: jest.fn(),
}));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { signIn, signUp } from "../api/authApi";
import { AuthForm } from "../ui/AuthForm";

const mockSignIn = signIn as jest.Mock;
const mockSignUp = signUp as jest.Mock;

async function fillAndSubmit(
  utils: Awaited<ReturnType<typeof render>>,
  email: string,
  password: string,
) {
  await fireEvent.changeText(utils.getByTestId("email-input"), email);
  await fireEvent.changeText(utils.getByTestId("password-input"), password);
  await fireEvent.press(utils.getByTestId("submit-button"));
}

describe("AuthForm", () => {
  afterEach(() => jest.clearAllMocks());

  test("puste pola: pokazuje błędy i nie wywołuje logowania", async () => {
    const utils = await render(<AuthForm mode="login" />);
    await fireEvent.press(utils.getByTestId("submit-button"));

    expect(utils.getByText("auth.errors.invalidEmail")).toBeTruthy();
    expect(utils.getByText("auth.errors.shortPassword")).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  test("logowanie: wywołuje signIn z wpisanymi danymi", async () => {
    mockSignIn.mockResolvedValue({ ok: true });
    const utils = await render(<AuthForm mode="login" />);
    await fillAndSubmit(utils, "anna@example.com", "haslo1234");

    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith("anna@example.com", "haslo1234"),
    );
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  test("rejestracja: wywołuje signUp", async () => {
    mockSignUp.mockResolvedValue({ ok: true });
    const utils = await render(<AuthForm mode="register" />);
    await fillAndSubmit(utils, "anna@example.com", "haslo1234");

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith("anna@example.com", "haslo1234"),
    );
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  test("błąd z serwera: pokazuje komunikat", async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: "invalidCredentials" });
    const utils = await render(<AuthForm mode="login" />);
    await fillAndSubmit(utils, "anna@example.com", "zlehaslo1");

    expect(
      await utils.findByText("auth.errors.invalidCredentials"),
    ).toBeTruthy();
  });
});
