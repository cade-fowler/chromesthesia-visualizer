import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { SongWithColors } from '@chromesthesia/shared';
import { getRandomSong } from '../databaseAPI';
import AlbumArt from '../ui/AlbumArt';
import ColorStrip from '../ui/ColorStrip';
import { smallKeyClass } from '../ui/buttons';
import { albumPagePath, songPagePath } from '../../utils/paths';

type Load =
    | { status: 'loading' }
    | { status: 'none' }
    | { status: 'error'; message: string }
    | { status: 'loaded'; song: SongWithColors };

/** A random song with colors, picked fresh on each visit, with a key to shuffle to another. */
const FeaturedSong = () => {
    const [load, setLoad] = useState<Load>({ status: 'loading' });
    // Each new request loads a song; Shuffle asks for one other than the song on screen
    const [request, setRequest] = useState<{ not?: string }>({});
    const [shuffling, setShuffling] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getRandomSong(request.not)
            .then((song) => {
                if (!cancelled) setLoad(song ? { status: 'loaded', song } : { status: 'none' });
            })
            .catch((err: Error) => {
                if (!cancelled) setLoad({ status: 'error', message: err.message });
            })
            .finally(() => {
                if (!cancelled) setShuffling(false);
            });
        return () => {
            cancelled = true;
        };
    }, [request]);

    const shuffle = () => {
        if (load.status !== 'loaded') return;
        setShuffling(true);
        setRequest({ not: load.song.id });
    };

    if (load.status === 'none') return null;

    return (
        <section
            aria-label="Featured song"
            className="flex min-h-40 flex-col gap-4 well rounded-md p-4 sm:flex-row sm:items-end sm:gap-6 sm:p-5"
        >
            {load.status !== 'loaded' ? (
                <p
                    className={`m-auto text-sm ${load.status === 'error' ? 'font-bold text-danger' : 'text-silk'}`}
                    role={load.status === 'error' ? 'alert' : undefined}
                >
                    {load.status === 'error' ? load.message : 'Loading…'}
                </p>
            ) : (
                <>
                    <AlbumArt
                        src={load.song.albumImageUrl}
                        alt={`${load.song.title} album art`}
                        className="size-24 sm:size-36"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="font-mono text-[11px] tracking-[0.08em] text-silk uppercase">
                            Featured song
                        </span>
                        <h2 className="text-3xl leading-none font-bold tracking-[-0.03em] text-balance sm:text-4xl">
                            {load.song.title}
                        </h2>
                        <p className="text-base text-silk">
                            {load.song.artists.join(', ')}
                            {load.song.album && (
                                <>
                                    {' · '}
                                    <Link
                                        className="hover:text-ink hover:underline"
                                        to={albumPagePath(load.song.album.id)}
                                    >
                                        {load.song.album.name}
                                    </Link>
                                    {`, ${load.song.album.releaseDate.slice(0, 4)}`}
                                </>
                            )}
                        </p>
                        <ColorStrip
                            colors={load.song.colors.map((entry) => entry.color)}
                            className="mt-2 h-3.5"
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                            <Link
                                to={songPagePath(load.song.id)}
                                className="text-xs font-bold tracking-[0.08em] text-silk uppercase hover:text-ink hover:underline"
                            >
                                Open song page →
                            </Link>
                            <button
                                type="button"
                                className={smallKeyClass}
                                onClick={shuffle}
                                disabled={shuffling}
                            >
                                Shuffle
                            </button>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};

export default FeaturedSong;
