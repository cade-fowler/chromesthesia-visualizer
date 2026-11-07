import { useEffect, useState } from 'react';
import type { SongSummary } from '@chromesthesia/shared';
import { listSongs } from '../databaseAPI';
import SectionLabel from '../ui/SectionLabel';
import { inputClass } from '../ui/fields';
import { smallKeyClass } from '../ui/buttons';
import SongCard from '../ui/SongCard';
import { albumMatches } from '../../utils/albumMatches';
import AlbumResult from './AlbumResult';

const DEBOUNCE_MS = 250;

/** "90s" for 1990, "00s" for 2000 */
const decadeLabel = (decade: number) => `${String(decade).slice(2)}s`;

const decadeKeyClass = (on: boolean) =>
    on ? smallKeyClass.replace(/^key /, 'key-down ') : smallKeyClass;

interface FindSongProps {
    /** Decades with songs in them, oldest first, offered as filters */
    decades: number[];
}

/**
 * Text search over titles, artists and album names, with decade filters. Results show only
 * once something is entered or a decade is chosen.
 */
const FindSong = ({ decades }: FindSongProps) => {
    const [text, setText] = useState('');
    const [q, setQ] = useState('');
    const [decade, setDecade] = useState<number | undefined>(undefined);
    // Kept with the search they answer, so albums are matched against the right text
    const [found, setFound] = useState<{ q: string; songs: SongSummary[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Search once typing pauses
    useEffect(() => {
        const timer = setTimeout(() => setQ(text.trim()), DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [text]);

    const filtering = q !== '' || decade !== undefined;

    useEffect(() => {
        if (!filtering) return;
        const controller = new AbortController();
        listSongs({ q, decade, limit: 200 }, controller.signal)
            .then((songs) => {
                setFound({ q, songs });
                setError(null);
            })
            .catch((err: Error) => {
                if (!controller.signal.aborted) setError(err.message);
            });
        return () => controller.abort();
    }, [filtering, q, decade]);

    const results = found?.songs ?? null;
    const albums = found ? albumMatches(found.songs, found.q) : [];

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 panel screws p-6">
                <SectionLabel aside={filtering && results ? results.length : undefined}>
                    Find a song
                </SectionLabel>
                <input
                    type="search"
                    className={`${inputClass} h-11 text-base`}
                    placeholder="Song, artist or album"
                    aria-label="Search songs by title, artist or album"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                {decades.length > 0 && (
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Decade">
                        {decades.map((d) => (
                            <button
                                key={d}
                                type="button"
                                className={decadeKeyClass(decade === d)}
                                aria-pressed={decade === d}
                                onClick={() => setDecade(decade === d ? undefined : d)}
                            >
                                {decadeLabel(d)}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {!filtering ? null : error ? (
                <p className="text-sm font-bold text-danger" role="alert">
                    {error}
                </p>
            ) : !results ? (
                <p className="text-sm text-silk">Loading…</p>
            ) : results.length === 0 ? (
                <p className="text-sm text-silk">No songs match.</p>
            ) : (
                <>
                    {albums.length > 0 && (
                        <ul aria-label="Albums" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
        </section>
    );
};

export default FindSong;
