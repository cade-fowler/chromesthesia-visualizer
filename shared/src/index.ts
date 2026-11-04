// Types shared by the client and the server.
// Type-only: nothing in here exists at runtime, so it needs no build step.

/** A hex color string such as "#ff8800". */
export type HexColor = string;

/** The song Spotify reports as currently playing, shaped for the UI. */
export interface NowPlaying {
  id: string;
  title: string;
  /** Artist names joined with ", " */
  artist: string;
  albumImageUrl?: string;
  songUrl: string;
  isPlaying: boolean;
}

/** A song as stored in MongoDB and returned by the API. */
export interface Song {
  /** Spotify track id */
  id: string;
  title: string;
  artists: string[];
  albumImageUrl?: string;
  songUrl: string;
  colors: HexColor[];
}

/** Body of POST /api/songs: a song plus the color to attach to it. */
export interface AddColorRequest extends Omit<Song, 'colors'> {
  color: HexColor;
}

/** Shape of every API error response. */
export interface ApiError {
  error: string;
}
