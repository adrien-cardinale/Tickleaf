package ch.tickleaf.geofence

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import com.fasterxml.jackson.databind.ObjectMapper

object GeofenceStore {
    private const val PREFERENCES_NAME = "geofences"
    private const val TARGETS_KEY = "targets"

    private val mapper = ObjectMapper()

    fun read(context: Context): List<GeofenceTarget> {
        val json = preferences(context).getString(TARGETS_KEY, null) ?: return emptyList()
        return runCatching { mapper.readValue(json, Array<GeofenceTarget>::class.java).toList() }.getOrDefault(emptyList())
    }

    fun write(context: Context, targets: List<GeofenceTarget>) {
        val json = mapper.writeValueAsString(targets)
        preferences(context).edit { putString(TARGETS_KEY, json) }
    }

    fun clear(context: Context) {
        preferences(context).edit { remove(TARGETS_KEY) }
    }

    private fun preferences(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
}
