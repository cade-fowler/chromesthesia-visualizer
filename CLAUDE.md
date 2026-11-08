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
- **Server:** `app.ts` builds the Express app (`createApp(authConfig)`), `index.ts` loads env, connects, and listens. Keep this split: tests use `testApp()`/`ownerAgent()` from `server/src/test/auth.ts` and call `useTestDb()` (`server/src/test/`, excluded from the build) to get an in-memory DB. `songs()`/`colors()` in `db.ts` throw if the DB isn't connected; `connectDb()` also creates indexes (`ensureIndexes`).
- **Data model:** two main collections (plus `settings`, see Logbook). `songs` holds track metadata (unique `id` = Spotify track id, optional song-level `notes`). `colors` holds one `ColorEntry` per assigned color (`songId`, `color`, `createdAt`, optional `startMs`/`endMs`/`label`/`notes`). Colors are never embedded in songs, duplicates are allowed, and entries are addressed by id (Mongo `_id` as hex, mapped by `toColorEntry()`), never by hex value. Colors are returned in song order (`startMs`, then `createdAt`, then `_id`; whole-song colors first) by the server's `colorsFor()` and the client's `compareColorEntries()`; keep the two in step.
- **Validation:** every request body/query is parsed with zod in the route file. Colors are normalized to lowercase `#rrggbb` on the server. Query params are restricted to plain strings to block Mongo operator injection (`?title[$ne]=x` → 400).
- **Client routes:** `/` Explore (public home: random featured song, stats from `GET /api/stats`, a basic search over `GET /api/songs` (text, decade and color Swatches only, kept in the URL as `?q=&decade=&family=`; an old `color`/`hue`/`light` link forwards to `/songs`), recently added), `/songs` the Songs page (every song, with all the filters: text, decade and every color mode (Swatches, Hex, HSL, Range), also kept in the URL as `&color=rrggbb` (no `#`) or `&hue=200-260&light=30-70`, plus `&sort=`, applied on the client by `sortSongs()`). Both pages share the URL logic (`utils/songSearch.ts`), `useSongSearch()` and `SearchFilters` (`components/search/`). `/studio` the owner's Color picker (follows the Spotify song; `?song=<id>` pins it to any saved song instead, which needs no Spotify), `/songs/:songId` the public song page, `/albums/:albumId` the public album page (logged songs from one album, via `GET /api/albums/:id`; album names link here, not to Spotify). Spotify's redirect URI is the site origin, so `/` forwards `?code=`/`?error=` to `/studio`, which finishes the login.
- **Client → API:** always relative `/api/...` URLs (Vite proxies `/api` to :5050 in dev). No CORS by design.
- **Spotify:** the browser does Authorization Code + PKCE (`SpotifyAPI.ts`); there is no client secret anywhere and none should be added. Tokens live in localStorage and refresh when <60s remain. `SpotifyElement` polls now-playing every 5s.

## Gotchas

- Use `127.0.0.1`, never `localhost`: Spotify rejects `localhost` redirect URIs, and `redirectUri` is `window.location.origin`.
- Tailwind v4 utilities live in `@layer utilities`, so unlayered third-party CSS (react-colorful) beats them. Override it with a two-class selector in `index.css` (see `.bezel .react-colorful…`) or the `!` suffix.
- Colors chosen at runtime must use inline `style`, not Tailwind classes.

## Visual style ("Bench gear")

