jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../store/welcomeStore", () => ({ useWelcomeStore: jest.fn() }));

import { fireEvent, render, screen } from "@testing-library/react-native";
import { useWelcomeStore } from "../store/welcomeStore";
import { WelcomeView } from "../ui/WelcomeView";

const mockStore = useWelcomeStore as unknown as jest.Mock;
const markSeen = jest.fn();

beforeEach(() => {
  mockStore.mockImplementation((select: (state: unknown) => unknown) =>
    select({ seen: false, hydrated: true, markSeen }),
  );
});

afterEach(() => jest.resetAllMocks());

describe("WelcomeView", () => {
  test("pokazuje tytuł i trzy funkcje aplikacji", async () => {
    await render(<WelcomeView />);

    expect(screen.getByText("welcome.title")).toBeTruthy();
    expect(screen.getByText("welcome.features.shared")).toBeTruthy();
    expect(screen.getByText("welcome.features.reminders")).toBeTruthy();
    expect(screen.getByText("welcome.features.history")).toBeTruthy();
  });

  test("Zaczynamy oznacza powitanie jako widziane", async () => {
    await render(<WelcomeView />);

    await fireEvent.press(screen.getByTestId("welcome-start"));

    expect(markSeen).toHaveBeenCalledTimes(1);
  });
});
