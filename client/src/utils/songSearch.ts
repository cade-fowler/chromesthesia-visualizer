import type {
    ColorFamily,
    HexColor,
    HueRange,
    LightRange,
    ListSongsQuery,
} from '@chromesthesia/shared';
import { parseHex } from './color';
import { isColorFamily } from './colorFamilies';
import { formatRange, parseHueRange, parseLightRange } from './colorRange';

/** How the Songs page orders its results. `closest` is for searches by color only. */
export type SongSort = 'newest' | 'title' | 'artist' | 'colors' | 'closest';

export const SONG_SORTS: SongSort[] = ['newest', 'title', 'artist', 'colors', 'closest'];

const isSongSort = (value: string): value is SongSort => (SONG_SORTS as string[]).includes(value);

/**
 * A song search as it's kept in the page's URL, e.g. "?q=frank&decade=2010&family=blue" or
 * "?hue=200-260&light=30-70&sort=title". Explore and the Songs page share it.
 */
export interface Search {
    q: string;
    decade?: number;
    /** Kept in the URL without its "#" */
    color?: HexColor;
    family?: ColorFamily;
    hue?: HueRange;
    light?: LightRange;
    /** The Songs page's order; left out for the default */
    sort?: SongSort;
}

export type SearchChanges = { [K in keyof Search]?: Search[K] | undefined };

export const readSearch = (params: URLSearchParams): Search => {
    const decadeText = params.get('decade') ?? '';
    const familyText = params.get('family') ?? '';
    const sortText = params.get('sort') ?? '';
    return {
        q: params.get('q')?.trim() ?? '',
        decade: /^\d{3}0$/.test(decadeText) ? Number(decadeText) : undefined,
        color: parseHex(params.get('color') ?? '') ?? undefined,
        family: isColorFamily(familyText) ? familyText : undefined,
        hue: parseHueRange(params.get('hue') ?? ''),
        light: parseLightRange(params.get('light') ?? ''),
        sort: isSongSort(sortText) ? sortText : undefined,
    };
};

const COLOR_PARAMS = ['color', 'family', 'hue', 'light'];

/**
 * The URL params with part of the search changed. Only one kind of color search is kept: setting
 * a color drops a family or range, and so on. Empty values remove their param.
 */
export const writeSearch = (prev: URLSearchParams, changes: SearchChanges): URLSearchParams => {
    const next = new URLSearchParams(prev);
    for (const [name, value] of Object.entries(changes)) {
        if (value === undefined || value === '') next.delete(name);
        else if (typeof value === 'object') next.set(name, formatRange(value));
        else next.set(name, name === 'color' ? String(value).slice(1) : String(value));
    }
    const keepOnly = (keep: string[]) => {
        for (const name of COLOR_PARAMS) if (!keep.includes(name)) next.delete(name);
    };
    if (changes.color) keepOnly(['color']);
    if (changes.family) keepOnly(['family']);
    if (changes.hue || changes.light) keepOnly(['hue', 'light']);
    return next;
};

/** Whether the search is by color in any way: a family, an exact color or a range. */
export const hasColorSearch = ({ color, family, hue, light }: Search): boolean =>
    color !== undefined || family !== undefined || hue !== undefined || light !== undefined;

/** Whether any filter is set; the sort isn't a filter. */
export const hasFilters = (search: Search): boolean =>
    search.q !== '' || search.decade !== undefined || hasColorSearch(search);

/** What the server is asked for (everything but the sort, which the page applies itself). */
export const searchQuery = ({ sort: _sort, q, ...rest }: Search): ListSongsQuery => ({
    ...rest,
    ...(q ? { q } : {}),
});
