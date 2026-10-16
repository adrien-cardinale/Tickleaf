# Tickleaf

Application de tâches inspirée de Todoist. Local-first : les données vivent dans le navigateur, l'application s'installe comme une PWA et fonctionne hors ligne. Un relais chiffré optionnel synchronise plusieurs appareils : le serveur ne voit jamais les données en clair.

## Pile

- Bun (workspaces), TypeScript.
- `packages/core` : types du domaine, parseur d'ajout rapide, dates, tri. Aucune dépendance.
- `packages/db` : schéma Drizzle SQLite, migrations embarquées.
- `apps/web` : React 19, Vite, TanStack Router et Query, Tailwind 4, shadcn/ui, sql.js, vite-plugin-pwa. Le chiffrement vit dans `src/lib/crypto`, la synchronisation dans `src/lib/sync`.
- `apps/server` : relais Hono sur `bun:sqlite`. Il stocke un journal de blobs chiffrés et sert le build web. Aucune logique métier.

## Commandes

| Commande | Effet |
|---|---|
| `bun install` | Installe les dépendances. |
| `bun run dev` | Lance le relais sur le port 3000 et Vite sur le port 5173 (proxy `/api`). |
| `bun run build` | Vérifie les types de `core` et `db`, puis construit `apps/web/dist`. |
| `bun run start` | Lance le relais, qui sert `apps/web/dist`. |
| `bun run build:static` | Construit pour GitHub Pages dans `apps/web/dist-static`. Préfixe avec `BASE_PATH=/tickleaf/`. |
| `bun run typecheck` | Vérifie les types de tous les paquets. |
| `bun run test` | Lance les tests unitaires de `core`, `web` et `server`. |
| `bun run lint` | Lance Biome. |
| `bun run db:generate` | Génère une migration après un changement de schéma, puis la regroupe. |
| `bun run db:bundle` | Regroupe les migrations dans `migrations.generated.ts`. |
| `bun run icons` | Régénère les icônes de la PWA. |

## Lancer avec Docker

```sh
docker compose up -d --build
```

Ouvre `http://localhost:3000`. L'image construit le web, puis lance le relais avec les seules dépendances du serveur. La base du relais vit dans le volume `tickleaf-data`, monté sur `/app/data`.

Sans Compose :

```sh
docker build -t tickleaf .
docker run -d -p 3000:3000 -v tickleaf-data:/app/data tickleaf
```

Le service worker et Web Crypto exigent HTTPS, sauf sur `localhost`. Place un reverse proxy TLS devant le port 3000 pour un accès distant.

## Configuration du relais

