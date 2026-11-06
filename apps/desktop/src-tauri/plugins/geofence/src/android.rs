use serde::{de::DeserializeOwned, Serialize};
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Manager, Runtime,
};

use crate::Result;

const PLUGIN_IDENTIFIER: &str = "ch.tickleaf.geofence";

struct Geofence<R: Runtime>(PluginHandle<R>);

pub(crate) fn register<R: Runtime>(
    app: &AppHandle<R>,
    api: PluginApi<R, ()>,
) -> std::result::Result<(), Box<dyn std::error::Error>> {
    let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "GeofencePlugin")?;
    app.manage(Geofence(handle));
    Ok(())
}

pub(crate) fn run<R: Runtime, T: DeserializeOwned>(
    app: &AppHandle<R>,
    command: &str,
    payload: impl Serialize,
) -> Result<T> {
    let geofence = app.state::<Geofence<R>>();
    geofence
        .0
        .run_mobile_plugin(command, payload)
        .map_err(Into::into)
}
