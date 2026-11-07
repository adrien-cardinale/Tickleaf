package ch.tickleaf.geofence

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import com.fasterxml.jackson.databind.ObjectMapper

object GeofenceStore {
    private const val PREFERENCES_NAME = "geofences"
    private const val TARGETS_KEY = "targets"
    private const val REGISTERED_KEY = "registered"
    private const val EMPTY_LIST = "[]"

    private val mapper = ObjectMapper()

    fun read(context: Context): List<GeofenceTarget> = readList(context, TARGETS_KEY) ?: emptyList()

    // Before deferred arming, every stored target was registered and no registered list existed.
    fun write(context: Context, targets: List<GeofenceTarget>) {
        val preferences = preferences(context)
        val legacy = preferences.getString(TARGETS_KEY, null) ?: EMPTY_LIST
        preferences.edit {
            if (!preferences.contains(REGISTERED_KEY)) putString(REGISTERED_KEY, legacy)
            putString(TARGETS_KEY, mapper.writeValueAsString(targets))
        }
    }

    fun registered(context: Context): List<GeofenceTarget> = readList(context, REGISTERED_KEY) ?: read(context)

    fun writeRegistered(context: Context, targets: List<GeofenceTarget>) {
        preferences(context).edit { putString(REGISTERED_KEY, mapper.writeValueAsString(targets)) }
    }

    fun clear(context: Context) {
        preferences(context).edit {
            remove(TARGETS_KEY)
            remove(REGISTERED_KEY)
        }
    }

    private fun readList(context: Context, key: String): List<GeofenceTarget>? {
        val json = preferences(context).getString(key, null) ?: return null
        return runCatching { mapper.readValue(json, Array<GeofenceTarget>::class.java).toList() }.getOrDefault(emptyList())
    }

    private fun preferences(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
}
