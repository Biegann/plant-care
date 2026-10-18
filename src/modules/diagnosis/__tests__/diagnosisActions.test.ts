jest.mock("../../../shared/api/supabase", () => ({ supabase: {} }));
jest.mock("../api/diagnosisApi", () => ({ diagnosePlant: jest.fn() }));
jest.mock("../../journal/journalActions", () => ({
  createJournalEntryAndRefresh: jest.fn(),
}));
jest.mock("../../plants/preparePhoto", () => ({ preparePhoto: jest.fn() }));

import { queryClient } from "../../../shared/api/queryClient";
import { createJournalEntryAndRefresh } from "../../journal/journalActions";
import { preparePhoto } from "../../plants/preparePhoto";
import { diagnosePlant } from "../api/diagnosisApi";
import {
  diagnosePlantAndRefresh,
  saveDiagnosisToJournal,
} from "../diagnosisActions";
import { remainingDiagnosesKey } from "../hooks/useRemainingDiagnoses";

const mockDiagnose = diagnosePlant as jest.Mock;
const mockCreate = createJournalEntryAndRefresh as jest.Mock;
const mockPrepare = preparePhoto as jest.Mock;

const request = {
  plantId: "p1",
  imageBase64: "AQID",
  description: "",
  language: "pl" as const,
};

afterEach(() => {
  jest.resetAllMocks();
  jest.useRealTimers();
  queryClient.clear();
});

describe("diagnosePlantAndRefresh", () => {
  test("po udanej diagnozie wpisuje nowy licznik", async () => {
    mockDiagnose.mockResolvedValue({
      ok: true,
      data: { result: {}, remaining: 2 },
    });
    await diagnosePlantAndRefresh(request);
    expect(queryClient.getQueryData(remainingDiagnosesKey)).toBe(2);
  });

  test("limit wyczerpany: licznik 0", async () => {
    queryClient.setQueryData(remainingDiagnosesKey, 1);
    mockDiagnose.mockResolvedValue({ ok: false, error: "limitReached" });
    await diagnosePlantAndRefresh(request);
    expect(queryClient.getQueryData(remainingDiagnosesKey)).toBe(0);
  });

  test("błąd AI: licznik bez zmian (diagnoza wróciła do puli)", async () => {
    queryClient.setQueryData(remainingDiagnosesKey, 4);
    mockDiagnose.mockResolvedValue({ ok: false, error: "aiFailed" });
    await diagnosePlantAndRefresh(request);
    expect(queryClient.getQueryData(remainingDiagnosesKey)).toBe(4);
  });
});

describe("saveDiagnosisToJournal", () => {
  test("zdjęcie w rozmiarze dziennika i wpis z dzisiejszą datą", async () => {
    jest.useFakeTimers({ now: new Date(2026, 9, 18, 12, 0) });
    const photo = new ArrayBuffer(3);
    mockPrepare.mockResolvedValue(photo);
    mockCreate.mockResolvedValue({ ok: true, data: { id: "j1" } });

    const res = await saveDiagnosisToJournal(
      "g1",
      "p1",
      "file:///a.jpg",
      "Diagnoza AI: ...",
    );

    expect(res).toEqual({ ok: true, data: { id: "j1" } });
    // bez wymiarów i opcji: preparePhoto sam je odczyta i użyje 800 px / 60%
    expect(mockPrepare).toHaveBeenCalledWith("file:///a.jpg", 0, 0);
    expect(mockCreate).toHaveBeenCalledWith(
      "g1",
      "p1",
      { entryOn: "2026-10-18", note: "Diagnoza AI: ...", hasPhoto: true },
      photo,
    );
  });

  test("nie udało się przygotować zdjęcia: photoUpload, bez zapisu", async () => {
    mockPrepare.mockRejectedValue(new Error("brak pliku"));
    expect(
      await saveDiagnosisToJournal("g1", "p1", "file:///a.jpg", "x"),
    ).toEqual({
      ok: false,
      error: "photoUpload",
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
