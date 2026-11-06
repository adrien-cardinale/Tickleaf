package ch.tickleaf.geofence

import app.tauri.annotation.InvokeArg

@InvokeArg
class GeofenceTarget {
    var id: Int = 0
    var taskId: String = ""
    var title: String = ""
    var body: String = ""
    var latitude: Double = 0.0
    var longitude: Double = 0.0
    var radius: Double = 0.0
}

@InvokeArg
class SyncArgs {
    var targets: List<GeofenceTarget> = emptyList()
}
