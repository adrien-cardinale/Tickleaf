# Changelog

All notable changes to Tickleaf are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [semantic versioning](https://semver.org).

The section matching the released version is attached automatically as the GitHub release notes.

## [Unreleased]

### Added

- Places. The **Lieu** field in the task detail attaches a place to a task: coordinates, a radius from 50 m to 1 km and an optional name. **Utiliser ma position** fills in the current position on Android and in the browser.
- **Près de moi** at the top of **Aujourd’hui** lists open tasks with a place nearby. Tasks whose zone contains you come first, marked **Sur place**, then the others sorted by distance.
- The Android app shows a notification when it opens or comes back to the foreground inside the zone of a task. A task notifies again only after you leave its zone and come back.
- Task rows show the place name next to the due date.
- The Android app notifies you when you enter the zone of a task, even when it is closed. Android watches the zones itself and wakes Tickleaf on arrival, and the zones come back after a restart of the phone.
- The Android app asks for background location, shown as **Toujours autoriser** in the system settings, the first time a task has a place. Without it, arrivals only notify while the app is open. **Paramètres** › **Lieux** shows whether the alert works with the app closed, asks for the permission again and counts the zones Android watches.
- Favorite places. **Paramètres** › **Lieux favoris** lists named places: add one on the map, rename it, change its radius or delete it. In the **Lieu** field, the star button applies a favorite to the task in one click, and the star next to the radius saves the task place as a favorite. Favorites are synchronized.
- Due time. Once a task has a due date, the task detail shows an **Heure** field for an optional time, with a button to clear it. Task rows show the time after the date, tasks of the same day are sorted by time, and a repeating task keeps its time on the next occurrence. The CSV export gains an **Heure** column. Clearing the due date clears the time.

### Changed

- Places are synchronized. Update every device: an older version cannot read the changes a newer one sends.
- The CSV export gains a **Lieu** column with the place name, or its coordinates when it has no name.
- The zone of a task with a due date is armed one hour before its due time, or from 23:00 the day before when the task has no time. Until then, the task neither notifies on arrival nor appears in **Près de moi**. A task without due date stays armed, and an overdue task stays armed until it is completed.
- On Android, a zone is armed at its time even when the app is closed, give or take a few minutes. Before, it waited for the next opening of the app.

## [0.4.0] - 2026-10-24

### Added

- Right-click a task to open it, complete or reopen it, set its due date to today, tomorrow or none, change its priority, move it to another project or the inbox, or delete it.
- Right-click a project in the sidebar to rename it, add a subproject, change its color, move it or archive it.

### Changed

- A new project gets a random color. The color picker no longer appears when you create a project: change the color later with **Couleur** in the project menu.
- The desktop and Android apps no longer show the browser menu on right-click outside text fields.

### Fixed

- Drag a task from one section of a project to another, or to the list without a section.
- **Copier** copies the recovery key on a self-hosted instance served over plain HTTP.

## [0.3.0] - 2026-10-17

### Added

- Recurring tasks. The **Répétition** field in the task detail repeats a task every day, weekday, week, month or year, with an interval. Quick add understands `tous les jours`, `chaque lundi` or `toutes les 2 semaines`. Completing a recurring task moves its due date to the next occurrence instead of closing it, and **Annuler** in the notification puts the previous date back.
- Subtasks. The **Sous-tâches** field in the task detail splits a task into steps to tick one by one. The task list shows the progress, for example 2/5. Completing the task completes its open subtasks.
- Reorder tasks by drag and drop in the inbox and in projects, in the list without a section and inside each section. Drag the handle at the left of a task, or focus it and use the keyboard. Today and Upcoming stay sorted by priority and date.
- Keyboard shortcuts on the computer: `g` then a letter to change view, `j` and `k` to move between tasks, `x` to complete the focused task, `Ctrl+K` (`⌘K` on a Mac) to search. Press `?` or open **Settings › Raccourcis clavier** to list them all.
- Subprojects: a project can hold subprojects, up to four levels deep. **Ajouter un sous-projet** in the project menu creates one, and **Déplacer vers…** moves a project under another project or back to the root. The sidebar indents subprojects under their parent and folds them with a chevron. Archiving a project archives its subprojects too.
- Project colors: pick one of ten colors below the name when you create a project, or later with **Couleur** in the project menu. The dot next to the project name takes that color in the sidebar, on task rows and in the breadcrumb.
- **Matrice** view: the Eisenhower matrix splits open tasks into four quadrants. A task is important with priority P1 or P2, and urgent when it is overdue or due within two days. The sidebar counts the urgent and important tasks. Press `g` then `m` to open it.

### Changed

- Repetitions, subtasks, the parent and the color of a project are synchronized. Update every device to 0.3.0: an older version ignores them and can drop them when it edits a task or a project.
- The CSV export gains a **Répétition** column and a **Tâche parente** column, and lists subtasks under the title of their parent task.

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
