import {
    isValidEmail,
    isValidPassword,
    validateCredentials,
} from "../validation";

describe("walidacja logowania", () => {
  test("odrzuca niepoprawny e-mail", () => {
    expect(isValidEmail("abc")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
  });

  test("akceptuje poprawny e-mail", () => {
    expect(isValidEmail("anna@example.com")).toBe(true);
  });

  test("hasło musi mieć co najmniej 8 znaków", () => {
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("12345678")).toBe(true);
  });

  test("zwraca kody błędów dla złych danych", () => {
    expect(validateCredentials("abc", "123")).toEqual({
      email: "invalidEmail",
      password: "shortPassword",
    });
  });

  test("brak błędów dla poprawnych danych", () => {
    expect(validateCredentials("anna@example.com", "haslo1234")).toEqual({});
  });
});
