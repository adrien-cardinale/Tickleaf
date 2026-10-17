---
name: release
description: Prepare a new Tickleaf release end to end — pick the semver number, bump the three version files, write the CHANGELOG section, verify the README is still accurate, run the quality gate, and commit. Use this skill whenever the user talks about cutting, preparing or shipping a version ("prépare la v0.2.0", "nouvelle version", "on sort une release", "bump the version", "release notes", "update the changelog for the release"), or asks whether the docs are up to date before tagging. Use it even for a small patch release, since the CI refuses a tag whose version files or changelog section are off.
---

# Preparing a Tickleaf release

## Why the preparation matters

A release here is just a tag: pushing `v<X.Y.Z>` on `main` starts `.github/workflows/desktop.yml`, which

1. checks that `apps/desktop/package.json`, `Cargo.toml`, `Cargo.lock` and the tag all carry the same version (`apps/desktop/scripts/check-version.ts`),
2. checks that `CHANGELOG.md` has a `## [X.Y.Z]` section (`apps/desktop/scripts/release-notes.ts`),
3. checks that the updater signing secret exists,
4. typechecks and tests, builds the Windows / macOS / Linux installers and the signed Android APK, then publishes the GitHub release with that changelog section as the release notes and `latest.json` for the desktop updater.

So every mistake surfaces *after* the tag exists, when fixing it means deleting a tag and a half-published release. The whole point of this skill is to get the repository into a state where the tag can only succeed — and to notice what CI cannot check at all: stale documentation.

The release version is the **desktop app version**. The web build displays it too (`apps/web/vite.config.ts` reads `apps/desktop/package.json`). The other workspace packages (`apps/web`, `apps/server`, `packages/*`) are private and keep their own version — do not bump them unless the user asks.

## Step 1 — Audit the repository

Run the bundled audit first:

```sh
bun .claude/skills/release/scripts/release-audit.ts [target-version]
```

It reports the three declared versions and whether they agree, the commits and touched areas since the last tag, whether the changelog section already exists, and the working tree state.

Then read the commits since the last tag yourself (`git log --oneline <lastTag>..HEAD`, `git diff --stat <lastTag>..HEAD`). The audit tells you *where* things moved; only reading the diff tells you *what a user will notice*, which is what the changelog and the version number depend on.

If the working tree is dirty, sort that out before going further: either the pending work belongs in this release (commit it, normally before the release commit) or it does not (stash it). A release built from a half-committed tree is impossible to reproduce.

## Step 2 — Choose the version

Propose a number with a one-line justification and let the user confirm — the judgement about what counts as "breaking" for their users is theirs.

The project is pre-1.0 and follows semver: a breaking change (sync protocol, sealed blob format, key derivation, a database migration that an older build cannot read, a removed relay route) goes in the minor while major stays at 0; a new user-visible capability also goes in the minor; a release that only fixes things goes in the patch. If the tag contains a hyphen (`v0.2.0-rc.1`), the workflow publishes it as a prerelease, which is the way to ship a build for testing.

## Step 3 — Bump the version files

Three files must carry the exact same string:

- `apps/desktop/package.json` → `"version"`
- `apps/desktop/src-tauri/Cargo.toml` → `version` in the `[package]` section
- `apps/desktop/src-tauri/Cargo.lock` → the `version` right under `name = "tickleaf-desktop"`

`tauri.conf.json` has no version field on purpose (Tauri reads Cargo.toml), and the Android `versionCode` is derived by Tauri — do not add a version anywhere else, each extra copy is one more thing to desynchronize.

Verify with the same script CI uses, including the tag it will be given:

```sh
bun run desktop:check-version v<X.Y.Z>
```

## Step 4 — Write the changelog section

Insert the new section directly under the intro paragraph, above the previous version, and follow the conventions already in `CHANGELOG.md` (Keep a Changelog, English, today's date):

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- Short sentence describing what the user can now do.

### Changed

### Fixed
```

Only keep the subsections that have entries, in the Keep a Changelog order (Added, Changed, Deprecated, Removed, Fixed, Security). Write from the user's point of view: what changed for someone using the app, naming UI paths in bold (**Settings › Synchronization**) and file or command names in backticks. Internal refactors, CI tweaks and dependency bumps that change nothing observable do not belong here — the section becomes the public release notes, and the desktop app shows it in **Settings › Updates**. A release that genuinely has nothing user-visible is a sign the release itself may not be needed; say so rather than padding the list.

Check that the extraction CI performs returns what you expect:

```sh
bun apps/desktop/scripts/release-notes.ts v<X.Y.Z>
```

## Step 5 — Check the documentation against the release

Documentation drift is invisible to CI. Go through the diff since the last tag and, for each user-visible change, check whether `README.md` describes it:

- the intro and `## Stack` — packages and their roles,
- the `## Commands` table — against the root `scripts` in `package.json`,
- `## Desktop and Android apps` — release steps, secrets, signing,
- `## Running with Docker` — against `Dockerfile` and `docker-compose.yml`,
- `## Relay configuration` — against `.env.example` and the variables read in `apps/server/src`,
- `## Relay API` — against the routes in `apps/server/src`,
- `## Encryption model`, `## Synchronization`, `## Where the data lives` — against `apps/web/src/lib/crypto`, `apps/web/src/lib/sync` and `apps/web/src/lib/local-db`.

Useful cross-checks:

```sh
git diff <lastTag>..HEAD -- apps/server/src .env.example packages/db/drizzle   # API, config, migrations
grep -o 'bun run [a-z:-]*' README.md | sort -u                                 # commands documented
```

UI text lives in `apps/web/src/lib/labels.ts` (French only): no translation parity to check.

Fix what is wrong, and report what you deliberately left alone. Do not rewrite documentation beyond what this release changed: a release commit that also restructures the README is impossible to review.

## Step 6 — Run the quality gate

```sh
bun run typecheck
bun run lint
bun run desktop:check-version v<X.Y.Z>
bun apps/desktop/scripts/release-notes.ts v<X.Y.Z>
```

Do not run `bun run test` unless the user asks: the user runs tests themselves, and CI runs them before building. Mention that the tests were not run locally.

Report failures with their output rather than working around them.

## Step 7 — Commit, then stop before the tag

Commit the preparation on its own, with no attribution line:

```sh
git commit -m "chore(release): v<X.Y.Z>"
```

Then stop and hand the user the two commands that actually publish:

```sh
git push
git tag v<X.Y.Z> && git push origin v<X.Y.Z>
```

Do not run them yourself unless the user explicitly asks in this conversation. Pushing the tag builds and publishes a public GitHub release with installers and an APK that people install over their existing one; that call belongs to the user. Mention that the build takes about 15 to 20 minutes and that the release notes come from the changelog section, so it is worth re-reading before tagging.

When the user asks you to push the tag, follow the run with `gh run watch <run-id> --exit-status` in the background, then check `gh release view v<X.Y.Z>` lists the installers, the APK and `latest.json`.

## Final report

Close with a short summary the user can act on, in French:

- version chosen, and why that bump
- files changed (version files, changelog, docs)
- changelog section, verbatim
- quality gate: results, and the note that tests were left to CI
- the exact tag commands, and anything left deliberately undone
