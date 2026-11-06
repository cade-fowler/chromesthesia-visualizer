import { useId, useState, type FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import type { AddColorRequest, ColorEntry, HexColor } from '@chromesthesia/shared';
import { emptyFields, readFields, type ColorEntryFields } from '../../../utils/colorEntryForm';
import { formatMs, parseTime } from '../../../utils/time';
import { textColorOn } from '../../../utils/color';
import { keyClass, primaryKeyClass, smallKeyClass } from '../../ui/buttons';
import SectionLabel from '../../ui/SectionLabel';

const LABEL_SUGGESTIONS = ['intro', 'verse', 'pre-chorus', 'chorus', 'bridge', 'drop', 'outro'];

const inputClass = 'well h-9 w-full min-w-0 px-2.5 font-mono text-sm placeholder:text-silk/70';

const fieldLabelClass = 'silk text-[10px]';

interface ColorEntryFormProps {
    /** The picker's color, which is what gets saved */
    color: HexColor;
    /** Starting values; the form keeps its own state after that (re-key it to reset) */
    initial?: ColorEntryFields;
    /** The saved entry being edited, as it was before; omit to add a new color */
    editing?: ColorEntry;
    /** Where playback is now, for the Mark buttons; null when nothing is playing */
    positionMs: number | null;
    /** Length of the song, to warn about times past the end */
    durationMs?: number;
    /** No song to save to */
    disabled?: boolean;
    /** A short confirmation shown beside the submit button, e.g. "Color added" */
    status?: string | null;
    /** Saves the entry; a rejection's message is shown and the form keeps its values */
    onSubmit: (request: AddColorRequest) => Promise<void>;
    onCancel?: () => void;
    onDelete?: () => Promise<void>;
}

const ColorEntryForm = ({
    color,
    initial = emptyFields,
    editing,
    positionMs,
    durationMs,
    disabled = false,
    status,
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
        <label className="flex min-w-0 flex-col gap-1.5">
            <span className={fieldLabelClass}>{name}</span>
            {/* The Mark key sits inside the field, so every field is the same size */}
            <span className="flex h-9 items-center gap-1 well pr-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink">
                <input
                    className="h-full min-w-0 flex-1 bg-transparent px-2.5 font-mono text-sm outline-none placeholder:text-silk/70"
                    value={fields[which]}
                    onChange={(e) => set({ [which]: e.target.value })}
                    placeholder={placeholders[which]}
                    inputMode="decimal"
                    disabled={disabled}
                />
                <button
                    type="button"
                    className={smallKeyClass}
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
    const colorChanged = editing !== undefined && editing.color !== color;

    return (
        <form
            onSubmit={handleSubmit}
            aria-label={editing ? 'Edit a saved color' : 'Add a new color'}
            className={`grid gap-5 panel screws p-5 sm:grid-cols-[9.5rem_minmax(0,1fr)] ${
                editing ? 'outline-2 outline-offset-2 outline-ink' : ''
            }`}
        >
            {/* The color being saved. It's the form's header, so adding and editing keep the
                same height; while editing, the saved color shows underneath if it changed. */}
            <div
                className="flex min-h-24 flex-col justify-end overflow-hidden pad"
                style={{ backgroundColor: color, color: textColorOn(color) }}
            >
                <div className="flex flex-col gap-0.5 p-3">
                    <span className="text-[10px] font-bold tracking-[0.12em] uppercase opacity-75">
                        {editing ? 'Editing' : 'New color'}
                    </span>
                    <span className="font-mono text-lg leading-tight uppercase">{color}</span>
                    {editing && (
                        <span className="truncate text-xs">
                            {[
                                editing.label,
                                editing.startMs === undefined
                                    ? 'Whole song'
                                    : `${formatMs(editing.startMs)}–${formatMs(editing.endMs!)}`,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </span>
                    )}
                </div>
                {colorChanged && (
                    <span
                        className="px-3 py-1 font-mono text-[11px] uppercase"
                        style={{
                            backgroundColor: editing.color,
                            color: textColorOn(editing.color),
                        }}
                    >
                        <span className="sr-only">Changing from </span>was {editing.color}
                    </span>
                )}
            </div>
            <div className="flex min-w-0 flex-col gap-4">
                <SectionLabel
                    aside={
                        <button
                            type="button"
                            className={smallKeyClass}
                            onClick={() => set({ start: '', end: '' })}
                            disabled={disabled || isWholeSong}
                            title="Apply the color to the whole song"
                        >
                            Whole song
                        </button>
                    }
                >
                    Times
                </SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                    {timeInput('start', 'Start')}
                    {timeInput('end', 'End')}
                    <label className="flex min-w-0 flex-col gap-1.5">
                        <span className={fieldLabelClass}>Part</span>
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
                    <label className="flex min-w-0 flex-col gap-1.5">
                        <span className={fieldLabelClass}>Notes</span>
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
                    <span className="text-sm text-silk">
                        That&apos;s past the end of the song ({formatMs(durationMs!)}).
                    </span>
                )}
                {error && (
                    <span className="text-sm font-bold text-danger" role="alert">
                        {error}
                    </span>
                )}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="submit"
                        className={primaryKeyClass}
                        disabled={disabled || busy !== null}
                    >
                        {busy === 'saving' ? 'Saving…' : editing ? 'Save changes' : 'Add color'}
                    </button>
                    {/* Always rendered so screen readers announce the text when it appears */}
                    <span role="status" className="text-[11px] silk">
                        {status && (
                            <span className="flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faCircleCheck} />
                                {status}
                            </span>
                        )}
                    </span>
                    {(onCancel || onDelete) && (
                        <span className="ml-auto flex gap-3">
                            {onCancel && (
                                <button
                                    type="button"
                                    className={keyClass}
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
                                        className={`${keyClass} text-danger!`}
                                        onClick={handleDelete}
                                        disabled={busy !== null}
                                    >
                                        {busy === 'deleting' ? 'Deleting…' : 'Really delete?'}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={keyClass}
                                        onClick={() => setConfirmingDelete(true)}
                                        disabled={busy !== null}
                                    >
                                        Delete
                                    </button>
                                ))}
                        </span>
                    )}
                </div>
            </div>
        </form>
    );
};

export default ColorEntryForm;
