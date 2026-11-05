import OpenWearablesHealthSDK, { HealthDataType } from "open-wearables";
import { useState } from "react";
import { Alert } from "react-native";
import { Group } from "./Group";
import { ActionRow } from "./ActionRow";
import { SyncOptionsModal } from "./SyncOptionsModal";

interface ActionsGroupProps {
  isAuthorized: boolean | null;
  isSyncActive: boolean;
  onAuthChange: (authorized: boolean) => void;
  onSyncChange: (active: boolean) => void;
  onDisconnect: () => void;
  onToast: (message: string) => void;
}

export function ActionsGroup({
  isAuthorized,
  isSyncActive,
  onAuthChange,
  onSyncChange,
  onDisconnect,
  onToast,
}: ActionsGroupProps) {
  const [isSyncModalVisible, setSyncModalVisible] = useState(false);

  const requestAuthorization = async () => {
    const granted = await OpenWearablesHealthSDK.requestAuthorization(
      Object.values(HealthDataType)
    );
    onAuthChange(granted);
    if (granted) {
      onToast("Authorized");
    } else {
      Alert.alert(
        "Access denied",
        "Please grant health permissions to enable sync."
      );
    }
  };

  const toggleSync = async () => {
    if (!isSyncActive) {
      setSyncModalVisible(true);
      return;
    }
    try {
      await OpenWearablesHealthSDK.stopBackgroundSync();
      onSyncChange(false);
    } catch (e: any) {
      Alert.alert("Sync error", e?.message ?? String(e));
    }
  };

  const startSync = async (
    syncDaysBack: number | null,
    resetAnchors: boolean
  ) => {
    setSyncModalVisible(false);
    try {
      // Anchors survive stopBackgroundSync, so reaching further back than a
      // previous sync needs a reset first. Safe here because sync is stopped —
      // resetting while it is active kicks off an export with the old range.
      if (resetAnchors) {
        OpenWearablesHealthSDK.resetAnchors();
      }
      const started =
        await OpenWearablesHealthSDK.startBackgroundSync(syncDaysBack);
      onSyncChange(started);
      if (started) {
        const range =
          syncDaysBack == null
            ? "all data"
            : `${syncDaysBack} day${syncDaysBack === 1 ? "" : "s"} back`;
        onToast(
          resetAnchors
            ? `Sync started (${range}, history reset)`
            : `Sync started (${range})`
        );
      } else {
        Alert.alert(
          "Could not start sync",
          "Check that the SDK is configured and you are signed in."
        );
      }
    } catch (e: any) {
      Alert.alert("Sync error", e?.message ?? String(e));
    }
  };

  const signOut = async () => {
    try {
      await OpenWearablesHealthSDK.signOut();
      onDisconnect();
    } catch (e: any) {
      Alert.alert("Sign out error", e?.message ?? String(e));
    }
  };

  return (
    <>
      <SyncOptionsModal
        visible={isSyncModalVisible}
        onCancel={() => setSyncModalVisible(false)}
        onConfirm={startSync}
      />
      <Group>
        {isAuthorized !== true ? (
          <>
            <ActionRow
              title="Authorize Health"
              description="Grant access to health data"
              iconName="heart-outline"
              iconBgColor="#3A3A3C"
              onPress={requestAuthorization}
              hasBorderBottom
            />
            <ActionRow
              title="Disconnect"
              description="Sign out and stop syncing"
              iconName="exit-outline"
              iconBgColor="#5C1A1A"
              titleColor="#FF453A"
              onPress={signOut}
            />
          </>
        ) : (
          <>
            <ActionRow
              title={isSyncActive ? "Stop Sync" : "Start Sync"}
              description={
                isSyncActive
                  ? "Background sync is active"
                  : "Begin syncing health data"
              }
              iconName={isSyncActive ? "pause" : "play"}
              iconBgColor="#1A3D1A"
              onPress={toggleSync}
              hasBorderBottom
            />
            <ActionRow
              title="Disconnect"
              description="Sign out and stop syncing"
              iconName="exit-outline"
              iconBgColor="#5C1A1A"
              titleColor="#FF453A"
              onPress={signOut}
            />
          </>
        )}
      </Group>
    </>
  );
}
