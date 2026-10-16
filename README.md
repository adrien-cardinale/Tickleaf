# Tickleaf

Application de tâches inspirée de Todoist. Local-first : aucune inscription, aucun serveur. Les données restent dans le navigateur. L’application s’installe comme une PWA et fonctionne hors ligne.

## Pile

- Bun (workspaces), TypeScript.
- `packages/core` : types du domaine, parseur d’ajout rapide, dates, tri. Aucune dépendance.
- `packages/db` : schéma Drizzle SQLite, migrations embarquées.
- `apps/web` : React 19, Vite, TanStack Router et Query, Tailwind 4, shadcn/ui, sql.js, vite-plugin-pwa.

## Commandes

| Commande | Effet |
|---|---|
| `bun install` | Installe les dépendances. |
| `bun run dev` | Lance Vite en développement. |
| `bun run build` | Vérifie les types de `core` et `db`, puis construit `apps/web/dist`. |
| `bun run build:static` | Construit pour GitHub Pages dans `apps/web/dist-static`. Préfixe avec `BASE_PATH=/tickleaf/`. |
| `bun run typecheck` | Vérifie les types de tous les paquets. |
| `bun run test` | Lance les tests unitaires de `core`. |
| `bun run lint` | Lance Biome. |
| `bun run db:generate` | Génère une migration après un changement de schéma, puis la regroupe. |
| `bun run db:bundle` | Regroupe les migrations dans `migrations.generated.ts`. |
| `bun run icons` | Régénère les icônes de la PWA. |

## Servir la PWA

```sh
bun run build
bun run --cwd apps/web preview -- --port 4173
```

Ouvre `http://localhost:4173`. Le navigateur propose l’installation. Le service worker exige HTTPS, sauf sur `localhost`.

## Où vivent les données

La base SQLite tourne en mémoire avec sql.js. Elle est sauvegardée dans IndexedDB (base `tickleaf`, entrée `database`) 500 ms après chaque écriture, et à la fermeture de la page.

Le navigateur peut effacer ce stockage : nettoyage des données du site, navigation privée, manque d’espace, ou inactivité prolongée sur Safari. Il n’existe pas encore d’export ni de synchronisation. Ne confie pas à Tickleaf des données que tu ne peux pas perdre.
