# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the repo root (npm workspaces: `shared`, `client`, `server`):

- `npm run dev` — Vite client on http://127.0.0.1:5173 + Express server (tsx watch) on :5050
- `npm test` / `npm run typecheck` / `npm run lint` / `npm run format:check` / `npm run build`
- Single workspace: `npm test -w server` (or `-w client`)
- Single test: `npm test -w server -- src/routes/songs.test.ts -t "normalizes"`

CI (`.github/workflows/ci.yml`) runs format:check, lint, typecheck, test and build; keep all of them passing.

Server tests use `mongodb-memory-server`, so they need no running MongoDB (the first run downloads a mongod binary). Local dev needs MongoDB (`scripts/start_mongodb.zsh`) and `server/.env` + `client/.env` copied from the `.env.example` files.

## Architecture

- **`shared/`** is types only (no build step, no runtime code). Both client and server import `@chromesthesia/shared`; change API shapes there first.
- **Server:** `app.ts` builds the Express app (`createApp()`), `index.ts` loads env, connects, and listens. Keep this split: tests import `createApp()` and call `useTestDb()` (`server/src/test/`, excluded from the build) to get an in-memory DB. `songs()`/`colors()` in `db.ts` throw if the DB isn't connected; `connectDb()` also creates indexes (`ensureIndexes`).
- **Data model:** two collections. `songs` holds track metadata (unique `id` = Spotify track id, optional song-level `notes`). `colors` holds one `ColorEntry` per assigned color (`songId`, `color`, `createdAt`, optional `startMs`/`endMs`/`label`/`notes`). Colors are never embedded in songs, duplicates are allowed, and entries are addressed by id (Mongo `_id` as hex, mapped by `toColorEntry()`), never by hex value. Colors are returned in song order (`startMs`, then `createdAt`, then `_id`; whole-song colors first) by the server's `colorsFor()` and the client's `compareColorEntries()`; keep the two in step.
- **Validation:** every request body/query is parsed with zod in the route file. Colors are normalized to lowercase `#rrggbb` on the server. Query params are restricted to plain strings to block Mongo operator injection (`?title[$ne]=x` → 400).
- **Client → API:** always relative `/api/...` URLs (Vite proxies `/api` to :5050 in dev). No CORS by design.
- **Spotify:** the browser does Authorization Code + PKCE (`SpotifyAPI.ts`); there is no client secret anywhere and none should be added. Tokens live in localStorage and refresh when <60s remain. `SpotifyElement` polls now-playing every 5s.

## Gotchas

- Use `127.0.0.1`, never `localhost`: Spotify rejects `localhost` redirect URIs, and `redirectUri` is `window.location.origin`.
- Tailwind v4 utilities live in `@layer utilities`, so unlayered third-party CSS (react-colorful) beats them — use the `!` suffix (e.g. `h-4/5!`). Theme tokens (`bg-panel`, `text-accent`, `font-display`, `animate-playing`) are defined in `client/src/index.css` `@theme`.
- Colors chosen at runtime must use inline `style`, not Tailwind classes.
- The server env var is `CONNECTION_STRING` (not `MONGODB_URI`); `DB_NAME` defaults to `colordatabase`.
- `PUT /api/songs/:id` keeps a song's `notes` when the body leaves them out (the Color Picker page never sends them), and `[]` clears them. It keeps `durationMs` the same way, but removes `albumImageUrl` when that's left out.
- `PATCH /api/colors/:id` uses `null` to clear a field; the part's times are checked (`partError()`) after merging with the stored entry.
- `migratedAt` marks color entries made by `npm run migrate:split-colors -w server` (`server/src/migrations/`). It's internal: `toColorEntry()` strips it from API responses.
- TypeScript is v7 (native compiler); `typescript-eslint`'s peer range lags, so lint stays non-type-aware.

## Project direction

- Public read, owner-only write. The API currently has **no auth** — any new write route must be designed to sit behind a future `requireOwner` middleware; don't deploy publicly before auth lands.
- Write routes are `PUT /api/songs/:id`, `POST /api/songs/:id/colors`, `PATCH /api/colors/:id` and `DELETE /api/colors/:id`; all need `requireOwner` once auth lands.
- Not built yet: showing song-level notes, deleting a song (would need to cascade to its colors), and analytics endpoints.

## Conventions

- Prettier: 4-space indent, single quotes, width 100. The Prettier mass-format commit is in `.git-blame-ignore-revs`.
- Conventional commit messages (`feat(client): …`, `fix: …`, `chore: …`). Fold iterative fixes for the same issue into one commit.
