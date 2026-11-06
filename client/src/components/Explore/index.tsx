import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { Song } from '@chromesthesia/shared';
import { listSongs } from '../databaseAPI';
import { useOwner } from '../../auth/OwnerContext';
import AlbumArt from '../ui/AlbumArt';
import SectionLabel from '../ui/SectionLabel';
import Nameplate from '../ui/Nameplate';

/** The home page. For now, a list of saved songs that each open their song page. */
const Explore = () => {
    const { owner } = useOwner();
    const [songs, setSongs] = useState<Song[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        listSongs()
            .then((list) => {
                if (!cancelled) setSongs(list);
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="lg:h-full lg:overflow-y-auto">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 p-5 sm:p-7 lg:p-9">
                <SectionLabel aside={songs ? songs.length : undefined}>Songs</SectionLabel>
                {error ? (
                    <p className="text-sm font-bold text-danger" role="alert">
                        {error}
                    </p>
                ) : !songs ? (
                    <p className="text-sm text-silk">Loading…</p>
                ) : songs.length === 0 ? (
                    <p className="text-sm text-silk">
                        {owner ? 'No songs yet. Add colors from the Studio.' : 'No songs yet.'}
                    </p>
                ) : (
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {songs.map((song) => (
                            <li key={song.id} className="min-w-0">
                                <Link
                                    to={`/songs/${encodeURIComponent(song.id)}`}
                                    className="flex items-center gap-4 panel p-3 outline-ink transition-[outline-width] hover:outline-2 focus-visible:outline-2"
                                >
                                    <AlbumArt
                                        src={song.albumImageUrl}
                                        alt=""
                                        className="size-16 text-xl"
                                    />
                                    <span className="flex min-w-0 flex-col gap-0.5">
                                        <span className="truncate font-bold tracking-[-0.01em]">
                                            {song.title}
                                        </span>
                                        <span className="truncate text-sm text-silk">
                                            {song.artists.join(', ')}
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="mt-4">
                    <Nameplate details={['Model CV-1', 'Explore']} />
                </div>
            </div>
        </div>
    );
};

export default Explore;
