import {
    isValidGardenName,
    isValidInviteCode,
    normalizeInviteCode,
} from "../validation";

describe("walidacja ogrodów", () => {
  test("nazwa ogrodu: od 1 do 60 znaków po przycięciu", () => {
    expect(isValidGardenName("Balkon")).toBe(true);
    expect(isValidGardenName("   ")).toBe(false);
    expect(isValidGardenName("")).toBe(false);
    expect(isValidGardenName("a".repeat(60))).toBe(true);
    expect(isValidGardenName("a".repeat(61))).toBe(false);
  });

  test("kod zaproszenia jest normalizowany", () => {
    expect(normalizeInviteCode(" abcd-1234 ef ")).toBe("ABCD1234EF");
  });

  test("kod zaproszenia ma 10 znaków po normalizacji", () => {
    expect(isValidInviteCode("abcd1234ef")).toBe(true);
    expect(isValidInviteCode("ABCD-1234 EF")).toBe(true);
    expect(isValidInviteCode("ABC123")).toBe(false);
    expect(isValidInviteCode("")).toBe(false);
  });
});
