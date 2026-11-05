package expo.modules.openwearables

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Coroutine
import com.openwearables.health.sdk.*

public class OpenWearablesModule : Module() {
  public override fun definition() = ModuleDefinition {
    Name("OpenWearablesHealthSDK")

    // MARK: - Callbacks (Events)
    Events("onLog", "onAuthError")

    // MARK: - Lifecycle
    OnCreate {
      OpenWearablesHealthSDK.initialize(appContext.reactContext!!)
      
      appContext.activityProvider?.currentActivity?.let { activity ->
        OpenWearablesHealthSDK.getInstance().setActivity(activity)
      }

      OpenWearablesHealthSDK.getInstance().logListener = { message ->
        sendEvent(
          "onLog",
          mapOf(
            "message" to message
          )
        )
      }

      OpenWearablesHealthSDK.getInstance().authErrorListener = { statusCode, message ->
        sendEvent(
          "onAuthError",
          mapOf(
            "statusCode" to statusCode,
            "message" to message
          )
        )
      }
    }

    OnActivityEntersForeground {
      appContext.activityProvider?.currentActivity?.let { activity ->
        OpenWearablesHealthSDK.getInstance().setActivity(activity)
      }

      OpenWearablesHealthSDK.getInstance().onForeground()
    }

    OnActivityEntersBackground {
      OpenWearablesHealthSDK.getInstance().onBackground()
    }

    OnActivityDestroys {
      OpenWearablesHealthSDK.getInstance().unregisterPermissionLauncher()
    }

    // MARK: - Configure
    Function("configure") { host: String, customSyncURL: String? ->
      OpenWearablesHealthSDK.getInstance().configure(host, customSyncURL)
    }

    // MARK: - Auth
    AsyncFunction("signIn") Coroutine { userId: String, accessToken: String?, refreshToken: String?, apiKey: String? ->
      OpenWearablesHealthSDK.getInstance().signIn(
        userId,
        accessToken,
        refreshToken,
        apiKey
      )
    }

    AsyncFunction("signOut") Coroutine { _: Unit? ->
      OpenWearablesHealthSDK.getInstance().signOut()
    }

    Function("updateTokens") { accessToken: String, refreshToken: String ->
      OpenWearablesHealthSDK.getInstance().updateTokens(
        accessToken,
        refreshToken
      )
    }

    Function("restoreSession") {
      OpenWearablesHealthSDK.getInstance().restoreSession()
    }

    Function("isSessionValid") {
      OpenWearablesHealthSDK.getInstance().isSessionValid()
    }

    // MARK: - Authorization
    AsyncFunction("requestAuthorization") Coroutine { types: List<String> ->
      return@Coroutine OpenWearablesHealthSDK.getInstance().requestAuthorization(types)
    }

    // MARK: - Sync
    Function("setSyncInterval") { minutes: Long ->
      OpenWearablesHealthSDK.getInstance().setSyncInterval(minutes)
    }

    AsyncFunction("startBackgroundSync") Coroutine { syncDaysBack: Int? ->
      // The native returns Unit and throws when it cannot start; iOS resolves false instead.
      try {
        OpenWearablesHealthSDK.getInstance().startBackgroundSync(syncDaysBack)
        return@Coroutine true
      } catch (e: IllegalStateException) {
        sendEvent("onLog", mapOf("message" to "Cannot start sync: ${e.message}"))
        return@Coroutine false
      }
    }

    AsyncFunction("stopBackgroundSync") Coroutine { _: Unit? ->
      OpenWearablesHealthSDK.getInstance().stopBackgroundSync()
    }

    AsyncFunction("resumeSync") Coroutine { _: Unit? ->
      // iOS resolves false when there is nothing to resume; the native here throws instead.
      try {
        OpenWearablesHealthSDK.getInstance().resumeSync()
        return@Coroutine true
      } catch (e: IllegalStateException) {
        sendEvent("onLog", mapOf("message" to "Cannot resume sync: ${e.message}"))
        return@Coroutine false
      }
    }

    Function("isSyncActive") {
      OpenWearablesHealthSDK.getInstance().isSyncActive()
    }

    Function("getSyncStatus") {
      OpenWearablesHealthSDK.getInstance().getSyncStatus()
    }

    Function("resetAnchors") {
      OpenWearablesHealthSDK.getInstance().resetAnchors()
    }

    Function("getStoredCredentials") {
      OpenWearablesHealthSDK.getInstance().getStoredCredentials()
    }

    // MARK: - Providers
    Function("getAvailableProviders") {
      OpenWearablesHealthSDK.getInstance().getAvailableProviders()
    }

    Function("setProvider") { providerId: String ->
      OpenWearablesHealthSDK.getInstance().setProvider(providerId)
    }
    
    // MARK: - Logs
    Function("setLogLevel") { levelId: Int ->
      val level = OWLogLevel.entries.getOrElse(levelId) {
          OWLogLevel.DEBUG
      }
      OpenWearablesHealthSDK.getInstance().logLevel = level
    }

    Function("getLogLevel") {
      OpenWearablesHealthSDK.getInstance().logLevel.ordinal
    }    
  }
}