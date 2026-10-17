# Tickleaf

Task app inspired by Todoist. Local-first: data lives in the browser, the app installs as a PWA and works offline. An optional encrypted relay synchronizes several devices: the server never sees the data in clear text.

## Stack

- Bun (workspaces), TypeScript.
- `packages/core`: domain types, quick-add parser, dates, sorting. No dependency.
- `packages/db`: Drizzle SQLite schema, bundled migrations.
- `apps/web`: React 19, Vite, TanStack Router and Query, Tailwind 4, shadcn/ui, sql.js, vite-plugin-pwa. Encryption lives in `src/lib/crypto`, synchronization in `src/lib/sync`.
- `apps/desktop`: Tauri 2 shell for Windows, macOS, Linux and Android. It packages the `apps/web` build made with `--mode desktop`.
- `apps/server`: Hono relay on `bun:sqlite`. It stores a log of encrypted blobs and serves the web build. No business logic.

## Commands

| Command | Purpose |
|---|---|
| `bun install` | Installs dependencies. |
| `bun run dev` | Starts the relay on port 3000 and Vite on port 5173 (proxies `/api`). |
| `bun run build` | Type-checks `core` and `db`, then builds `apps/web/dist`. |
| `bun run start` | Starts the relay, which serves `apps/web/dist`. |
| `bun run build:static` | Builds for GitHub Pages into `apps/web/dist-static`. Prefix with `BASE_PATH=/tickleaf/`. |
| `bun run desktop:dev` | Starts the desktop app with Vite on port 5174. |
| `bun run desktop:build` | Builds the desktop installers into `apps/desktop/src-tauri/target/release/bundle`. |
| `bun run android:dev` | Starts the app on a connected Android device or emulator. |
| `bun run android:build` | Builds the Android APK and AAB. |
| `bun run desktop:check-version` | Checks that `package.json`, `Cargo.toml` and `Cargo.lock` of `apps/desktop` carry the same version. |
| `bun run typecheck` | Type-checks every package. |
| `bun run test` | Runs the unit tests of `core`, `web` and `server`. |
| `bun run lint` | Runs Biome. |
| `bun run db:generate` | Generates a migration after a schema change, then bundles it. |
| `bun run db:bundle` | Bundles the migrations into `migrations.generated.ts`. |
| `bun run icons` | Regenerates the PWA icons. |

## Running with Docker

```sh
docker compose up -d --build
```

Open `http://localhost:3000`. The image builds the web UI, then starts the relay with the server dependencies only. The relay database lives in the `tickleaf-data` volume, mounted on `/app/data`.

Without Compose:

```sh
docker build -t tickleaf .
docker run -d -p 3000:3000 -v tickleaf-data:/app/data tickleaf
```

Encryption also works over plain HTTP, thanks to a JavaScript fallback when Web Crypto is unavailable. Only the service worker (PWA install, offline mode) requires HTTPS or `localhost`. Put a TLS reverse proxy in front of port 3000 for remote access.

## Desktop and Android apps

The version lives in `apps/desktop/package.json`, `src-tauri/Cargo.toml` and `src-tauri/Cargo.lock`. The web build displays it too.

Building needs Rust, plus the Android SDK, NDK and a JDK for Android. The apps ask for the relay address, like the static build. Requests go through the Tauri HTTP plugin, so `ALLOWED_ORIGINS` is not needed.

### Releasing

1. Bump the version in the three files above, then run `bun run desktop:check-version`.
2. Add a `## [x.y.z]` section to `CHANGELOG.md`. It becomes the release notes.
3. Push a `vx.y.z` tag. The `desktop.yml` workflow builds Windows, macOS, Linux and Android, then publishes the GitHub release with `latest.json`.

The desktop app installs updates from **Settings** through the Tauri updater. The Android app shows the new version and downloads its APK.

### Signing

| Secret | Content |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Content of `tickleaf-updater.key` (not versioned). |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password of that key. |
| `ANDROID_KEYSTORE` | Base64 of the release keystore. |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore and key password. |
| `ANDROID_KEY_ALIAS` | Key alias (`tickleaf`). |

The updater public key sits in `tauri.conf.json`. Losing the private key stops updates for installed apps. Losing the keystore prevents installing a new APK over the old one.

For a local signed APK, create `apps/desktop/src-tauri/gen/android/keystore.properties` (not versioned):

```properties
keyAlias=tickleaf
password=<password>
storeFile=C:/path/to/tickleaf-release.jks
```

## Relay configuration

Every variable has a default. Copy `.env.example` to `.env` to change them in development.

| Variable | Default | Role |
|---|---|---|
| `PORT` | `3000` | Listening port. |
| `DATABASE_PATH` | `./data/relay.db` | Relay SQLite database (`/app/data/relay.db` in the image). |
| `ALLOW_SIGNUP` | `true` | `false` refuses any new key. Set it to `false` once your devices are connected. |
| `STATIC_DIR` | `apps/web/dist` | Web build folder to serve. |
| `MAX_USER_BYTES` | 512 MiB | Log quota per key. `0` disables the quota. |
| `RATE_LIMIT_PER_MINUTE` | `300` | Requests per minute and per client. `0` disables the limit. |
| `ALLOWED_ORIGINS` | empty | Allowed CORS origins, comma-separated. Needed for a static build hosted elsewhere. |

