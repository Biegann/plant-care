import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../../shared/api/supabase";
// Wspólne z Edge Function: kształt wyniku i limit opisu. logic.ts nie ma zależności
// od Deno ani sieci, więc można go dołączyć do aplikacji
import type { DiagnosisResult } from "../../../../supabase/functions/diagnose-plant/logic";
export { MAX_DESCRIPTION_LENGTH } from "../../../../supabase/functions/diagnose-plant/logic";

export type { DiagnosisResult };

// Limit pilnuje baza (consume_diagnosis_quota); tu tylko do pokazania "x z 5"
export const DAILY_DIAGNOSIS_LIMIT = 5;
// Zdjęcie do diagnozy: więcej szczegółów niż zdjęcia roślin (800 px, 60%)
export const DIAGNOSIS_PHOTO = { maxSize: 1024, quality: 0.8 };

export type DiagnosisErrorCode =
  | "network"
  | "limitReached"
  | "aiFailed"
  | "notFound"
  | "invalidInput"
  | "unauthorized"
  | "unknown";
export type DiagnosisApiResult<T> =
  { ok: true; data: T } | { ok: false; error: DiagnosisErrorCode };

export type DiagnosisRequest = {
  plantId: string;
  imageBase64: string;
  description: string;
  language: "pl" | "en";
};

export type Diagnosis = { result: DiagnosisResult; remaining: number };

// Kody, które zwraca funkcja diagnose-plant w polu "error"
const SERVER_CODES: DiagnosisErrorCode[] = [
  "limitReached",
  "aiFailed",
  "notFound",
  "invalidInput",
  "unauthorized",
];

export async function mapDiagnosisError(
  error: unknown,
): Promise<DiagnosisErrorCode> {
  if (error instanceof FunctionsFetchError) return "network";
  if (!(error instanceof FunctionsHttpError)) return "unknown";

  const response = error.context as Response;
  try {
    const body = await response.json();
    if (SERVER_CODES.includes(body?.error)) return body.error;
  } catch {
    // treść nie jest JSON-em, np. odpowiedź bramki Supabase
  }
  return response.status === 401 ? "unauthorized" : "unknown";
}

export async function diagnosePlant(
  request: DiagnosisRequest,
): Promise<DiagnosisApiResult<Diagnosis>> {
  const { data, error } = await supabase.functions.invoke("diagnose-plant", {
    body: {
      plantId: request.plantId,
      image: request.imageBase64,
      description: request.description,
      language: request.language,
    },
  });
  if (error) return { ok: false, error: await mapDiagnosisError(error) };
  if (!data?.result || typeof data.remaining !== "number")
    return { ok: false, error: "unknown" };

  return { ok: true, data: { result: data.result, remaining: data.remaining } };
}

// Ile diagnoz zostało dziś zalogowanemu użytkownikowi. Dzień liczy się w UTC,
// tak jak w bazie. RLS pokazuje tylko własne liczniki
export async function getRemainingDiagnoses(): Promise<
  DiagnosisApiResult<number>
> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("diagnosis_usage")
    .select("*")
    .eq("used_on", today)
    .maybeSingle();
  if (error) return { ok: false, error: "unknown" };

  const used = (data as { count: number } | null)?.count ?? 0;
  return { ok: true, data: Math.max(DAILY_DIAGNOSIS_LIMIT - used, 0) };
}
