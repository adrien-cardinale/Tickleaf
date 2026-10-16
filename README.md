# Tickleaf

Task app inspired by Todoist. Local-first: data lives in the browser, the app installs as a PWA and works offline. An optional encrypted relay synchronizes several devices: the server never sees the data in clear text.

## Stack

- Bun (workspaces), TypeScript.
- `packages/core`: domain types, quick-add parser, dates, sorting. No dependency.
- `packages/db`: Drizzle SQLite schema, bundled migrations.
- `apps/web`: React 19, Vite, TanStack Router and Query, Tailwind 4, shadcn/ui, sql.js, vite-plugin-pwa. Encryption lives in `src/lib/crypto`, synchronization in `src/lib/sync`.
- `apps/server`: Hono relay on `bun:sqlite`. It stores a log of encrypted blobs and serves the web build. No business logic.

## Commands

| Command | Purpose |
|---|---|
| `bun install` | Installs dependencies. |
| `bun run dev` | Starts the relay on port 3000 and Vite on port 5173 (proxies `/api`). |
| `bun run build` | Type-checks `core` and `db`, then builds `apps/web/dist`. |
| `bun run start` | Starts the relay, which serves `apps/web/dist`. |
| `bun run build:static` | Builds for GitHub Pages into `apps/web/dist-static`. Prefix with `BASE_PATH=/tickleaf/`. |
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
2. In the browser, the server is the one that served the page: synchronization starts on its own. The static build (GitHub Pages) asks for the relay address, which must list that origin in `ALLOWED_ORIGINS`. Without an address, the app stays local.
3. The **Synchronization** dialog in the sidebar shows the status, reveals the recovery key behind a warning, and lets you **forget this device** (erases the local database and the key).

A device that already had data before this version goes through "Create a key" and keeps its data; it is then sent to the relay.

## Where the data lives

The SQLite database runs in memory with sql.js. It is saved encrypted in IndexedDB (database `tickleaf`, entry `database`, key in the entry `master-key`) 500 ms after each write, and when the page closes.

The browser may clear this storage: site data cleanup, private browsing, storage pressure, or long inactivity on Safari. With a relay configured, the data comes back on another device with the recovery key. Without a relay, do not trust Tickleaf with data you cannot afford to lose.
