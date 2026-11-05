import type {
    AddColorRequest,
    ColorEntry,
    HexColor,
    UpdateColorRequest,
} from '@chromesthesia/shared';
import { formatMs, parseTime } from './time';

/** What the color entry form holds while you type. */
export interface ColorEntryFields {
    label: string;
    start: string;
    end: string;
    /** Comma-separated */
    notes: string;
}

export const emptyFields: ColorEntryFields = { label: '', start: '', end: '', notes: '' };

export const fieldsFromEntry = (entry: ColorEntry): ColorEntryFields => ({
    label: entry.label ?? '',
    start: entry.startMs === undefined ? '' : formatMs(entry.startMs),
    end: entry.endMs === undefined ? '' : formatMs(entry.endMs),
    notes: entry.notes?.join(', ') ?? '',
});

/** Splits "glossy, warm" into distinct, trimmed notes. */
export const parseNotes = (text: string): string[] => [
    ...new Set(
        text
            .split(',')
            .map((note) => note.trim())
            .filter(Boolean),
    ),
];

export type FormResult = { ok: true; request: AddColorRequest } | { ok: false; error: string };

/** Turns the form into a request, with the same rules for times as the server. */
export const readFields = (color: HexColor, fields: ColorEntryFields): FormResult => {
    const startText = fields.start.trim();
    const endText = fields.end.trim();
    const startMs = startText ? parseTime(startText) : undefined;
    const endMs = endText ? parseTime(endText) : undefined;

    if (startMs === null) return { ok: false, error: 'Start should be a time like 1:15' };
    if (endMs === null) return { ok: false, error: 'End should be a time like 1:15' };
    if ((startMs === undefined) !== (endMs === undefined)) {
        return { ok: false, error: 'Give both a start and an end, or neither for the whole song' };
    }
    if (startMs !== undefined && endMs! <= startMs) {
        return { ok: false, error: 'End must be after start' };
    }

    const label = fields.label.trim();
    if (label.length > 50) return { ok: false, error: 'Keep the label to 50 characters' };
    const notes = parseNotes(fields.notes);

    return {
        ok: true,
        request: {
            color,
            ...(startMs !== undefined && { startMs, endMs }),
            ...(label && { label }),
            ...(notes.length > 0 && { notes }),
        },
    };
};

const sameNotes = (a: string[] = [], b: string[] = []) =>
    a.length === b.length && a.every((note, i) => note === b[i]);

/** The PATCH body that turns `entry` into `request`: changed fields only, null to clear. */
export const colorEntryChanges = (
    entry: ColorEntry,
    request: AddColorRequest,
): UpdateColorRequest => {
    const changes: UpdateColorRequest = {};
    if (request.color !== entry.color) changes.color = request.color;
    if (request.startMs !== entry.startMs || request.endMs !== entry.endMs) {
        changes.startMs = request.startMs ?? null;
        changes.endMs = request.endMs ?? null;
    }
    if (request.label !== entry.label) changes.label = request.label ?? null;
    if (!sameNotes(request.notes, entry.notes)) changes.notes = request.notes ?? null;
    return changes;
};
