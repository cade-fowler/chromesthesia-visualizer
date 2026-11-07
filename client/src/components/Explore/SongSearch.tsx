import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { ColorFamily, HexColor, SongSummary } from '@chromesthesia/shared';
import { listSongs } from '../databaseAPI';
import SectionLabel from '../ui/SectionLabel';
import SongCard from '../ui/SongCard';
import { albumMatches } from '../../utils/albumMatches';
import { parseHex } from '../../utils/color';
import { isColorFamily } from '../../utils/colorFamilies';
import AlbumResult from './AlbumResult';
import FindSong from './FindSong';
import FindByColor from './FindByColor';

const DEBOUNCE_MS = 250;

/** The search as it's kept in the page's URL, e.g. "?q=frank&decade=2010&family=blue" */
interface Search {
    q: string;
    decade?: number;
    /** Kept in the URL without its "#" */
    color?: HexColor;
    family?: ColorFamily;
}

const readSearch = (params: URLSearchParams): Search => {
    const decadeText = params.get('decade') ?? '';
    const familyText = params.get('family') ?? '';
    return {
        q: params.get('q')?.trim() ?? '',
        decade: /^\d{3}0$/.test(decadeText) ? Number(decadeText) : undefined,
        color: parseHex(params.get('color') ?? '') ?? undefined,
        family: isColorFamily(familyText) ? familyText : undefined,
    };
};

type Changes = { [K in keyof Search]?: Search[K] | undefined };

/**
 * Both home page searches, by song and by color, and their shared results. The search lives in
 * the URL, so it can be linked to and the back button undoes it. Results show only once
 * something is searched for; all the filters that are set apply together.
 */
const SongSearch = ({ decades }: { decades: number[] }) => {
    const [params, setParams] = useSearchParams();
    const search = readSearch(params);
    const { q, decade, color, family } = search;
    const [text, setText] = useState(q);
    // Kept with the search they answer, so albums are matched against the right text
    const [found, setFound] = useState<{ key: string; q: string; songs: SongSummary[] } | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);

    /** Changes part of the search. `replace` is for typing and sliding, which would flood history. */
    const update = (changes: Changes, replace = false) => {
        setParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                for (const [name, value] of Object.entries(changes)) {
                    if (value === undefined || value === '') next.delete(name);
                    else next.set(name, name === 'color' ? String(value).slice(1) : String(value));
                }
                // One color search at a time
                if (changes.color) next.delete('family');
                if (changes.family) next.delete('color');
                return next;
            },
            { replace },
        );
    };

    // Search once typing pauses
    useEffect(() => {
        const timer = setTimeout(() => {
            if (text.trim() !== q) update({ q: text.trim() }, true);
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only typing should trigger this
    }, [text]);

    // Follow a search that changes from outside, such as the back button
    const [syncedQ, setSyncedQ] = useState(q);
    if (q !== syncedQ) {
        setSyncedQ(q);
        if (text.trim() !== q) setText(q);
    }

    const filtering =
        q !== '' || decade !== undefined || color !== undefined || family !== undefined;
    const key = JSON.stringify(search);

    useEffect(() => {
        if (!filtering) return;
        const controller = new AbortController();
        listSongs({ q, decade, color, family, limit: 200 }, controller.signal)
            .then((songs) => {
                setFound({ key, q, songs });
                setError(null);
            })
            .catch((err: Error) => {
                if (!controller.signal.aborted) setError(err.message);
            });
        return () => controller.abort();
        // key covers q, decade, color and family
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtering, key]);

    const results = found?.songs ?? null;
    const current = found?.key === key;
    const albums = found ? albumMatches(found.songs, found.q) : [];
    const byColor = color !== undefined || family !== undefined;

    return (
        <section className="flex flex-col gap-4">
            <div className="grid gap-6 lg:grid-cols-2">
                <FindSong
                    text={text}
                    onText={setText}
                    decade={decade}
                    onDecade={(d) => update({ decade: d })}
                    decades={decades}
                />
                <FindByColor
                    color={color}
                    family={family}
                    onColor={(c, replace) => update({ color: c }, replace)}
                    onFamily={(f, replace) => update({ family: f }, replace)}
                    count={byColor && current && results ? results.length : undefined}
                />
            </div>
            {!filtering ? null : error ? (
                <p className="text-sm font-bold text-danger" role="alert">
                    {error}
                </p>
            ) : !results ? (
                <p className="text-sm text-silk">Loading…</p>
            ) : (
                <>
                    <SectionLabel aside={results.length}>
                        {byColor ? 'Closest matches' : 'Results'}
                    </SectionLabel>
                    {results.length === 0 ? (
                        <p className="text-sm text-silk">No songs match.</p>
                    ) : (
                        <>
                            {albums.length > 0 && (
                                <ul
                                    aria-label="Albums"
                                    className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                                >
                                    {albums.map((match) => (
                                        <li key={match.album.id} className="min-w-0">
                                            <AlbumResult match={match} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <ul
                                aria-label="Songs"
                                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                {results.map((song) => (
                                    <li key={song.id} className="min-w-0">
                                        <SongCard song={song} />
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </>
            )}
        </section>
    );
};

export default SongSearch;
