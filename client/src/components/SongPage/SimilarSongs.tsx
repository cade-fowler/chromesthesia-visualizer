import { useEffect, useState } from 'react';
import type { SimilarSong } from '@chromesthesia/shared';
import { getSimilarSongs } from '../databaseAPI';
import SectionLabel from '../ui/SectionLabel';
import SongCard from '../ui/SongCard';

/** "2 of 3 colors close": how many of this song's colors the other song has a close match for. */
const closeNote = ({ close, total }: SimilarSong['similarity']) =>
    `${close} of ${total} ${total === 1 ? 'color' : 'colors'} close`;

/**
 * Songs whose colors are closest to this one's, loaded after the song so they don't hold up the
 * page. Key it by song so a new song starts from Loading.
 */
const SimilarSongs = ({ songId }: { songId: string }) => {
    const [songs, setSongs] = useState<SimilarSong[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        getSimilarSongs(songId, controller.signal)
            .then(setSongs)
            .catch((err: Error) => {
                if (!controller.signal.aborted) setError(err.message);
            });
        return () => controller.abort();
    }, [songId]);

    return (
        <section className="flex flex-col gap-4">
            <SectionLabel aside={songs?.length || undefined}>Similar songs</SectionLabel>
            {error ? (
                <p className="text-sm font-bold text-danger" role="alert">
                    {error}
                </p>
            ) : !songs ? (
                <p className="text-sm text-silk">Loading…</p>
            ) : songs.length === 0 ? (
                <p className="text-sm text-silk">No songs with close colors yet.</p>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {songs.map((song) => (
                        <li key={song.id} className="min-w-0">
                            <SongCard song={song} note={closeNote(song.similarity)} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default SimilarSongs;
