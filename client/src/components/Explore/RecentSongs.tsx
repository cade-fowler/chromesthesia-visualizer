import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { SongSummary } from '@chromesthesia/shared';
import { listSongs } from '../databaseAPI';
import SectionLabel from '../ui/SectionLabel';
import ColorStrip from '../ui/ColorStrip';
import { songPagePath } from '../../utils/paths';

const COUNT = 4;

/** The songs most recently given their first color, as big color strips. */
const RecentSongs = () => {
    const [songs, setSongs] = useState<SongSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        listSongs({ limit: COUNT })
            .then((list) => {
                if (!cancelled) setSongs(list.filter((song) => song.colors.length > 0));
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (songs?.length === 0) return null;

    return (
        <section className="flex flex-col gap-4 panel screws p-6">
            <SectionLabel>Recently added</SectionLabel>
            {error ? (
                <p className="text-sm font-bold text-danger" role="alert">
                    {error}
                </p>
            ) : !songs ? (
                <p className="text-sm text-silk">Loading…</p>
            ) : (
                <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {songs.map((song) => (
                        <li key={song.id} className="min-w-0">
                            <Link
                                to={songPagePath(song.id)}
                                className="group flex flex-col gap-1.5 rounded-md outline-offset-4"
                            >
                                <ColorStrip
                                    colors={song.colors}
                                    className="h-14 rounded-md outline-ink transition-[outline-width] group-hover:outline-2"
                                />
                                <span className="truncate text-sm font-bold group-hover:underline">
                                    {song.title}
                                </span>
                                <span className="-mt-1 truncate text-xs text-silk">
                                    {song.artists.join(', ')}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default RecentSongs;
