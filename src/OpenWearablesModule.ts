import { NativeModule, requireNativeModule } from "expo-modules-core";
import {
  HealthDataType,
  OpenWearablesModuleEvents,
  HealthDataProvider,
  OWLogLevel,
  StoredCredentials,
  SyncStatus,
} from "./OpenWearables.types";

declare class OpenWearablesModule extends NativeModule<OpenWearablesModuleEvents> {
  // MARK: - Configure
  configure(host: string, customSyncURL?: string): void;

  // MARK: - Auth
  signIn(
    userId: string,
    accessToken: string | null,
    refreshToken: string | null,
    apiKey: string | null
  ): Promise<void>;
  signOut(): Promise<void>;
  updateTokens(accessToken: string, refreshToken: string | null): void;
  restoreSession(): string | null;
  isSessionValid(): boolean;

  // MARK: - HealthKit Authorization
  requestAuthorization(types: HealthDataType[]): Promise<boolean>;

  // MARK: - Sync
  setSyncInterval(minutes: number): void;
  startBackgroundSync(syncDaysBack: number | null): Promise<boolean>;
  stopBackgroundSync(): Promise<void>;
  isSyncActive(): boolean;
  getSyncStatus(): SyncStatus;
  resumeSync(): Promise<boolean>;
  resetAnchors(): void;
  getStoredCredentials(): StoredCredentials;

  // MARK: - Providers
  getAvailableProviders(): HealthDataProvider[];
  setProvider(providerId: string): boolean;

  // MARK: - Logs
  setLogLevel(logLevel: OWLogLevel): void;
  getLogLevel(): OWLogLevel;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<OpenWearablesModule>(
  "OpenWearablesHealthSDK"
);
