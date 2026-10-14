jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock("../preparePhoto", () => ({ preparePhoto: jest.fn() }));

import * as ImagePicker from "expo-image-picker";
import { pickPhoto } from "../pickPhoto";
import { preparePhoto } from "../preparePhoto";

const mockPermission = ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const mockCamera = ImagePicker.launchCameraAsync as jest.Mock;
const mockLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockPrepare = preparePhoto as jest.Mock;

const asset = { uri: "file:///zdjecie.jpg", width: 4000, height: 3000 };
const data = new ArrayBuffer(4);

afterEach(() => jest.resetAllMocks());

describe("pickPhoto", () => {
  test("aparat bez zgody: zwraca denied i nie otwiera aparatu", async () => {
    mockPermission.mockResolvedValue({ granted: false });

    expect(await pickPhoto("camera")).toEqual({ status: "denied" });
    expect(mockCamera).not.toHaveBeenCalled();
  });

  test("aparat ze zgodą: zwraca przygotowane zdjęcie", async () => {
    mockPermission.mockResolvedValue({ granted: true });
    mockCamera.mockResolvedValue({ canceled: false, assets: [asset] });
    mockPrepare.mockResolvedValue(data);

    expect(await pickPhoto("camera")).toEqual({
      status: "picked",
      photo: { uri: asset.uri, data },
    });
    expect(mockPrepare).toHaveBeenCalledWith(asset.uri, 4000, 3000);
  });

  test("galeria: nie pyta o zgodę na aparat", async () => {
    mockLibrary.mockResolvedValue({ canceled: false, assets: [asset] });
    mockPrepare.mockResolvedValue(data);

    const result = await pickPhoto("gallery");

    expect(result.status).toBe("picked");
    expect(mockPermission).not.toHaveBeenCalled();
    expect(mockLibrary).toHaveBeenCalledWith({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
  });

  test("rezygnacja z wyboru: zwraca canceled", async () => {
    mockLibrary.mockResolvedValue({ canceled: true, assets: null });

    expect(await pickPhoto("gallery")).toEqual({ status: "canceled" });
    expect(mockPrepare).not.toHaveBeenCalled();
  });

  test("błąd przygotowania zdjęcia: zwraca failed", async () => {
    mockLibrary.mockResolvedValue({ canceled: false, assets: [asset] });
    mockPrepare.mockRejectedValue(new Error("boom"));

    expect(await pickPhoto("gallery")).toEqual({ status: "failed" });
  });

  test("bez kadrowania: nie pokazuje ekranu przycinania do kwadratu", async () => {
    mockLibrary.mockResolvedValue({ canceled: false, assets: [asset] });
    mockPrepare.mockResolvedValue(data);

    await pickPhoto("gallery", { square: false });

    expect(mockLibrary).toHaveBeenCalledWith({
      mediaTypes: ["images"],
      quality: 1,
    });
  });
});
