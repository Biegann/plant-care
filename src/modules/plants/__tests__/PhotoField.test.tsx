jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../pickPhoto", () => ({ pickPhoto: jest.fn() }));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { pickPhoto } from "../pickPhoto";
import { PhotoField } from "../ui/PhotoField";

const mockPick = pickPhoto as jest.Mock;
const onPicked = jest.fn();
const onRemoved = jest.fn();

const renderField = (previewUri: string | null = null) =>
  render(
    <PhotoField
      previewUri={previewUri}
      onPicked={onPicked}
      onRemoved={onRemoved}
    />,
  );

afterEach(() => jest.resetAllMocks());

describe("PhotoField", () => {
  test("bez zdjęcia: menu ma aparat i galerię, bez usuwania", async () => {
    const utils = await renderField();
    expect(utils.queryByTestId("sheet-action-take")).toBeNull();

    await fireEvent.press(utils.getByTestId("plant-photo-field"));

    expect(utils.getByTestId("sheet-action-take")).toBeTruthy();
    expect(utils.getByTestId("sheet-action-choose")).toBeTruthy();
    expect(utils.queryByTestId("sheet-action-remove")).toBeNull();
  });

  test("zrobione zdjęcie: zgłasza je i zamyka menu", async () => {
    const photo = { uri: "file:///a.jpg", data: new ArrayBuffer(4) };
    mockPick.mockResolvedValue({ status: "picked", photo });
    const utils = await renderField();
    await fireEvent.press(utils.getByTestId("plant-photo-field"));
    await fireEvent.press(utils.getByTestId("sheet-action-take"));

    await waitFor(() => expect(onPicked).toHaveBeenCalledWith(photo));
    expect(mockPick).toHaveBeenCalledWith("camera");
    expect(utils.queryByTestId("sheet-action-take")).toBeNull();
  });

  test("brak zgody na aparat: pokazuje komunikat", async () => {
    mockPick.mockResolvedValue({ status: "denied" });
    const utils = await renderField();
    await fireEvent.press(utils.getByTestId("plant-photo-field"));
    await fireEvent.press(utils.getByTestId("sheet-action-take"));

    expect(await utils.findByText("plants.photo.cameraDenied")).toBeTruthy();
    expect(onPicked).not.toHaveBeenCalled();
  });

  test("błąd przygotowania zdjęcia: pokazuje komunikat", async () => {
    mockPick.mockResolvedValue({ status: "failed" });
    const utils = await renderField();
    await fireEvent.press(utils.getByTestId("plant-photo-field"));
    await fireEvent.press(utils.getByTestId("sheet-action-choose"));

    expect(await utils.findByText("plants.photo.failed")).toBeTruthy();
    expect(mockPick).toHaveBeenCalledWith("gallery");
  });

  test("rezygnacja z wyboru: nic nie zgłasza i nie pokazuje błędu", async () => {
    mockPick.mockResolvedValue({ status: "canceled" });
    const utils = await renderField();
    await fireEvent.press(utils.getByTestId("plant-photo-field"));
    await fireEvent.press(utils.getByTestId("sheet-action-choose"));

    await waitFor(() => expect(mockPick).toHaveBeenCalledTimes(1));
    expect(onPicked).not.toHaveBeenCalled();
    expect(utils.queryByText("plants.photo.failed")).toBeNull();
  });

  test("ze zdjęciem: pokazuje podgląd, a usuwanie zgłasza usunięcie", async () => {
    const utils = await renderField("file:///a.jpg");
    expect(utils.getByTestId("plant-photo-preview")).toBeTruthy();

    await fireEvent.press(utils.getByTestId("plant-photo-field"));
    await fireEvent.press(utils.getByTestId("sheet-action-remove"));

    expect(onRemoved).toHaveBeenCalledTimes(1);
    expect(utils.queryByTestId("sheet-action-remove")).toBeNull();
  });

  test("Anuluj: zamyka menu bez wybierania zdjęcia", async () => {
    const utils = await renderField();
    await fireEvent.press(utils.getByTestId("plant-photo-field"));
    await fireEvent.press(utils.getByTestId("sheet-cancel"));

    expect(utils.queryByTestId("sheet-action-take")).toBeNull();
    expect(mockPick).not.toHaveBeenCalled();
  });
});
