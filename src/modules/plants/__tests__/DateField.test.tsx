const mockOpen = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@react-native-community/datetimepicker", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: object) => <View {...props} />,
    DateTimePickerAndroid: { open: (options: object) => mockOpen(options) },
  };
});

import { fireEvent, render } from "@testing-library/react-native";
import { Platform } from "react-native";
import { DateField } from "../ui/DateField";

const onChange = jest.fn();
const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
  jest.resetAllMocks();
});

describe("DateField", () => {
  test("bez daty: pokazuje zachętę i nie ma przycisku czyszczenia", async () => {
    const utils = await render(<DateField value="" onChange={onChange} />);

    expect(utils.getByText("plants.form.pickDate")).toBeTruthy();
    expect(utils.queryByTestId("plant-date-clear")).toBeNull();
  });

  test("z datą: pokazuje ją jako DD.MM.RRRR", async () => {
    const utils = await render(
      <DateField value="2026-03-09" onChange={onChange} />,
    );

    expect(utils.getByText("09.03.2026")).toBeTruthy();
  });

  test("czyszczenie: zgłasza pustą datę", async () => {
    const utils = await render(
      <DateField value="2026-03-09" onChange={onChange} />,
    );
    await fireEvent.press(utils.getByTestId("plant-date-clear"));

    expect(onChange).toHaveBeenCalledWith("");
  });

  test("Android: otwiera kalendarz systemowy i zgłasza wybraną datę", async () => {
    Platform.OS = "android";
    const utils = await render(
      <DateField value="2026-03-09" onChange={onChange} />,
    );
    await fireEvent.press(utils.getByTestId("plant-date-open"));

    const options = mockOpen.mock.calls[0][0];
    expect(options.mode).toBe("date");
    expect(options.value.getDate()).toBe(9);
    expect(options.maximumDate).toBeInstanceOf(Date);

    options.onValueChange({}, new Date(2026, 4, 2));
    expect(onChange).toHaveBeenCalledWith("2026-05-02");
  });

  test("iOS: pokazuje kalendarz na ekranie i zgłasza wybraną datę", async () => {
    Platform.OS = "ios";
    const utils = await render(<DateField value="" onChange={onChange} />);
    expect(utils.queryByTestId("plant-date-picker")).toBeNull();

    await fireEvent.press(utils.getByTestId("plant-date-open"));
    await fireEvent(
      utils.getByTestId("plant-date-picker"),
      "valueChange",
      {},
      new Date(2026, 4, 2),
    );

    expect(mockOpen).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith("2026-05-02");
  });
});
