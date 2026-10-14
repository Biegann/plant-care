export const PHOTO_MAX_SIZE = 800;
export const PHOTO_QUALITY = 0.6;

export function computeResize(
  width: number,
  height: number,
  max: number = PHOTO_MAX_SIZE,
): { width: number } | { height: number } | null {
  if (Math.max(width, height) <= max) return null;
  return width >= height ? { width: max } : { height: max };
}

// Ścieżka pliku: <id ogrodu>/[<folder>/]<unikalna nazwa>.jpg
// (pierwszy fragment decyduje o dostępie; folder np. "journal" dla zdjęć z dziennika)
export function newPhotoPath(gardenId: string, folder?: string): string {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return folder ? `${gardenId}/${folder}/${id}.jpg` : `${gardenId}/${id}.jpg`;
}
