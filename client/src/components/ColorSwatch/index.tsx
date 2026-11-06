import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrashCan } from '@fortawesome/free-regular-svg-icons';
import type { ColorEntry } from '@chromesthesia/shared';
import { formatMs } from '../../utils/time';
import { iconKeyClass, smallKeyClass } from '../ui/buttons';

interface ColorSwatchProps {
    entry: ColorEntry;
    /** Deletes the entry; a rejection leaves the swatch in place so it can be retried */
    onDelete?: () => Promise<void>;
    /** Opens the entry in the edit form */
    onEdit?: () => void;
}

/**
 * A color pad with its details printed underneath. Given onEdit and onDelete, edit and delete
 * keys appear on hover (and keyboard focus); on touch screens, which can't hover, they always
 * show. Without them the swatch is read-only.
 */
const ColorSwatch = ({ entry, onDelete, onEdit }: ColorSwatchProps) => {
    const { color, label, notes, startMs, endMs } = entry;
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [failed, setFailed] = useState(false);

    const editable = onEdit !== undefined && onDelete !== undefined;

    const handleDelete = async () => {
        if (!onDelete) return;
        setDeleting(true);
        setFailed(false);
        try {
            await onDelete(); // on success the parent unmounts this swatch
        } catch (err) {
            console.error(err);
            setFailed(true);
            setDeleting(false);
        }
    };

    const cancel = () => {
        setConfirmingDelete(false);
        setFailed(false);
    };

    const range =
        startMs !== undefined && endMs !== undefined
            ? `${formatMs(startMs)}–${formatMs(endMs)}`
            : null;

    return (
        <div className="group flex min-w-0 flex-col gap-2">
            <div className="relative h-20 pad" style={{ backgroundColor: color }}>
                {editable && (
                    <div
                        className={`absolute top-2 right-2 flex gap-1.5 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100 ${
                            confirmingDelete ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {confirmingDelete ? (
                            <>
                                <button
                                    className={`${smallKeyClass} text-danger!`}
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? 'Deleting…' : failed ? 'Retry' : 'Delete'}
                                </button>
                                <button
                                    className={smallKeyClass}
                                    onClick={cancel}
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    aria-label={`Edit ${color}`}
                                    title="Edit"
                                    className={iconKeyClass}
                                    onClick={onEdit}
                                >
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                </button>
                                <button
                                    aria-label={`Delete ${color}`}
                                    title="Delete"
                                    className={iconKeyClass}
                                    onClick={() => setConfirmingDelete(true)}
                                >
                                    <FontAwesomeIcon icon={faTrashCan} />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-mono text-xs uppercase">{color}</span>
                <span className="truncate text-[10px] silk">
                    {[label ?? (range ? 'Part' : 'Whole song'), range].filter(Boolean).join(' · ')}
                </span>
                {notes && notes.length > 0 && (
                    <span className="text-xs text-silk italic">{notes.join(', ')}</span>
                )}
                {failed && (
                    <span className="text-xs font-bold text-danger" role="alert">
                        Couldn&apos;t delete. Try again.
                    </span>
                )}
            </div>
        </div>
    );
};

export default ColorSwatch;
