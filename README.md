# Chromesthesia Visualizer

A web app for recording the colors I perceive in music (chromesthesia) and analyzing how they relate to the songs.

## Why I built this

[Chromesthesia](https://en.wikipedia.org/wiki/Chromesthesia) is a type of synesthesia where sound involuntarily triggers the sensation of seeing color. When I listen to music, I see colors tied to specific songs and moments within them. I am building this tool to record these associations as they happen and to find patterns in them. I want to gather data so I can understand what makes songs have their color. I also want to be able to generate playlists based on the hue, brightness, etc.

## Features

- **Built:**
  - Basic web app
  - Spotify now playing integration
  - Saving colors to MongoDB, one record per color, with optional notes (e.g. a texture)
  - Deleting individual colors
  - Owner login: anyone can browse, only the owner can write (password hash + signed session cookie)
- **Planned:**
  - Color tied to specific timestamps in a song (the data model supports it; the UI doesn't yet)
  - Two way searching / filtering
    - Search a color, brightness, range of hues, etc and get all songs that match
    - Search a song, band, genre, decade, etc and get the colors associated with those songs

## Tech stack

- **Client:** React 18, TypeScript, Vite, Tailwind CSS v4, React Router
- **Server:** Node, Express, TypeScript, zod
- **Database:** MongoDB
- **Tooling:** npm workspaces, ESLint, Prettier, Vitest, supertest, mongodb-memory-server

## Getting started

### Prerequisites

- Node.js 22+
- MongoDB running locally (or a MongoDB Atlas connection string)
- A Spotify app from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), with
  `http://127.0.0.1:5173` added as a redirect URI (Spotify does not allow `localhost`)

### Setup

```sh
npm install

cp client/.env.example client/.env   # set VITE_SPOTIFY_CLIENT_ID
cp server/.env.example server/.env   # set CONNECTION_STRING if not using local MongoDB
npm run hash-password -w server     # pick the owner password; paste its output into server/.env

npm run dev
```

Open http://127.0.0.1:5173 (use `127.0.0.1`, not `localhost`, or Spotify login will fail).

### Scripts

Run from the repo root:

| Command             | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Start the client (Vite) and server (tsx watch)       |
| `npm run build`     | Build the client and compile the server              |
| `npm test`          | Run all tests                                        |
| `npm run typecheck` | Type-check every workspace                           |
| `npm run lint`      | Lint with ESLint                                     |
| `npm run format`    | Format with Prettier (`format:check` to verify only) |

## How it works

```
client/   React app: Explore, song pages, and the Studio (Spotify login, now playing, color picker)
server/   Express API under /api, backed by MongoDB
shared/   TypeScript types used by both (Song, ColorEntry, NowPlaying, ...)
```

### Data model

Two MongoDB collections:

- **`songs`**: one document per Spotify track (`id`, `title`, `artists`, `albumImageUrl`,
  `songUrl`, optional `notes` about the song as a whole). `id` is the Spotify track id and is unique.
- **`colors`**: one document per color assigned to a song (`songId`, `color`, `createdAt`), with
  optional `startMs`/`endMs` for a part of the song, a `label` such as "chorus", and `notes`.

Keeping each color as its own record means a color can describe part of a song, carries its own
history and notes, can be deleted by id, and can be queried across all songs for analysis.

### API

| Method   | Route                   | What it does                                               |
| -------- | ----------------------- | ---------------------------------------------------------- |
| `GET`    | `/api/songs`            | List songs, optionally filtered by `?title=` or `?artist=` |
| `GET`    | `/api/songs/:id`        | One song with its colors, in song order                    |
| `PUT`    | `/api/songs/:id`        | Create or update a song's metadata                         |
| `GET`    | `/api/songs/:id/colors` | A song's colors, in song order                             |
| `POST`   | `/api/songs/:id/colors` | Add a color to a song                                      |
| `DELETE` | `/api/colors/:id`       | Delete one color                                           |

Colors come back in **song order**: whole-song colors first, then parts by `startMs`, with ties
going to whichever was saved first. That's the order a timeline of the song would draw them in.

There's no authentication yet, so don't expose the server publicly.

1. The client logs in to Spotify with the Authorization Code + PKCE flow, so no client secret is
   needed in the browser.
2. While logged in, it polls Spotify every 5 seconds for the currently playing track.
3. Picking a color and clicking **Save** saves the song with `PUT /api/songs/:id`, then adds the
   color with `POST /api/songs/:id/colors`. The server validates every request with zod and
   normalizes colors to lowercase `#rrggbb`.
4. In development, Vite proxies `/api` to the Express server, so both run on one origin.

### Upgrading an older database

Databases from before the `colors` collection store each song's colors in a `colors` array on
the song, and the server warns about this at startup. To convert them, back up first, stop the
server, then run:

```sh
npm run migrate:split-colors -w server -- --dry-run   # report only
npm run migrate:split-colors -w server
```

It also converts the oldest, raw-Spotify-shaped song documents and merges duplicate documents for
the same song. Songs it can't convert are reported and left untouched. It's safe to rerun.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contact
