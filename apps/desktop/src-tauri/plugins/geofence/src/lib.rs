use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

mod commands;
mod error;
mod models;

#[cfg(target_os = "android")]
#[path = "android.rs"]
mod platform;

#[cfg(not(target_os = "android"))]
#[path = "unsupported.rs"]
mod platform;

pub use error::{Error, Result};
pub use models::*;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("geofence")
        .invoke_handler(tauri::generate_handler![
            commands::check_permissions,
            commands::request_permissions,
            commands::sync_geofences,
            commands::clear_geofences
        ])
        .setup(|app, api| platform::register(app, api))
        .build()
}
