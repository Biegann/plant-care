import { Link } from "expo-router";
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
import { requestPasswordReset, resetPasswordWithCode } from "../api/authApi";
import { isValidEmail, validateResetInput } from "../validation";
import { useAuthStyles } from "./authStyles";
import { useColors } from "../../../shared/ui/theme";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const styles = useAuthStyles();
  const colors = useColors();

  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onRequest = async () => {
    if (loading) return;
    if (!isValidEmail(email)) {
      setErrorKey("invalidEmail");
      return;
    }

    setErrorKey(null);
    setLoading(true);
    const result = await requestPasswordReset(email);
    setLoading(false);

    if (result.ok) setStep("confirm");
    else setErrorKey(result.error);
  };

  const onConfirm = async () => {
    if (loading) return;
    const errors = validateResetInput(code, password);
    const firstError = errors.code ?? errors.password;
    if (firstError) {
      setErrorKey(firstError);
      return;
    }

    setErrorKey(null);
    setLoading(true);
    const result = await resetPasswordWithCode(email, code, password);
    setLoading(false);

    // Sukces: strażnik tras sam przeniesie zalogowanego użytkownika do aplikacji
    if (!result.ok) setErrorKey(result.error);
  };

  const onChangeEmail = () => {
    setStep("request");
    setCode("");
    setPassword("");
    setErrorKey(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>{t("auth.forgot.title")}</Text>

      {step === "request" ? (
        <>
          <Text style={styles.info}>{t("auth.forgot.intro")}</Text>
          <TextField
            testID="forgot-email-input"
            style={styles.input}
            placeholder={t("common.email")}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </>
      ) : (
        <>
          <Text style={styles.info}>
            {t("auth.forgot.codeSent", { email: email.trim() })}
          </Text>
          <TextField
            testID="forgot-code-input"
            style={styles.input}
            placeholder={t("auth.forgot.code")}
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
          <TextField
            testID="forgot-password-input"
            style={styles.input}
            placeholder={t("auth.forgot.newPassword")}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
        </>
      )}

      {errorKey && (
        <Text style={styles.error}>{t(`auth.errors.${errorKey}`)}</Text>
      )}

      <Pressable
        testID="forgot-submit-button"
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={step === "request" ? onRequest : onConfirm}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>
            {t(
              step === "request"
                ? "auth.forgot.sendCode"
                : "auth.forgot.changePassword",
            )}
          </Text>
        )}
      </Pressable>

      {step === "confirm" && (
        <Pressable testID="forgot-change-email" onPress={onChangeEmail}>
          <Text style={styles.link}>{t("auth.forgot.changeEmail")}</Text>
        </Pressable>
      )}

      <Link href="/login" style={styles.link}>
        {t("auth.forgot.backToLogin")}
      </Link>
    </KeyboardAvoidingView>
  );
}