## Encryption model

Each device keeps its own SQLite database with all the data. The server never sees it in clear text.

- **Master key**: 32 random bytes generated on the device. It is shown as a recovery key in Crockford base32, in groups of four characters, with a 2-byte checksum that detects typos (`I`, `L` and `O` are accepted for `1`, `1` and `0`). Anyone holding this key can read the data. Losing it makes the data unrecoverable.
- **Derived values** (HKDF-SHA-256, salt `tickleaf/v1`): a public **user id** (32 hex characters), an **auth secret** and an **AES-256-GCM key**. The master key never leaves the device.
- **Sealed blobs**: each entry is encrypted with a random 12-byte IV, prefixed by a format version byte, with the user id bound as additional authenticated data.
- **Authentication**: `Authorization: Bearer <userId>.<secret>`. The server stores only the SHA-256 hash of the secret and compares it in constant time. No password, no session.

The local database saved in IndexedDB is encrypted with the same key. A plain database from an earlier version is read once and re-encrypted on the next save.

## Relay API

All routes live under `/api`. `data` is the base64 of a sealed blob (8 MiB max per entry, 9 MiB max per request). Errors are JSON: `{ "error": "…" }`.

| Route | Description |
|---|---|
| `GET /api/health` | Returns `{ "status": "ok" }`. |
| `POST /api/log` | Appends `{ "data" }` to the log and returns `{ "seq" }` (201). The first append from an unknown user id creates the account (403 if signups are closed); later appends need the matching secret (401 otherwise). 413 when the quota is reached. |
| `GET /api/log?since=<seq>&limit=<n>` | Returns `{ entries: [{ seq, data }], cursor, hasMore }` for entries after `since`. `limit` defaults to 200 and is capped at 500; a page is also capped at 8 MiB. Call again with `cursor` while `hasMore` is `true`. |
| `DELETE /api/account` | Deletes the account and its whole log (204). |

The log is append-only, numbered per account with a gapless sequence (`seq`), stored in SQLite in WAL mode.

## Synchronization

The server is a blind, ordered log; clients do the merging.

1. **Pull**: the client reads the log from its cursor, page by page, decrypts each entry and applies its rows. An unreadable entry aborts the sync without moving the cursor: the key does not match, or the data is corrupted.
2. **Push**: local rows not yet sent (`sync_version` is `NULL`) go out in batches of 200, each sealed and appended to the log. Accepted rows get their sequence number as `sync_version`.
3. **Conflicts**: the row with the most recent `updatedAt` wins. Deletions are soft (`deleted_at`) so they propagate between devices.

Synchronization runs at startup, every 5 minutes, 5 seconds after each change, when the tab comes back to the foreground, when the network comes back, and on demand from the sidebar.

## Connecting a device

1. On first launch the app asks for a key: **create a key** (write down the displayed recovery key) or **enter an existing key** to join your data.
   The Android app can also **scan a QR code**: on a device already set up, **Settings** shows a QR code holding the recovery key and the relay address.
2. In the browser, the server is the one that served the page: synchronization starts on its own. The static build (GitHub Pages) and the desktop and Android apps ask for the relay address. For the static build, the relay must list its origin in `ALLOWED_ORIGINS`. Without an address, the app stays local.
3. The **Settings** page (`/settings`) shows the synchronization status, reveals the recovery key behind a warning, exports the tasks and checks for updates.

A device that already had data before this version goes through "Create a key" and keeps its data; it is then sent to the relay.

## Accounts

A device can hold several accounts. Each account has its own key, its own encrypted database and its own relay address.

- **Settings › Accounts** lists the accounts, renames them, opens another one (the app reloads) and adds one with the same create, restore or scan steps as the first launch.
- With two accounts or more, an account switcher appears at the bottom of the sidebar.
- **Settings › This account** offers **Remove from this device**: it erases the key and the local database of the open account, then opens the next account or the welcome screen. Server data stays available to other devices.
- With a relay, **Delete on the server** also calls `DELETE /api/account`: every device loses the data of this account.

Account names and relay addresses are stored in clear text in IndexedDB.

## Export

**Settings › Export** downloads every task of the open account as CSV: `;` separator, UTF-8 with BOM, one row per task, subtasks included with the title of their parent task. The Android app saves the file in its Download folder and shows the path.

## Reminders

The task detail sets a reminder date and time. The desktop and Android apps show a notification at that time; the web build stores the reminder but never rings. On the desktop, the reminder only rings while the app is open. On Android, the system schedules it, so it rings with the app closed.

## Where the data lives

The SQLite database runs in memory with sql.js. It is saved encrypted in IndexedDB (database `tickleaf`, entry `database:<id>`, key in the entry `master-key:<id>`) 500 ms after each write, and when the page closes. `<id>` is the public user id derived from the key. The entry `accounts` lists the accounts and the open one. The `database` and `master-key` entries of an earlier version move under the new names on the next launch.

The browser may clear this storage: site data cleanup, private browsing, storage pressure, or long inactivity on Safari. With a relay configured, the data comes back on another device with the recovery key. Without a relay, do not trust Tickleaf with data you cannot afford to lose.
