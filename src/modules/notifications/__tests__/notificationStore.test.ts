jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotificationStore } from "../store/notificationStore";

const settings = () => {
  const { enabled, hour, minute, ownerUserId } = useNotificationStore.getState();
  return { enabled, hour, minute, ownerUserId };
};

beforeEach(() => {
  useNotificationStore.setState({
    enabled: true,
    hour: 18,
    minute: 30,
    ownerUserId: "u1",
  });
});

describe("notificationStore.claimFor", () => {
  test("to samo konto zachowuje swoje ustawienia", () => {
    useNotificationStore.getState().claimFor("u1");
    expect(settings()).toEqual({
      enabled: true,
      hour: 18,
      minute: 30,
      ownerUserId: "u1",
    });
  });

  test("inne konto zaczyna od ustawień domyślnych", () => {
    useNotificationStore.getState().claimFor("u2");
    expect(settings()).toEqual({
      enabled: false,
      hour: 9,
      minute: 0,
      ownerUserId: "u2",
    });
  });

  test("ustawienia bez właściciela przejmuje zalogowane konto", () => {
    useNotificationStore.setState({ ownerUserId: null });
    useNotificationStore.getState().claimFor("u2");
    expect(settings()).toEqual({
      enabled: true,
      hour: 18,
      minute: 30,
      ownerUserId: "u2",
    });
  });

  test("właściciel jest zapisywany w pamięci telefonu", async () => {
    useNotificationStore.getState().claimFor("u2");
    await new Promise((resolve) => setTimeout(resolve, 0));

    const raw = await AsyncStorage.getItem("notification-settings");
    expect(JSON.parse(raw as string).state).toEqual({
      enabled: false,
      hour: 9,
      minute: 0,
      ownerUserId: "u2",
    });
  });
});
