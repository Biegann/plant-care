jest.mock("../../../shared/api/supabase", () => ({
  supabase: { from: jest.fn(), functions: { invoke: jest.fn() } },
}));

import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";
import { supabase } from "../../../shared/api/supabase";
import {
  diagnosePlant,
  getRemainingDiagnoses,
  mapDiagnosisError,
  type DiagnosisResult,
} from "../api/diagnosisApi";

const db = supabase as unknown as {
  from: jest.Mock;
  functions: { invoke: jest.Mock };
};

// Udaje odpowiedź funkcji o danym statusie i treści (jak Response z fetch)
const httpError = (status: number, body: unknown) =>
  new FunctionsHttpError({
    status,
    json: async () => {
      if (body === undefined) throw new Error("not json");
      return body;
    },
  });

function chain(result: unknown) {
  const builder = {} as Record<string, jest.Mock>;
  ["select", "eq", "maybeSingle"].forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  Object.assign(builder, {
    then: (resolve: (value: unknown) => unknown) => resolve(result),
  });
  return builder;
}

const result: DiagnosisResult = {
  notPlant: false,
  summary: "Przesuszenie",
  causes: [
    { name: "Za mało wody", confidence: "high", explanation: "Suche liście" },
  ],
  steps: ["Podlej"],
  worryIf: [],
};

const request = {
  plantId: "p1",
  imageBase64: "AQID",
  description: "żółte liście",
  language: "pl" as const,
};

afterEach(() => jest.resetAllMocks());

describe("mapDiagnosisError", () => {
  test("brak sieci", async () => {
    expect(await mapDiagnosisError(new FunctionsFetchError({}))).toBe(
      "network",
    );
  });

  test.each([
    "limitReached",
    "aiFailed",
    "notFound",
    "invalidInput",
    "unauthorized",
  ])("kod z funkcji: %s", async (code) => {
    expect(await mapDiagnosisError(httpError(400, { error: code }))).toBe(code);
  });

  test("401 z bramki Supabase (bez naszego kodu): unauthorized", async () => {
    expect(
      await mapDiagnosisError(httpError(401, { msg: "Invalid JWT" })),
    ).toBe("unauthorized");
  });

  test("nieznany kod albo treść nie w JSON: unknown", async () => {
    expect(await mapDiagnosisError(httpError(500, { error: "boom" }))).toBe(
      "unknown",
    );
    expect(await mapDiagnosisError(httpError(500, undefined))).toBe("unknown");
    expect(await mapDiagnosisError(new FunctionsRelayError({}))).toBe(
      "unknown",
    );
  });
});

describe("diagnosePlant", () => {
  test("wysyła zdjęcie, opis i język do funkcji diagnose-plant", async () => {
    db.functions.invoke.mockResolvedValue({
      data: { result, remaining: 3 },
      error: null,
    });

    expect(await diagnosePlant(request)).toEqual({
      ok: true,
      data: { result, remaining: 3 },
    });
    expect(db.functions.invoke).toHaveBeenCalledWith("diagnose-plant", {
      body: {
        plantId: "p1",
        image: "AQID",
        description: "żółte liście",
        language: "pl",
      },
    });
  });

  test("błąd funkcji: kod błędu", async () => {
    db.functions.invoke.mockResolvedValue({
      data: null,
      error: httpError(429, { error: "limitReached" }),
    });
    expect(await diagnosePlant(request)).toEqual({
      ok: false,
      error: "limitReached",
    });
  });

  test("odpowiedź bez wyniku: unknown", async () => {
    db.functions.invoke.mockResolvedValue({ data: {}, error: null });
    expect(await diagnosePlant(request)).toEqual({
      ok: false,
      error: "unknown",
    });
  });
});

describe("getRemainingDiagnoses", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-18T23:30:00Z") });
  });
  afterEach(() => jest.useRealTimers());

  test("odejmuje dzisiejsze diagnozy od limitu (dzień w UTC)", async () => {
    const query = chain({ data: { count: 2 }, error: null });
    db.from.mockReturnValue(query);

    expect(await getRemainingDiagnoses()).toEqual({ ok: true, data: 3 });
    expect(db.from).toHaveBeenCalledWith("diagnosis_usage");
    expect(query.eq).toHaveBeenCalledWith("used_on", "2026-10-18");
  });

  test("brak wiersza na dziś: pełny limit", async () => {
    db.from.mockReturnValue(chain({ data: null, error: null }));
    expect(await getRemainingDiagnoses()).toEqual({ ok: true, data: 5 });
  });

  test("błąd bazy: unknown", async () => {
    db.from.mockReturnValue(chain({ data: null, error: { code: "42501" } }));
    expect(await getRemainingDiagnoses()).toEqual({
      ok: false,
      error: "unknown",
    });
  });
});
