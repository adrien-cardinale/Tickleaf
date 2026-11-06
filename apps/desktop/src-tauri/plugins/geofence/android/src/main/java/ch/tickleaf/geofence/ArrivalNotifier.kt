package ch.tickleaf.geofence

import android.annotation.SuppressLint
import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object ArrivalNotifier {
    private const val CHANNEL_ID = "tickleaf.places"

    @SuppressLint("MissingPermission")
    fun show(context: Context, target: GeofenceTarget) {
        if (!GeofencePermissions.canNotify(context)) return
        val manager = NotificationManagerCompat.from(context)
        manager.createNotificationChannel(channel(context))
        manager.notify(CHANNEL_ID, target.id, notification(context, target))
    }

    private fun channel(context: Context): NotificationChannelCompat =
        NotificationChannelCompat.Builder(CHANNEL_ID, NotificationManagerCompat.IMPORTANCE_HIGH)
            .setName(context.getString(R.string.geofence_channel_name))
            .build()

    private fun notification(context: Context, target: GeofenceTarget): Notification =
        NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(context.applicationInfo.icon)
            .setContentTitle(target.title)
            .setContentText(target.body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(openApp(context, target.id))
            .build()

    private fun openApp(context: Context, requestCode: Int): PendingIntent? {
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
        return PendingIntent.getActivity(
            context,
            requestCode,
            launch,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
