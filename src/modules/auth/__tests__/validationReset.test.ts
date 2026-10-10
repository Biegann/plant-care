import { isValidCode, validateResetInput } from "../validation";

describe("walidacja resetu hasła", () => {
  test("kod to 6 do 8 cyfr", () => {
    expect(isValidCode("123456")).toBe(true);
    expect(isValidCode(" 12345678 ")).toBe(true);
  });

  test("odrzuca za krótki kod i litery", () => {
    expect(isValidCode("12345")).toBe(false);
    expect(isValidCode("12ab56")).toBe(false);
    expect(isValidCode("")).toBe(false);
  });

  test("zwraca kody błędów dla złych danych", () => {
    expect(validateResetInput("abc", "123")).toEqual({
      code: "invalidCode",
      password: "shortPassword",
    });
    expect(validateResetInput("123456", "noweHaslo1")).toEqual({});
  });
});
