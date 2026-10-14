jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWelcomeStore } from "../store/welcomeStore";

afterEach(async () => {
  useWelcomeStore.setState({ seen: false });
  await AsyncStorage.clear();
});

describe("welcomeStore", () => {
  test("po wczytaniu pustej pamięci powitanie jest do pokazania", async () => {
    await useWelcomeStore.persist.rehydrate();

    expect(useWelcomeStore.getState().hydrated).toBe(true);
    expect(useWelcomeStore.getState().seen).toBe(false);
  });

  test("oznaczenie jako widziane zapisuje się w pamięci telefonu", async () => {
    useWelcomeStore.getState().markSeen();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const raw = await AsyncStorage.getItem("welcome");
    expect(JSON.parse(raw as string).state).toEqual({ seen: true });
  });

  test("po wczytaniu z pamięci pamięta, że powitanie było widziane", async () => {
    await AsyncStorage.setItem(
      "welcome",
      JSON.stringify({ state: { seen: true }, version: 0 }),
    );

    await useWelcomeStore.persist.rehydrate();

    expect(useWelcomeStore.getState().seen).toBe(true);
  });
});
