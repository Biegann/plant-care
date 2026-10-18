const mockManipulate = jest.fn();

jest.mock("expo-image-manipulator", () => ({
  ImageManipulator: { manipulate: (uri: string) => mockManipulate(uri) },
  SaveFormat: { JPEG: "jpeg" },
}));

import { preparePhoto } from "../preparePhoto";

// "AQID" to bajty 1, 2, 3 zapisane w base64
const makeContext = (width: number, height: number) => {
  const saveAsync = jest.fn().mockResolvedValue({ base64: "AQID" });
  const context = {
    resize: jest.fn(),
    renderAsync: jest.fn().mockResolvedValue({ width, height, saveAsync }),
  };
  return { context, saveAsync };
};

afterEach(() => jest.resetAllMocks());

describe("preparePhoto", () => {
  test("duże zdjęcie: zmniejsza dłuższy bok i zapisuje JPEG 60%", async () => {
    const { context, saveAsync } = makeContext(800, 600);
    mockManipulate.mockReturnValue(context);

    const data = await preparePhoto("file:///a.jpg", 4000, 3000);

    expect(context.resize).toHaveBeenCalledWith({ width: 800 });
    expect(saveAsync).toHaveBeenCalledWith({
      format: "jpeg",
      compress: 0.6,
      base64: true,
    });
    expect(Array.from(new Uint8Array(data))).toEqual([1, 2, 3]);
  });

  test("własny rozmiar i jakość (diagnoza AI)", async () => {
    const { context, saveAsync } = makeContext(1024, 768);
    mockManipulate.mockReturnValue(context);

    await preparePhoto("file:///a.jpg", 4000, 3000, {
      maxSize: 1024,
      quality: 0.8,
    });

    expect(context.resize).toHaveBeenCalledWith({ width: 1024 });
    expect(saveAsync).toHaveBeenCalledWith({
      format: "jpeg",
      compress: 0.8,
      base64: true,
    });
  });

  test("małe zdjęcie: nie zmienia rozmiaru", async () => {
    const { context } = makeContext(500, 400);
    mockManipulate.mockReturnValue(context);

    await preparePhoto("file:///a.jpg", 500, 400);

    expect(context.resize).not.toHaveBeenCalled();
  });

  test("brak wymiarów: odczytuje je ze zdjęcia i dopiero wtedy zmniejsza", async () => {
    const probe = makeContext(3000, 4000);
    const main = makeContext(600, 800);
    mockManipulate
      .mockReturnValueOnce(probe.context)
      .mockReturnValueOnce(main.context);

    await preparePhoto("file:///a.jpg", 0, 0);

    expect(probe.context.resize).not.toHaveBeenCalled();
    expect(main.context.resize).toHaveBeenCalledWith({ height: 800 });
  });
});
