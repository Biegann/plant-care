import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text } from "react-native";
import { TextField } from "../../../shared/ui/TextField";
import { useUi } from "../../../shared/ui/styles";
import { useColors } from "../../../shared/ui/theme";
import { deleteAccount, getDeletionPlan } from "../api/accountApi";

export function DeleteAccountView() {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();

  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const plan = useQuery({
    queryKey: ["account-deletion-plan"],
    queryFn: async () => {
      const result = await getDeletionPlan();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });

  if (plan.isPending) {
    return (
      <ScrollView contentContainerStyle={ui.screen}>
        <ActivityIndicator color={colors.primary} />
      </ScrollView>
    );
  }
  if (plan.isError) {
    return (
      <ScrollView contentContainerStyle={ui.screen}>
        <Text style={ui.error}>{t("account.errors.unknown")}</Text>
      </ScrollView>
    );
  }

  const { blocking, removed } = plan.data;
  const blocked = blocking.length > 0;

  const onSubmit = async () => {
    if (loading || blocked) return;
    if (!password) {
      setErrorKey("passwordRequired");
      return;
    }
    setErrorKey(null);
    setLoading(true);
    const result = await deleteAccount(password);
    // po sukcesie strażnik tras sam przenosi na ekran logowania
    if (!result.ok) {
      setLoading(false);
      setErrorKey(result.error);
      if (result.error === "ownsSharedGarden") plan.refetch();
    }
  };

  return (
    <ScrollView contentContainerStyle={ui.screen}>
      <Text style={ui.text}>{t("account.deleteIntro")}</Text>
      <Text style={ui.text}>• {t("account.deleteProfile")}</Text>
      {removed.length > 0 && (
        <Text testID="delete-account-removed" style={ui.text}>
          • {t("account.deleteGardens", {
            names: removed.map((garden) => garden.name).join(", "),
          })}
        </Text>
      )}
      <Text style={ui.subtitle}>{t("account.memberGardensStay")}</Text>

      {blocked ? (
        <Text testID="delete-account-blocked" style={ui.error}>
          {t("account.blocked", {
            names: blocking.map((garden) => garden.name).join(", "),
          })}
        </Text>
      ) : (
        <>
          <TextField
            testID="delete-account-password"
            style={ui.input}
            placeholder={t("account.passwordPlaceholder")}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
          {errorKey && (
            <Text style={ui.error}>{t(`account.errors.${errorKey}`)}</Text>
          )}
          <Pressable
            testID="delete-account-submit"
            style={[ui.dangerButton, loading && ui.buttonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Text style={ui.dangerButtonText}>{t("account.deleteForever")}</Text>
            )}
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
