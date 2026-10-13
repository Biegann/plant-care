jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { useThemeStore } from "../store/themeStore";

let setScheme: jest.SpyInstance;

beforeEach(() => {
  setScheme = jest.spyOn(Appearance, "setColorScheme").mockImplementation();
});

afterEach(() => {
  setScheme.mockRestore();
  useThemeStore.setState({ preference: "system" });
});

describe("themeStore", () => {
  test("domyślnie motyw jest taki jak w telefonie", () => {
    expect(useThemeStore.getState().preference).toBe("system");
  });

  test("wybór ciemnego motywu trafia do systemu", () => {
    useThemeStore.getState().setPreference("dark");

    expect(useThemeStore.getState().preference).toBe("dark");
    expect(setScheme).toHaveBeenCalledWith("dark");
  });

  test("powrót do motywu telefonu zdejmuje wymuszenie", () => {
    useThemeStore.getState().setPreference("system");

    expect(setScheme).toHaveBeenCalledWith("unspecified");
  });

  test("wybór jest zapisywany w pamięci telefonu", async () => {
    useThemeStore.getState().setPreference("light");
    await new Promise((resolve) => setTimeout(resolve, 0));

    const raw = await AsyncStorage.getItem("theme-preference");
    expect(JSON.parse(raw as string).state).toEqual({ preference: "light" });
  });

  test("po wczytaniu z pamięci stosuje zapisany motyw", async () => {
    await AsyncStorage.setItem(
      "theme-preference",
      JSON.stringify({ state: { preference: "dark" }, version: 0 }),
    );

    await useThemeStore.persist.rehydrate();

    expect(useThemeStore.getState().preference).toBe("dark");
    expect(setScheme).toHaveBeenCalledWith("dark");
  });
});
