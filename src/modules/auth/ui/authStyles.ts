import { StyleSheet } from "react-native";
import { createThemedStyles } from "../../../shared/ui/theme";

export const useAuthStyles = createThemedStyles((c) =>
  StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
    title: { fontSize: 28, fontWeight: "700", marginBottom: 12, color: c.text },
    info: { color: c.textMuted, fontSize: 14 },
    input: {
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: c.text,
    },
    error: { color: c.danger },
    button: {
      backgroundColor: c.primary,
      borderRadius: 8,
      padding: 14,
      alignItems: "center",
      marginTop: 8,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: c.onPrimary, fontSize: 16, fontWeight: "600" },
    link: { textAlign: "center", marginTop: 12, color: c.primary },
  }),
);
