import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrashCan } from '@fortawesome/free-regular-svg-icons';
import type { ColorEntry } from '@chromesthesia/shared';
import { isDark, textColorOn } from '../../../../utils/color';
import { formatMs } from '../../../../utils/time';

interface ColorSwatchProps {
    entry: ColorEntry;
    /** Deletes the entry; a rejection leaves the swatch in place so it can be retried */
    onDelete: () => Promise<void>;
    /** Opens the entry in the edit form */
    onEdit: () => void;
}

const ColorSwatch = ({ entry, onDelete, onEdit }: ColorSwatchProps) => {
    const { color, label, notes, startMs, endMs } = entry;
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [failed, setFailed] = useState(false);
    const textColor = textColorOn(color);
    const outlined = { color: textColor, borderColor: textColor };
    const iconButtonClass = `rounded-[30%] px-1.5 py-1 text-base ${
        isDark(color) ? 'hover:bg-white/20' : 'hover:bg-black/20'
    }`;

    const handleDelete = async () => {
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

    return (
        <div
            className="group relative max-h-[30%] min-h-40 min-w-1/5 grow transition-transform duration-300 hover:scale-110"
            style={{ background: color }}
        >
            <div
                className={`flex h-full flex-col items-center justify-center overflow-hidden transition-opacity duration-300 group-hover:opacity-100 ${
                    confirmingDelete ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ color: textColor }}
            >
                <div className="absolute top-2 right-2 flex flex-col items-end gap-0.5">
                    {confirmingDelete ? (
                        <>
                            <button
                                className="rounded-[5px] border border-red-600 bg-red-600/20 px-2 text-red-600 disabled:opacity-60"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting…' : failed ? 'Retry' : 'Delete'}
                            </button>
                            <button
                                className="rounded-[5px] border px-2 disabled:opacity-60"
                                style={outlined}
                                onClick={cancel}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <div className="flex gap-0.5">
                            <button
                                aria-label={`Edit ${color}`}
                                className={iconButtonClass}
                                onClick={onEdit}
                            >
                                <FontAwesomeIcon
                                    icon={faPenToSquare}
                                    style={{ color: textColor }}
                                />
                            </button>
                            <button
                                aria-label={`Delete ${color}`}
                                className={iconButtonClass}
                                onClick={() => setConfirmingDelete(true)}
                            >
                                <FontAwesomeIcon icon={faTrashCan} style={{ color: textColor }} />
                            </button>
                        </div>
                    )}
                </div>
                <span>{color}</span>
                {label && <span className="text-sm">{label}</span>}
                {startMs !== undefined && endMs !== undefined && (
                    <span className="text-sm">
                        {formatMs(startMs)}–{formatMs(endMs)}
                    </span>
                )}
                {notes && notes.length > 0 && (
                    <span className="px-2 text-center text-sm italic">{notes.join(', ')}</span>
                )}
                {failed && (
                    <span className="text-sm" role="alert">
                        Couldn&apos;t delete. Try again.
                    </span>
                )}
            </div>
        </div>
    );
};

export default ColorSwatch;
