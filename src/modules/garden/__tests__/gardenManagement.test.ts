jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../api/gardenApi", () => ({
  renameGarden: jest.fn(),
  deleteGarden: jest.fn(),
  leaveGarden: jest.fn(),
  removeMember: jest.fn(),
}));
jest.mock("../../notifications/sync", () => ({ syncNotifications: jest.fn() }));

import { queryClient } from "../../../shared/api/queryClient";
import { syncNotifications } from "../../notifications/sync";
import {
    deleteGarden,
    leaveGarden,
    removeMember,
    renameGarden,
} from "../api/gardenApi";
import {
    deleteAndRefresh,
    leaveAndRefresh,
    removeMemberAndRefresh,
    renameAndRefresh,
} from "../gardenManagement";
import { useGardenStore } from "../store/gardenStore";

const mockRename = renameGarden as jest.Mock;
const mockDelete = deleteGarden as jest.Mock;
const mockLeave = leaveGarden as jest.Mock;
const mockRemove = removeMember as jest.Mock;
const mockSync = syncNotifications as jest.Mock;

const success = { ok: true, data: null };
const failure = { ok: false, error: "notAllowed" };

let invalidate: jest.SpyInstance;

beforeEach(() => {
  useGardenStore.setState({ activeGardenId: "g1" });
  invalidate = jest
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue(undefined);
});

afterEach(() => {
  invalidate.mockRestore();
  jest.resetAllMocks();
});

describe("renameAndRefresh", () => {
  test("po sukcesie odświeża listę ogrodów", async () => {
    mockRename.mockResolvedValue(success);
    expect(await renameAndRefresh("g1", "Nowa")).toEqual(success);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["gardens"] });
    expect(mockSync).not.toHaveBeenCalled();
  });

  test("po błędzie niczego nie odświeża", async () => {
    mockRename.mockResolvedValue(failure);
    expect(await renameAndRefresh("g1", "Nowa")).toEqual(failure);
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe("deleteAndRefresh", () => {
  test("usunięcie aktywnego ogrodu czyści wybór i odświeża listę", async () => {
    mockDelete.mockResolvedValue(success);
    await deleteAndRefresh("g1");
    expect(useGardenStore.getState().activeGardenId).toBeNull();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["gardens"] });
  });

  test("usunięcie innego ogrodu nie zmienia aktywnego", async () => {
    mockDelete.mockResolvedValue(success);
    await deleteAndRefresh("g2");
    expect(useGardenStore.getState().activeGardenId).toBe("g1");
  });

  test("po sukcesie przelicza plan powiadomień", async () => {
    mockDelete.mockResolvedValue(success);
    await deleteAndRefresh("g2");
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  test("po błędzie niczego nie zmienia", async () => {
    mockDelete.mockResolvedValue(failure);
    expect(await deleteAndRefresh("g1")).toEqual(failure);
    expect(useGardenStore.getState().activeGardenId).toBe("g1");
    expect(invalidate).not.toHaveBeenCalled();
    expect(mockSync).not.toHaveBeenCalled();
  });
});

describe("leaveAndRefresh", () => {
  test("opuszczenie aktywnego ogrodu czyści wybór i odświeża listę", async () => {
    mockLeave.mockResolvedValue(success);
    await leaveAndRefresh("g1");
    expect(useGardenStore.getState().activeGardenId).toBeNull();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["gardens"] });
  });

  test("po sukcesie przelicza plan powiadomień", async () => {
    mockLeave.mockResolvedValue(success);
    await leaveAndRefresh("g1");
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  test("po błędzie nie przelicza planu powiadomień", async () => {
    mockLeave.mockResolvedValue(failure);
    expect(await leaveAndRefresh("g1")).toEqual(failure);
    expect(mockSync).not.toHaveBeenCalled();
  });
});

describe("removeMemberAndRefresh", () => {
  test("po sukcesie odświeża listę członków tego ogrodu", async () => {
    mockRemove.mockResolvedValue(success);
    await removeMemberAndRefresh("g1", "u2");
    expect(mockRemove).toHaveBeenCalledWith("g1", "u2");
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["garden-members", "g1"],
    });
  });

  test("po błędzie niczego nie odświeża", async () => {
    mockRemove.mockResolvedValue(failure);
    expect(await removeMemberAndRefresh("g1", "u2")).toEqual(failure);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
