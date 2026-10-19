// Edge Function delete-account: usuwa konto zalogowanego użytkownika.
// Wywołują ją aplikacja i strona plantcareapp.pl/delete-account, obie po sprawdzeniu hasła
// ponownym logowaniem. Kolejność: blokada -> zdjęcia -> konto. Zdjęcia trzeba skasować
// przed kontem (potem reguły Storage nikogo nie wpuszczą); gdy się nie uda, konto zostaje
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import {
  LIST_PAGE,
  PHOTO_BUCKET,
  chunk,
  listAllFiles,
  splitOwnedGardens,
  type ErrorCode,
  type OwnedGardenRow,
} from './logic.ts';

function fail(status: number, error: ErrorCode, extra: Record<string, unknown> = {}): Response {
  return Response.json({ error, ...extra }, { status, headers: corsHeaders });
}

// Tylko nowe klucze (publishable/secret), jak w diagnose-plant
function namedKey(variable: 'SUPABASE_PUBLISHABLE_KEYS' | 'SUPABASE_SECRET_KEYS'): string | null {
  try {
    const key = JSON.parse(Deno.env.get(variable) ?? '{}').default;
    return typeof key === 'string' && key ? key : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  // zapytanie wstępne przeglądarki (strona www)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return fail(405, 'serverError');

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return fail(401, 'unauthorized');

  const url = Deno.env.get('SUPABASE_URL')!;
  const publishableKey = namedKey('SUPABASE_PUBLISHABLE_KEYS');
  const secretKey = namedKey('SUPABASE_SECRET_KEYS');
  if (!publishableKey || !secretKey) {
    console.error('missing publishable or secret key');
    return fail(500, 'serverError');
  }
  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return fail(401, 'unauthorized');
  const userId = userData.user.id;

  // Ogrody czytamy jako użytkownik (RLS), a pliki kasujemy kluczem serwisowym,
  // żeby usunięcie nie zależało od reguł Storage
  const { data: owned, error: ownedError } = await userClient
    .from('gardens')
    .select('id, name, garden_members(user_id)')
    .eq('owner_id', userId);
  if (ownedError) {
    console.error('gardens', ownedError.message);
    return fail(500, 'serverError');
  }
  const plan = splitOwnedGardens((owned ?? []) as OwnedGardenRow[], userId);
  if (plan.blocking.length > 0) return fail(409, 'ownsSharedGarden', { gardens: plan.blocking });

  const storage = createClient(url, secretKey, { auth: { persistSession: false } }).storage.from(
    PHOTO_BUCKET,
  );
  for (const gardenId of plan.removed) {
    const paths = await listAllFiles(async (folder, offset) => {
      const { data, error } = await storage.list(folder, { limit: LIST_PAGE, offset });
      if (error) console.error('list', folder, error.message);
      return error ? null : (data ?? []);
    }, gardenId);
    if (paths === null) return fail(500, 'photosNotRemoved');
    for (const batch of chunk(paths, LIST_PAGE)) {
      const { error } = await storage.remove(batch);
      if (error) {
        console.error('remove', gardenId, error.message);
        return fail(500, 'photosNotRemoved');
      }
    }
  }

  // RPC jeszcze raz sprawdza blokadę w bazie i kasuje konto wywołującego
  const { error: deleteError } = await userClient.rpc('delete_my_account');
  if (deleteError) {
    if (deleteError.message === 'owns_shared_garden') return fail(409, 'ownsSharedGarden', { gardens: [] });
    console.error('delete_my_account', deleteError.message);
    return fail(500, 'serverError');
  }

  return Response.json({ ok: true }, { headers: corsHeaders });
});
