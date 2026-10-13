jest.mock("../api/plantsApi", () => ({
  createPlant: jest.fn(),
  updatePlant: jest.fn(),
  deletePlant: jest.fn(),
}));
jest.mock("../../notifications/sync", () => ({ syncNotifications: jest.fn() }));

import { queryClient } from "../../../shared/api/queryClient";
import { syncNotifications } from "../../notifications/sync";
import {
    createPlant,
    deletePlant,
    updatePlant,
    type Plant,
} from "../api/plantsApi";
import {
    createPlantAndRefresh,
    deletePlantAndRefresh,
    updatePlantAndRefresh,
} from "../plantActions";

const mockCreate = createPlant as jest.Mock;
const mockUpdate = updatePlant as jest.Mock;
const mockDelete = deletePlant as jest.Mock;

const plant = {
  id: "p1",
  gardenId: "g1",
  name: "Monstera",
  photoPath: null,
} as Plant;
const buffer = new ArrayBuffer(8);

let invalidate: jest.SpyInstance;

beforeEach(() => {
  invalidate = jest
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue(undefined);
});

afterEach(() => {
  invalidate.mockRestore();
  jest.resetAllMocks();
});

describe("przeliczanie powiadomień", () => {
  const mockSync = syncNotifications as jest.Mock;
  const saved = { ok: true, data: { id: "p1", photoFailed: false } };

  test("zmiana i usunięcie rośliny przeliczają plan, dodanie nie", async () => {
    mockCreate.mockResolvedValue(saved);
    mockUpdate.mockResolvedValue(saved);
    mockDelete.mockResolvedValue({ ok: true, data: null });

    await createPlantAndRefresh("g1", { name: "Monstera" });
    expect(mockSync).not.toHaveBeenCalled();

    await updatePlantAndRefresh(plant, { name: "Nowa" }, undefined);
    await deletePlantAndRefresh(plant);
    expect(mockSync).toHaveBeenCalledTimes(2);
  });

  test("nieudana zmiana nie rusza planu", async () => {
    mockUpdate.mockResolvedValue({ ok: false, error: "notAllowed" });

    await updatePlantAndRefresh(plant, { name: "Nowa" }, undefined);

    expect(mockSync).not.toHaveBeenCalled();
  });
});

describe("createPlantAndRefresh", () => {
  test("po sukcesie przekazuje dane i odświeża rośliny ogrodu", async () => {
    mockCreate.mockResolvedValue({
      ok: true,
      data: { id: "p1", photoFailed: false },
    });

    await createPlantAndRefresh("g1", { name: "Monstera" }, buffer);

    expect(mockCreate).toHaveBeenCalledWith("g1", { name: "Monstera" }, buffer);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["plants", "g1"] });
  });

  test("po błędzie nie odświeża", async () => {
    mockCreate.mockResolvedValue({ ok: false, error: "unknown" });

    expect(await createPlantAndRefresh("g1", { name: "Monstera" })).toEqual({
      ok: false,
      error: "unknown",
    });
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe("updatePlantAndRefresh", () => {
  test("po sukcesie odświeża rośliny ogrodu rośliny", async () => {
    mockUpdate.mockResolvedValue({
      ok: true,
      data: { id: "p1", photoFailed: false },
    });

    await updatePlantAndRefresh(plant, { name: "Nowa" }, "remove");

    expect(mockUpdate).toHaveBeenCalledWith(plant, { name: "Nowa" }, "remove");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["plants", "g1"] });
  });

  test("po błędzie nie odświeża", async () => {
    mockUpdate.mockResolvedValue({ ok: false, error: "notAllowed" });

    await updatePlantAndRefresh(plant, { name: "Nowa" }, undefined);

    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe("deletePlantAndRefresh", () => {
  test("po sukcesie odświeża rośliny ogrodu", async () => {
    mockDelete.mockResolvedValue({ ok: true, data: null });

    await deletePlantAndRefresh(plant);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["plants", "g1"] });
  });

  test("po błędzie nie odświeża", async () => {
    mockDelete.mockResolvedValue({ ok: false, error: "notAllowed" });

    await deletePlantAndRefresh(plant);

    expect(invalidate).not.toHaveBeenCalled();
  });
});
