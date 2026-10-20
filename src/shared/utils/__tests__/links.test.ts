jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));
jest.mock("i18next", () => ({ language: "pl" }));

import * as WebBrowser from "expo-web-browser";
import { openPrivacyPolicy, privacyPolicyUrl } from "../links";

afterEach(() => jest.resetAllMocks());

describe("privacyPolicyUrl", () => {
  test("polski prowadzi do /privacy/, inne języki do /en/privacy/", () => {
    expect(privacyPolicyUrl("pl")).toBe("https://plantcareapp.pl/privacy/");
    expect(privacyPolicyUrl("pl-PL")).toBe("https://plantcareapp.pl/privacy/");
    expect(privacyPolicyUrl("en")).toBe("https://plantcareapp.pl/en/privacy/");
    expect(privacyPolicyUrl(undefined)).toBe(
      "https://plantcareapp.pl/en/privacy/",
    );
  });
});

describe("openPrivacyPolicy", () => {
  test("otwiera politykę w języku aplikacji", async () => {
    await openPrivacyPolicy();
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
      "https://plantcareapp.pl/privacy/",
    );
  });
});
