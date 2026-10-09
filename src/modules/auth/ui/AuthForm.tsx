import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
} from "react-native";
import { signIn, signUp } from "../api/authApi";
import { CredentialErrors, validateCredentials } from "../validation";

type Props = { mode: "login" | "register" };

export function AuthForm({ mode }: Props) {
  const { t } = useTranslation();
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CredentialErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (loading) return;
    setFormError(null);

    const errors = validateCredentials(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const result = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);
    setLoading(false);

    if (!result.ok) setFormError(result.error);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>
        {t(isLogin ? "auth.loginTitle" : "auth.registerTitle")}
      </Text>

      <TextInput
        testID="email-input"
        style={styles.input}
        placeholder={t("common.email")}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {fieldErrors.email && (
        <Text style={styles.error}>
          {t(`auth.errors.${fieldErrors.email}`)}
        </Text>
      )}

      <TextInput
        testID="password-input"
        style={styles.input}
        placeholder={t("common.password")}
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />
      {fieldErrors.password && (
        <Text style={styles.error}>
          {t(`auth.errors.${fieldErrors.password}`)}
        </Text>
      )}

      {formError && (
        <Text style={styles.error}>{t(`auth.errors.${formError}`)}</Text>
      )}

      <Pressable
        testID="submit-button"
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {t(isLogin ? "auth.login" : "auth.register")}
          </Text>
        )}
      </Pressable>

      <Link href={isLogin ? "/register" : "/login"} style={styles.link}>
        {t(isLogin ? "auth.noAccount" : "auth.haveAccount")}
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: { color: "#c0392b" },
  button: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { textAlign: "center", marginTop: 16, color: "#2e7d32" },
});
