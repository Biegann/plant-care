jest.mock("../../../shared/api/supabase", () => ({ supabase: {} }));
jest.mock("expo-router/react-navigation", () => ({
  useHeaderHeight: () => 0,
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "pl" },
  }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../plants/hooks/usePlant", () => ({ usePlant: jest.fn() }));
jest.mock("../hooks/useRemainingDiagnoses", () => ({
  useRemainingDiagnoses: jest.fn(),
}));
jest.mock("../diagnosisActions", () => ({
  diagnosePlantAndRefresh: jest.fn(),
  saveDiagnosisToJournal: jest.fn(),
}));
// Pole zdjęcia zastępujemy przyciskiem "wybrano zdjęcie" i podglądem ustawień
jest.mock("../../plants/ui/PhotoField", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  return {
    PhotoField: (props: {
      square?: boolean;
      size?: { maxSize: number; quality: number };
      onPicked: (photo: { uri: string; data: ArrayBuffer }) => void;
    }) => (
      <>
        <Text testID="photo-options">
          {JSON.stringify({ square: props.square, size: props.size })}
        </Text>
        <Pressable
          testID="photo-pick"
          onPress={() =>
            props.onPicked({
              uri: "file:///roslina.jpg",
              data: new Uint8Array([1, 2, 3]).buffer,
            })
          }
        />
      </>
    ),
  };
});

import { fireEvent, render } from "@testing-library/react-native";
import { usePlant } from "../../plants/hooks/usePlant";
import type { DiagnosisResult } from "../api/diagnosisApi";
import {
  diagnosePlantAndRefresh,
  saveDiagnosisToJournal,
} from "../diagnosisActions";
import { useRemainingDiagnoses } from "../hooks/useRemainingDiagnoses";
import { DiagnosisView } from "../ui/DiagnosisView";

const mockPlant = usePlant as jest.Mock;
const mockRemaining = useRemainingDiagnoses as jest.Mock;
const mockDiagnose = diagnosePlantAndRefresh as jest.Mock;
const mockSave = saveDiagnosisToJournal as jest.Mock;

const plant = { id: "p1", gardenId: "g1", name: "Rybcia" };

const result: DiagnosisResult = {
  notPlant: false,
  summary: "Prawdopodobnie przesuszenie.",
  causes: [
    { name: "Za mało wody", confidence: "high", explanation: "Suche brzegi." },
    { name: "Suche powietrze", confidence: "low", explanation: "Grzejnik." },
  ],
  steps: ["Podlej obficie"],
  worryIf: ["Łodyga mięknie"],
};

beforeEach(() => {
  mockPlant.mockReturnValue({ plant, isLoading: false });
  mockRemaining.mockReturnValue({ data: 4 });
});

afterEach(() => jest.resetAllMocks());

async function pickAndSubmit(utils: Awaited<ReturnType<typeof render>>) {
  await fireEvent.press(utils.getByTestId("photo-pick"));
  await fireEvent.changeText(
    utils.getByTestId("diagnosis-description"),
    "żółte liście",
  );
  await fireEvent.press(utils.getByTestId("diagnosis-submit"));
}

