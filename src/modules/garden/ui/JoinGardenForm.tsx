import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Pressable,
    Text,
    View,
} from "react-native";
import { TextField } from "../../../shared/ui/TextField";
import { ui } from "../../../shared/ui/styles";
import { joinAndActivate } from "../gardenActions";
import { isValidInviteCode } from "../validation";

export function JoinGardenForm() {
  const { t } = useTranslation();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (loading) return;
    if (!isValidInviteCode(code)) {
      setErrorKey("invalidCode");
      return;
    }

    setErrorKey(null);
    setLoading(true);
    const result = await joinAndActivate(code);
    setLoading(false);

    if (result.ok) router.back();
    else setErrorKey(result.error);
  };

  return (
    <View style={ui.screen}>
      <Text style={ui.subtitle}>{t("gardens.codeHint")}</Text>
      <TextField
        testID="garden-code-input"
        style={ui.input}
        placeholder={t("gardens.codePlaceholder")}
        autoCapitalize="characters"
        autoCorrect={false}
        value={code}
        onChangeText={setCode}
      />
      {errorKey && (
        <Text style={ui.error}>{t(`gardens.errors.${errorKey}`)}</Text>
      )}
      <Pressable
        testID="join-garden-submit"
        style={[ui.button, loading && ui.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={ui.buttonText}>{t("gardens.joinSubmit")}</Text>
        )}
      </Pressable>
    </View>
  );
}
