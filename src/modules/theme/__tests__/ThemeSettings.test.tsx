jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../store/themeStore", () => ({ useThemeStore: jest.fn() }));

import { fireEvent, render, screen } from "@testing-library/react-native";
import { useThemeStore } from "../store/themeStore";
import { ThemeSettings } from "../ui/ThemeSettings";

const mockStore = useThemeStore as unknown as jest.Mock;
const setPreference = jest.fn();

beforeEach(() => {
  mockStore.mockReturnValue({ preference: "system", setPreference });
});

afterEach(() => jest.resetAllMocks());

describe("ThemeSettings", () => {
  test("pokazuje trzy opcje i zaznacza wybraną", async () => {
    await render(<ThemeSettings />);

    expect(screen.getByText("theme.sectionTitle")).toBeTruthy();
    expect(
      screen.getByTestId("theme-system").props.accessibilityState.selected,
    ).toBe(true);
    expect(
      screen.getByTestId("theme-light").props.accessibilityState.selected,
    ).toBe(false);
    expect(
      screen.getByTestId("theme-dark").props.accessibilityState.selected,
    ).toBe(false);
  });

  test("dotknięcie opcji zapisuje wybór", async () => {
    await render(<ThemeSettings />);

    await fireEvent.press(screen.getByTestId("theme-dark"));

    expect(setPreference).toHaveBeenCalledWith("dark");
  });
});
