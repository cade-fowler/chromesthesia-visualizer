// Types shared by the client and the server.
// Type-only: nothing in here exists at runtime, so it needs no build step.

/** A hex color string such as "#ff8800". */
export type HexColor = string;

/** The album a song is on, from Spotify. */
export interface Album {
    /** Spotify album id */
    id: string;
    name: string;
    /** The album's Spotify page */
    url: string;
    /** "YYYY", "YYYY-MM" or "YYYY-MM-DD", depending on releaseDatePrecision */
    releaseDate: string;
    releaseDatePrecision: 'year' | 'month' | 'day';
    type: 'album' | 'single' | 'compilation';
}

/** Song details from Spotify beyond the basics. Songs saved before these existed lack them. */
export interface SongDetails {
    album?: Album;
    /** Each artist's Spotify page, in the same order as the artists */
    artistUrls?: string[];
    /** The song's place on its album (1-based), within its disc */
    trackNumber?: number;
    /** Which disc of the album the song is on (1-based) */
    discNumber?: number;
}

/** The song Spotify reports as currently playing, shaped for the UI. */
export interface NowPlaying extends SongDetails {
    id: string;
    title: string;
    /** Artist names, as Spotify lists them (a name may itself contain a comma) */
    artists: string[];
    albumImageUrl?: string;
    songUrl: string;
    isPlaying: boolean;
    /** Playback position when Spotify was polled */
    progressMs: number;
    /** Length of the track */
    durationMs: number;
}

