jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("expo-router/react-navigation", () => ({
  useHeaderHeight: () => 0,
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));
jest.mock("../../../shared/api/supabase", () => ({ supabase: {} }));

import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { CareTask } from "../api/careApi";
import { todayIso } from "../schedule";
import { CareTaskForm } from "../ui/CareTaskForm";
import type { CareType } from "../validation";

const onSubmit = jest.fn();
const onSaved = jest.fn();

const task: CareTask = {
  id: "t1",
  plantId: "p1",
  type: "other",
  customLabel: "Zraszanie",
  intervalDays: 3,
  nextDueOn: "2026-10-20",
  enabled: true,
  createdAt: "2026-10-11T10:00:00Z",
};

const renderForm = (props: { initial?: CareTask; takenTypes?: CareType[] } = {}) =>
  render(<CareTaskForm {...props} onSubmit={onSubmit} onSaved={onSaved} />);

afterEach(() => jest.resetAllMocks());

describe("CareTaskForm", () => {
  test("nowe zadanie: domyślnie podlewanie co 7 dni z terminem na dziś", async () => {
    onSubmit.mockResolvedValue({ ok: true, data: "t9" });
    const utils = await renderForm();

    expect(utils.getByTestId("care-interval-input").props.value).toBe("7");
    expect(utils.queryByTestId("care-label-input")).toBeNull();

    await fireEvent.press(utils.getByTestId("care-form-submit"));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        type: "water",
        customLabel: "",
        intervalDays: 7,
        nextDueOn: todayIso(),
        enabled: true,
      }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });

  test("wybór rodzaju podpowiada interwał", async () => {
    const utils = await renderForm();
    await fireEvent.press(utils.getByTestId("care-type-fertilize"));

    expect(utils.getByTestId("care-interval-input").props.value).toBe("30");
  });

  test("ręcznie wpisany interwał nie jest nadpisywany przy zmianie rodzaju", async () => {
    const utils = await renderForm();
    await fireEvent.changeText(utils.getByTestId("care-interval-input"), "10");
    await fireEvent.press(utils.getByTestId("care-type-fertilize"));

    expect(utils.getByTestId("care-interval-input").props.value).toBe("10");
  });

  test("zajęte rodzaje są zablokowane, a domyślny jest pierwszy wolny", async () => {
    onSubmit.mockResolvedValue({ ok: true, data: "t9" });
    const utils = await renderForm({ takenTypes: ["water", "other"] });

    expect(
      utils.getByTestId("care-type-water").props.accessibilityState.disabled,
    ).toBe(true);
    // "Inne" można dodawać wielokrotnie
    expect(
      utils.getByTestId("care-type-other").props.accessibilityState.disabled,
    ).toBe(false);

    await fireEvent.press(utils.getByTestId("care-type-water"));
    await fireEvent.press(utils.getByTestId("care-form-submit"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      type: "fertilize",
      intervalDays: 30,
    });
  });

  test("rodzaj Inne: wymaga nazwy", async () => {
    const utils = await renderForm();
    await fireEvent.press(utils.getByTestId("care-type-other"));
    await fireEvent.press(utils.getByTestId("care-form-submit"));

    expect(utils.getByText("care.errors.invalidLabel")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test.each(["", "0", "731", "abc", "2.5"])(
    "błędny interwał %p: pokazuje błąd i nie zapisuje",
    async (value) => {
      const utils = await renderForm();
      await fireEvent.changeText(
        utils.getByTestId("care-interval-input"),
        value,
      );
      await fireEvent.press(utils.getByTestId("care-form-submit"));

      expect(utils.getByText("care.errors.invalidInterval")).toBeTruthy();
      expect(onSubmit).not.toHaveBeenCalled();
    },
  );

  test("błąd zapisu: pokazuje komunikat i nie zgłasza zapisu", async () => {
    onSubmit.mockResolvedValue({ ok: false, error: "duplicateType" });
    const utils = await renderForm();
    await fireEvent.press(utils.getByTestId("care-form-submit"));

    expect(await utils.findByText("care.errors.duplicateType")).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });

  test("tryb edycji: pola wypełnione, rodzaj bez możliwości zmiany", async () => {
    onSubmit.mockResolvedValue({ ok: true, data: null });
    const utils = await renderForm({ initial: task });

    expect(utils.getByTestId("care-type-fixed")).toBeTruthy();
    expect(utils.queryByTestId("care-type-water")).toBeNull();
    expect(utils.getByTestId("care-label-input").props.value).toBe("Zraszanie");
    expect(utils.getByTestId("care-interval-input").props.value).toBe("3");
    expect(utils.getByText("20.10.2026")).toBeTruthy();
    // Terminu zadania nie da się wyczyścić
    expect(utils.queryByTestId("care-date-clear")).toBeNull();

    await fireEvent.changeText(utils.getByTestId("care-interval-input"), "5");
    await fireEvent.press(utils.getByTestId("care-form-submit"));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        type: "other",
        customLabel: "Zraszanie",
        intervalDays: 5,
        nextDueOn: "2026-10-20",
        enabled: true,
      }),
    );
  });

  test("termin można ustawić w przyszłości", async () => {
    const { DateTimePickerAndroid } = jest.requireMock(
      "@react-native-community/datetimepicker",
    );
    const { Platform } = jest.requireActual("react-native");
    const original = Platform.OS;
    Platform.OS = "android";

    const utils = await renderForm();
    await fireEvent.press(utils.getByTestId("care-date-open"));
    Platform.OS = original;

    expect(DateTimePickerAndroid.open.mock.calls[0][0].maximumDate).toBeUndefined();
  });
});
