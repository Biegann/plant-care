import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput
} from "react-native";
import {
    sendPasswordResetCode,
    updatePassword,
    verifyResetCode,
} from "../../modules/auth/api/authApi";
import { isValidEmail, isValidPassword } from "../../modules/auth/validation";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!isValidEmail(email)) {
      setError(t("auth.errors.invalidEmail"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetCode(email.trim());
      setStep(2);
    } catch (err: any) {
      setError(err.message || t("auth.errors.unknown"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !isValidPassword(newPassword)) {
      setError(t("auth.errors.shortPassword"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyResetCode(email.trim(), code.trim());
      await updatePassword(newPassword);
      router.replace("/(auth)/login");
    } catch (err: any) {
      setError(err.message || t("auth.errors.unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>{t("auth.forgotPassword")}</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {step === 1 ? (
        <>
          <TextInput
            style={styles.input}
            placeholder={t("common.email")}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Pressable
            style={styles.button}
            onPress={handleSendCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Wyślij kod</Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.infoText}>
            Wpisz 6-cyfrowy kod, który wysłaliśmy na e-mail.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Kod z e-maila"
            keyboardType="numeric"
            value={code}
            onChangeText={setCode}
          />
          <TextInput
            style={styles.input}
            placeholder="Nowe hasło (min. 8 znaków)"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Pressable
            style={styles.button}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Zmień hasło</Text>
            )}
          </Pressable>
        </>
      )}

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.link}>Powrót</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  backButton: { alignItems: "center", marginTop: 20 },
  link: { color: "#2e7d32", fontSize: 16 },
  errorText: { color: "#d32f2f", textAlign: "center", marginBottom: 10 },
  infoText: {
    textAlign: "center",
    marginBottom: 10,
    fontSize: 14,
    color: "#666",
  },
});
