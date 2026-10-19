import { Link, router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
} from "react-native";
import { TextField } from "../../../shared/ui/TextField";
import { resendSignupCode, signIn, signUp } from "../api/authApi";
import { CredentialErrors, validateCredentials } from "../validation";
import { useAuthStyles } from "./authStyles";
import { useColors } from "../../../shared/ui/theme";

type Props = { mode: "login" | "register" };

export function AuthForm({ mode }: Props) {
  const { t } = useTranslation();
  const styles = useAuthStyles();
  const colors = useColors();
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
    if (isLogin) {
      const result = await signIn(email, password);
      if (!result.ok && result.error === "emailNotConfirmed") {
        // Nowy kod wysyłamy od razu; jeśli się nie uda (np. limit 60 s),
        // ekran potwierdzenia pozwala wysłać go ponownie
        await resendSignupCode(email);
        setLoading(false);
        goToVerifyEmail();
        return;
      }
      setLoading(false);
      if (!result.ok) setFormError(result.error);
    } else {
      const result = await signUp(email, password);
      setLoading(false);
      if (!result.ok) setFormError(result.error);
      // Bez potwierdzania e-maila Supabase od razu loguje, a strażnik tras
      // sam przenosi do aplikacji
      else if (result.data.needsConfirmation) goToVerifyEmail();
    }
  };

  const goToVerifyEmail = () =>
    router.push({
      pathname: "/verify-email",
      params: { email: email.trim() },
    });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>
        {t(isLogin ? "auth.loginTitle" : "auth.registerTitle")}
      </Text>

      <TextField
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

      <TextField
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
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>
            {t(isLogin ? "auth.login" : "auth.register")}
          </Text>
        )}
      </Pressable>

      {isLogin && (
        <Link href="/forgot-password" style={styles.link}>
          {t("auth.forgotPassword")}
        </Link>
      )}

      <Link href={isLogin ? "/register" : "/login"} style={styles.link}>
        {t(isLogin ? "auth.noAccount" : "auth.haveAccount")}
      </Link>
    </KeyboardAvoidingView>
  );
}
