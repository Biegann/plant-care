import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { createThemedStyles } from "./theme";

export type SheetAction = {
  key: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

type Props = {
  visible: boolean;
  actions: SheetAction[];
  cancelLabel: string;
  onClose: () => void;
};

// Panel z opcjami wysuwany od dołu ekranu; zamyka go "Anuluj", dotknięcie tła albo przycisk wstecz
export function ActionSheet({ visible, actions, cancelLabel, onClose }: Props) {
  const styles = useStyles();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          testID="sheet-backdrop"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          {actions.map((action) => (
            <Pressable
              key={action.key}
              testID={`sheet-action-${action.key}`}
              style={styles.item}
              onPress={action.onPress}
            >
              <Text style={[styles.label, action.danger && styles.danger]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            testID="sheet-cancel"
            style={[styles.item, styles.cancel]}
            onPress={onClose}
          >
            <Text style={styles.cancelLabel}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingTop: 8,
      paddingBottom: 32,
    },
    item: { paddingVertical: 16, paddingHorizontal: 24 },
    label: { fontSize: 16, color: c.primary },
    danger: { color: c.danger },
    cancel: { borderTopWidth: 1, borderTopColor: c.divider },
    cancelLabel: { fontSize: 16, color: c.textMuted },
  }),
);
