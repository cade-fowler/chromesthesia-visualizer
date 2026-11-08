import type { SongSummary } from '@chromesthesia/shared';
import type { Search, SongSort } from './songSearch';
import { hasColorSearch } from './songSearch';

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

/** What each sort key is labelled on the Songs page */
export const SORT_LABELS: Record<SongSort, string> = {
    newest: 'Newest',
    title: 'Title',
    artist: 'Artist',
    colors: 'Most colors',
    closest: 'Closest',
};

/**
 * The sorts on offer for a search: Closest only for a search by color, where it comes first and
 * is the default.
 */
export const sortsFor = (search: Search): SongSort[] =>
    hasColorSearch(search)
        ? ['closest', 'newest', 'title', 'artist', 'colors']
        : ['newest', 'title', 'artist', 'colors'];

/** The sort in effect: the search's own if it's on offer, otherwise the first that is. */
export const activeSort = (search: Search): SongSort => {
    const offered = sortsFor(search);
    return search.sort && offered.includes(search.sort) ? search.sort : offered[0];
};

/**
 * Orders songs for the Songs page. The server already lists them newest first, or closest
 * first in a search by color, so those keep its order. The sort is stable, so ties keep it too.
 */
export const sortSongs = (songs: SongSummary[], sort: SongSort): SongSummary[] => {
    switch (sort) {
        case 'newest':
        case 'closest':
            return songs;
        case 'title':
            return [...songs].sort((a, b) => collator.compare(a.title, b.title));
        case 'artist':
            return [...songs].sort(
                (a, b) =>
                    collator.compare(a.artists[0] ?? '', b.artists[0] ?? '') ||
                    collator.compare(a.title, b.title),
            );
        case 'colors':
            return [...songs].sort((a, b) => b.colors.length - a.colors.length);
    }
};
