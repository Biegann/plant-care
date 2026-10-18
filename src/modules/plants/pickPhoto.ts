import * as ImagePicker from "expo-image-picker";
import { preparePhoto, type PhotoSize } from "./preparePhoto";

export type PhotoSource = "camera" | "gallery";
// uri służy do podglądu w formularzu, data to zmniejszony plik do wysłania
export type PickedPhoto = { uri: string; data: ArrayBuffer };
export type PickPhotoResult =
  | { status: "picked"; photo: PickedPhoto }
  | { status: "canceled" }
  | { status: "denied" }
  | { status: "failed" };

// Z kadrowaniem telefon pokazuje po wyborze ekran przycinania do kwadratu.
// Kompresję robi preparePhoto, więc z telefonu bierzemy zdjęcie w pełnej jakości
const SQUARE_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 1,
};
const FREE_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 1,
};

export async function pickPhoto(
  source: PhotoSource,
  { square = true, ...size }: { square?: boolean } & PhotoSize = {},
): Promise<PickPhotoResult> {
  const OPTIONS = square ? SQUARE_OPTIONS : FREE_OPTIONS;
  try {
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return { status: "denied" };
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(OPTIONS);
    if (result.canceled) return { status: "canceled" };

    const asset = result.assets[0];
    const data = await preparePhoto(asset.uri, asset.width, asset.height, size);
    return { status: "picked", photo: { uri: asset.uri, data } };
  } catch {
    return { status: "failed" };
  }
}
