import { useEffect, useState } from 'react';
import type { LibraryStats, SongSummary } from '@chromesthesia/shared';
import { getStats } from '../databaseAPI';
import SectionLabel from '../ui/SectionLabel';
import SongCard from '../ui/SongCard';
import { smallKeyClass, toggleKeyClass } from '../ui/buttons';
import SearchFilters from '../search/SearchFilters';
import { useSongSearch } from '../search/useSongSearch';
import { hasFilters } from '../../utils/songSearch';
import { SORT_LABELS, activeSort, sortSongs, sortsFor } from '../../utils/songSort';

/** Enough for the whole library; the server's maximum */
const LIMIT = 1000;

/** On a range search, how many of the song's colors were in range */
const rangeNote = (song: SongSummary) =>
    song.match?.inRange === undefined
        ? undefined
        : `${song.match.inRange} of ${song.colors.length} colors in range`;

/**
 * Every song, with all the filters: text, decade and every way of searching by color, which
 * combine. Wide screens put the filters in a side column; each column scrolls on its own.
 */
const SongsPage = () => {
    const songSearch = useSongSearch({ always: true, limit: LIMIT });
    const { search, update, reset, found, current, error } = songSearch;
    const [stats, setStats] = useState<LibraryStats | null>(null);

    useEffect(() => {
        let cancelled = false;
        getStats()
            .then((loaded) => {
                if (!cancelled) setStats(loaded);
            })
            // The decade keys just don't show; the songs still load
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    const sort = activeSort(search);
    const songs = found ? sortSongs(found.songs, sort) : null;
    const filtered = hasFilters(search);

    let count: string | undefined;
    if (songs) {
        const total = stats?.songs;
        count =
            filtered && total !== undefined
                ? `${songs.length} of ${total}`
                : `${songs.length} ${songs.length === 1 ? 'song' : 'songs'}`;
    }

    return (
        <div className="flex flex-col lg:h-full lg:flex-row">
            <aside
                aria-label="Filters"
                className="flex shrink-0 flex-col gap-6 p-5 sm:p-7 lg:h-full lg:w-[380px] lg:overflow-y-auto lg:border-r lg:border-edge lg:p-7"
            >
                <div className="-mb-2 flex items-center justify-between gap-3">
                    <h2 className="text-[11px] silk">Filters</h2>
                    {/* Always there, so the panels don't jump when it would appear */}
                    <button
                        type="button"
                        className={smallKeyClass}
                        onClick={reset}
                        disabled={!filtered && !search.sort}
                    >
                        Reset all
                    </button>
                </div>
                <SearchFilters songSearch={songSearch} decades={stats?.decades ?? []} />
            </aside>
            <section
                aria-label="Songs"
                className="flex min-w-0 flex-1 flex-col gap-4 px-5 pb-7 sm:px-7 lg:h-full lg:overflow-y-auto lg:p-7"
            >
                <SectionLabel aside={count}>
                    {filtered ? 'Matching songs' : 'All songs'}
                </SectionLabel>
                <div className="flex flex-wrap items-center gap-2">
                    <span id="sort-label" className="mr-1 text-[10px] silk">
                        Sort by
                    </span>
                    <div className="flex flex-wrap gap-2" role="group" aria-labelledby="sort-label">
                        {sortsFor(search).map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={toggleKeyClass(sort === value)}
                                aria-pressed={sort === value}
                                // The default sort stays out of the URL
                                onClick={() =>
                                    update({
                                        sort: value === sortsFor(search)[0] ? undefined : value,
                                    })
                                }
                            >
                                {SORT_LABELS[value]}
                            </button>
                        ))}
                    </div>
                </div>
                {error ? (
                    <p className="text-sm font-bold text-danger" role="alert">
                        {error}
                    </p>
                ) : !songs ? (
                    <p className="text-sm text-silk">Loading…</p>
                ) : songs.length === 0 ? (
                    <p className="text-sm text-silk">
                        {filtered ? 'No songs match.' : 'No songs yet.'}
                    </p>
                ) : (
                    <ul
                        className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${current ? '' : 'opacity-60'}`}
                    >
                        {songs.map((song) => (
                            <li key={song.id} className="min-w-0">
                                <SongCard song={song} note={rangeNote(song)} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default SongsPage;
