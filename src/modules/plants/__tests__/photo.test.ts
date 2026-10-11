import { computeResize, newPhotoPath } from "../photo";

describe("computeResize", () => {
  test("zdjęcie poziome większe niż limit: skaluje szerokość", () => {
    expect(computeResize(4000, 3000)).toEqual({ width: 800 });
  });

  test("zdjęcie pionowe większe niż limit: skaluje wysokość", () => {
    expect(computeResize(3000, 4000)).toEqual({ height: 800 });
  });

  test("zdjęcie nie większe niż limit: nie zmienia rozmiaru", () => {
    expect(computeResize(800, 600)).toBeNull();
    expect(computeResize(500, 700)).toBeNull();
  });
});

describe("newPhotoPath", () => {
  test("ścieżka zaczyna się od id ogrodu i kończy na .jpg, a kolejne się różnią", () => {
    const first = newPhotoPath("g1");
    const second = newPhotoPath("g1");

    expect(first).toMatch(/^g1\/[a-z0-9]+\.jpg$/);
    expect(first).not.toBe(second);
  });
});
