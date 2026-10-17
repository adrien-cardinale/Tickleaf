# Changelog

All notable changes to Tickleaf are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [semantic versioning](https://semver.org).

The section matching the released version is attached automatically as the GitHub release notes.

## [0.2.0] - 2026-10-17

### Added

- Sections inside projects: create, rename and delete them, and add tasks directly into a section. The task detail lets you move a task to another section.
- Task reminders. Set a **Rappel** date and time in the task detail. The desktop and Android apps show a notification at that time. On the desktop, the reminder only rings while the app is open.
- Several accounts per device. **Settings › Accounts** adds, renames and opens accounts, and a switcher appears in the sidebar with two accounts or more.
- **Delete on the server** erases the account on the relay for every device. **Remove from this device** erases only the local copy.
- **Settings › Export** downloads every task as a CSV file.
- Pair the Android app with a QR code. **Settings** shows a QR code holding the recovery key and the server address. On first launch, the Android app scans it instead of typing the key.

### Changed

- The task delete button is now a trash icon in the task detail header, and the detail has a confirm button.
- Sections and reminders are synchronized. Update every device to 0.2.0: an older version ignores them and can drop them when it edits a task.

## [0.1.0] - 2026-10-17

### Added

- Desktop application for Windows, macOS and Linux, built with Tauri. It checks GitHub releases and installs updates in one click.
- Android application (APK). **Settings** shows when a newer version is published and downloads its APK.
- The desktop and Android applications ask for the relay address, like the static build.
