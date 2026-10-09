import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { signOut } from "../../modules/auth/api/authApi";
import { useSession } from "../../modules/auth/hooks/useSession";

export default function HomeScreen() {
  const { t } = useTranslation();
  const session = useSession();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{session?.user.email}</Text>
      <Pressable testID="logout-button" style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>{t("auth.logout")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  title: { fontSize: 18 },
  button: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
