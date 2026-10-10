jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGardenStore } from "../store/gardenStore";

describe("gardenStore", () => {
  test("zapamiętuje wybrany ogród", () => {
    useGardenStore.getState().setActiveGardenId("g1");
    expect(useGardenStore.getState().activeGardenId).toBe("g1");
  });

  test("wybór można wyczyścić", () => {
    useGardenStore.getState().setActiveGardenId("g1");
    useGardenStore.getState().setActiveGardenId(null);
    expect(useGardenStore.getState().activeGardenId).toBeNull();
  });

  test("do pamięci telefonu zapisuje tylko identyfikator ogrodu", async () => {
    useGardenStore.getState().setActiveGardenId("g1");
    await new Promise((resolve) => setTimeout(resolve, 0));

    const raw = await AsyncStorage.getItem("active-garden");
    expect(JSON.parse(raw as string).state).toEqual({ activeGardenId: "g1" });
  });

  test("po wczytaniu z pamięci ustawia znacznik hydrated", async () => {
    await useGardenStore.persist.rehydrate();
    expect(useGardenStore.getState().hydrated).toBe(true);
  });
});
