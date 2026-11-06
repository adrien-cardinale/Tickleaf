use tauri::{command, AppHandle, Runtime};

use crate::{platform, GeofenceTarget, PermissionStatus, Result, SyncRequest, SyncResponse};

#[command]
pub(crate) async fn check_permissions<R: Runtime>(app: AppHandle<R>) -> Result<PermissionStatus> {
    platform::run(&app, "checkPermissions", ())
}

#[command]
pub(crate) async fn request_permissions<R: Runtime>(app: AppHandle<R>) -> Result<PermissionStatus> {
    platform::run(&app, "requestPermissions", ())
}

#[command]
pub(crate) async fn sync_geofences<R: Runtime>(
    app: AppHandle<R>,
    targets: Vec<GeofenceTarget>,
) -> Result<SyncResponse> {
    platform::run(&app, "syncGeofences", SyncRequest { targets })
}

#[command]
pub(crate) async fn clear_geofences<R: Runtime>(app: AppHandle<R>) -> Result<()> {
    platform::run(&app, "clearGeofences", ())
}
