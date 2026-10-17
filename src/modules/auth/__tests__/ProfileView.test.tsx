jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../api/authApi", () => ({ signOut: jest.fn() }));

jest.mock("../../notifications/ui/NotificationSettings", () => ({
  NotificationSettings: () => null,
}));

jest.mock("../../theme/ui/ThemeSettings", () => ({
  ThemeSettings: () => null,
}));

jest.mock("../../language/ui/LanguageSettings", () => ({
  LanguageSettings: () => null,
}));

jest.mock("../hooks/useSession", () => ({
  useSession: () => ({ user: { email: "anna@example.com" } }),
}));

import { fireEvent, render } from "@testing-library/react-native";
import { signOut } from "../api/authApi";
import { ProfileView } from "../ui/ProfileView";

afterEach(() => jest.clearAllMocks());

describe("ProfileView", () => {
  test("pokazuje adres e-mail zalogowanego użytkownika", async () => {
    const utils = await render(<ProfileView />);
    expect(utils.getByTestId("profile-email").props.children).toBe(
      "anna@example.com",
    );
  });

  test("przycisk wylogowania wywołuje signOut", async () => {
    const utils = await render(<ProfileView />);
    await fireEvent.press(utils.getByTestId("logout-button"));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  test("link usuwania konta otwiera ekran usuwania", async () => {
    const utils = await render(<ProfileView />);
    await fireEvent.press(utils.getByTestId("delete-account-link"));
    expect(mockPush).toHaveBeenCalledWith("/account/delete");
  });
});
