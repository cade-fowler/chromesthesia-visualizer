import { useEffect, useState } from 'react';
import type { Song } from '@chromesthesia/shared';
import { listSongs } from '../../databaseAPI';
import AlbumArt from '../../ui/AlbumArt';
import SectionLabel from '../../ui/SectionLabel';

interface SongSourceProps {
    /** The saved song the Studio is pinned to, or null when it follows Spotify */
    pickedId: string | null;
    /** Pins the Studio to a saved song, or (null) goes back to following Spotify */
    onPick: (songId: string | null) => void;
    /** Bumped when a song is saved or deleted, so the list loads again the next time it's open */
    listVersion: number;
}

const sourceKey = (down: boolean) =>
    `${down ? 'key-down' : 'key'} inline-flex h-9 flex-1 items-center justify-center px-4 text-[11px] font-bold tracking-[0.1em] whitespace-nowrap uppercase sm:flex-none`;

const matches = (song: Song, filter: string) => {
    const needle = filter.trim().toLowerCase();
    return (
        !needle ||
        song.title.toLowerCase().includes(needle) ||
        song.artists.some((artist) => artist.toLowerCase().includes(needle))
    );
};

/** Which song the Studio works on: the one playing on Spotify, or any saved song. */
const SongSource = ({ pickedId, onPick, listVersion }: SongSourceProps) => {
    const [open, setOpen] = useState(false);
    // The list with the version it was loaded at; an older list stays up while a newer one loads
    const [loaded, setLoaded] = useState<{ songs: Song[]; version: number } | null>(null);
    const [error, setError] = useState<{ message: string; version: number } | null>(null);
    const [filter, setFilter] = useState('');

    // Load the list when it's opened and hasn't been loaded since the last change
    const needsSongs = open && loaded?.version !== listVersion && error?.version !== listVersion;
    useEffect(() => {
        if (!needsSongs) return;
        let cancelled = false;
        // Its filter runs in the browser, so load as many as the API allows
        listSongs({ limit: 200 })
            .then((list) => {
                if (cancelled) return;
                setLoaded({ songs: list, version: listVersion });
                setError(null);
            })
            .catch((err: Error) => {
                if (!cancelled) setError({ message: err.message, version: listVersion });
            });
        return () => {
            cancelled = true;
        };
    }, [needsSongs, listVersion]);

    const songs = loaded?.songs ?? null;

    const pick = (songId: string | null) => {
        setOpen(false);
        setFilter('');
        onPick(songId);
    };

    const shown = songs?.filter((song) => matches(song, filter)) ?? [];

    return (
        <section
            className="flex flex-col gap-3"
            onKeyDown={(event) => {
                if (event.key === 'Escape') setOpen(false);
            }}
        >
            <SectionLabel>Song</SectionLabel>
            <div className="flex gap-2">
                <button
                    type="button"
                    className={sourceKey(pickedId === null && !open)}
                    aria-pressed={pickedId === null}
                    onClick={() => pick(null)}
                >
                    Now playing
                </button>
                <button
                    type="button"
                    className={sourceKey(pickedId !== null || open)}
                    aria-expanded={open}
                    onClick={() => setOpen((prev) => !prev)}
                >
                    Pick a song…
                </button>
            </div>
            {open && (
                <div className="flex flex-col gap-2 panel p-3">
                    <input
                        // The list was opened on purpose, so typing should go straight in
                        autoFocus
                        type="search"
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        placeholder="Filter by title or artist"
                        aria-label="Filter songs"
                        className="h-9 well px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-ink"
                    />
                    {error ? (
                        <p className="px-1 text-sm font-bold text-danger" role="alert">
                            {error.message}
                        </p>
                    ) : !songs ? (
                        <p className="px-1 text-sm text-silk">Loading…</p>
                    ) : shown.length === 0 ? (
                        <p className="px-1 text-sm text-silk">
                            {songs.length === 0 ? 'No saved songs yet.' : 'No songs match.'}
                        </p>
                    ) : (
                        <ul className="flex max-h-72 flex-col overflow-y-auto">
                            {shown.map((song) => (
                                <li key={song.id}>
                                    <button
                                        type="button"
                                        onClick={() => pick(song.id)}
                                        aria-current={song.id === pickedId}
                                        className={`flex w-full items-center gap-3 rounded-[4px] p-1.5 text-left hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-ink ${
                                            song.id === pickedId ? 'bg-ink/10' : ''
                                        }`}
                                    >
                                        <AlbumArt
                                            src={song.albumImageUrl}
                                            alt=""
                                            className="size-9 text-sm"
                                        />
                                        <span className="flex min-w-0 flex-col">
                                            <span className="truncate text-sm font-bold">
                                                {song.title}
                                            </span>
                                            <span className="truncate text-xs text-silk">
                                                {song.artists.join(', ')}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
};

export default SongSource;
