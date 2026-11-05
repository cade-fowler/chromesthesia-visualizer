# Chromesthesia Visualizer

A web app for recording the colors I perceive in music (chromesthesia) and analyzing how they relate to the songs.

## Why I built this

[Chromesthesia](https://en.wikipedia.org/wiki/Chromesthesia) is a type of synesthesia where sound involuntarily triggers the sensation of seeing color. When I listen to music, I see colors tied to specific songs and moments within them. I am building this tool to record these associations as they happen and to find patterns in them. I want to gather data so I can understand what makes songs have their color. I also want to be able to generate playlists based on the hue, brightness, etc.

## Features

- **Built:**
  - Basic web app
  - Spotify now playing integration
  - Saving to MongoDB
- **Planned:**
  - Color tied to specific timestamps in a song
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
client/   React app: Spotify login, now playing, color picker
server/   Express API under /api, backed by MongoDB
shared/   TypeScript types used by both (Song, NowPlaying, ...)
```

1. The client logs in to Spotify with the Authorization Code + PKCE flow, so no client secret is
   needed in the browser.
2. While logged in, it polls Spotify every 5 seconds for the currently playing track.
3. Picking a color and clicking **Save** sends the song and color to `POST /api/songs`. The server
   validates the request with zod, normalizes the color to lowercase `#rrggbb`, and upserts the song
   with the color added to its set of colors.
4. In development, Vite proxies `/api` to the Express server, so both run on one origin.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contact