describe("DiagnosisView", () => {
  test("formularz: nazwa rośliny, podpowiedź, licznik i zdjęcie bez kwadratu w 1024 px", async () => {
    const utils = await render(<DiagnosisView plantId="p1" />);

    expect(utils.getByText("Rybcia")).toBeTruthy();
    expect(utils.getByText("diagnosis.photoHint")).toBeTruthy();
    expect(utils.getByTestId("diagnosis-remaining")).toHaveTextContent(
      'diagnosis.remaining:{"count":4,"limit":5}',
    );
    expect(utils.getByTestId("photo-options")).toHaveTextContent(
      '{"square":false,"size":{"maxSize":1024,"quality":0.8}}',
    );
  });

  test("bez zdjęcia: komunikat i brak wywołania", async () => {
    const utils = await render(<DiagnosisView plantId="p1" />);
    await fireEvent.press(utils.getByTestId("diagnosis-submit"));

    expect(utils.getByText("diagnosis.errors.noPhoto")).toBeTruthy();
    expect(mockDiagnose).not.toHaveBeenCalled();
  });

  test("limit wykorzystany: przycisk zablokowany i komunikat", async () => {
    mockRemaining.mockReturnValue({ data: 0 });
    const utils = await render(<DiagnosisView plantId="p1" />);

    expect(utils.getByText("diagnosis.limitReached")).toBeTruthy();
    expect(utils.getByTestId("diagnosis-submit")).toBeDisabled();
  });

  test("licznik niedostępny: nie pokazuje linii z limitem", async () => {
    mockRemaining.mockReturnValue({ data: undefined });
    const utils = await render(<DiagnosisView plantId="p1" />);
    expect(utils.queryByTestId("diagnosis-remaining")).toBeNull();
  });

  test("udana diagnoza: wysyła zdjęcie w base64 z opisem i językiem, pokazuje wynik", async () => {
    mockDiagnose.mockResolvedValue({
      ok: true,
      data: { result, remaining: 3 },
    });
    const utils = await render(<DiagnosisView plantId="p1" />);
    await pickAndSubmit(utils);

    expect(mockDiagnose).toHaveBeenCalledWith({
      plantId: "p1",
      imageBase64: "AQID",
      description: "żółte liście",
      language: "pl",
    });
    expect(await utils.findByTestId("diagnosis-result")).toBeTruthy();
    expect(utils.getByText("Prawdopodobnie przesuszenie.")).toBeTruthy();
    expect(utils.getByText("Za mało wody")).toBeTruthy();
    expect(utils.getByText("diagnosis.confidence.high")).toBeTruthy();
    expect(utils.getByText("diagnosis.confidence.low")).toBeTruthy();
    // niska pewność na czerwono (kolor danger z palety)
    expect(utils.getByTestId("diagnosis-confidence-1")).toHaveStyle({
      color: "#c0392b",
    });
    expect(utils.getByText("Podlej obficie")).toBeTruthy();
    expect(utils.getByText("Łodyga mięknie")).toBeTruthy();
    expect(utils.getByText("diagnosis.disclaimer")).toBeTruthy();
  });

  test("błąd diagnozy: wraca do formularza z komunikatem i zachowuje dane", async () => {
    mockDiagnose.mockResolvedValue({ ok: false, error: "aiFailed" });
    const utils = await render(<DiagnosisView plantId="p1" />);
    await pickAndSubmit(utils);

    expect(await utils.findByText("diagnosis.errors.aiFailed")).toBeTruthy();
    expect(utils.getByTestId("diagnosis-description").props.value).toBe(
      "żółte liście",
    );
  });

  test("zapis w dzienniku: notatka z podsumowaniem i krokami, potem przycisk 'Zapisano'", async () => {
    mockDiagnose.mockResolvedValue({
      ok: true,
      data: { result, remaining: 3 },
    });
    mockSave.mockResolvedValue({ ok: true, data: { id: "j1" } });
    const utils = await render(<DiagnosisView plantId="p1" />);
    await pickAndSubmit(utils);
    await fireEvent.press(await utils.findByTestId("diagnosis-save"));

    expect(mockSave).toHaveBeenCalledWith(
      "g1",
      "p1",
      "file:///roslina.jpg",
      "diagnosis.journalPrefix Prawdopodobnie przesuszenie. diagnosis.journalSteps 1. Podlej obficie",
    );
    expect(await utils.findByText("diagnosis.savedToJournal")).toBeTruthy();
    expect(utils.getByTestId("diagnosis-save")).toBeDisabled();
  });

  test("błąd zapisu w dzienniku: komunikat i można spróbować ponownie", async () => {
    mockDiagnose.mockResolvedValue({
      ok: true,
      data: { result, remaining: 3 },
    });
    mockSave.mockResolvedValue({ ok: false, error: "photoUpload" });
    const utils = await render(<DiagnosisView plantId="p1" />);
    await pickAndSubmit(utils);
    await fireEvent.press(await utils.findByTestId("diagnosis-save"));

    expect(await utils.findByText("journal.errors.photoUpload")).toBeTruthy();
    expect(utils.getByTestId("diagnosis-save")).not.toBeDisabled();
  });

  test("na zdjęciu nie ma rośliny: bez przycisku zapisu", async () => {
    mockDiagnose.mockResolvedValue({
      ok: true,
      data: {
        result: {
          ...result,
          notPlant: true,
          causes: [],
          steps: [],
          worryIf: [],
        },
        remaining: 3,
      },
    });
    const utils = await render(<DiagnosisView plantId="p1" />);
    await pickAndSubmit(utils);

    expect(await utils.findByTestId("diagnosis-result")).toBeTruthy();
    expect(utils.queryByTestId("diagnosis-save")).toBeNull();
    expect(utils.queryByText("diagnosis.causes")).toBeNull();
  });

  test("nowa diagnoza: czysty formularz", async () => {
    mockDiagnose.mockResolvedValue({
      ok: true,
      data: { result, remaining: 3 },
    });
    const utils = await render(<DiagnosisView plantId="p1" />);
    await pickAndSubmit(utils);
    await fireEvent.press(await utils.findByTestId("diagnosis-again"));

    expect(utils.queryByTestId("diagnosis-result")).toBeNull();
    expect(utils.getByTestId("diagnosis-description").props.value).toBe("");
    await fireEvent.press(utils.getByTestId("diagnosis-submit"));
    expect(utils.getByText("diagnosis.errors.noPhoto")).toBeTruthy();
  });

  test("brak rośliny: komunikat", async () => {
    mockPlant.mockReturnValue({ plant: null, isLoading: false });
    const utils = await render(<DiagnosisView plantId="p1" />);
    expect(utils.getByText("plants.notFound")).toBeTruthy();
  });
});
