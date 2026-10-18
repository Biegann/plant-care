// Edge Function diagnose-plant: zdjęcie rośliny -> podpowiedź Gemini.
// Klucz Gemini jest tylko w sekretach Supabase (GEMINI_API_KEY), nigdy w aplikacji.
// Roślinę czytamy jako zalogowany użytkownik (RLS sprawdza członkostwo w ogrodzie),
// a kluczem serwisowym zmieniamy tylko licznik limitu diagnoz
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  MODEL,
  RESULT_SCHEMA,
  buildPrompt,
  extractResponseText,
  parseInput,
  parseResult,
  systemInstruction,
  type PlantContext,
} from './logic.ts';

const GEMINI_TIMEOUT_MS = 45_000;

type ErrorCode = 'unauthorized' | 'invalidInput' | 'notFound' | 'limitReached' | 'aiFailed' | 'serverError';

function fail(status: number, error: ErrorCode): Response {
  return Response.json({ error }, { status });
}

// Nowe klucze (publishable/secret) z zapasem na stare (anon/service_role)
function publishableKey(): string {
  const keys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  return keys ? JSON.parse(keys).default : Deno.env.get('SUPABASE_ANON_KEY')!;
}
function secretKey(): string {
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  return keys ? JSON.parse(keys).default : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
}

async function callGemini(apiKey: string, image: string, prompt: string, system: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [
          {
            role: 'user',
            parts: [{ inlineData: { mimeType: 'image/jpeg', data: image } }, { text: prompt }],
          },
        ],
        generationConfig: {
          thinkingConfig: { thinkingLevel: 'low' },
          responseMimeType: 'application/json',
          responseJsonSchema: RESULT_SCHEMA,
          maxOutputTokens: 4096,
        },
      }),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    },
  );
  if (!res.ok) {
    // treść błędu Google trafia tylko do logów funkcji, nie do aplikacji
    console.error('gemini http', res.status, (await res.text()).slice(0, 1000));
    return null;
  }
  const json = await res.json();
  console.log('gemini usage', JSON.stringify(json.usageMetadata ?? null));
  const text = extractResponseText(json);
  if (text === null) {
    console.error('gemini empty', JSON.stringify(json).slice(0, 1000));
    return null;
  }
  try {
    return parseResult(JSON.parse(text));
  } catch {
    console.error('gemini bad json', text.slice(0, 1000));
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return fail(405, 'invalidInput');

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return fail(401, 'unauthorized');

  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, publishableKey(), {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return fail(401, 'unauthorized');
  const userId = userData.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, 'invalidInput');
  }
  const input = parseInput(body);
  if (!input) return fail(400, 'invalidInput');

  // RLS: osoba spoza ogrodu dostaje pusty wynik, czyli notFound
  const { data: plant, error: plantError } = await userClient
    .from('plants')
    .select('name, species_name, species_key, location_note, notes')
    .eq('id', input.plantId)
    .maybeSingle();
  if (plantError) {
    console.error('plant', plantError.message);
    return fail(500, 'serverError');
  }
  if (!plant) return fail(404, 'notFound');

  const [tasksRes, careRes] = await Promise.all([
    userClient
      .from('care_tasks')
      .select('type, custom_label, interval_days, next_due_on')
      .eq('plant_id', input.plantId)
      .eq('enabled', true),
    userClient
      .from('care_log')
      .select('type, custom_label, done_on')
      .eq('plant_id', input.plantId)
      .order('done_on', { ascending: false })
      .limit(5),
  ]);
  if (tasksRes.error || careRes.error) {
    console.error('context', tasksRes.error?.message, careRes.error?.message);
    return fail(500, 'serverError');
  }

  const context: PlantContext = {
    name: plant.name,
    speciesName: plant.species_name,
    speciesKey: plant.species_key,
    locationNote: plant.location_note,
    notes: plant.notes,
    tasks: tasksRes.data.map((t) => ({
      type: t.type,
      customLabel: t.custom_label,
      intervalDays: t.interval_days,
      nextDueOn: t.next_due_on,
    })),
    recentCare: careRes.data.map((c) => ({
      type: c.type,
      customLabel: c.custom_label,
      doneOn: c.done_on,
    })),
  };

  const admin = createClient(url, secretKey(), { auth: { persistSession: false } });
  const { data: remaining, error: quotaError } = await admin.rpc('consume_diagnosis_quota', {
    p_user: userId,
  });
  if (quotaError) {
    console.error('quota', quotaError.message);
    return fail(500, 'serverError');
  }
  if (remaining < 0) return fail(429, 'limitReached');

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const today = new Date().toISOString().slice(0, 10);
  let result = null;
  try {
    result = apiKey
      ? await callGemini(
          apiKey,
          input.image,
          buildPrompt(input, context, today),
          systemInstruction(input.language),
        )
      : null;
  } catch (e) {
    console.error('gemini call', String(e));
  }

  if (!result) {
    // błąd po naszej stronie: diagnoza wraca do limitu
    const { error: refundError } = await admin.rpc('refund_diagnosis_quota', { p_user: userId });
    if (refundError) console.error('refund', refundError.message);
    return fail(502, 'aiFailed');
  }

  return Response.json({ result, remaining });
});
