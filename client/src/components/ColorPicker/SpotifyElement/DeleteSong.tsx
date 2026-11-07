import { useState } from 'react';
import { keyClass } from '../../ui/buttons';
import SectionLabel from '../../ui/SectionLabel';

interface DeleteSongProps {
    /** How many colors go with the song */
    colorCount: number;
    /** Deletes the song; a rejection keeps the confirmation up and shows the error */
    onDelete: () => Promise<void>;
}

/** Deletes the saved song with all its colors and notes, after a second press to confirm. */
const DeleteSong = ({ colorCount, onDelete }: DeleteSongProps) => {
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setBusy(true);
        setError(null);
        try {
            await onDelete(); // on success the parent unmounts this
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Deleting failed. Try again.');
            setBusy(false);
        }
    };

    const cancel = () => {
        setConfirming(false);
        setError(null);
    };

    const what = `${colorCount} ${colorCount === 1 ? 'color' : 'colors'}`;

    return (
        <section className="flex flex-col gap-3">
            <SectionLabel>Delete song</SectionLabel>
            <div className="flex flex-wrap items-center gap-3">
                {confirming ? (
                    <>
                        <button
                            type="button"
                            className={`${keyClass} text-danger!`}
                            onClick={handleDelete}
                            disabled={busy}
                        >
                            {busy ? 'Deleting…' : 'Really delete?'}
                        </button>
                        <button type="button" className={keyClass} onClick={cancel} disabled={busy}>
                            Cancel
                        </button>
                    </>
                ) : (
                    <button type="button" className={keyClass} onClick={() => setConfirming(true)}>
                        Delete song
                    </button>
                )}
                {error ? (
                    <span className="text-sm font-bold text-danger" role="alert">
                        {error}
                    </span>
                ) : (
                    <span className="text-xs text-silk">
                        {confirming
                            ? `Its ${what} and notes go too. This can’t be undone.`
                            : 'Removes it from the site with its colors and notes.'}
                    </span>
                )}
            </div>
        </section>
    );
};

export default DeleteSong;