/** A song's metadata as stored in MongoDB and returned by the API. */
export interface Song extends SongDetails {
    /** Spotify track id */
    id: string;
    title: string;
    artists: string[];
    albumImageUrl?: string;
    songUrl: string;
    /** Length of the track, from Spotify. Older songs get it the next time they're saved. */
    durationMs?: number;
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

/**
 * Response of GET /api/songs/:id: the song with its colors in song order, which is the order
 * GET /api/songs/:id/colors uses too. Whole-song colors come first, then parts by startMs;
 * ties go to whichever was saved first.
 */
export interface SongWithColors extends Song {
    colors: ColorEntry[];
}

/**
 * One item of GET /api/songs: the song with just the hex values of its colors, for drawing a
 * strip. Newest first, by when the song got its first color, except in a search by color,
 * which puts the closest match first.
 */
export interface SongSummary extends Song {
    /** The song's colors in song order (the same order as SongWithColors.colors) */
    colors: HexColor[];
    /** ISO 8601 timestamp of the song's first color; missing for a song with no colors */
    addedAt?: string;
    /** The song's color that matched a search by color; only present for those searches */
    match?: ColorMatch;
}

/**
 * One item of GET /api/songs/:id/similar: a song whose colors are close to the given song's,
 * closest first.
 */
export interface SimilarSong extends SongSummary {
    similarity: {
        /** songDistance() between the two songs: 0 is the same palette */
        distance: number;
        /** How many of the given song's colors have a close match in this one */
        close: number;
        /** How many colors the given song has */
        total: number;
    };
}

/**
 * The named color groups the home page's swatches search by. A color's family comes from its
 * OKLCH hue, or from its lightness when it's too grey to have one (white and black).
 */
export type ColorFamily =
    'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'white' | 'black';

/** Which of a song's colors matched a search by color, and how close it was. */
export interface ColorMatch {
    color: HexColor;
    /**
     * OKLab distance to the searched color (or to the family's swatch color): 0 is the same
     * color, about 1 is black to white. For a range search it's how far the color is from the
     * middle of the range instead: 0 at the middle, 1 at the edge.
     */
    distance: number;
    /** Range searches only: how many of the song's colors are in the range */
    inRange?: number;
}

/**
 * An OKLCH hue range in whole degrees (0–359), from `from` round to `to`. When `from` is
 * greater than `to` it wraps past 360, so { from: 330, to: 30 } covers the reds.
 */
export interface HueRange {
    from: number;
    to: number;
}

/** An OKLCH lightness range in percent (0–100), `from` at most `to`. */
export interface LightRange {
    from: number;
    to: number;
}

/** Query of GET /api/songs. Every filter is optional; they combine with AND. */
export interface ListSongsQuery {
    /** Case-insensitive text found in the title, an artist or the album name */
    q?: string;
    /** A decade such as 1990: songs whose album came out from 1990 to 1999 */
    decade?: number;
    /**
     * Songs with a color close to this one, closest first. A song's score is its single
     * closest color. Can't be combined with family.
     */
    color?: HexColor;
    /**
     * Songs with any color in this family, ranked by how close that color is to the family's
     * swatch. Can't be combined with color.
     */
    family?: ColorFamily;
    /**
     * Songs with colors in this hue range (sent as "330-30"). Greyish colors have no hue, so
     * they never match. Combines with light; can't be combined with color or family.
     */
    hue?: HueRange;
    /**
     * Songs with colors in this lightness range (sent as "30-70"). Combines with hue; can't be
     * combined with color or family. Range searches rank songs by the share of their colors in
     * range, then by how close the best one is to the middle of the range.
     */
    light?: LightRange;
    /** How many songs to return, 1–1000 (default 50) */
    limit?: number;
}

/**
 * Response of GET /api/albums/:id: an album and the songs from it that have been logged, in
 * track order (songs saved before track numbers were stored come last, by title).
 */
export interface AlbumWithSongs {
    album: Album;
    /** The album art, from one of its songs */
    albumImageUrl?: string;
    /** Every artist on the logged songs, in order of first appearance */
    artists: string[];
    songs: SongWithColors[];
}

/** Response of GET /api/stats: counts across everything logged. */
export interface LibraryStats {
    songs: number;
    colors: number;
    /** Distinct artist names */
    artists: number;
    /** Colors for part of a song rather than the whole song */
    parts: number;
    /** Decades the songs' albums came out in, such as [1990, 2010], oldest first */
    decades: number[];
}

/**
 * One item of GET /api/stats/hues: a single color entry with its song, placed for the home
 * page's hue chart. Every entry is listed, so a hex logged for three parts appears three times.
 */
export interface HueChartColor {
    /** The color entry's id */
    id: string;
    color: HexColor;
    songId: string;
    title: string;
    artists: string[];
    /** OKLCH hue in degrees (0–360), or null for a greyish color, which has no real hue */
    hue: number | null;
    /** OKLCH lightness, 0 (black) to 1 (white) */
    lightness: number;
}

/** How light a colorful color is within its family, for the Studio's color prompts. */
export type ColorShade = 'pale' | 'mid' | 'deep';

/**
 * Response of GET /api/stats/progress (owner only): what the Studio's Logbook needs to show
 * progress and suggest what to log next.
 */
export interface CollectionProgress {
    songs: number;
    colors: number;
    /** Each song's first color time (ISO 8601) from the last 90 days, for days and the streak */
    loggedAt: string[];
    /**
     * Songs with a color in each family and shade. White and black have no shade (null). A song
     * counts in every bucket it has a color in.
     */
    colorBuckets: { family: ColorFamily; shade: ColorShade | null; songs: number }[];
    /** Songs per family, with one color from each of up to 10 of them (newest songs first) */
    families: { family: ColorFamily; songs: number; colors: HexColor[] }[];
    /** Songs per decade, from the 1960s to now plus any older decade that has songs */
    decades: { decade: number; songs: number }[];
    /** Albums (not singles) with only one or two logged songs */
    thinAlbums: { id: string; name: string; imageUrl?: string; songs: number }[];
    /** Artists with exactly one logged song */
    oneSongArtists: string[];
    /** Songs with a single whole-song color and no parts */
    oneColorSongs: { id: string; title: string; artists: string[] }[];
}

/** The owner's settings (GET and PATCH /api/settings, owner only). */
export interface OwnerSettings {
    /** Songs to log each day, 1–100 */
    dailyGoal: number;
}

/** Body of PATCH /api/settings. */
export type UpdateSettingsRequest = Partial<OwnerSettings>;

/**
 * Body of PUT /api/songs/:id (the id comes from the URL). Leaving out notes, durationMs, album or
 * artistUrls keeps the song's current value, so saving from Spotify never wipes notes; send [] to clear them.
 */
export type UpsertSongRequest = Omit<Song, 'id'>;

/** Body of POST /api/songs/:id/colors. Colors may be #rgb or #rrggbb in any case. */
export type AddColorRequest = Pick<ColorEntry, 'color' | 'startMs' | 'endMs' | 'label' | 'notes'>;

/**
 * Body of PATCH /api/colors/:id. Only the fields given change; null clears a field. Clearing
 * startMs and endMs together turns a part back into a whole-song color. Send at least one field.
 */
export interface UpdateColorRequest {
    color?: HexColor;
    startMs?: number | null;
    endMs?: number | null;
    label?: string | null;
    notes?: string[] | null;
}

/** Body of POST /api/auth/login. */
export interface LoginRequest {
    password: string;
}

/** Response of GET /api/auth/me. */
export interface AuthStatus {
    /** Whether this browser is logged in as the owner, who is the only one who can write */
    owner: boolean;
}

/** Shape of every API error response. */
export interface ApiError {
    error: string;
}
