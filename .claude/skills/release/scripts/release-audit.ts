#!/usr/bin/env bun
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim()
const root = git("rev-parse", "--show-toplevel")
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8")

const section = (title: string) => console.log(`\n=== ${title}\n`)

function declaredVersions() {
  const packageJson = JSON.parse(read("apps/desktop/package.json")).version as string
  const cargoPackage =
    read("apps/desktop/src-tauri/Cargo.toml")
      .split(/^\[/m)
      .find((part) => part.startsWith("package]")) ?? ""
  const cargoToml = cargoPackage.match(/^version = "([^"]+)"/m)?.[1]
  const cargoLock = read("apps/desktop/src-tauri/Cargo.lock").match(
    /name = "tickleaf-desktop"\r?\nversion = "([^"]+)"/,
  )?.[1]
  return { packageJson, cargoToml, cargoLock }
}

function reportVersions(target: string | undefined) {
  const { packageJson, cargoToml, cargoLock } = declaredVersions()
  section("Versions")
  console.log(`apps/desktop/package.json         ${packageJson}`)
  console.log(`apps/desktop/src-tauri/Cargo.toml ${cargoToml ?? "introuvable"}`)
  console.log(`apps/desktop/src-tauri/Cargo.lock ${cargoLock ?? "introuvable"}`)
  const consistent = new Set([packageJson, cargoToml, cargoLock]).size === 1
  console.log(consistent ? "→ cohérentes" : "→ INCOHÉRENTES : à aligner avant de taguer")
  if (target) console.log(`version cible demandée : ${target}`)
  return packageJson
}

function reportHistory() {
  const lastTag = git("tag", "--sort=-v:refname").split("\n").filter(Boolean)[0]
  const range = lastTag ? `${lastTag}..HEAD` : "HEAD"

  section(`Commits depuis ${lastTag ?? "le début"}`)
  console.log(git("log", "--oneline", range) || "(aucun)")

  section("Zones touchées depuis ce tag")
  const changed = lastTag ? git("diff", "--name-only", range).split("\n").filter(Boolean) : []
  const areas = new Map<string, number>()
  for (const file of changed) {
    const area = file.split("/").slice(0, 3).join("/")
    areas.set(area, (areas.get(area) ?? 0) + 1)
  }
  for (const [area, count] of [...areas].sort((a, b) => b[1] - a[1])) {
    console.log(`${String(count).padStart(4)}  ${area}`)
  }
  if (!changed.length) console.log("(aucun fichier modifié, ou pas de tag de référence)")
}

function reportChangelog(version: string) {
  section("Changelog")
  const changelog = read("CHANGELOG.md")
  const heading = changelog.match(new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\][^\\n]*`, "m"))?.[0]
  console.log(heading ? `section trouvée : ${heading}` : `pas de section "## [${version}]" → le tag échouerait en CI`)
  const today = new Date().toISOString().slice(0, 10)
  if (heading && !heading.includes(today))
    console.log(`date de la section différente d'aujourd'hui (${today}) : à vérifier`)
  const existing = [...changelog.matchAll(/^## \[([^\]]+)\]/gm)].map((match) => match[1])
  console.log(`\nsections existantes : ${existing.join(", ")}`)
}

function reportRepository() {
  section("État du dépôt")
  console.log(`branche : ${git("rev-parse", "--abbrev-ref", "HEAD")}`)
  console.log(git("status", "--porcelain") || "arbre propre")
}

const target = process.argv[2]?.replace(/^v/, "")
const declared = reportVersions(target)
reportHistory()
reportChangelog(target ?? declared)
reportRepository()
