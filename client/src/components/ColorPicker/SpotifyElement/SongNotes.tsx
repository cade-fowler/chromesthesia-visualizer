import { useEffect, useId, useState, type FormEvent } from 'react';
import { parseNotes } from '../../../utils/colorEntryForm';
import { keyClass } from '../../ui/buttons';
import { inputClass } from '../../ui/fields';
import SectionLabel from '../../ui/SectionLabel';

interface SongNotesProps {
    /** The song's saved notes */
    notes: string[];
    /** Whether the song is saved yet; a song is saved along with its first color */
    saved: boolean;
    /** Saves the notes; a rejection keeps what was typed and shows the error */
    onSave: (notes: string[]) => Promise<void>;
}

/** Impressions of the song as a whole ("glossy, warm"), shown on its song page. */
const SongNotes = ({ notes, saved, onSave }: SongNotesProps) => {
    const id = useId();
    const [text, setText] = useState(notes.join(', '));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedNotice, setSavedNotice] = useState(false);

    // Show the saved notes when they arrive (the song's record can load after this mounts)
    const savedText = notes.join(', ');
    const [lastSavedText, setLastSavedText] = useState(savedText);
    if (savedText !== lastSavedText) {
        setLastSavedText(savedText);
        setText(savedText);
    }

    useEffect(() => {
        if (!savedNotice) return;
        const timeout = setTimeout(() => setSavedNotice(false), 3000);
        return () => clearTimeout(timeout);
    }, [savedNotice]);

    const changed = parseNotes(text).join(', ') !== savedText;

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await onSave(parseNotes(text));
            setSavedNotice(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="flex flex-col gap-3">
            <SectionLabel>Song notes</SectionLabel>
            {saved ? (
                <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
                    <div className="flex gap-2">
                        <label htmlFor={id} className="sr-only">
                            Song notes
                        </label>
                        <input
                            id={id}
                            className={inputClass}
                            value={text}
                            onChange={(event) => {
                                setText(event.target.value);
                                setSavedNotice(false);
                            }}
                            placeholder="glossy, warm"
                            disabled={busy}
                        />
                        <button
                            type="submit"
                            className={`${keyClass} shrink-0`}
                            disabled={busy || !changed}
                        >
                            {busy ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                    {error ? (
                        <span className="text-sm font-bold text-danger" role="alert">
                            {error}
                        </span>
                    ) : (
                        <span className="text-xs text-silk" role="status">
                            {savedNotice
                                ? 'Notes saved'
                                : 'Comma-separated. They show on the song page.'}
                        </span>
                    )}
                </form>
            ) : (
                <p className="text-sm text-silk">Notes can be added once the song has a color.</p>
            )}
        </section>
    );
};

export default SongNotes;
