import { StyleSheet } from "react-native";
import { createThemedStyles, lightPalette, type Palette } from "./theme";

const makeUi = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, padding: 24, gap: 12, backgroundColor: c.background },
    text: { color: c.text },
    title: { fontSize: 28, fontWeight: "700", color: c.text },
    subtitle: { color: c.textMuted, fontSize: 14 },
    error: { color: c.danger },
    input: {
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: c.text,
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: 8,
      padding: 14,
      alignItems: "center",
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: c.onPrimary, fontSize: 16, fontWeight: "600" },
    secondaryButton: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 8,
      padding: 14,
      alignItems: "center",
    },
    secondaryButtonText: { color: c.primary, fontSize: 16, fontWeight: "600" },
    card: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      padding: 14,
      gap: 12,
    },
    cardActive: { borderColor: c.primary, backgroundColor: c.surfaceActive },
    cardMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
    cardTitle: { fontSize: 16, fontWeight: "600", color: c.text },
    cardSubtitle: { color: c.textMuted, fontSize: 13 },
    grow: { flex: 1 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginTop: 12,
      color: c.text,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 4,
    },
    link: { color: c.primary, fontSize: 15 },
    dangerLink: { color: c.danger, fontSize: 15 },
    dangerButton: {
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 8,
      padding: 14,
      alignItems: "center",
    },
    dangerButtonText: { color: c.danger, fontSize: 16, fontWeight: "600" },
    code: {
      fontSize: 24,
      fontWeight: "700",
      letterSpacing: 2,
      textAlign: "center",
      color: c.text,
    },
  });

// Wspólne style w kolorach aktualnego motywu
export const useUi = createThemedStyles(makeUi);

// Tylko jasny motyw: dla ekranów, które nie przeszły jeszcze na useUi
export const ui = makeUi(lightPalette);
