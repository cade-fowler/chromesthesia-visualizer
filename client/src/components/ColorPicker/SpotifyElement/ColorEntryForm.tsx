import { useId, useState, type FormEvent } from 'react';
import type { AddColorRequest, HexColor } from '@chromesthesia/shared';
import { emptyFields, readFields, type ColorEntryFields } from '../../../utils/colorEntryForm';
import { formatMs, parseTime } from '../../../utils/time';
import { textColorOn } from '../../../utils/color';
import { buttonClass, smallButtonClass } from './buttons';

const LABEL_SUGGESTIONS = ['intro', 'verse', 'pre-chorus', 'chorus', 'bridge', 'drop', 'outro'];

const inputClass =
    'w-full rounded-[5px] border-2 border-medium bg-transparent px-2 py-1 text-light ' +
    'outline-none placeholder:text-medium focus:border-accent';

interface ColorEntryFormProps {
    /** The picker's color, which is what gets saved */
    color: HexColor;
    /** Starting values; the form keeps its own state after that (re-key it to reset) */
    initial?: ColorEntryFields;
    /** Edit an existing entry instead of adding one */
    editing?: boolean;
    /** Where playback is now, for the Mark buttons; null when nothing is playing */
    positionMs: number | null;
    /** Length of the song, to warn about times past the end */
    durationMs?: number;
    /** No song to save to */
    disabled?: boolean;
    /** Saves the entry; a rejection's message is shown and the form keeps its values */
    onSubmit: (request: AddColorRequest) => Promise<void>;
    onCancel?: () => void;
    onDelete?: () => Promise<void>;
}

const ColorEntryForm = ({
    color,
    initial = emptyFields,
    editing = false,
    positionMs,
    durationMs,
    disabled = false,
    onSubmit,
    onCancel,
    onDelete,
}: ColorEntryFormProps) => {
    const [fields, setFields] = useState(initial);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<'saving' | 'deleting' | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const id = useId();

    const set = (changes: Partial<ColorEntryFields>) => {
        setFields((prev) => ({ ...prev, ...changes }));
        setError(null);
    };

    const pastEnd =
        durationMs !== undefined &&
        [fields.start, fields.end].some((text) => (parseTime(text) ?? 0) > durationMs);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const result = readFields(color, fields, durationMs);
        if (!result.ok) {
            setError(result.error);
            return;
        }
        setBusy('saving');
        try {
            await onSubmit(result.request);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Saving failed. Try again.');
        } finally {
            setBusy(null);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        setBusy('deleting');
        try {
            await onDelete(); // on success the parent closes the form
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Deleting failed. Try again.');
            setBusy(null);
        }
    };

    // Left empty, a start means the beginning and an end means the end of the song
    const placeholders = {
        start: '0:00',
        end: durationMs === undefined ? 'm:ss' : formatMs(durationMs),
    };

    const timeInput = (which: 'start' | 'end', name: string) => (
        <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-medium">{name}</span>
            <span className="flex gap-2">
                <input
                    className={inputClass}
                    value={fields[which]}
                    onChange={(e) => set({ [which]: e.target.value })}
                    placeholder={placeholders[which]}
                    inputMode="decimal"
                    disabled={disabled}
                />
                <button
                    type="button"
                    className={smallButtonClass}
                    onClick={() => positionMs !== null && set({ [which]: formatMs(positionMs) })}
                    disabled={disabled || positionMs === null}
                    title={`Set ${name.toLowerCase()} to where playback is now`}
                >
                    Mark
                </button>
            </span>
        </label>
    );

    const isWholeSong = !fields.start.trim() && !fields.end.trim();

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-[3%] flex flex-col gap-3 rounded-[15px] border-[3px] border-medium p-4"
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-bold text-light">
                    {editing ? 'Edit color' : 'Add color'}
                </span>
                <span
                    className="rounded-[5px] px-2 py-0.5 text-sm"
                    style={{ backgroundColor: color, color: textColorOn(color) }}
                >
                    {color}
                </span>
            </div>
            <div className="flex flex-wrap items-end gap-3">
                {timeInput('start', 'Start')}
                {timeInput('end', 'End')}
                <button
                    type="button"
                    className={smallButtonClass}
                    onClick={() => set({ start: '', end: '' })}
                    disabled={disabled || isWholeSong}
                    title="Apply the color to the whole song"
                >
                    Whole song
                </button>
            </div>
            <div className="flex flex-wrap gap-3">
                <label className="flex min-w-40 flex-1 flex-col gap-1">
                    <span className="text-sm text-medium">Part</span>
                    <input
                        className={inputClass}
                        value={fields.label}
                        onChange={(e) => set({ label: e.target.value })}
                        placeholder={isWholeSong ? 'optional' : 'chorus'}
                        list={`${id}-labels`}
                        maxLength={50}
                        disabled={disabled}
                    />
                    <datalist id={`${id}-labels`}>
                        {LABEL_SUGGESTIONS.map((suggestion) => (
                            <option key={suggestion} value={suggestion} />
                        ))}
                    </datalist>
                </label>
                <label className="flex min-w-40 flex-1 flex-col gap-1">
                    <span className="text-sm text-medium">Notes</span>
                    <input
                        className={inputClass}
                        value={fields.notes}
                        onChange={(e) => set({ notes: e.target.value })}
                        placeholder="glossy, warm"
                        disabled={disabled}
                    />
                </label>
            </div>
            {pastEnd && (
                <span className="text-sm text-complement">
                    That&apos;s past the end of the song ({formatMs(durationMs!)}).
                </span>
            )}
            {error && (
                <span className="text-sm text-red-400" role="alert">
                    {error}
                </span>
            )}
            <div className="-m-2 flex flex-wrap items-center">
                <button type="submit" className={buttonClass} disabled={disabled || busy !== null}>
                    {busy === 'saving' ? 'Saving…' : editing ? 'Save changes' : 'Save'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        className={buttonClass}
                        onClick={onCancel}
                        disabled={busy !== null}
                    >
                        Cancel
                    </button>
                )}
                {onDelete &&
                    (confirmingDelete ? (
                        <button
                            type="button"
                            className={`${buttonClass} ml-auto border-red-600! text-red-500! hover:bg-red-600! hover:text-light!`}
                            onClick={handleDelete}
                            disabled={busy !== null}
                        >
                            {busy === 'deleting' ? 'Deleting…' : 'Really delete?'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={`${buttonClass} ml-auto`}
                            onClick={() => setConfirmingDelete(true)}
                            disabled={busy !== null}
                        >
                            Delete
                        </button>
                    ))}
            </div>
        </form>
    );
};

export default ColorEntryForm;