- The site looks like a light-grey piece of hardware. The interface is **neutral only** (greys and near-black, no accent colors); the only real colors are album art and song colors.
- Tokens are in `client/src/index.css` `@theme` (`bg-case`, `bg-panel`, `bg-display`, `text-ink`, `text-silk`, `text-danger`, `font-mono` = IBM Plex Mono, body = system Helvetica Neue). Hardware pieces are `@utility` classes there: `key` / `key-dark` / `key-down` (keys), `well` (recessed display, also inputs), `panel` + `screws`, `pad` (color swatch), `bezel` (the picker), `silk` (printed label text).
- Shared pieces live in `client/src/components/ui/`: `buttons.ts` (key class strings), `SectionLabel` (label with a rule to the edge) and `Nameplate`.
- `key*`, `well`, `panel`, `pad` and `bezel` set `box-shadow`, so don't add Tailwind `ring-*` to them (it also uses `box-shadow`); use `outline-*`. To change a key's text color, use the `!` suffix (`text-danger!`).
- Layout: a top bar from `md` up, a bottom tab bar on phones (`Navbar`). From `lg` up, pages fill the height and scroll their own panels; below that the whole page scrolls. Use `dvh`, never `vh`.
- The server env var is `CONNECTION_STRING` (not `MONGODB_URI`); `DB_NAME` defaults to `colordatabase`. The server won't start without `OWNER_PASSWORD_HASH` and `SESSION_SECRET` (from `npm run hash-password -w server`).
- `PUT /api/songs/:id` keeps a song's `notes` when the body leaves them out (the Color Picker page never sends them), and `[]` clears them. It keeps `durationMs`, `album` and `artistUrls` the same way (`artistUrls` is in the same order as `artists`), but removes `albumImageUrl` when that's left out.
- `PATCH /api/colors/:id` uses `null` to clear a field; the part's times are checked (`partError()`) after merging with the stored entry.
- `migratedAt` marks color entries made by `npm run migrate:split-colors -w server` (`server/src/migrations/`). It's internal: `toColorEntry()` strips it from API responses.
- TypeScript is v7 (native compiler); `typescript-eslint`'s peer range lags, so lint stays non-type-aware.

## Project direction

