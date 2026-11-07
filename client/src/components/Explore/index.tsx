import { useEffect, useState } from 'react';
import type { LibraryStats as Stats } from '@chromesthesia/shared';
import { getStats } from '../databaseAPI';
import { useOwner } from '../../auth/OwnerContext';
import Nameplate from '../ui/Nameplate';
import FeaturedSong from './FeaturedSong';
import StatReadout from '../ui/StatReadout';
import SongSearch from './SongSearch';
import RecentSongs from './RecentSongs';

/**
 * The public home page: a featured song and the library's stats, search, and the songs most
 * recently added.
 */
const Explore = () => {
    const { owner } = useOwner();
    const [stats, setStats] = useState<Stats | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getStats()
            .then((loaded) => {
                if (!cancelled) setStats(loaded);
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    let content;
    if (error) {
        content = (
            <p className="text-sm font-bold text-danger" role="alert">
                {error}
            </p>
        );
    } else if (!stats) {
        content = <p className="text-sm text-silk">Loading…</p>;
    } else if (stats.songs === 0) {
        content = (
            <p className="text-sm text-silk">
                {owner ? 'No songs yet. Add colors from the Studio.' : 'No songs yet.'}
            </p>
        );
    } else {
        content = (
            <>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <FeaturedSong />
                    <StatReadout
                        readings={[
                            ['Songs', stats.songs],
                            ['Colors', stats.colors],
                            ['Artists', stats.artists],
                            ['Song parts', stats.parts],
                        ]}
                    />
                </div>
                <SongSearch decades={stats.decades} />
                <RecentSongs />
            </>
        );
    }

    const songCount = stats?.songs ?? 0;
    return (
        <div className="lg:h-full lg:overflow-y-auto">
            <div className="mx-auto flex max-w-6xl flex-col gap-8 p-5 sm:p-7 lg:p-9">
                {content}
                <div className="mt-2">
                    <Nameplate
                        details={[
                            'Model CV-1',
                            `Serial ${String(songCount).padStart(4, '0')}`,
                            `${songCount} ${songCount === 1 ? 'song' : 'songs'} logged`,
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default Explore;
