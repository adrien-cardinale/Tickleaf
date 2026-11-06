package ch.tickleaf.geofence

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingClient
import com.google.android.gms.location.GeofencingRequest
import com.google.android.gms.location.LocationServices

typealias Completion = (Exception?) -> Unit

object GeofenceRegistrar {
    private const val MAX_GEOFENCES = 100

    fun sync(context: Context, targets: List<GeofenceTarget>, done: Completion) {
        val kept = if (GeofencePermissions.canRegister(context)) targets.take(MAX_GEOFENCES) else emptyList()
        val previous = GeofenceStore.read(context)
        val stale = previous.filter { old -> kept.none { sameRegion(it, old) } }.map { it.taskId }
        val fresh = kept.filter { target -> previous.none { sameRegion(it, target) } }
        GeofenceStore.write(context, kept)
        remove(context, stale) { removalError ->
            if (removalError != null) {
                GeofenceStore.write(context, previous)
                done(removalError)
            } else {
                add(context, fresh) { addError ->
                    if (addError != null) GeofenceStore.write(context, kept - fresh.toSet())
                    done(addError)
                }
            }
        }
    }

    fun restore(context: Context, done: Completion) {
        add(context, GeofenceStore.read(context)) { error ->
            if (error != null) GeofenceStore.clear(context)
            done(error)
        }
    }

    fun clear(context: Context, done: Completion) {
        GeofenceStore.clear(context)
        client(context).removeGeofences(pendingIntent(context)).addOnCompleteListener { done(it.exception) }
    }

    private fun sameRegion(first: GeofenceTarget, second: GeofenceTarget): Boolean =
        first.taskId == second.taskId &&
            first.latitude == second.latitude &&
            first.longitude == second.longitude &&
            first.radius == second.radius

    private fun remove(context: Context, requestIds: List<String>, done: Completion) {
        if (requestIds.isEmpty()) {
            done(null)
            return
        }
        client(context).removeGeofences(requestIds).addOnCompleteListener { done(it.exception) }
    }

    @SuppressLint("MissingPermission")
    private fun add(context: Context, targets: List<GeofenceTarget>, done: Completion) {
        if (targets.isEmpty() || !GeofencePermissions.canRegister(context)) {
            done(null)
            return
        }
        client(context)
            .addGeofences(request(targets), pendingIntent(context))
            .addOnCompleteListener { done(it.exception) }
    }

    private fun request(targets: List<GeofenceTarget>): GeofencingRequest =
        GeofencingRequest.Builder()
            .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
            .addGeofences(targets.map { geofence(it) })
            .build()

    private fun geofence(target: GeofenceTarget): Geofence =
        Geofence.Builder()
            .setRequestId(target.taskId)
            .setCircularRegion(target.latitude, target.longitude, target.radius.toFloat())
            .setExpirationDuration(Geofence.NEVER_EXPIRE)
            .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER)
            .build()

    private fun client(context: Context): GeofencingClient = LocationServices.getGeofencingClient(context)

    // Play Services fills the intent with the triggering geofences, so it must stay mutable on API 31+.
    private fun pendingIntent(context: Context): PendingIntent =
        PendingIntent.getBroadcast(
            context,
            0,
            Intent(context, GeofenceReceiver::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE,
        )
}
