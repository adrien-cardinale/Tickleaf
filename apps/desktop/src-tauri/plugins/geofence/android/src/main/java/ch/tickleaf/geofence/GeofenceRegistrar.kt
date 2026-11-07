package ch.tickleaf.geofence

import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.AlarmManagerCompat
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingClient
import com.google.android.gms.location.GeofencingRequest
import com.google.android.gms.location.LocationServices

typealias Completion = (Exception?) -> Unit

object GeofenceRegistrar {
    private const val MAX_GEOFENCES = 100
    private const val ARMING_REQUEST_CODE = 1

    fun sync(context: Context, targets: List<GeofenceTarget>, done: Completion) {
        GeofenceStore.write(context, targets)
        applyStored(context, done)
    }

    fun restore(context: Context, done: Completion) {
        GeofenceStore.writeRegistered(context, emptyList())
        applyStored(context, done)
    }

    fun applyStored(context: Context, done: Completion) {
        val now = System.currentTimeMillis()
        val targets = GeofenceStore.read(context)
        val armed = if (GeofencePermissions.canRegister(context)) armedTargets(targets, now) else emptyList()
        val previous = GeofenceStore.registered(context)
        val stale = previous.filter { old -> armed.none { sameRegion(it, old) } }.map { it.taskId }
        val fresh = armed.filter { target -> previous.none { sameRegion(it, target) } }
        scheduleArming(context, nextArmAt(targets, now))
        remove(context, stale) { removalError ->
            if (removalError != null) {
                done(removalError)
            } else {
                add(context, fresh) { addError ->
                    GeofenceStore.writeRegistered(context, if (addError == null) armed else armed - fresh.toSet())
                    done(addError)
                }
            }
        }
    }

    fun clear(context: Context, done: Completion) {
        GeofenceStore.clear(context)
        cancelArming(context)
        client(context).removeGeofences(pendingIntent(context)).addOnCompleteListener { done(it.exception) }
    }

    private fun isArmed(target: GeofenceTarget, now: Long): Boolean = target.armAt.let { it == null || it <= now }

    private fun armedTargets(targets: List<GeofenceTarget>, now: Long): List<GeofenceTarget> =
        targets.filter { isArmed(it, now) }.take(MAX_GEOFENCES)

    private fun nextArmAt(targets: List<GeofenceTarget>, now: Long): Long? =
        targets.mapNotNull { it.armAt }.filter { it > now }.minOrNull()

    private fun scheduleArming(context: Context, armAt: Long?) {
        val alarms = context.getSystemService(AlarmManager::class.java) ?: return
        val intent = armingIntent(context)
        alarms.cancel(intent)
        if (armAt != null) AlarmManagerCompat.setAndAllowWhileIdle(alarms, AlarmManager.RTC_WAKEUP, armAt, intent)
    }

    private fun cancelArming(context: Context) = scheduleArming(context, null)

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

    private fun armingIntent(context: Context): PendingIntent =
        PendingIntent.getBroadcast(
            context,
            ARMING_REQUEST_CODE,
            Intent(context, ArmingReceiver::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

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
