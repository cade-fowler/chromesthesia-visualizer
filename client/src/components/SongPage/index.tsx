import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { SongWithColors } from '@chromesthesia/shared';
import { getSong } from '../databaseAPI';
import { formatMs } from '../../utils/time';
import Timeline from '../Timeline';
import ColorSwatch from '../ColorSwatch';
import AlbumArt from '../ui/AlbumArt';
import NotFound from '../NotFound';
import SectionLabel from '../ui/SectionLabel';
import Nameplate from '../ui/Nameplate';
import { keyClass } from '../ui/buttons';
import { useOwner } from '../../auth/OwnerContext';

type Load =
    | { status: 'loading' }
    | { status: 'missing' }
    | { status: 'error'; message: string }
    | { status: 'loaded'; song: SongWithColors };

const Tag = ({ children }: { children: string }) => (
    <span className="rounded-[3px] border border-silk/60 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-silk uppercase">
        {children}
    </span>
);

/** The public page for one song: its details, color timeline, colors and notes. */
const SongPage = () => {
    const { songId = '' } = useParams();
    const { owner } = useOwner();
    // Stored with the id it was loaded for, so another song's data is never shown
    const [load, setLoad] = useState<{ songId: string; load: Load } | null>(null);

    useEffect(() => {
        let cancelled = false;
        getSong(songId)
            .then((song) => {
                if (cancelled) return;
                setLoad({
                    songId,
                    load: song ? { status: 'loaded', song } : { status: 'missing' },
                });
            })
            .catch((err: Error) => {
                if (!cancelled)
                    setLoad({ songId, load: { status: 'error', message: err.message } });
            });
        return () => {
            cancelled = true;
        };
    }, [songId]);

    const state: Load = load && load.songId === songId ? load.load : { status: 'loading' };
    const title = state.status === 'loaded' ? state.song.title : null;

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
                title="Song not found"
                message="There’s no song with colors at this address."
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

    const { song } = state;
    const { colors } = song;
    const notes = song.notes ?? [];

    return (
        <div className="lg:h-full lg:overflow-y-auto">
            <div className="mx-auto flex max-w-6xl flex-col gap-8 p-5 sm:p-7 lg:p-9">
                <header className="flex flex-col gap-4 well rounded-md p-4 sm:flex-row sm:items-end sm:gap-6 sm:p-5">
                    <AlbumArt
                        src={song.albumImageUrl}
                        alt={`${song.title} album art`}
                        className="size-28 sm:size-44 lg:size-52"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="truncate font-mono text-[11px] tracking-[0.08em] text-silk uppercase">
                            Song
                            {song.album && (
                                <>
                                    {' · '}
                                    <a
                                        className="hover:text-ink hover:underline"
                                        href={song.album.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {song.album.name}
                                    </a>
                                </>
                            )}
                        </span>
                        <h1 className="text-3xl leading-none font-bold tracking-[-0.03em] text-balance sm:text-5xl">
                            {song.title}
                        </h1>
                        <p className="text-base text-silk sm:text-lg">
                            {song.artists.map((artist, i) => {
                                const url = song.artistUrls?.[i];
                                return (
                                    <span key={i}>
                                        {i > 0 && ', '}
                                        {url ? (
                                            <a
                                                className="hover:text-ink hover:underline"
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {artist}
                                            </a>
                                        ) : (
                                            artist
                                        )}
                                    </span>
                                );
                            })}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {song.durationMs !== undefined && (
                                <Tag>{formatMs(song.durationMs)}</Tag>
                            )}
                            <Tag>{`${colors.length} ${colors.length === 1 ? 'color' : 'colors'}`}</Tag>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 self-start sm:self-end">
                        {owner && (
                            <Link
                                className={keyClass}
                                to={`/studio?song=${encodeURIComponent(song.id)}`}
                            >
                                Edit in Studio
                            </Link>
                        )}
                        <a
                            className={keyClass}
                            href={song.songUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open in Spotify
                        </a>
                    </div>
                </header>

                <section className="flex flex-col gap-3">
                    <SectionLabel>Timeline</SectionLabel>
                    {colors.length > 0 ? (
                        <Timeline entries={colors} durationMs={song.durationMs} />
                    ) : (
                        <p className="text-sm text-silk">No colors yet for this song.</p>
                    )}
                </section>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <section className="flex min-w-0 flex-col gap-4">
                        <SectionLabel aside={colors.length}>Colors</SectionLabel>
                        {colors.length > 0 ? (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                                {colors.map((entry) => (
                                    <ColorSwatch key={entry.id} entry={entry} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-silk">No colors yet.</p>
                        )}
                    </section>
                    <aside className="flex flex-col gap-3 self-start panel screws p-6">
                        <SectionLabel>Notes</SectionLabel>
                        {notes.length > 0 ? (
                            <ul className="flex flex-col gap-1.5 text-sm">
                                {notes.map((note, i) => (
                                    <li key={i}>{note}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-silk">No notes yet.</p>
                        )}
                    </aside>
                </div>

                <div className="mt-2">
                    <Nameplate details={['Model CV-1', 'Song']} />
                </div>
            </div>
        </div>
    );
};

export default SongPage;
