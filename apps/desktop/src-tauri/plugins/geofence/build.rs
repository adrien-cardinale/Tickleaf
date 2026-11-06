const COMMANDS: &[&str] = &[
    "check_permissions",
    "request_permissions",
    "sync_geofences",
    "clear_geofences",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
