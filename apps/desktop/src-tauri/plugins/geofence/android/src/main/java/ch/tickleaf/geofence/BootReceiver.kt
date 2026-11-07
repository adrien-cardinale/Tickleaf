package ch.tickleaf.geofence

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        // Android drops every geofence and every alarm on reboot.
        val pending = goAsync()
        GeofenceRegistrar.restore(context.applicationContext) { pending.finish() }
    }
}
