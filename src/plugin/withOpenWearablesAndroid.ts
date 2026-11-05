import { ManifestActivity } from "@expo/config-plugins/build/android/Manifest";
import {
  ConfigPlugin,
  WarningAggregator,
  withAndroidManifest,
  withProjectBuildGradle,
} from "expo/config-plugins";

// The native Android SDK ships inside this package (android/maven). The module finds it through its own
// repositories, but the app resolves the module's dependencies again with the app's repositories, so the
// folder is added there too. Resolved by Gradle at build time, as React Native resolves its own path.
const BUNDLED_REPOSITORY = `maven { url new File(["node", "--print", "require.resolve('@kalybr-io/open-wearables/package.json')"].execute(null, rootDir).text.trim()).getParentFile().absolutePath + "/android/maven" }`;

const withBundledRepository: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    if (contents.includes(BUNDLED_REPOSITORY)) {
      return config;
    }

    const allprojectsRepositories = /allprojects\s*\{\s*repositories\s*\{/;
    if (!allprojectsRepositories.test(contents)) {
      WarningAggregator.addWarningAndroid(
        "@kalybr-io/open-wearables",
        "Could not find allprojects { repositories { } } in android/build.gradle; add the bundled Open Wearables repository by hand."
      );
      return config;
    }

    config.modResults.contents = contents.replace(
      allprojectsRepositories,
      (match) => `${match}\n    ${BUNDLED_REPOSITORY}`
    );
    return config;
  });
};

const withOpenWearablesAndroid: ConfigPlugin = (config) => {
  config = withBundledRepository(config);
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // MARK: - Health Connect aliases
    const application = manifest.application?.[0];
    if (!application) {
      return config;
    }

    const mainActivity = getMainActivityName(application.activity ?? []);

    const existingAliases = new Set(
      (application["activity-alias"] ?? []).map(
        (alias) => alias?.$?.["android:name"]
      )
    );

    const aliasesToAdd = [];

    if (!existingAliases.has("ViewPermissionUsageActivity")) {
      aliasesToAdd.push({
        $: {
          "android:name": "ViewPermissionUsageActivity",
          "android:exported": "true",
          "android:targetActivity": mainActivity,
          "android:permission":
            "android.permission.START_VIEW_PERMISSION_USAGE",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name": "android.intent.action.VIEW_PERMISSION_USAGE",
                },
              },
            ],
            category: [
              {
                $: {
                  "android:name": "android.intent.category.HEALTH_PERMISSIONS",
                },
              },
            ],
          },
        ],
      });
    }

    if (!existingAliases.has("ShowPermissionRationaleActivity")) {
      aliasesToAdd.push({
        $: {
          "android:name": "ShowPermissionRationaleActivity",
          "android:exported": "true",
          "android:targetActivity": mainActivity,
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name":
                    "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE",
                },
              },
            ],
          },
        ],
      });
    }

    application["activity-alias"] = [
      ...(application["activity-alias"] ?? []),
      ...aliasesToAdd,
    ];

    return config;
  });
};

const getMainActivityName = (activities: ManifestActivity[]): string => {
  for (const activity of activities) {
    const intentFilters = activity["intent-filter"] ?? [];

    for (const filter of intentFilters) {
      const actions = filter.action ?? [];
      const categories = filter.category ?? [];

      const hasMainAction = actions.some(
        (a) => a?.$?.["android:name"] === "android.intent.action.MAIN"
      );

      const hasLauncherCategory = categories.some(
        (c) => c?.$?.["android:name"] === "android.intent.category.LAUNCHER"
      );

      if (hasMainAction && hasLauncherCategory) {
        return activity?.$?.["android:name"];
      }
    }
  }

  return ".MainActivity";
};

export default withOpenWearablesAndroid;
