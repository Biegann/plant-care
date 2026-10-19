import { LIST_PAGE, chunk, listAllFiles, splitOwnedGardens, type StorageItem } from '../logic';

describe('splitOwnedGardens', () => {
  it('ogród z innymi członkami blokuje, ogród tylko z właścicielem znika', () => {
    const plan = splitOwnedGardens(
      [
        { id: 'g-dom', name: 'Dom', garden_members: [{ user_id: 'u1' }, { user_id: 'u2' }] },
        { id: 'g-balkon', name: 'Balkon', garden_members: [{ user_id: 'u1' }] },
        { id: 'g-altana', name: 'Altana', garden_members: [{ user_id: 'u3' }, { user_id: 'u1' }] },
      ],
      'u1',
    );
    expect(plan).toEqual({ blocking: ['Altana', 'Dom'], removed: ['g-balkon'] });
  });

  it('bez ogrodów nic nie blokuje i nic nie znika', () => {
    expect(splitOwnedGardens([], 'u1')).toEqual({ blocking: [], removed: [] });
  });
});

describe('listAllFiles', () => {
  const file = (name: string): StorageItem => ({ name, id: `id-${name}` });
  const folder = (name: string): StorageItem => ({ name, id: null });

  it('zbiera pliki z folderu i podfolderów', async () => {
    const tree: Record<string, StorageItem[]> = {
      g1: [file('a.jpg'), folder('journal')],
      'g1/journal': [file('b.jpg'), file('c.jpg')],
    };
    const paths = await listAllFiles(async (f) => tree[f] ?? [], 'g1');
    expect(paths).toEqual(['g1/a.jpg', 'g1/journal/b.jpg', 'g1/journal/c.jpg']);
  });

  it('pobiera kolejne strony, gdy strona jest pełna', async () => {
    const full = Array.from({ length: LIST_PAGE }, (_, i) => file(`p${i}.jpg`));
    const offsets: number[] = [];
    const paths = await listAllFiles(async (_f, offset) => {
      offsets.push(offset);
      return offset === 0 ? full : [file('last.jpg')];
    }, 'g1');
    expect(offsets).toEqual([0, LIST_PAGE]);
    expect(paths).toHaveLength(LIST_PAGE + 1);
    expect(paths?.at(-1)).toBe('g1/last.jpg');
  });

  it('błąd listowania w podfolderze zwraca null', async () => {
    const paths = await listAllFiles(
      async (f) => (f === 'g1' ? [folder('journal')] : null),
      'g1',
    );
    expect(paths).toBeNull();
  });

  it('pusty folder to pusta lista', async () => {
    expect(await listAllFiles(async () => [], 'g1')).toEqual([]);
  });
});

describe('chunk', () => {
  it('dzieli listę na porcje', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toEqual([]);
  });
});
