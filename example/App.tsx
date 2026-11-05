import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import OpenWearablesHealthSDK, {
  HealthDataType,
  type SyncStatus,
} from "open-wearables";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ActionsGroup } from "./components/ActionsGroup";
import { ProvidersGroup } from "./components/ProvidersGroup";
import { SessionGroup } from "./components/SessionGroup";
import { StatusBanner } from "./components/StatusBanner";
import { Toast } from "./components/Toast";
import { useLogs } from "./hooks/useLogs";
import { LogsScreen } from "./screens/LogsScreen";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  const onAuthErrorPayload = useEvent(OpenWearablesHealthSDK, "onAuthError");
  const [credentials, setCredentials] = useState<Record<string, any>>({});
  const [showLogs, setShowLogs] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isSyncActive, setIsSyncActive] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(
    null
  );
  const { logs, clearLogs } = useLogs();

  const autoRequestAuthorization = async () => {
    const granted = await OpenWearablesHealthSDK.requestAuthorization(
      Object.values(HealthDataType)
    );
    setIsAuthorized(granted);
  };

  useEffect(() => {
    const init = async () => {
      const stored = OpenWearablesHealthSDK.getStoredCredentials();
      setCredentials(stored ?? {});

      if (stored?.host) {
        OpenWearablesHealthSDK.configure(stored.host);
      }

      const valid = Boolean(OpenWearablesHealthSDK.isSessionValid());
      setIsConnected(valid);
      if (valid) {
        setIsSyncActive(Boolean(OpenWearablesHealthSDK.isSyncActive()));
        await autoRequestAuthorization();
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!onAuthErrorPayload) return;
    Alert.alert(onAuthErrorPayload.message);
  }, [onAuthErrorPayload]);

  useEffect(() => {
    if (!isConnected || !isSyncActive) {
      setSyncStatus(null);
      return;
    }
    const read = () => {
      setSyncStatus(OpenWearablesHealthSDK.getSyncStatus());
    };
    read();
    const id = setInterval(read, 2000);
    return () => clearInterval(id);
  }, [isConnected, isSyncActive]);

  const handleResumeSync = async () => {
    setIsResuming(true);
    try {
      // Deliberately not branching on the resolved value: it reports true even when the
      // native call was a no-op. The isSyncing poll is the source of truth.
      await OpenWearablesHealthSDK.resumeSync();
    } catch (e: any) {
      Alert.alert("Resume failed", e?.message ?? String(e));
    } finally {
      setIsResuming(false);
      setSyncStatus(OpenWearablesHealthSDK.getSyncStatus());
    }
  };

  const refreshStoredCredentials = () => {
    const stored = OpenWearablesHealthSDK.getStoredCredentials();
    setCredentials(stored ?? {});
  };

  const showToast = (message: string) => {
    setToast({ message, key: Date.now() });
  };

  const handleConnectSuccess = () => {
    const stored = OpenWearablesHealthSDK.getStoredCredentials();
    setCredentials(stored ?? {});
    setIsConnected(true);
    showToast("Connected successfully");
    if (stored?.provider) {
      autoRequestAuthorization();
    }
  };

  const handleDisconnect = () => {
    setIsAuthorized(null);
    setIsSyncActive(false);
    setIsConnected(false);
    refreshStoredCredentials();
  };

  const handleProviderChange = () => {
    setIsAuthorized(null);
    setIsSyncActive(false);
    refreshStoredCredentials();
    autoRequestAuthorization();
  };

  const getProviderDisplayName = (): string | null => {
    if (!credentials.provider) return null;
    const providers = OpenWearablesHealthSDK.getAvailableProviders();
    return (
      providers.find((p) => p.id === credentials.provider)?.displayName ?? null
    );
  };

  const syncSubtitle = isConnected
    ? (() => {
        const name = getProviderDisplayName();
        return name ? `Connected via ${name}` : "Connected";
      })()
    : "Not connected";

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Modal
          visible={showLogs}
          animationType="slide"
          onRequestClose={() => setShowLogs(false)}
        >
          <LogsScreen
            logs={logs}
            onClearLogs={clearLogs}
            onBack={() => setShowLogs(false)}
          />
        </Modal>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Open Wearables</Text>
            <Pressable onPress={() => setShowLogs(true)} hitSlop={8}>
              <View style={styles.logsButton}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color="#8E8E93"
                />
                {logs.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {logs.length > 99 ? "99+" : logs.length}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            style={styles.scroll}
            keyboardShouldPersistTaps="always"
          >
            <StatusBanner
              isSyncActive={isSyncActive}
              status={syncStatus}
              subtitle={syncSubtitle}
              onResume={handleResumeSync}
              isResuming={isResuming}
            />
            {isConnected === false ? (
              <SessionGroup
                credentials={credentials}
                onConnectSuccess={handleConnectSuccess}
              />
            ) : (
              <>
                <ProvidersGroup
                  savedProvider={credentials.provider}
                  onProviderChange={handleProviderChange}
                />
                <ActionsGroup
                  isAuthorized={isAuthorized}
                  isSyncActive={isSyncActive}
                  onAuthChange={setIsAuthorized}
                  onSyncChange={setIsSyncActive}
                  onDisconnect={handleDisconnect}
                  onToast={showToast}
                />
              </>
            )}
            {toast != null && (
              <Toast
                key={toast.key}
                message={toast.message}
                onHide={() => setToast(null)}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  logsButton: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#FF453A",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    gap: 16,
    padding: 20,
    paddingTop: 4,
  },
});
