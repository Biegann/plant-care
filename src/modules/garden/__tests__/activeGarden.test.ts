import { resolveActiveGarden } from "../activeGarden";

const gardens = [
  { id: "1", name: "Balkon", role: "owner" as const },
  { id: "2", name: "Dom", role: "member" as const },
];

describe("resolveActiveGarden", () => {
  test("brak ogrodów: zwraca null", () => {
    expect(resolveActiveGarden([], "cokolwiek")).toBeNull();
  });

  test("zapamiętany ogród istnieje: używa go", () => {
    expect(resolveActiveGarden(gardens, "2")?.name).toBe("Dom");
  });

  test("zapamiętany ogród nie istnieje (np. usunięty): bierze pierwszy", () => {
    expect(resolveActiveGarden(gardens, "usuniety")?.name).toBe("Balkon");
  });

  test("nic nie zapamiętano: bierze pierwszy", () => {
    expect(resolveActiveGarden(gardens, null)?.name).toBe("Balkon");
  });
});