- Public read, owner-only write. **Auth** (`server/src/auth.ts`): one owner password, stored only as a scrypt hash in `OWNER_PASSWORD_HASH`. `POST /api/auth/login` sets a stateless HMAC-signed `session` cookie (HttpOnly, SameSite=Strict, 30 days; `Secure` when `NODE_ENV=production`), `POST /api/auth/logout` clears it, `GET /api/auth/me` returns `{ owner }`. Failed logins are limited per IP in memory (5 per 15 min); `TRUST_CLOUDFLARE=true` takes the IP from `CF-Connecting-IP` (only safe when the server is reachable solely through the tunnel). Don't add CORS (the SameSite cookie is the CSRF defense).
- **Production:** with `NODE_ENV=production`, `index.ts` passes `clientDir` (`client/dist`, or `CLIENT_DIR`) to `createApp`, which serves it after the API routes: hashed `/assets` cached as immutable, `index.html` (no-cache) for any extensionless path, 404 for missing files. `Dockerfile` + `docker-compose.yml` (app + `mongo:7`, settings from the root `.env.example`, app published on all interfaces so the LAN can browse it at `http://<ip>:5050`; logging in and Spotify need the HTTPS tunnel). `VITE_SPOTIFY_CLIENT_ID` is a Docker build arg.
- **Security headers:** `helmet` in `server/src/security.ts` sets a strict CSP (`script-src 'self'`, no inline scripts or `eval`; images from Spotify's CDNs; `connect-src` to Spotify's APIs; `frame-ancestors 'none'`). A new external host (images, fonts, APIs) must be added there, or the production page blocks it. It only reaches the page once Express serves `client/dist`.
- Write routes are `PUT /api/songs/:id`, `DELETE /api/songs/:id` (deletes the song's colors first, then the song), `POST /api/songs/:id/colors`, `PATCH /api/colors/:id` and `DELETE /api/colors/:id`, each with `requireOwner` (401 `Not logged in`). Every new write route gets it too; reads stay public.
- Client: `OwnerProvider`/`useOwner()` (`client/src/auth/`) holds the login state. The Studio tab shows only to the owner, `RequireOwner` sends others from `/studio` to `/login?next=…` (nothing links to `/login`), and the Studio's Lock key logs out.
- Song-level notes are edited in the Studio (`SongNotes`, saved with `saveSongNotes()`, which re-sends the song's details because `PUT` needs them) and shown on the song page. The Studio's Delete song key (`DeleteSong`, two presses) removes a saved song; a picked song then goes back to now playing.
- `GET /api/songs` returns `SongSummary` (hex colors in song order + `addedAt` = first color's time, newest first); `GET /api/songs/random` is registered before `/:id`. Songs store `trackNumber`/`discNumber` from Spotify (kept on PUT like `durationMs`; older songs get them when next saved in the Studio), which order an album's songs. `songOrder` in `db.ts` is the shared Mongo sort for song order.
- **Search by color** (`server/src/color.ts`): `GET /api/songs?family=` (Swatches mode), `?color=` (Hex and HSL modes) or `?hue=`/`?light=` (Range mode), one kind at a time. Each result gets `match` (the matching color and its distance). Colors are compared in OKLab (`colorDistance()`), with the chroma part of the difference weighted by `CHROMA_WEIGHT` so greys don't match muted colors of the same lightness. `family` matches songs with any color in that family: greyish colors (OKLCH chroma under `GREY_CHROMA`) and very dark ones are white or black by lightness, the rest go by OKLCH hue band (`HUE_BANDS`; pinks are red, browns orange, teal blue). Results rank by closeness to the family's swatch color. `color` scores a song by its single closest color, keeps those within `CLOSE_DISTANCE`, and puts the closest first. Range search (`inColorRange()`): `hue=FROM-TO` is OKLCH hue in whole degrees and wraps past 360 when `FROM > TO`; `light=FROM-TO` is OKLCH lightness in %. A color is in range when it's in both given ranges; greyish colors never match a hue range. Songs rank by the share of their colors in range, then by how close the best one is to the range's middle (`rangeCenterDistance()`, in `match.distance`, with `match.inRange`). The Range mode's two-thumb sliders are `ui/RangeSlider` (CSS `slider-track` + `slider-range`). All of these are scored in Node after the aggregation, so `limit` applies after ranking. The swatch hexes are in both `FAMILY_COLORS` (server) and `client/src/utils/colorFamilies.ts`; keep them in step (`shared` can't hold runtime values, because the server build runs it as compiled JS).
- **Similar songs** (`GET /api/songs/:id/similar?limit=`, the song page's last section): `songDistance()` in `color.ts` matches each color to its closest color in the other song, both ways, and averages the two means. Every color entry counts (a hex logged for three parts weighs three times). A song is listed when its score is within `SIMILAR_DISTANCE` and it has at least one color within `CLOSE_DISTANCE` of one of this song's; the card's note is "`close` of `total` colors close".
- **Hue chart** (home page, `HueChart`): `GET /api/stats/hues` lists every color entry with its song and OKLCH `hue`/`lightness`; `hue` is `null` for greyish colors (`GREY_CHROMA`), which get their own Grey column. The client's `layoutHueChart()` (`utils/hueChart.ts`) puts hues in 24 columns of 15° starting at 345° (red's band start, so labels match `HUE_BANDS`), each stacked darkest at the bottom. Hovering a block dims other songs' blocks; clicking opens the song page.
- **Logbook** (Studio, owner only: `SpotifyElement/Logbook.tsx`, logic in `utils/logbook.ts`): today's songs against the daily goal, the day streak, milestones, a rerollable prompt (color bucket, thin decade, thin album, one-song artist, one-color song) and coverage channels. Data from `GET /api/stats/progress` (`requireOwner`); days are bucketed on the client so they end at local midnight. The daily goal lives in a third collection, `settings` (one doc, `_id: 'owner'`), via `GET`/`PATCH /api/settings` (both `requireOwner`). Color prompts' shades come from `shadeOf()` in `color.ts`; the prompt swatch hexes in `COLOR_NAMES` must stay in their bucket.
- Not built yet: the knob controls from the mockups, genre filters (songs store no genre), and analytics endpoints.

## Conventions

- Prettier: 4-space indent, single quotes, width 100. The Prettier mass-format commit is in `.git-blame-ignore-revs`.
- Conventional commit messages (`feat(client): …`, `fix: …`, `chore: …`). Fold iterative fixes for the same issue into one commit.
