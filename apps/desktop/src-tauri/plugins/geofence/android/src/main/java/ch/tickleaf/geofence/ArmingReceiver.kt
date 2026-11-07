package ch.tickleaf.geofence

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class ArmingReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val pending = goAsync()
        GeofenceRegistrar.applyStored(context.applicationContext) { pending.finish() }
    }
}
