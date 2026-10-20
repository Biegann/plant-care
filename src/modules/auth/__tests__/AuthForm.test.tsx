jest.mock("expo-router", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Link: ({ children }: { children?: unknown }) =>
      React.createElement(Text, null, children),
    router: { push: jest.fn() },
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../api/authApi", () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  resendSignupCode: jest.fn(),
}));

jest.mock("../../../shared/utils/links", () => ({
  openPrivacyPolicy: jest.fn(),
}));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { openPrivacyPolicy } from "../../../shared/utils/links";
import { resendSignupCode, signIn, signUp } from "../api/authApi";
import { AuthForm } from "../ui/AuthForm";

const mockSignIn = signIn as jest.Mock;
const mockSignUp = signUp as jest.Mock;
const mockResend = resendSignupCode as jest.Mock;
const mockPush = router.push as jest.Mock;

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

  test("rejestracja: link do polityki prywatności otwiera politykę", async () => {
    const utils = await render(<AuthForm mode="register" />);
    await fireEvent.press(utils.getByTestId("privacy-policy-link"));
    expect(openPrivacyPolicy).toHaveBeenCalled();
  });

  test("logowanie: bez linku do polityki prywatności", async () => {
    const utils = await render(<AuthForm mode="login" />);
    expect(utils.queryByTestId("privacy-policy-link")).toBeNull();
  });

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
    mockSignUp.mockResolvedValue({
      ok: true,
      data: { needsConfirmation: false },
    });
    const utils = await render(<AuthForm mode="register" />);
    await fillAndSubmit(utils, "anna@example.com", "haslo1234");

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith("anna@example.com", "haslo1234"),
    );
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("rejestracja z potwierdzaniem: przechodzi do ekranu kodu", async () => {
    mockSignUp.mockResolvedValue({
      ok: true,
      data: { needsConfirmation: true },
    });
    const utils = await render(<AuthForm mode="register" />);
    await fillAndSubmit(utils, " anna@example.com ", "haslo1234");

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/verify-email",
        params: { email: "anna@example.com" },
      }),
    );
  });

  test("logowanie na niepotwierdzone konto: wysyła kod i przechodzi do ekranu kodu", async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: "emailNotConfirmed" });
    mockResend.mockResolvedValue({ ok: false, error: "rateLimited" });
    const utils = await render(<AuthForm mode="login" />);
    await fillAndSubmit(utils, "anna@example.com", "haslo1234");

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/verify-email",
        params: { email: "anna@example.com" },
      }),
    );
    expect(mockResend).toHaveBeenCalledWith("anna@example.com");
    expect(utils.queryByText("auth.errors.rateLimited")).toBeNull();
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
