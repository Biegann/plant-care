import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
} from "react-native";
import { TextField } from "../../../shared/ui/TextField";
import { useColors } from "../../../shared/ui/theme";
import { resendSignupCode, verifySignupCode } from "../api/authApi";
import { isValidCode } from "../validation";
import { useAuthStyles } from "./authStyles";

// Tyle samo każe czekać Supabase między wysyłkami kodu
export const RESEND_COOLDOWN_SECONDS = 60;

type Props = { email: string };

export function VerifyEmailForm({ email }: Props) {
  const { t } = useTranslation();
  const styles = useAuthStyles();
  const colors = useColors();

  const [code, setCode] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  // Kod został właśnie wysłany (rejestracja lub logowanie), więc od razu odliczamy
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const onConfirm = async () => {
    if (loading) return;
    if (!isValidCode(code)) {
      setErrorKey("invalidCode");
      return;
    }

    setErrorKey(null);
    setResent(false);
    setLoading(true);
    const result = await verifySignupCode(email, code);
    setLoading(false);

    // Sukces: strażnik tras sam przeniesie zalogowanego użytkownika do aplikacji
    if (!result.ok) setErrorKey(result.error);
  };

  const onResend = async () => {
    if (loading || secondsLeft > 0) return;
    setErrorKey(null);
    setResent(false);
    setLoading(true);
    const result = await resendSignupCode(email);
    setLoading(false);

    if (result.ok) {
      setResent(true);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } else {
      setErrorKey(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>{t("auth.verify.title")}</Text>
      <Text style={styles.info}>{t("auth.verify.codeSent", { email })}</Text>

      <TextField
        testID="verify-code-input"
        style={styles.input}
        placeholder={t("auth.verify.code")}
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
      />

      {errorKey && (
        <Text style={styles.error}>{t(`auth.errors.${errorKey}`)}</Text>
      )}
      {resent && <Text style={styles.info}>{t("auth.verify.resent")}</Text>}

      <Pressable
        testID="verify-submit-button"
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onConfirm}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>{t("auth.verify.confirm")}</Text>
        )}
      </Pressable>

      <Pressable
        testID="verify-resend"
        onPress={onResend}
        disabled={loading || secondsLeft > 0}
      >
        <Text style={[styles.link, secondsLeft > 0 && styles.linkDisabled]}>
          {secondsLeft > 0
            ? t("auth.verify.resendIn", { seconds: secondsLeft })
            : t("auth.verify.resend")}
        </Text>
      </Pressable>

      <Pressable testID="verify-change-email" onPress={() => router.back()}>
        <Text style={styles.link}>{t("auth.verify.changeEmail")}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
