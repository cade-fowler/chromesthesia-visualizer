import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { SongSummary } from '@chromesthesia/shared';
import { listSongs } from '../databaseAPI';
import {
    hasFilters,
    readSearch,
    searchQuery,
    writeSearch,
    type Search,
    type SearchChanges,
} from '../../utils/songSearch';

/** The text box searches once typing has paused this long */
const DEBOUNCE_MS = 250;

interface Options {
    /** Load songs even when nothing is searched for (the Songs page lists them all) */
    always?: boolean;
    /** How many songs to ask for */
    limit: number;
}

/** Songs loaded for a search, kept with the search they answer */
interface Found {
    key: string;
    q: string;
    songs: SongSummary[];
}

/**
 * A song search kept in the page's URL, so it can be linked to and the back button undoes it,
 * and the songs that match it. The sort is part of the URL but not of what's loaded.
 */
export const useSongSearch = ({ always = false, limit }: Options) => {
    const [params, setParams] = useSearchParams();
    const search: Search = readSearch(params);
    const [text, setText] = useState(search.q);
    const [found, setFound] = useState<Found | null>(null);
    const [error, setError] = useState<string | null>(null);

    /** Changes part of the search. `replace` is for typing and sliding, which would flood history. */
    const update = (changes: SearchChanges, replace = false) =>
        setParams((prev) => writeSearch(prev, changes), { replace });

    // Search once typing pauses
    useEffect(() => {
        const timer = setTimeout(() => {
            if (text.trim() !== search.q) update({ q: text.trim() }, true);
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only typing should trigger this
    }, [text]);

    // Follow a search that changes from outside, such as the back button
    const [syncedQ, setSyncedQ] = useState(search.q);
    if (search.q !== syncedQ) {
        setSyncedQ(search.q);
        if (text.trim() !== search.q) setText(search.q);
    }

    const query = searchQuery(search);
    const enabled = always || hasFilters(search);
    const key = JSON.stringify(query);

    useEffect(() => {
        if (!enabled) return;
        const controller = new AbortController();
        listSongs({ ...query, limit }, controller.signal)
            .then((songs) => {
                setFound({ key, q: query.q ?? '', songs });
                setError(null);
            })
            .catch((err: Error) => {
                if (!controller.signal.aborted) setError(err.message);
            });
        return () => controller.abort();
        // key covers the query
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, key, limit]);

    return {
        search,
        /** The URL's search string, for linking to the same search on another page */
        params: params.toString(),
        text,
        setText,
        update,
        enabled,
        /** The latest songs loaded, which may be for an earlier search while the next loads */
        found,
        /** Whether `found` answers the search as it is now */
        current: found?.key === key,
        error,
    };
};
