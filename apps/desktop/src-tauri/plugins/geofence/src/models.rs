use serde::{Deserialize, Serialize};
use tauri::plugin::PermissionState;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeofenceTarget {
    pub id: i32,
    pub task_id: String,
    pub title: String,
    pub body: String,
    pub latitude: f64,
    pub longitude: f64,
    pub radius: f64,
    pub arm_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncRequest {
    pub targets: Vec<GeofenceTarget>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct SyncResponse {
    pub registered: u32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionStatus {
    pub location: PermissionState,
    pub background_location: PermissionState,
}
