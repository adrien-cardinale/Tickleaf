use serde::Serialize;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::{Error, Result};

pub(crate) fn register<R: Runtime>(
    _app: &AppHandle<R>,
    _api: PluginApi<R, ()>,
) -> std::result::Result<(), Box<dyn std::error::Error>> {
    Ok(())
}

pub(crate) fn run<R: Runtime, T>(
    _app: &AppHandle<R>,
    _command: &str,
    _payload: impl Serialize,
) -> Result<T> {
    Err(Error::Unsupported)
}
