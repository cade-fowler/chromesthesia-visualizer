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

/** A song as stored in MongoDB. */
export interface Song {
  id: string;
  title: string;
  artists: string[];
  albumImageUrl?: string;
  songUrl: string;
  colors: HexColor[];
}
