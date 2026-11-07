use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

use tauri::{Emitter, Manager, Window, WindowEvent};

const CLOSE_REQUESTED_EVENT: &str = "tickleaf://close-requested";
const SAVE_TIMEOUT: Duration = Duration::from_secs(3);

#[derive(Default)]
pub struct CloseGuard {
    saved: AtomicBool,
}

fn allow_close(window: &Window) {
    window
        .state::<CloseGuard>()
        .saved
        .store(true, Ordering::SeqCst);
    let _ = window.close();
}

fn close_after_timeout(window: Window) {
    thread::spawn(move || {
        thread::sleep(SAVE_TIMEOUT);
        allow_close(&window);
    });
}

pub fn on_window_event(window: &Window, event: &WindowEvent) {
    let WindowEvent::CloseRequested { api, .. } = event else {
        return;
    };
    if window.state::<CloseGuard>().saved.load(Ordering::SeqCst) {
        return;
    }
    api.prevent_close();
    if window.emit(CLOSE_REQUESTED_EVENT, ()).is_err() {
        allow_close(window);
        return;
    }
    close_after_timeout(window.clone());
}

#[tauri::command]
pub fn confirm_close(window: Window) {
    allow_close(&window);
}
