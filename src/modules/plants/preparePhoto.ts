import { decode } from "base64-arraybuffer";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { computeResize, PHOTO_MAX_SIZE, PHOTO_QUALITY } from "./photo";

// Rozmiar i jakość pliku; domyślnie jak zdjęcia roślin i dziennika
export type PhotoSize = { maxSize?: number; quality?: number };

export async function preparePhoto(
  uri: string,
  width: number,
  height: number,
  { maxSize = PHOTO_MAX_SIZE, quality = PHOTO_QUALITY }: PhotoSize = {},
): Promise<ArrayBuffer> {
  // Telefon nie zawsze podaje wymiary zdjęcia; wtedy odczytujemy je sami
  if (width <= 0 || height <= 0) {
    const original = await ImageManipulator.manipulate(uri).renderAsync();
    width = original.width;
    height = original.height;
  }

  const context = ImageManipulator.manipulate(uri);
  const size = computeResize(width, height, maxSize);
  if (size) context.resize(size);

  const image = await context.renderAsync();
  const result = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: quality,
    base64: true,
  });

  return decode(result.base64 ?? "");
}
