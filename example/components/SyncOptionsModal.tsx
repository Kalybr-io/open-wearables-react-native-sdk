import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, Colors } from "./Button";
import { Checkbox } from "./Checkbox";
import { Input } from "./Input";

const MIN_DAYS = 1;
const MAX_DAYS = 30;

interface SyncOptionsModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (syncDaysBack: number | null, resetAnchors: boolean) => void;
}

export function SyncOptionsModal({
  visible,
  onCancel,
  onConfirm,
}: SyncOptionsModalProps) {
  const [syncAll, setSyncAll] = useState(false);
  const [daysText, setDaysText] = useState("1");
  const [resetAnchors, setResetAnchors] = useState(false);

  useEffect(() => {
    if (visible) {
      setSyncAll(false);
      setDaysText("1");
      setResetAnchors(false);
    }
  }, [visible]);

  const days = Number.parseInt(daysText, 10);
  const isDaysValid =
    Number.isFinite(days) && days >= MIN_DAYS && days <= MAX_DAYS;
  const canConfirm = syncAll || isDaysValid;

  const confirm = () => {
    if (!canConfirm) return;
    onConfirm(syncAll ? null : days, resetAnchors);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.card}>
          <Text style={styles.title}>Start Sync</Text>
          <Text style={styles.description}>
            Choose how far back to sync health data.
          </Text>

          <Checkbox
            checked={syncAll}
            onToggle={() => setSyncAll((value) => !value)}
            title="Sync all my data"
            description="Ignore the day limit and sync the full history."
          />

          <View style={styles.field}>
            <Text style={[styles.label, syncAll && styles.labelDisabled]}>
              Days back ({MIN_DAYS}-{MAX_DAYS})
            </Text>
            <View style={syncAll && styles.inputDisabled}>
              <Input
                value={syncAll ? "" : daysText}
                onChangeText={setDaysText}
                keyboardType="number-pad"
                placeholder="1"
                editable={!syncAll}
                maxLength={2}
              />
            </View>
            {!syncAll && daysText.length > 0 && !isDaysValid && (
              <Text style={styles.error}>
                Enter a number between {MIN_DAYS} and {MAX_DAYS}.
              </Text>
            )}
          </View>

          <Checkbox
            checked={resetAnchors}
            onToggle={() => setResetAnchors((value) => !value)}
            title="Re-sync history"
            description="Required to reach further back than a previous sync. Re-uploads data that was already sent."
          />

          <View style={styles.actions}>
            <View style={styles.action}>
              <Button title="Cancel" onPress={onCancel} color={Colors.muted} />
            </View>
            <View style={styles.action}>
              <Button
                title="Start Sync"
                onPress={confirm}
                disabled={!canConfirm}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  card: {
    backgroundColor: "#1C1C1E",
    borderRadius: 14,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  description: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: -12,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: "#8E8E93",
  },
  labelDisabled: {
    color: "#48484A",
  },
  inputDisabled: {
    opacity: 0.4,
  },
  error: {
    fontSize: 12,
    color: Colors.destructive,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  action: {
    flex: 1,
  },
});
