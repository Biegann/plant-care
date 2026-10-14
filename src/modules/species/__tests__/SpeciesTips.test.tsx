jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

import { render, screen } from "@testing-library/react-native";
import { speciesIntervals } from "../data";
import { speciesLabel } from "../useSpeciesLanguage";
import { SpeciesTips } from "../ui/SpeciesTips";

describe("SpeciesTips", () => {
  test("gatunek z listy: pięć wskazówek z danymi gatunku", async () => {
    await render(<SpeciesTips speciesKey="monstera-deliciosa" />);

    expect(screen.getByText("species.tipsTitle")).toBeTruthy();
    expect(screen.getByText("species.light.bright")).toBeTruthy();
    expect(
      screen.getByText(
        'species.watering.line:{"days":9,"hint":"species.watering.topDry"}',
      ),
    ).toBeTruthy();
    expect(screen.getByText('species.fertilize:{"days":30}')).toBeTruthy();
    expect(screen.getByText("species.humidity.high")).toBeTruthy();
    expect(screen.getByText("species.toxic.yes")).toBeTruthy();
  });

  test("roślina nietrująca: odpowiedni tekst", async () => {
    await render(<SpeciesTips speciesKey="chlorophytum-comosum" />);

    expect(screen.getByText("species.toxic.no")).toBeTruthy();
  });

  test("bez gatunku albo z nieznanym kluczem: nic nie rysuje", async () => {
    await render(<SpeciesTips speciesKey={null} />);
    expect(screen.queryByTestId("species-tips")).toBeNull();

    await render(<SpeciesTips speciesKey="nie-ma" />);
    expect(screen.queryByTestId("species-tips")).toBeNull();
  });
});

describe("speciesLabel", () => {
  test("gatunek z listy w bieżącym języku, spoza listy: wpisany tekst", () => {
    const fromList = { speciesKey: "ficus-lyrata", speciesName: "Fikus" };
    expect(speciesLabel(fromList, "en")).toBe("Fiddle-leaf fig");
    expect(speciesLabel(fromList, "pl")).toBe("Fikus lirolistny");
    expect(speciesLabel({ speciesKey: null, speciesName: "Moja" }, "pl")).toBe(
      "Moja",
    );
  });
});

describe("speciesIntervals", () => {
  test("interwały gatunku albo puste podpowiedzi", () => {
    expect(speciesIntervals("cactaceae")).toEqual({
      water: 21,
      fertilize: 60,
    });
    expect(speciesIntervals(null)).toEqual({});
  });
});
