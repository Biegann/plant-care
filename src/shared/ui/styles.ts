import { StyleSheet } from "react-native";

export const ui = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#666", fontSize: 14 },
  error: { color: "#c0392b" },
  button: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
