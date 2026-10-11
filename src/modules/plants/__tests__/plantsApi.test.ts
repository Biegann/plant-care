jest.mock("../../../shared/api/supabase", () => ({
  supabase: { from: jest.fn(), storage: { from: jest.fn() } },
}));

import { supabase } from "../../../shared/api/supabase";
import {
    createPlant,
    deletePlant,
    getPhotoUrl,
    listPlants,
    mapPlantError,
    toPlant,
    updatePlant,
    type Plant,
} from "../api/plantsApi";

const db = supabase as unknown as {
  from: jest.Mock;
  storage: { from: jest.Mock };
};
const storage = {
  upload: jest.fn(),
  remove: jest.fn(),
  createSignedUrl: jest.fn(),
};

// Udaje łańcuch zapytań Supabase (from().select().eq()...), który na końcu zwraca wynik
function chain(result: unknown) {
  const builder = {} as Record<string, jest.Mock>;
  [
    "select",
    "eq",
    "is",
    "order",
    "insert",
    "update",
    "delete",
    "single",
  ].forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  Object.assign(builder, {
    then: (resolve: (value: unknown) => unknown) => resolve(result),
  });
  return builder;
}

const plant: Plant = {
  id: "p1",
  gardenId: "g1",
  name: "Monstera",
  speciesName: null,
  locationNote: null,
  purchaseDate: null,
  notes: null,
  photoPath: "g1/old.jpg",
  createdAt: "2026-01-01",
};

const buffer = new ArrayBuffer(8);

beforeEach(() => {
  db.storage.from.mockReturnValue(storage);
});

afterEach(() => jest.resetAllMocks());

describe("mapPlantError i toPlant", () => {
  test("mapuje kody błędów bazy", () => {
    expect(mapPlantError({ code: "23514" })).toBe("invalidInput");
    expect(mapPlantError({ code: "42501" })).toBe("notAllowed");
    expect(mapPlantError({ message: "cokolwiek" })).toBe("unknown");
  });

  test("toPlant zamienia kolumny bazy na pola rośliny", () => {
    expect(
      toPlant({
        id: "p1",
        garden_id: "g1",
        name: "Fikus",
        species_name: "Ficus",
        location_note: "Salon",
        purchase_date: "2026-03-12",
        notes: "Lubi światło",
        photo_path: "g1/a.jpg",
        created_at: "2026-01-01",
      }),
    ).toEqual({
      id: "p1",
      gardenId: "g1",
      name: "Fikus",
      speciesName: "Ficus",
      locationNote: "Salon",
      purchaseDate: "2026-03-12",
      notes: "Lubi światło",
      photoPath: "g1/a.jpg",
      createdAt: "2026-01-01",
    });
  });
});

describe("listPlants", () => {
  test("pobiera niezarchiwizowane rośliny ogrodu", async () => {
    const builder = chain({
      data: [
        {
          id: "p1",
          garden_id: "g1",
          name: "Monstera",
          species_name: null,
          location_note: null,
          purchase_date: null,
          notes: null,
          photo_path: null,
          created_at: "2026-01-01",
        },
      ],
      error: null,
    });
    db.from.mockReturnValue(builder);

    const result = await listPlants("g1");

    expect(db.from).toHaveBeenCalledWith("plants");
    expect(builder.eq).toHaveBeenCalledWith("garden_id", "g1");
    expect(builder.is).toHaveBeenCalledWith("archived_at", null);
    expect(result.ok && result.data[0].name).toBe("Monstera");
  });

  test("błąd bazy jest zamieniany na kod", async () => {
    db.from.mockReturnValue(chain({ data: null, error: { code: "42501" } }));
    expect(await listPlants("g1")).toEqual({ ok: false, error: "notAllowed" });
  });
});

