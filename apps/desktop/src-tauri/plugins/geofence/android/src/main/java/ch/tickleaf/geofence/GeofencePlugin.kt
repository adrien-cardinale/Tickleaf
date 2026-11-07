package ch.tickleaf.geofence

import android.Manifest
import android.app.Activity
import android.os.Build
import app.tauri.PermissionState
import app.tauri.annotation.Command
import app.tauri.annotation.Permission
import app.tauri.annotation.PermissionCallback
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

private const val ALIAS_LOCATION = "location"
private const val ALIAS_BACKGROUND_LOCATION = "backgroundLocation"

@TauriPlugin(
    permissions = [
        Permission(
            strings = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION],
            alias = ALIAS_LOCATION,
        ),
        Permission(
            strings = [Manifest.permission.ACCESS_BACKGROUND_LOCATION],
            alias = ALIAS_BACKGROUND_LOCATION,
        ),
    ],
)
class GeofencePlugin(private val activity: Activity) : Plugin(activity) {
    @Command
    override fun checkPermissions(invoke: Invoke) {
        invoke.resolve(permissionStatus())
    }

    // Android only grants background location once foreground location is granted, in a separate request.
    @Command
    override fun requestPermissions(invoke: Invoke) {
        when {
            !GeofencePermissions.hasForegroundLocation(activity) ->
                requestPermissionForAlias(ALIAS_LOCATION, invoke, "locationPermissionCallback")
            !GeofencePermissions.hasBackgroundLocation(activity) -> requestBackgroundLocation(invoke)
            else -> invoke.resolve(permissionStatus())
        }
    }

    @Command
    fun syncGeofences(invoke: Invoke) {
        val args = invoke.parseArgs(SyncArgs::class.java)
        GeofenceRegistrar.sync(activity.applicationContext, args.targets) { error ->
            if (error == null) invoke.resolve(syncResult()) else invoke.reject(error.message, error)
        }
    }

    @Command
    fun clearGeofences(invoke: Invoke) {
        GeofenceRegistrar.clear(activity.applicationContext) { error ->
            if (error == null) invoke.resolve() else invoke.reject(error.message, error)
        }
    }

    @PermissionCallback
    private fun locationPermissionCallback(invoke: Invoke) {
        val needsBackground = GeofencePermissions.hasForegroundLocation(activity) &&
            !GeofencePermissions.hasBackgroundLocation(activity)
        if (needsBackground) requestBackgroundLocation(invoke) else invoke.resolve(permissionStatus())
    }

    @PermissionCallback
    private fun backgroundPermissionCallback(invoke: Invoke) {
        invoke.resolve(permissionStatus())
    }

    private fun requestBackgroundLocation(invoke: Invoke) {
        requestPermissionForAlias(ALIAS_BACKGROUND_LOCATION, invoke, "backgroundPermissionCallback")
    }

    private fun syncResult(): JSObject {
        val result = JSObject()
        result.put("registered", GeofenceStore.registered(activity.applicationContext).size)
        return result
    }

    private fun permissionStatus(): JSObject {
        val location = stateOf(ALIAS_LOCATION)
        val backgroundLocation =
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) location else stateOf(ALIAS_BACKGROUND_LOCATION)
        val status = JSObject()
        status.put("location", location.toString())
        status.put("backgroundLocation", backgroundLocation.toString())
        return status
    }

    private fun stateOf(alias: String): PermissionState = getPermissionState(alias) ?: PermissionState.PROMPT
}
