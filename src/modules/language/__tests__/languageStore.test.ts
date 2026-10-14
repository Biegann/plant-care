jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
// Wartość domyślna od razu, bo magazyn wczytuje pamięć już przy imporcie
jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageCode: "pl" }]),
}));
jest.mock("../../../shared/i18n", () => ({
  __esModule: true,
  default: { language: "pl", changeLanguage: jest.fn() },
}));
jest.mock("../../notifications/sync", () => ({ syncNotifications: jest.fn() }));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "../../../shared/i18n";
import { syncNotifications } from "../../notifications/sync";
import { resolveLanguage, useLanguageStore } from "../store/languageStore";

const mockI18n = i18n as unknown as {
  language: string;
  changeLanguage: jest.Mock;
};
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  (getLocales as jest.Mock).mockReturnValue([{ languageCode: "pl" }]);
  mockI18n.language = "pl";
  mockI18n.changeLanguage.mockImplementation(async (lng: string) => {
    mockI18n.language = lng;
  });
});

// clearAllMocks zamiast resetAllMocks: reset zepsułby atrapę AsyncStorage
afterEach(async () => {
  jest.clearAllMocks();
  useLanguageStore.setState({ preference: "system" });
  await AsyncStorage.clear();
});

describe("resolveLanguage", () => {
  test("systemowy: polski dla telefonu po polsku", () => {
    expect(resolveLanguage("system", "pl")).toBe("pl");
  });

  test("systemowy: angielski dla każdego innego języka i braku języka", () => {
    expect(resolveLanguage("system", "de")).toBe("en");
    expect(resolveLanguage("system", null)).toBe("en");
  });

  test("wybrany język wygrywa z językiem telefonu", () => {
    expect(resolveLanguage("en", "pl")).toBe("en");
    expect(resolveLanguage("pl", "de")).toBe("pl");
  });
});

describe("languageStore", () => {
  test("domyślnie język jest taki jak w telefonie", () => {
    expect(useLanguageStore.getState().preference).toBe("system");
  });

  test("wybór angielskiego zmienia język i przelicza powiadomienia", async () => {
    useLanguageStore.getState().setPreference("en");
    await flush();

    expect(useLanguageStore.getState().preference).toBe("en");
    expect(mockI18n.changeLanguage).toHaveBeenCalledWith("en");
    expect(syncNotifications).toHaveBeenCalledTimes(1);
  });

  test("ten sam język co obecny: niczego nie przelicza", async () => {
    useLanguageStore.getState().setPreference("pl");
    await flush();

    expect(mockI18n.changeLanguage).not.toHaveBeenCalled();
    expect(syncNotifications).not.toHaveBeenCalled();
  });

  test("powrót do systemowego na telefonie po niemiecku daje angielski", async () => {
    (getLocales as jest.Mock).mockReturnValue([{ languageCode: "de" }]);

    useLanguageStore.getState().setPreference("system");
    await flush();

    expect(mockI18n.changeLanguage).toHaveBeenCalledWith("en");
  });

  test("wybór jest zapisywany w pamięci telefonu", async () => {
    useLanguageStore.getState().setPreference("en");
    await flush();

    const raw = await AsyncStorage.getItem("language-preference");
    expect(JSON.parse(raw as string).state).toEqual({ preference: "en" });
  });

  test("po wczytaniu z pamięci stosuje zapisany język", async () => {
    await AsyncStorage.setItem(
      "language-preference",
      JSON.stringify({ state: { preference: "en" }, version: 0 }),
    );

    await useLanguageStore.persist.rehydrate();
    await flush();

    expect(useLanguageStore.getState().preference).toBe("en");
    expect(mockI18n.changeLanguage).toHaveBeenCalledWith("en");
    expect(syncNotifications).toHaveBeenCalledTimes(1);
  });
});
