package ch.tickleaf.geofence

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat

object GeofencePermissions {
    fun hasForegroundLocation(context: Context): Boolean =
        isGranted(context, Manifest.permission.ACCESS_FINE_LOCATION)

    fun hasBackgroundLocation(context: Context): Boolean =
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            hasForegroundLocation(context)
        } else {
            isGranted(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION)
        }

    fun canRegister(context: Context): Boolean =
        hasForegroundLocation(context) && hasBackgroundLocation(context)

    fun canNotify(context: Context): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            isGranted(context, Manifest.permission.POST_NOTIFICATIONS)

    private fun isGranted(context: Context, permission: String): Boolean =
        ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
}
