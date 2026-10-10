jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../api/gardenApi", () => ({
  createGarden: jest.fn(),
  joinGarden: jest.fn(),
}));

import { queryClient } from "../../../shared/api/queryClient";
import { createGarden, joinGarden } from "../api/gardenApi";
import { createAndActivate, joinAndActivate } from "../gardenActions";
import { useGardenStore } from "../store/gardenStore";

const mockCreate = createGarden as jest.Mock;
const mockJoin = joinGarden as jest.Mock;

let invalidate: jest.SpyInstance;

beforeEach(() => {
  useGardenStore.setState({ activeGardenId: null });
  invalidate = jest
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue(undefined);
});

afterEach(() => {
  invalidate.mockRestore();
  jest.resetAllMocks();
});

describe("createAndActivate", () => {
  test("po sukcesie ustawia aktywny ogród i odświeża listę", async () => {
    mockCreate.mockResolvedValue({ ok: true, data: "g1" });

    const result = await createAndActivate("Dom");

    expect(result).toEqual({ ok: true, data: "g1" });
    expect(useGardenStore.getState().activeGardenId).toBe("g1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["gardens"] });
  });

  test("po błędzie niczego nie zmienia", async () => {
    mockCreate.mockResolvedValue({ ok: false, error: "unknown" });

    const result = await createAndActivate("Dom");

    expect(result).toEqual({ ok: false, error: "unknown" });
    expect(useGardenStore.getState().activeGardenId).toBeNull();
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe("joinAndActivate", () => {
  test("po sukcesie ustawia aktywny ogród i odświeża listę", async () => {
    mockJoin.mockResolvedValue({ ok: true, data: "g2" });

    const result = await joinAndActivate("ABCD1234EF");

    expect(result).toEqual({ ok: true, data: "g2" });
    expect(useGardenStore.getState().activeGardenId).toBe("g2");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["gardens"] });
  });

  test("po błędzie niczego nie zmienia", async () => {
    mockJoin.mockResolvedValue({ ok: false, error: "invalidCode" });

    const result = await joinAndActivate("ABCD1234EF");

    expect(result).toEqual({ ok: false, error: "invalidCode" });
    expect(useGardenStore.getState().activeGardenId).toBeNull();
    expect(invalidate).not.toHaveBeenCalled();
  });
});
