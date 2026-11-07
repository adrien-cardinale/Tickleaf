#[cfg(desktop)]
mod close_guard;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init());

    #[cfg(mobile)]
    let builder = builder
        .plugin(tauri_plugin_barcode_scanner::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_geolocation::init())
        .plugin(tauri_plugin_geofence::init());

    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(close_guard::CloseGuard::default())
        .on_window_event(close_guard::on_window_event)
        .invoke_handler(tauri::generate_handler![close_guard::confirm_close]);

    builder
        .run(tauri::generate_context!())
        .expect("erreur au lancement de Tickleaf");
}
