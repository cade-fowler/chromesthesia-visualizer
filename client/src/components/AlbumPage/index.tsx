import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { Album, AlbumWithSongs } from '@chromesthesia/shared';
import { getAlbum } from '../databaseAPI';
import { songPagePath } from '../../utils/paths';
import Timeline from '../Timeline';
import NotFound from '../NotFound';
import AlbumArt from '../ui/AlbumArt';
import SectionLabel from '../ui/SectionLabel';
import Nameplate from '../ui/Nameplate';
import SongCard from '../ui/SongCard';
import StatReadout from '../ui/StatReadout';
import Tag from '../ui/Tag';
import { keyClass } from '../ui/buttons';
import AlbumPalette from './AlbumPalette';

type Load =
    | { status: 'loading' }
    | { status: 'missing' }
    | { status: 'error'; message: string }
    | { status: 'loaded'; album: AlbumWithSongs };

const TYPE_LABELS: Record<Album['type'], string> = {
    album: 'Album',
    single: 'Single',
    compilation: 'Compilation',
};

const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;

/** The public page for an album: the songs from it that have colors, and how they compare. */
const AlbumPage = () => {
    const { albumId = '' } = useParams();
    // Stored with the id it was loaded for, so another album's data is never shown
    const [load, setLoad] = useState<{ albumId: string; load: Load } | null>(null);

    useEffect(() => {
        let cancelled = false;
        getAlbum(albumId)
            .then((album) => {
                if (cancelled) return;
                setLoad({
                    albumId,
                    load: album ? { status: 'loaded', album } : { status: 'missing' },
                });
            })
            .catch((err: Error) => {
                if (!cancelled)
                    setLoad({ albumId, load: { status: 'error', message: err.message } });
            });
        return () => {
            cancelled = true;
        };
    }, [albumId]);

    const state: Load = load && load.albumId === albumId ? load.load : { status: 'loading' };
    const title = state.status === 'loaded' ? state.album.album.name : null;

    useEffect(() => {
        if (!title) return;
        const before = document.title;
        document.title = `${title} · Chromesthesia Visualizer`;
        return () => {
            document.title = before;
        };
    }, [title]);

    if (state.status === 'missing') {
        return (
            <NotFound
                title="Album not found"
                message="There’s no album with colors at this address."
            />
        );
    }
    if (state.status !== 'loaded') {
        return (
            <div className="flex min-h-full items-center justify-center p-6 lg:h-full">
                <p
                    className={`text-sm ${state.status === 'error' ? 'font-bold text-danger' : 'text-silk'}`}
                    role={state.status === 'error' ? 'alert' : undefined}
                >
                    {state.status === 'error' ? state.message : 'Loading…'}
                </p>
            </div>
        );
    }

    const { album, albumImageUrl, artists, songs } = state.album;
    const entries = songs.flatMap((song) => song.colors);
    const parts = entries.filter((entry) => entry.startMs !== undefined).length;
    const summaries = songs.map((song) => ({
        ...song,
        colors: song.colors.map((entry) => entry.color),
    }));

    return (
        <div className="lg:h-full lg:overflow-y-auto">
            <div className="mx-auto flex max-w-6xl flex-col gap-8 p-5 sm:p-7 lg:p-9">
                <header className="flex flex-col gap-4 well rounded-md p-4 sm:flex-row sm:items-end sm:gap-6 sm:p-5">
                    <AlbumArt
                        src={albumImageUrl}
                        alt={`${album.name} album art`}
                        className="size-28 sm:size-44 lg:size-52"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="font-mono text-[11px] tracking-[0.08em] text-silk uppercase">
                            {TYPE_LABELS[album.type]}
                        </span>
                        <h1 className="text-3xl leading-none font-bold tracking-[-0.03em] text-balance sm:text-5xl">
                            {album.name}
                        </h1>
                        <p className="text-base text-silk sm:text-lg">{artists.join(', ')}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Tag>{album.releaseDate.slice(0, 4)}</Tag>
                            <Tag>{`${plural(songs.length, 'song')} logged`}</Tag>
                        </div>
                    </div>
                    <a
                        className={`${keyClass} self-start sm:self-end`}
                        href={album.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open in Spotify
                    </a>
                </header>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <AlbumPalette colors={entries.map((entry) => entry.color)} />
                    <StatReadout
                        readings={[
                            ['Songs logged', songs.length],
                            ['Colors', entries.length],
                            ['Song parts', parts],
                        ]}
                    />
                </div>

                <section className="flex flex-col gap-4">
                    <SectionLabel aside={songs.length}>Songs</SectionLabel>
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {summaries.map((song) => (
                            <li key={song.id} className="min-w-0">
                                <SongCard song={song} />
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="flex flex-col gap-5">
                    <SectionLabel>Timelines</SectionLabel>
                    {songs.map((song) => (
                        <div key={song.id} className="flex flex-col gap-2">
                            <Link
                                to={songPagePath(song.id)}
                                className="self-start text-sm font-bold hover:underline"
                            >
                                {song.trackNumber !== undefined && (
                                    <span className="mr-2 font-mono text-xs font-medium text-silk">
                                        {String(song.trackNumber).padStart(2, '0')}
                                    </span>
                                )}
                                {song.title}
                            </Link>
                            {song.colors.length > 0 ? (
                                <Timeline entries={song.colors} durationMs={song.durationMs} />
                            ) : (
                                <p className="text-sm text-silk">No colors yet.</p>
                            )}
                        </div>
                    ))}
                </section>

                <div className="mt-2">
                    <Nameplate details={['Model CV-1', 'Album']} />
                </div>
            </div>
        </div>
    );
};

export default AlbumPage;
