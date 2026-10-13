import { render, screen } from "@testing-library/react-native";
import { TextField } from "../TextField";
import { lightPalette } from "../theme";

describe("TextField", () => {
  test("podpowiedź ma kolor ustawiony przez aplikację", async () => {
    await render(<TextField testID="field" placeholder="Monstera" />);

    const field = screen.getByTestId("field");
    expect(field.props.placeholder).toBe("Monstera");
    expect(field.props.placeholderTextColor).toBe(lightPalette.placeholder);
  });

  test("kolor podpowiedzi można nadpisać", async () => {
    await render(<TextField testID="field" placeholderTextColor="#123456" />);

    expect(screen.getByTestId("field").props.placeholderTextColor).toBe(
      "#123456",
    );
  });
});
