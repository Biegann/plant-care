// Czysta logika funkcji delete-account (bez Deno i sieci), testowana w Jest.
// index.ts importuje ten plik jako './logic.ts'

export const PHOTO_BUCKET = 'plant-photos';
export const LIST_PAGE = 1000;

export type ErrorCode = 'unauthorized' | 'ownsSharedGarden' | 'photosNotRemoved' | 'serverError';

export type OwnedGardenRow = {
  id: string;
  name: string;
  garden_members: { user_id: string }[];
};

// blocking: ogrody z innymi członkami (trzeba przekazać lub usunąć),
// removed: ogrody, które znikną razem z kontem
export function splitOwnedGardens(rows: OwnedGardenRow[], userId: string) {
  const blocking: string[] = [];
  const removed: string[] = [];
  for (const row of rows) {
    const shared = row.garden_members.some((member) => member.user_id !== userId);
    if (shared) blocking.push(row.name);
    else removed.push(row.id);
  }
  return { blocking: blocking.sort((a, b) => a.localeCompare(b, 'pl')), removed };
}

// Element listy Storage: folder ma id === null
export type StorageItem = { name: string; id: string | null };
export type ListPage = (folder: string, offset: number) => Promise<StorageItem[] | null>;

// Wszystkie pliki w folderze i podfolderach (np. <ogród>/journal); null = błąd listowania
export async function listAllFiles(listPage: ListPage, folder: string): Promise<string[] | null> {
  const paths: string[] = [];
  const subfolders: string[] = [];
  for (let offset = 0; ; offset += LIST_PAGE) {
    const items = await listPage(folder, offset);
    if (items === null) return null;
    for (const item of items) {
      if (item.id === null) subfolders.push(`${folder}/${item.name}`);
      else paths.push(`${folder}/${item.name}`);
    }
    if (items.length < LIST_PAGE) break;
  }
  for (const subfolder of subfolders) {
    const nested = await listAllFiles(listPage, subfolder);
    if (nested === null) return null;
    paths.push(...nested);
  }
  return paths;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}
