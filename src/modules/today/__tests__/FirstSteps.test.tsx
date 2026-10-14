const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

import { fireEvent, render, screen } from "@testing-library/react-native";
import { FirstSteps } from "../ui/FirstSteps";

afterEach(() => jest.resetAllMocks());

describe("FirstSteps", () => {
  test("pokazuje powitanie i dwa przyciski", async () => {
    await render(<FirstSteps />);

    expect(screen.getByText("today.firstSteps.title")).toBeTruthy();
    expect(screen.getByText("today.firstSteps.text")).toBeTruthy();
    expect(screen.getByText("gardens.new")).toBeTruthy();
    expect(screen.getByText("gardens.join")).toBeTruthy();
  });

  test("przycisk nowego ogrodu otwiera formularz ogrodu", async () => {
    await render(<FirstSteps />);

    await fireEvent.press(screen.getByTestId("first-steps-new-garden"));

    expect(mockPush).toHaveBeenCalledWith("/garden/new");
  });

  test("przycisk dołączenia otwiera ekran kodu zaproszenia", async () => {
    await render(<FirstSteps />);

    await fireEvent.press(screen.getByTestId("first-steps-join-garden"));

    expect(mockPush).toHaveBeenCalledWith("/garden/join");
  });
});
