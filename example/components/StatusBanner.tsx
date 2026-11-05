import { Ionicons } from "@expo/vector-icons";
import { type SyncStatus } from "open-wearables";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface StatusBannerProps {
  isSyncActive: boolean;
  status: SyncStatus | null;
  subtitle: string;
  onResume: () => void;
  isResuming: boolean;
}

export function StatusBanner({
  isSyncActive,
  status,
  subtitle,
  onResume,
  isResuming,
}: StatusBannerProps) {
  const isSyncing = Boolean(status?.isSyncing);
  // hasResumableSession stays true for the whole of an active round, so !isSyncing is required.
  const canResume =
    isSyncActive && !isSyncing && Boolean(status?.hasResumableSession);
  const circleStyle = isSyncing
    ? styles.iconGreen
    : canResume
      ? styles.iconAmber
      : isSyncActive
        ? styles.iconGreen
        : styles.iconRed;
  const title = isSyncing
    ? status?.isFullExport
      ? "Exporting History…"
      : "Syncing…"
    : canResume
      ? "Sync Interrupted"
      : isSyncActive
        ? "Sync Active"
        : "Not Syncing";

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, circleStyle]}>
          <View style={[styles.outerCircle, circleStyle]} />
          {isSyncing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name={canResume ? "alert" : isSyncActive ? "checkmark" : "close"}
              size={28}
              // White on amber is illegible; the amber circle gets a dark glyph.
              color={canResume ? "#1C1C1E" : "#FFFFFF"}
            />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {isSyncActive && status != null && (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{status.sentCount}</Text>
              <Text style={styles.statLabel}>Records sent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{status.completedTypes}</Text>
              <Text style={styles.statLabel}>Types completed</Text>
            </View>
          </View>

          {canResume && (
            <View style={styles.resumeBlock}>
              <Pressable
                style={({ pressed }) => [
                  styles.resumeButton,
                  (pressed || isResuming) && styles.resumeButtonPressed,
                ]}
                onPress={onResume}
                disabled={isResuming}
              >
                {isResuming ? (
                  <ActivityIndicator size="small" color="#FFD60A" />
                ) : (
                  <Text style={styles.resumeButtonText}>Resume Sync</Text>
                )}
              </Pressable>
              <Text style={styles.resumeHint}>
                Sync was interrupted. It resumes automatically when you reopen
                the app.
              </Text>
            </View>
          )}

          {!status.initialExportDone && (
            <View style={styles.notice}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#FFD60A"
              />
              <Text style={styles.noticeText}>
                The initial history export is still running. Keep the app open
                until it finishes.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  outerCircle: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 60,
    opacity: 0.2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGreen: {
    backgroundColor: "#30D158",
  },
  iconAmber: {
    backgroundColor: "#FFD60A",
  },
  iconRed: {
    backgroundColor: "#FF453A",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 2,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: "#3A3A3C",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  resumeBlock: {
    gap: 8,
  },
  resumeButton: {
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2C2A1A",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#FFD60A",
  },
  resumeButtonPressed: {
    opacity: 0.6,
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFD60A",
  },
  resumeHint: {
    fontSize: 13,
    lineHeight: 18,
    color: "#8E8E93",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#2C2A1A",
    borderRadius: 8,
    padding: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#FFD60A",
  },
});
