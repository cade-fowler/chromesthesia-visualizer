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

/** A song's metadata as stored in MongoDB and returned by the API. */
export interface Song {
    /** Spotify track id */
    id: string;
    title: string;
    artists: string[];
    albumImageUrl?: string;
    songUrl: string;
    /** Impressions of the song as a whole, such as a texture ("glossy") */
    notes?: string[];
}

/** One color assigned to a song, or to part of it. */
export interface ColorEntry {
    /** Opaque id (a Mongo ObjectId as hex) */
    id: string;
    /** The Spotify track id of the song this color belongs to */
    songId: string;
    /** Lowercase #rrggbb */
    color: HexColor;
    /** Start of the part this color applies to; omitted (with endMs) for the whole song */
    startMs?: number;
    /** End of the part this color applies to; always greater than startMs */
    endMs?: number;
    /** A name for the part, such as "chorus" */
    label?: string;
    /** Impressions of this color, such as a texture ("glossy") */
    notes?: string[];
    /** ISO 8601 timestamp of when the color was assigned */
    createdAt: string;
}

/** Response of GET /api/songs/:id: the song with its colors, oldest first. */
export interface SongWithColors extends Song {
    colors: ColorEntry[];
}

/**
 * Body of PUT /api/songs/:id (the id comes from the URL). Leaving out notes keeps the
 * song's current notes, so saving from Spotify never wipes them; send [] to clear them.
 */
export type UpsertSongRequest = Omit<Song, 'id'>;

/** Body of POST /api/songs/:id/colors. Colors may be #rgb or #rrggbb in any case. */
export type AddColorRequest = Pick<ColorEntry, 'color' | 'startMs' | 'endMs' | 'label' | 'notes'>;

/** Shape of every API error response. */
export interface ApiError {
    error: string;
}
