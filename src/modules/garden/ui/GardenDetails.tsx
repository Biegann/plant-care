import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Share,
    Text,
    TextInput,
    View,
} from "react-native";
import { ui } from "../../../shared/ui/styles";
import { useSession } from "../../auth/hooks/useSession";
import {
    createInvite,
    type GardenMember,
    type GardenResult,
} from "../api/gardenApi";
import {
    deleteAndRefresh,
    leaveAndRefresh,
    removeMemberAndRefresh,
    renameAndRefresh,
} from "../gardenManagement";
import { useGardenMembers } from "../hooks/useGardenMembers";
import { useGardens } from "../hooks/useGardens";
import { isValidGardenName } from "../validation";

export function GardenDetails({ gardenId }: { gardenId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useSession()?.user.id;
  const gardensQuery = useGardens();
  const membersQuery = useGardenMembers(gardenId);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const garden = gardensQuery.data?.find((item) => item.id === gardenId);

  if (gardensQuery.isPending) {
    return (
      <View style={ui.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!garden) {
    return (
      <View style={ui.screen}>
        <Text style={ui.subtitle}>{t("gardens.notFound")}</Text>
      </View>
    );
  }

  const isOwner = garden.role === "owner";

  const run = async (
    action: () => Promise<GardenResult<unknown>>,
    onSuccess?: () => void,
  ) => {
    if (busy) return;
    setBusy(true);
    setErrorKey(null);
    const result = await action();
    setBusy(false);
    if (result.ok) onSuccess?.();
    else setErrorKey(result.error);
  };

  const startEdit = () => {
    setName(garden.name);
    setErrorKey(null);
    setEditing(true);
  };

  const saveName = () => {
    if (!isValidGardenName(name)) {
      setErrorKey("invalidName");
      return;
    }
    run(
      () => renameAndRefresh(gardenId, name),
      () => setEditing(false),
    );
  };

  const generateCode = () =>
    run(async () => {
      const result = await createInvite(gardenId);
      if (result.ok) setInviteCode(result.data);
      return result;
    });

  const shareCode = () => {
    if (!inviteCode) return;
    Share.share({
      message: t("gardens.shareMessage", {
        name: garden.name,
        code: inviteCode,
      }),
    });
  };

  const confirmRemove = (member: GardenMember) =>
    Alert.alert(
      t("gardens.removeMemberTitle"),
      t("gardens.removeMemberMessage", { name: member.displayName ?? "" }),
      [
        { text: t("gardens.cancel"), style: "cancel" },
        {
          text: t("gardens.remove"),
          style: "destructive",
          onPress: () =>
            run(() => removeMemberAndRefresh(gardenId, member.userId)),
        },
      ],
    );

  const confirmLeave = () =>
    Alert.alert(
      t("gardens.leaveTitle"),
      t("gardens.leaveMessage", { name: garden.name }),
      [
        { text: t("gardens.cancel"), style: "cancel" },
        {
          text: t("gardens.leave"),
          style: "destructive",
          onPress: () =>
            run(
              () => leaveAndRefresh(gardenId),
              () => router.back(),
            ),
        },
      ],
    );

  const confirmDelete = () =>
    Alert.alert(
      t("gardens.deleteTitle"),
      t("gardens.deleteMessage", { name: garden.name }),
      [
        { text: t("gardens.cancel"), style: "cancel" },
        {
          text: t("gardens.delete"),
          style: "destructive",
          onPress: () =>
            run(
              () => deleteAndRefresh(gardenId),
              () => router.back(),
            ),
        },
      ],
    );

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      {editing ? (
        <View style={{ gap: 12 }}>
          <TextInput
            testID="rename-input"
            style={ui.input}
            value={name}
            onChangeText={setName}
            maxLength={60}
          />
          <View style={ui.row}>
            <Pressable
              testID="rename-save"
              style={[ui.button, ui.grow]}
              onPress={saveName}
              disabled={busy}
            >
              <Text style={ui.buttonText}>{t("gardens.save")}</Text>
            </Pressable>
            <Pressable
              testID="rename-cancel"
              style={[ui.secondaryButton, ui.grow]}
              onPress={() => {
                setEditing(false);
                setErrorKey(null);
              }}
            >
              <Text style={ui.secondaryButtonText}>{t("gardens.cancel")}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={ui.row}>
          <Text style={[ui.title, ui.grow]}>{garden.name}</Text>
          {isOwner && (
            <Pressable testID="rename-button" onPress={startEdit}>
              <Text style={ui.link}>{t("gardens.rename")}</Text>
            </Pressable>
          )}
        </View>
      )}

      <Text style={ui.sectionTitle}>{t("gardens.members")}</Text>
      {membersQuery.isPending ? (
        <ActivityIndicator />
      ) : membersQuery.isError ? (
        <Text style={ui.error}>{t("gardens.error")}</Text>
      ) : (
        (membersQuery.data ?? []).map((member) => {
          const label = `${member.displayName ?? "—"}${
            member.userId === userId ? ` (${t("gardens.you")})` : ""
          }`;
          return (
            <View key={member.userId} style={ui.row}>
              <View style={ui.grow}>
                <Text style={ui.cardTitle}>{label}</Text>
                <Text style={ui.cardSubtitle}>
                  {t(`gardens.role.${member.role}`)}
                </Text>
              </View>
              {isOwner && member.role === "member" && (
                <Pressable
                  testID={`remove-member-${member.userId}`}
                  onPress={() => confirmRemove(member)}
                >
                  <Text style={ui.dangerLink}>{t("gardens.remove")}</Text>
                </Pressable>
              )}
            </View>
          );
        })
      )}

      {isOwner && (
        <>
          <Text style={ui.sectionTitle}>{t("gardens.invite")}</Text>
          {inviteCode && (
            <>
              <Text testID="invite-code" style={ui.code} selectable>
                {inviteCode}
              </Text>
              <Pressable
                testID="share-code"
                style={ui.secondaryButton}
                onPress={shareCode}
              >
                <Text style={ui.secondaryButtonText}>{t("gardens.share")}</Text>
              </Pressable>
            </>
          )}
          <Pressable
            testID="generate-code"
            style={[ui.button, busy && ui.buttonDisabled]}
            onPress={generateCode}
            disabled={busy}
          >
            <Text style={ui.buttonText}>
              {t(inviteCode ? "gardens.newCode" : "gardens.generateCode")}
            </Text>
          </Pressable>
          <Text style={ui.subtitle}>{t("gardens.codeInfo")}</Text>
        </>
      )}

      {errorKey && (
        <Text style={ui.error}>{t(`gardens.errors.${errorKey}`)}</Text>
      )}

      {isOwner ? (
        <Pressable
          testID="delete-garden"
          style={ui.dangerButton}
          onPress={confirmDelete}
        >
          <Text style={ui.dangerButtonText}>{t("gardens.delete")}</Text>
        </Pressable>
      ) : (
        <Pressable
          testID="leave-garden"
          style={ui.dangerButton}
          onPress={confirmLeave}
        >
          <Text style={ui.dangerButtonText}>{t("gardens.leave")}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
