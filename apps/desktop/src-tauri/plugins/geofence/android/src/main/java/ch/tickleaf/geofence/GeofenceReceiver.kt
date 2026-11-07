package ch.tickleaf.geofence

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofenceStatusCodes
import com.google.android.gms.location.GeofencingEvent

class GeofenceReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val event = GeofencingEvent.fromIntent(intent) ?: return
        if (event.hasError()) {
            forgetWhenUnavailable(context, event.errorCode)
            return
        }
        if (event.geofenceTransition != Geofence.GEOFENCE_TRANSITION_ENTER) return
        val targets = GeofenceStore.read(context)
        for (geofence in event.triggeringGeofences.orEmpty()) {
            val target = targets.firstOrNull { it.taskId == geofence.requestId } ?: continue
            ArrivalNotifier.show(context, target)
        }
    }

    // Android removes every geofence when location turns off; forgetting them lets the next sync add them back.
    private fun forgetWhenUnavailable(context: Context, errorCode: Int) {
        if (errorCode == GeofenceStatusCodes.GEOFENCE_NOT_AVAILABLE) GeofenceStore.writeRegistered(context, emptyList())
    }
}