describe("createPlant", () => {
  test("zła nazwa: nie wysyła zapytania", async () => {
    expect(await createPlant("g1", { name: "  " })).toEqual({
      ok: false,
      error: "invalidName",
    });
    expect(await createPlant("g1", { name: "A", purchaseDate: "x" })).toEqual({
      ok: false,
      error: "invalidInput",
    });
    expect(db.from).not.toHaveBeenCalled();
  });

  test("bez zdjęcia: zapisuje przycięte dane i zwraca id", async () => {
    const insert = chain({ data: { id: "p1" }, error: null });
    db.from.mockReturnValueOnce(insert);

    const result = await createPlant("g1", {
      name: " Monstera ",
      speciesName: "",
    });

    expect(result).toEqual({
      ok: true,
      data: { id: "p1", photoFailed: false },
    });
    expect(insert.insert).toHaveBeenCalledWith({
      garden_id: "g1",
      name: "Monstera",
      species_name: null,
      location_note: null,
      purchase_date: null,
      notes: null,
    });
    expect(storage.upload).not.toHaveBeenCalled();
  });

  test("ze zdjęciem: wysyła plik do folderu ogrodu i zapisuje jego ścieżkę", async () => {
    const insert = chain({ data: { id: "p1" }, error: null });
    const update = chain({ error: null });
    db.from.mockReturnValueOnce(insert).mockReturnValueOnce(update);
    storage.upload.mockResolvedValue({ error: null });

    const result = await createPlant("g1", { name: "Monstera" }, buffer);

    expect(result).toEqual({
      ok: true,
      data: { id: "p1", photoFailed: false },
    });
    expect(storage.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^g1\/.+\.jpg$/),
      buffer,
      { contentType: "image/jpeg" },
    );
    expect(update.update).toHaveBeenCalledWith({
      photo_path: expect.stringMatching(/^g1\/.+\.jpg$/),
    });
  });

  test("nieudane wysłanie zdjęcia: roślina zapisana, flaga photoFailed", async () => {
    db.from.mockReturnValueOnce(chain({ data: { id: "p1" }, error: null }));
    storage.upload.mockResolvedValue({ error: { message: "x" } });

    const result = await createPlant("g1", { name: "Monstera" }, buffer);

    expect(result).toEqual({ ok: true, data: { id: "p1", photoFailed: true } });
    expect(db.from).toHaveBeenCalledTimes(1);
  });
});

describe("updatePlant", () => {
  test("0 zmienionych wierszy: brak uprawnień", async () => {
    db.from.mockReturnValueOnce(chain({ error: null, count: 0 }));
    expect(await updatePlant(plant, { name: "Nowa" }, undefined)).toEqual({
      ok: false,
      error: "notAllowed",
    });
  });

  test("nowe zdjęcie: wysyła je, zapisuje ścieżkę i usuwa stary plik", async () => {
    const fields = chain({ error: null, count: 1 });
    const photoUpdate = chain({ error: null });
    db.from.mockReturnValueOnce(fields).mockReturnValueOnce(photoUpdate);
    storage.upload.mockResolvedValue({ error: null });
    storage.remove.mockResolvedValue({ error: null });

    const result = await updatePlant(plant, { name: "Nowa" }, buffer);

    expect(result).toEqual({
      ok: true,
      data: { id: "p1", photoFailed: false },
    });
    expect(photoUpdate.update).toHaveBeenCalledWith({
      photo_path: expect.stringMatching(/^g1\/.+\.jpg$/),
    });
    expect(storage.remove).toHaveBeenCalledWith(["g1/old.jpg"]);
  });

  test("usunięcie zdjęcia: czyści ścieżkę i usuwa plik", async () => {
    const fields = chain({ error: null, count: 1 });
    const photoUpdate = chain({ error: null });
    db.from.mockReturnValueOnce(fields).mockReturnValueOnce(photoUpdate);
    storage.remove.mockResolvedValue({ error: null });

    const result = await updatePlant(plant, { name: "Nowa" }, "remove");

    expect(result).toEqual({
      ok: true,
      data: { id: "p1", photoFailed: false },
    });
    expect(photoUpdate.update).toHaveBeenCalledWith({ photo_path: null });
    expect(storage.remove).toHaveBeenCalledWith(["g1/old.jpg"]);
  });
});

describe("deletePlant", () => {
  test("usuwa roślinę, a potem jej zdjęcie", async () => {
    db.from.mockReturnValueOnce(chain({ error: null, count: 1 }));
    storage.remove.mockResolvedValue({ error: null });

    expect(await deletePlant(plant)).toEqual({ ok: true, data: null });
    expect(storage.remove).toHaveBeenCalledWith(["g1/old.jpg"]);
  });

  test("0 usuniętych wierszy: brak uprawnień i plik zostaje", async () => {
    db.from.mockReturnValueOnce(chain({ error: null, count: 0 }));

    expect(await deletePlant(plant)).toEqual({
      ok: false,
      error: "notAllowed",
    });
    expect(storage.remove).not.toHaveBeenCalled();
  });
});

describe("getPhotoUrl", () => {
  test("zwraca podpisany link na godzinę", async () => {
    storage.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://x/y" },
      error: null,
    });

    expect(await getPhotoUrl("g1/old.jpg")).toBe("https://x/y");
    expect(storage.createSignedUrl).toHaveBeenCalledWith("g1/old.jpg", 3600);
  });

  test("błąd: zwraca null", async () => {
    storage.createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "x" },
    });
    expect(await getPhotoUrl("g1/old.jpg")).toBeNull();
  });
});
