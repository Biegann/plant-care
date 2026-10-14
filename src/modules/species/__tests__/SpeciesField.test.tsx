jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "pl" } }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

import { fireEvent, render, screen } from "@testing-library/react-native";
import { SpeciesField } from "../ui/SpeciesField";

const onChange = jest.fn();

function setup(name: string, speciesKey: string | null = null) {
  return render(
    <SpeciesField
      name={name}
      speciesKey={speciesKey}
      onChange={onChange}
      placeholder="gatunek"
    />,
  );
}

afterEach(() => jest.resetAllMocks());

describe("SpeciesField", () => {
  test("pisanie tekstu kasuje wybór z listy", async () => {
    await setup("Monstera dziurawa", "monstera-deliciosa");

    await fireEvent.changeText(
      screen.getByTestId("plant-species-input"),
      "Monstera",
    );

    expect(onChange).toHaveBeenCalledWith("Monstera", null);
  });

  test("podpowiedzi po polsku; wybór ustawia nazwę i klucz", async () => {
    await setup("skrzydlo");

    expect(screen.getByText("Skrzydłokwiat")).toBeTruthy();
    await fireEvent.press(
      screen.getByTestId("species-option-spathiphyllum-wallisii"),
    );

    expect(onChange).toHaveBeenCalledWith(
      "Skrzydłokwiat",
      "spathiphyllum-wallisii",
    );
  });

  test("po wyborze z listy: znaczek i brak podpowiedzi", async () => {
    await setup("Skrzydłokwiat", "spathiphyllum-wallisii");

    expect(screen.getByTestId("species-selected")).toBeTruthy();
    expect(screen.queryByTestId("species-suggestions")).toBeNull();
  });

  test("gatunek spoza listy: bez podpowiedzi i bez znaczka", async () => {
    await setup("Moja roślinka xyz");

    expect(screen.queryByTestId("species-suggestions")).toBeNull();
    expect(screen.queryByTestId("species-selected")).toBeNull();
  });
});
