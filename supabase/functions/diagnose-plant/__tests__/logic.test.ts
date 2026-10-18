import {
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_BASE64_LENGTH,
  buildPrompt,
  extractResponseText,
  parseInput,
  parseResult,
  systemInstruction,
  type PlantContext,
} from '../logic';

const PLANT_ID = '0a5a4b13-d193-43f1-bfd6-f767671f9dec';
const valid = { plantId: PLANT_ID, image: 'aGVsbG8=', language: 'pl' };

describe('parseInput', () => {
  it('przyjmuje poprawne dane, pusty opis zamienia na null', () => {
    expect(parseInput({ ...valid, description: '   ' })).toEqual({
      plantId: PLANT_ID,
      image: 'aGVsbG8=',
      description: null,
      language: 'pl',
    });
  });

  it('przycina opis', () => {
    expect(parseInput({ ...valid, description: ' żółte liście ' })?.description).toBe('żółte liście');
  });

  it.each([
    ['brak ciała', null],
    ['zły uuid', { ...valid, plantId: 'abc' }],
    ['puste zdjęcie', { ...valid, image: '' }],
    ['zdjęcie nie w base64', { ...valid, image: 'ab$cd' }],
    ['za duże zdjęcie', { ...valid, image: 'A'.repeat(MAX_IMAGE_BASE64_LENGTH + 1) }],
    ['zły język', { ...valid, language: 'de' }],
    ['opis nie tekstem', { ...valid, description: 5 }],
    ['za długi opis', { ...valid, description: 'a'.repeat(MAX_DESCRIPTION_LENGTH + 1) }],
  ])('odrzuca: %s', (_name, body) => {
    expect(parseInput(body)).toBeNull();
  });
});

const plant: PlantContext = {
  name: 'Rybcia',
  speciesName: 'Monstera',
  speciesKey: 'monstera',
  locationNote: null,
  notes: null,
  tasks: [{ type: 'other', customLabel: 'Zraszanie', intervalDays: 3, nextDueOn: '2026-10-20' }],
  recentCare: [],
};

describe('buildPrompt', () => {
  it('zawiera kontekst rośliny, harmonogram i opis', () => {
    const prompt = buildPrompt(
      { plantId: PLANT_ID, image: 'x', description: 'brązowe końcówki', language: 'pl' },
      plant,
      '2026-10-18',
    );
    expect(prompt).toContain('Today: 2026-10-18');
    expect(prompt).toContain('Species (owner\'s text): Monstera');
    expect(prompt).toContain('- other (Zraszanie) every 3 days, next due 2026-10-20');
    expect(prompt).toContain('Recent care: nothing recorded in the app');
    expect(prompt).toContain('problem: brązowe końcówki');
    expect(prompt).not.toContain('Location');
  });

  it('skraca długie notatki', () => {
    const prompt = buildPrompt(
      { plantId: PLANT_ID, image: 'x', description: null, language: 'en' },
      { ...plant, notes: 'n'.repeat(400) },
      '2026-10-18',
    );
    expect(prompt).toContain(`${'n'.repeat(300)}…`);
    expect(prompt).not.toContain('n'.repeat(301));
  });
});

describe('systemInstruction', () => {
  it('ustawia język odpowiedzi', () => {
    expect(systemInstruction('pl')).toContain('in Polish');
    expect(systemInstruction('en')).toContain('in English');
  });
});

const good = {
  notPlant: false,
  summary: ' Prawdopodobnie przelanie. ',
  causes: [{ name: 'Przelanie', confidence: 'high', explanation: 'Mokre podłoże.' }],
  steps: ['Przesusz podłoże', ''],
  worryIf: ['Łodyga mięknie'],
};

describe('parseResult', () => {
  it('przyjmuje poprawny wynik, przycina teksty i usuwa puste kroki', () => {
    expect(parseResult(good)).toEqual({
      notPlant: false,
      summary: 'Prawdopodobnie przelanie.',
      causes: [{ name: 'Przelanie', confidence: 'high', explanation: 'Mokre podłoże.' }],
      steps: ['Przesusz podłoże'],
      worryIf: ['Łodyga mięknie'],
    });
  });

  it('obcina za długie listy', () => {
    const r = parseResult({ ...good, steps: ['1', '2', '3', '4', '5', '6'] });
    expect(r?.steps).toHaveLength(5);
  });

  it.each([
    ['nie obiekt', 'tekst'],
    ['brak podsumowania', { ...good, summary: '' }],
    ['zła pewność', { ...good, causes: [{ name: 'a', confidence: 'sure', explanation: 'b' }] }],
    ['brak notPlant', { ...good, notPlant: undefined }],
    ['kroki nie listą', { ...good, steps: 'a' }],
  ])('odrzuca: %s', (_name, raw) => {
    expect(parseResult(raw)).toBeNull();
  });
});

describe('extractResponseText', () => {
  it('skleja tekst i pomija części z myśleniem', () => {
    const response = {
      candidates: [{ content: { parts: [{ text: 'myślę', thought: true }, { text: '{"a"' }, { text: ':1}' }] } }],
    };
    expect(extractResponseText(response)).toBe('{"a":1}');
  });

  it('zwraca null bez kandydatów', () => {
    expect(extractResponseText({ candidates: [] })).toBeNull();
    expect(extractResponseText(null)).toBeNull();
  });
});