Toutes les variables ont une valeur par défaut. Copie `.env.example` en `.env` pour les changer en développement.

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `3000` | Port d'écoute. |
| `DATABASE_PATH` | `./data/relay.db` | Base SQLite du relais (`/app/data/relay.db` dans l'image). |
| `ALLOW_SIGNUP` | `true` | `false` refuse toute nouvelle clé. Mets `false` une fois tes appareils connectés. |
| `STATIC_DIR` | `apps/web/dist` | Dossier du build web à servir. |
| `MAX_USER_BYTES` | 512 Mo | Quota du journal par clé. `0` désactive le quota. |
| `RATE_LIMIT_PER_MINUTE` | `300` | Requêtes par minute et par client. `0` désactive la limite. |
| `ALLOWED_ORIGINS` | vide | Origines CORS autorisées, séparées par des virgules. Utile pour un build statique hébergé ailleurs. |

## Modèle de chiffrement

Chaque appareil garde sa propre base SQLite avec toutes les données. Le serveur ne la voit jamais en clair.

- **Clé maîtresse** : 32 octets aléatoires générés sur l'appareil. Elle s'affiche comme clé de récupération en base32 Crockford, par groupes de quatre caractères, avec un checksum de 2 octets qui détecte les fautes de frappe (`I`, `L` et `O` sont acceptés pour `1`, `1` et `0`). Qui détient cette clé lit les données. Perdre la clé rend les données irrécupérables.
- **Valeurs dérivées** (HKDF-SHA-256, sel `tickleaf/v1`) : un **identifiant public** (32 caractères hex), un **secret d'authentification** et une **clé AES-256-GCM**. La clé maîtresse ne quitte jamais l'appareil.
- **Blobs scellés** : chaque entrée est chiffrée avec un IV aléatoire de 12 octets, précédée d'un octet de version, avec l'identifiant public en données authentifiées.
- **Authentification** : `Authorization: Bearer <userId>.<secret>`. Le serveur stocke seulement le SHA-256 du secret et le compare en temps constant. Pas de mot de passe, pas de session.

La base locale sauvegardée dans IndexedDB est chiffrée avec la même clé. Une base en clair d'une version précédente est relue puis rechiffrée à la sauvegarde suivante.

## API du relais

Toutes les routes vivent sous `/api`. `data` est le base64 d'un blob scellé (8 Mio max par entrée, 9 Mio max par requête). Les erreurs sont en JSON : `{ "error": "…" }`.

| Route | Description |
|---|---|
| `GET /api/health` | Renvoie `{ "status": "ok" }`. |
| `POST /api/log` | Ajoute `{ "data" }` au journal et renvoie `{ "seq" }` (201). Le premier ajout d'un identifiant inconnu crée le compte (403 si les inscriptions sont fermées) ; les suivants exigent le bon secret (401 sinon). 413 si le quota est atteint. |
| `GET /api/log?since=<seq>&limit=<n>` | Renvoie `{ entries: [{ seq, data }], cursor, hasMore }` pour les entrées après `since`. `limit` vaut 200 par défaut, 500 au plus ; une page est aussi plafonnée à 8 Mio. Rappelle avec `cursor` tant que `hasMore` vaut `true`. |
| `DELETE /api/account` | Supprime le compte et tout son journal (204). |

Le journal est append-only, numéroté par compte sans trou (`seq`), stocké dans SQLite en mode WAL.

## Synchronisation

Le serveur est un journal ordonné et aveugle ; les clients fusionnent.

1. **Pull** : le client lit le journal depuis son curseur, page par page, déchiffre chaque entrée et applique ses lignes. Une entrée illisible arrête la synchronisation sans avancer le curseur : la clé ne correspond pas, ou les données sont corrompues.
2. **Push** : les lignes locales non envoyées (`sync_version` à `NULL`) partent par lots de 200, chacun scellé puis ajouté au journal. Les lignes acceptées reçoivent leur numéro de séquence en `sync_version`.
3. **Conflits** : la ligne au `updatedAt` le plus récent gagne. Les suppressions sont logiques (`deleted_at`) pour se propager entre appareils.

La synchronisation tourne au démarrage, toutes les 5 minutes, 5 secondes après chaque modification, au retour de l'onglet au premier plan, au retour du réseau, et à la demande depuis la barre latérale.

## Connecter un appareil

1. Au premier lancement, l'application demande une clé : **crée une clé** (note la clé de récupération affichée) ou **entre une clé existante** pour rejoindre tes données.
2. Dans le navigateur, le serveur est celui qui a servi la page : la synchronisation démarre seule. Le build statique (GitHub Pages) demande l'adresse du relais, qui doit lister cette origine dans `ALLOWED_ORIGINS`. Sans adresse, l'application reste locale.
3. Le dialogue **Synchronisation** de la barre latérale montre l'état, affiche la clé de récupération derrière un avertissement, et permet d'**oublier cet appareil** (efface la base locale et la clé).

Un appareil qui avait déjà des données avant cette version passe par « Créer une clé » et garde ses données ; elles sont alors envoyées au relais.

## Où vivent les données

La base SQLite tourne en mémoire avec sql.js. Elle est sauvegardée chiffrée dans IndexedDB (base `tickleaf`, entrée `database`, clé dans l'entrée `master-key`) 500 ms après chaque écriture, et à la fermeture de la page.

Le navigateur peut effacer ce stockage : nettoyage des données du site, navigation privée, manque d'espace, ou inactivité prolongée sur Safari. Avec un relais configuré, les données se retrouvent depuis un autre appareil avec la clé de récupération. Sans relais, ne confie pas à Tickleaf des données que tu ne peux pas perdre.
