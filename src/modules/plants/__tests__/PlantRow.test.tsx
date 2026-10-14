jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../hooks/usePlantPhotoUrl", () => ({ usePlantPhotoUrl: jest.fn() }));

import { fireEvent, render } from "@testing-library/react-native";
import type { Plant } from "../api/plantsApi";
import { usePlantPhotoUrl } from "../hooks/usePlantPhotoUrl";
import { PlantRow } from "../ui/PlantRow";

const mockPhoto = usePlantPhotoUrl as jest.Mock;

function plant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: "p1",
    gardenId: "g1",
    name: "Monstera",
    speciesName: "Monstera deliciosa",
    speciesKey: null,
    locationNote: "Salon",
    purchaseDate: null,
    notes: null,
    photoPath: null,
    createdAt: "2026-01-01",
    ...overrides,
  };
}

afterEach(() => jest.resetAllMocks());

describe("PlantRow", () => {
  test("pokazuje nazwę oraz gatunek i lokalizację w drugiej linii", async () => {
    mockPhoto.mockReturnValue(null);
    const utils = await render(
      <PlantRow plant={plant()} onPress={jest.fn()} />,
    );

    expect(utils.getByText("Monstera")).toBeTruthy();
    expect(utils.getByText("Monstera deliciosa · Salon")).toBeTruthy();
  });

  test("bez gatunku i lokalizacji nie ma drugiej linii", async () => {
    mockPhoto.mockReturnValue(null);
    const utils = await render(
      <PlantRow
        plant={plant({ speciesName: null, locationNote: null })}
        onPress={jest.fn()}
      />,
    );

    expect(utils.queryByTestId("plant-subtitle-p1")).toBeNull();
  });

  test("dotknięcie wywołuje onPress", async () => {
    mockPhoto.mockReturnValue(null);
    const onPress = jest.fn();
    const utils = await render(<PlantRow plant={plant()} onPress={onPress} />);

    await fireEvent.press(utils.getByTestId("plant-p1"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("znacznik opieki pokazuje się tylko przy roślinie wymagającej opieki", async () => {
    mockPhoto.mockReturnValue(null);
    const needing = await render(
      <PlantRow plant={plant()} needsCare onPress={jest.fn()} />,
    );
    expect(needing.getByTestId("plant-care-marker-p1")).toBeTruthy();

    const fine = await render(<PlantRow plant={plant()} onPress={jest.fn()} />);
    expect(fine.queryByTestId("plant-care-marker-p1")).toBeNull();
  });

  test("zdjęcie pokazuje się tylko, gdy jest link", async () => {
    mockPhoto.mockReturnValue("https://x/y.jpg");
    const withPhoto = await render(
      <PlantRow plant={plant()} onPress={jest.fn()} />,
    );
    expect(withPhoto.getByTestId("plant-photo-p1")).toBeTruthy();

    mockPhoto.mockReturnValue(null);
    const withoutPhoto = await render(
      <PlantRow plant={plant()} onPress={jest.fn()} />,
    );
    expect(withoutPhoto.queryByTestId("plant-photo-p1")).toBeNull();
  });
});
