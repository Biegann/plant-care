jest.mock("expo-router", () => ({ router: { back: jest.fn() } }));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { seconds?: number }) =>
      params?.seconds !== undefined ? `${key}:${params.seconds}` : key,
  }),
}));

jest.mock("../api/authApi", () => ({
  resendSignupCode: jest.fn(),
  verifySignupCode: jest.fn(),
}));

import { act, fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { resendSignupCode, verifySignupCode } from "../api/authApi";
import {
  RESEND_COOLDOWN_SECONDS,
  VerifyEmailForm,
} from "../ui/VerifyEmailForm";

const mockVerify = verifySignupCode as jest.Mock;
const mockResend = resendSignupCode as jest.Mock;

async function waitOutCooldown() {
  // Każda sekunda osobno: kolejny timer powstaje dopiero po odświeżeniu ekranu
  for (let i = 0; i < RESEND_COOLDOWN_SECONDS; i++) {
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  }
}

describe("VerifyEmailForm", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  test("zły format kodu: komunikat bez wywołania API", async () => {
    const utils = await render(<VerifyEmailForm email="a@b.pl" />);
    await fireEvent.changeText(utils.getByTestId("verify-code-input"), "12");
    await fireEvent.press(utils.getByTestId("verify-submit-button"));

    expect(utils.getByText("auth.errors.invalidCode")).toBeTruthy();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  test("poprawny kod: wywołuje weryfikację z adresem", async () => {
    mockVerify.mockResolvedValue({ ok: true });
    const utils = await render(<VerifyEmailForm email="a@b.pl" />);
    await fireEvent.changeText(
      utils.getByTestId("verify-code-input"),
      "123456",
    );
    await fireEvent.press(utils.getByTestId("verify-submit-button"));

    expect(mockVerify).toHaveBeenCalledWith("a@b.pl", "123456");
    expect(utils.queryByText("auth.errors.invalidCode")).toBeNull();
  });

  test("błąd z serwera: pokazuje komunikat", async () => {
    mockVerify.mockResolvedValue({ ok: false, error: "invalidCode" });
    const utils = await render(<VerifyEmailForm email="a@b.pl" />);
    await fireEvent.changeText(
      utils.getByTestId("verify-code-input"),
      "123456",
    );
    await fireEvent.press(utils.getByTestId("verify-submit-button"));

    expect(await utils.findByText("auth.errors.invalidCode")).toBeTruthy();
  });

  test("ponowna wysyłka zablokowana przez pierwsze 60 s", async () => {
    const utils = await render(<VerifyEmailForm email="a@b.pl" />);
    expect(
      utils.getByText(`auth.verify.resendIn:${RESEND_COOLDOWN_SECONDS}`),
    ).toBeTruthy();

    await fireEvent.press(utils.getByTestId("verify-resend"));
    expect(mockResend).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(
      utils.getByText(`auth.verify.resendIn:${RESEND_COOLDOWN_SECONDS - 1}`),
    ).toBeTruthy();
  });

  test("po odliczaniu wysyła nowy kod i znów odlicza", async () => {
    mockResend.mockResolvedValue({ ok: true });
    const utils = await render(<VerifyEmailForm email="a@b.pl" />);
    await waitOutCooldown();

    await fireEvent.press(utils.getByText("auth.verify.resend"));

    expect(mockResend).toHaveBeenCalledWith("a@b.pl");
    expect(await utils.findByText("auth.verify.resent")).toBeTruthy();
    expect(
      utils.getByText(`auth.verify.resendIn:${RESEND_COOLDOWN_SECONDS}`),
    ).toBeTruthy();
  });

  test("błąd ponownej wysyłki: pokazuje komunikat", async () => {
    mockResend.mockResolvedValue({ ok: false, error: "rateLimited" });
    const utils = await render(<VerifyEmailForm email="a@b.pl" />);
    await waitOutCooldown();

    await fireEvent.press(utils.getByText("auth.verify.resend"));

    expect(await utils.findByText("auth.errors.rateLimited")).toBeTruthy();
  });

  test("Zmień adres e-mail wraca do poprzedniego ekranu", async () => {
    const utils = await render(<VerifyEmailForm email="a@b.pl" />);
    await fireEvent.press(utils.getByTestId("verify-change-email"));
    expect(router.back).toHaveBeenCalled();
  });
});
