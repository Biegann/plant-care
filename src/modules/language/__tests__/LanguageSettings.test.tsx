jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../store/languageStore", () => ({ useLanguageStore: jest.fn() }));

import { fireEvent, render, screen } from "@testing-library/react-native";
import { useLanguageStore } from "../store/languageStore";
import { LanguageSettings } from "../ui/LanguageSettings";

const mockStore = useLanguageStore as unknown as jest.Mock;
const setPreference = jest.fn();

beforeEach(() => {
  mockStore.mockReturnValue({ preference: "system", setPreference });
});

afterEach(() => jest.resetAllMocks());

describe("LanguageSettings", () => {
  test("pokazuje trzy opcje i zaznacza wybraną", async () => {
    await render(<LanguageSettings />);

    expect(screen.getByText("language.sectionTitle")).toBeTruthy();
    expect(screen.getByText("language.pl")).toBeTruthy();
    expect(screen.getByText("language.en")).toBeTruthy();
    expect(
      screen.getByTestId("language-system").props.accessibilityState.selected,
    ).toBe(true);
    expect(
      screen.getByTestId("language-pl").props.accessibilityState.selected,
    ).toBe(false);
  });

  test("dotknięcie opcji zapisuje wybór", async () => {
    await render(<LanguageSettings />);

    await fireEvent.press(screen.getByTestId("language-en"));

    expect(setPreference).toHaveBeenCalledWith("en");
  });
});
